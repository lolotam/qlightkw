// Send Admin Email Edge Function
// Integrates with Resend to send emails from admin accounts

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailRequest {
  from: string;
  to: string;
  cc?: string;
  subject: string;
  html: string;
  attachments?: {
    filename: string;
    content: string; // base64 encoded
    type: string;
  }[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify user is authenticated and is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user and admin role
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      throw new Error("Admin access required");
    }

    // Get Resend API key
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("Email service not configured. Please add RESEND_API_KEY to secrets.");
    }

    // Parse request
    const { from, to, cc, subject, html, attachments }: EmailRequest = await req.json();

    // Validate sender email (only allow approved sender addresses)
    const allowedSenders = ["info@qlightkw.com", "admin@qlightkw.com", "sales@qlightkw.com"];
    if (!allowedSenders.includes(from)) {
      throw new Error(`Invalid sender email. Allowed: ${allowedSenders.join(", ")}`);
    }

    // Validate recipient
    if (!to || !to.includes("@")) {
      throw new Error("Invalid recipient email");
    }

    // Build email payload for Resend
    const emailPayload: Record<string, unknown> = {
      from: `Quality Light <${from}>`,
      to: [to],
      subject: subject || "(No Subject)",
      html,
    };

    // Add CC if provided
    if (cc) {
      const ccList = cc.split(",").map(e => e.trim()).filter(e => e.includes("@"));
      if (ccList.length > 0) {
        emailPayload.cc = ccList;
      }
    }

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      emailPayload.attachments = attachments.map(att => ({
        filename: att.filename,
        content: att.content,
        type: att.type,
      }));
    }

    console.log("Sending email via Resend:", { from, to, subject, hasAttachments: !!attachments?.length });

    // Send via Resend API
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    const resendResult = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend API error:", resendResult);
      throw new Error(resendResult.message || "Failed to send email");
    }

    console.log("Email sent successfully:", resendResult.id);

    // Save to admin inbox
    const { error: saveError } = await supabase.from("admin_inbox_messages").insert({
      from_email: from,
      to_email: to,
      subject,
      html_body: html,
      body: html.replace(/<[^>]*>/g, ""), // Strip HTML for plain text
      direction: "outbound",
      status: "sent",
      is_read: true,
      resend_id: resendResult.id,
      admin_id: user.id,
      metadata: {
        cc: cc || null,
        attachments: attachments?.map(a => a.filename) || [],
      },
    });

    if (saveError) {
      console.error("Failed to save sent email:", saveError);
      // Don't throw - email was still sent
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        id: resendResult.id,
        message: "Email sent successfully" 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Send email error:", errorMessage);
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

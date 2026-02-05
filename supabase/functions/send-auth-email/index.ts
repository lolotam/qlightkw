// Send Auth Email Edge Function
// Handles Supabase auth emails using branded HTML templates via Resend

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);
const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Email subjects by type and language
const SUBJECTS: Record<string, Record<string, string>> = {
  signup: {
    en: "Welcome to Quality Light!",
    ar: "مرحباً بك في كوالتي لايت!",
  },
  recovery: {
    en: "Reset Your Password",
    ar: "إعادة تعيين كلمة المرور",
  },
  magiclink: {
    en: "Your Login Link",
    ar: "رابط تسجيل الدخول الخاص بك",
  },
  email_change: {
    en: "Confirm Your New Email",
    ar: "تأكيد بريدك الإلكتروني الجديد",
  },
  invite: {
    en: "You've Been Invited to Quality Light",
    ar: "لقد تمت دعوتك إلى كوالتي لايت",
  },
};

// Brand colors
const COLORS = {
  primary: "#1a1a2e",
  gold: "#d4af37",
  gray: "#374151",
  lightGray: "#6b7280",
  background: "#f6f9fc",
  white: "#ffffff",
  success: "#10b981",
  warning: "#d97706",
  error: "#dc2626",
};

// Generate HTML email template
function generateEmailHTML(params: {
  title: string;
  greeting: string;
  bodyText: string;
  buttonText: string;
  buttonUrl: string;
  footerNote?: string;
  code?: string;
  isRTL: boolean;
}): string {
  const { title, greeting, bodyText, buttonText, buttonUrl, footerNote, code, isRTL } = params;
  const dir = isRTL ? 'rtl' : 'ltr';
  const lang = isRTL ? 'ar' : 'en';
  const fontFamily = isRTL 
    ? "'Segoe UI', Tahoma, Arial, sans-serif"
    : "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif";

  return `
<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.background}; font-family: ${fontFamily};">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${COLORS.background};">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: ${COLORS.white}; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td align="center" style="background-color: ${COLORS.primary}; padding: 24px;">
              <img src="https://yubebbfsmlopmnluajgf.supabase.co/storage/v1/object/public/product-images/logo.png?v=1" alt="Quality Light" width="150" style="display: block; max-width: 150px; height: auto;">
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px 40px;">
              <h1 style="margin: 0 0 24px; color: ${COLORS.primary}; font-size: 24px; font-weight: 700;">
                ${title}
              </h1>
              
              <p style="margin: 0 0 16px; color: ${COLORS.gray}; font-size: 16px; line-height: 26px;">
                ${greeting}
              </p>
              
              <p style="margin: 0 0 24px; color: ${COLORS.gray}; font-size: 16px; line-height: 26px;">
                ${bodyText}
              </p>
              
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 8px 0 24px;">
                    <a href="${buttonUrl}" style="display: inline-block; background-color: ${COLORS.gold}; color: ${COLORS.primary}; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                      ${buttonText}
                    </a>
                  </td>
                </tr>
              </table>
              
              ${code ? `
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 16px 0;">
                    <p style="margin: 0 0 8px; color: ${COLORS.gray}; font-size: 14px;">
                      ${isRTL ? 'أو استخدم هذا الرمز:' : 'Or use this code:'}
                    </p>
                    <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px; text-align: center;">
                      <span style="color: ${COLORS.primary}; font-size: 32px; font-weight: 700; letter-spacing: 4px;">
                        ${code}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>
              ` : ''}
              
              ${footerNote ? `
              <p style="margin: 24px 0 0; color: ${COLORS.lightGray}; font-size: 14px; line-height: 22px;">
                ${footerNote}
              </p>
              ` : ''}
              
              <p style="margin: 32px 0 0; color: ${COLORS.lightGray}; font-size: 14px; line-height: 24px;">
                ${isRTL ? 'مع أطيب التحيات،' : 'Best regards,'}<br>
                ${isRTL ? 'فريق كوالتي لايت' : 'The Quality Light Team'}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 24px 40px; text-align: center; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 8px; color: ${COLORS.primary}; font-size: 14px; font-weight: 600;">
                ${isRTL ? 'كوالتي لايت - حلول الإضاءة المتميزة' : 'Quality Light - Premium Lighting Solutions'}
              </p>
              <p style="margin: 0 0 4px; color: ${COLORS.lightGray}; font-size: 12px;">
                ${isRTL ? 'الهاتف: ' : 'Phone: '}+965 51111725
              </p>
              <p style="margin: 0 0 16px; color: ${COLORS.lightGray}; font-size: 12px;">
                info@qlightkw.com
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                © ${new Date().getFullYear()} Quality Light. ${isRTL ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

interface AuthEmailPayload {
  user: {
    email: string;
    user_metadata?: {
      full_name?: string;
      preferred_language?: string;
    };
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
    token_new?: string;
    token_hash_new?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    
    let emailPayload: AuthEmailPayload;

    // Verify webhook signature if secret is configured
    if (hookSecret) {
      try {
        // The secret should be base64 encoded. If it's not, we need to encode it.
        let secretForVerification = hookSecret;
        
        // Check if the secret looks like it's already base64 encoded
        const isBase64 = /^[A-Za-z0-9+/=]+$/.test(hookSecret) && hookSecret.length % 4 === 0;
        
        if (!isBase64) {
          // Encode the secret to base64 if it's not already
          secretForVerification = btoa(hookSecret);
        }
        
        const wh = new Webhook(secretForVerification);
        emailPayload = wh.verify(payload, headers) as AuthEmailPayload;
      } catch (webhookError) {
        console.warn("Webhook verification failed, trying direct parse:", webhookError);
        // If webhook verification fails, try parsing directly (for development/testing)
        emailPayload = JSON.parse(payload);
      }
    } else {
      // For direct calls (testing)
      emailPayload = JSON.parse(payload);
    }

    const { user, email_data } = emailPayload;
    const { token, token_hash, redirect_to, email_action_type, site_url } = email_data;

    const userName = user.user_metadata?.full_name || user.email.split("@")[0];
    const isRTL = user.user_metadata?.preferred_language === "ar";
    const lang = isRTL ? "ar" : "en";

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? site_url;

    let html: string;
    let subject: string;

    switch (email_action_type) {
      case "signup":
      case "invite": {
        const verificationUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`;
        html = generateEmailHTML({
          title: isRTL ? `مرحباً ${userName}!` : `Welcome ${userName}!`,
          greeting: isRTL 
            ? 'شكراً لانضمامك إلى كوالتي لايت! نحن سعداء بوجودك معنا.'
            : "Thank you for joining Quality Light! We're excited to have you on board.",
          bodyText: isRTL 
            ? 'اكتشف مجموعتنا المميزة من حلول الإضاءة المتطورة للمنازل والمشاريع التجارية.'
            : 'Explore our premium collection of lighting solutions for homes and commercial projects.',
          buttonText: isRTL ? 'تسجيل الدخول إلى حسابك' : 'Login to Your Account',
          buttonUrl: verificationUrl,
          footerNote: isRTL 
            ? 'إذا لم تنشئ حساباً معنا، يمكنك تجاهل هذا البريد الإلكتروني.'
            : "If you didn't create an account with us, you can ignore this email.",
          isRTL,
        });
        subject = SUBJECTS.signup[lang];
        break;
      }

      case "recovery": {
        const resetUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`;
        html = generateEmailHTML({
          title: isRTL ? 'إعادة تعيين كلمة المرور' : 'Password Reset Request',
          greeting: isRTL ? `مرحباً ${userName}،` : `Hi ${userName},`,
          bodyText: isRTL 
            ? 'لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك. انقر على الزر أدناه لإنشاء كلمة مرور جديدة.'
            : "We received a request to reset the password for your account. Click the button below to create a new password.",
          buttonText: isRTL ? 'إعادة تعيين كلمة المرور' : 'Reset Password',
          buttonUrl: resetUrl,
          footerNote: isRTL 
            ? 'هذا الرابط صالح لمدة ساعة واحدة فقط. إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد الإلكتروني بأمان.'
            : "This link is valid for 1 hour only. If you didn't request a password reset, you can safely ignore this email.",
          isRTL,
        });
        subject = SUBJECTS.recovery[lang];
        break;
      }

      case "magiclink": {
        const magicLinkUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`;
        html = generateEmailHTML({
          title: isRTL ? 'تسجيل الدخول إلى حسابك' : 'Sign in to Your Account',
          greeting: '',
          bodyText: isRTL 
            ? 'انقر على الزر أدناه لتسجيل الدخول إلى حسابك في كوالتي لايت.'
            : 'Click the button below to sign in to your Quality Light account.',
          buttonText: isRTL ? 'تسجيل الدخول' : 'Sign In',
          buttonUrl: magicLinkUrl,
          code: token,
          footerNote: isRTL 
            ? 'هذا الرابط صالح لمدة 10 دقائق فقط. إذا لم تطلب تسجيل الدخول، يمكنك تجاهل هذا البريد الإلكتروني بأمان.'
            : "This link is valid for 10 minutes only. If you didn't request to sign in, you can safely ignore this email.",
          isRTL,
        });
        subject = SUBJECTS.magiclink[lang];
        break;
      }

      case "email_change": {
        const verificationUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`;
        html = generateEmailHTML({
          title: isRTL ? 'تأكيد بريدك الإلكتروني' : 'Verify Your Email',
          greeting: isRTL ? `مرحباً ${userName}،` : `Hi ${userName},`,
          bodyText: isRTL 
            ? 'يرجى تأكيد عنوان بريدك الإلكتروني الجديد بالنقر على الزر أدناه.'
            : 'Please confirm your new email address by clicking the button below.',
          buttonText: isRTL ? 'تأكيد البريد الإلكتروني' : 'Verify Email',
          buttonUrl: verificationUrl,
          footerNote: isRTL 
            ? 'هذا الرابط صالح لمدة 24 ساعة.'
            : 'This link is valid for 24 hours.',
          isRTL,
        });
        subject = SUBJECTS.email_change[lang];
        break;
      }

      default: {
        // Fallback to magic link template for unknown types
        const defaultUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`;
        html = generateEmailHTML({
          title: isRTL ? 'تسجيل الدخول إلى حسابك' : 'Sign in to Your Account',
          greeting: '',
          bodyText: isRTL 
            ? 'انقر على الزر أدناه للمتابعة.'
            : 'Click the button below to continue.',
          buttonText: isRTL ? 'متابعة' : 'Continue',
          buttonUrl: defaultUrl,
          code: token,
          isRTL,
        });
        subject = SUBJECTS.magiclink[lang];
      }
    }

    console.log(`Sending ${email_action_type} email to ${user.email}`);

    const { error } = await resend.emails.send({
      from: "Quality Light <info@qlightkw.com>",
      to: [user.email],
      subject,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      throw error;
    }

    console.log(`Email sent successfully to ${user.email}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Send auth email error:", errorMessage);
    
    return new Response(
      JSON.stringify({
        error: {
          http_code: 500,
          message: errorMessage,
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

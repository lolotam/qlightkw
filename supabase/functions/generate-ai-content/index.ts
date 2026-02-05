import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface GenerateRequest {
  type: "image" | "text";
  prompt: string;
  productName?: string;
  category?: string;
  model?: string;
  referenceImages?: string[]; // Base64 encoded images
  aspectRatio?: string; // e.g., "1:1", "16:9", "9:16"
}

// Updated AI settings interface with separate providers
interface AISettings {
  // New format with separate providers
  image_provider?: "google" | "openrouter";
  chat_provider?: "google" | "openrouter";
  google_image_model?: string;
  google_text_model?: string;
  openrouter_text_model?: string;
  openrouter_image_model?: string;
  auto_generate_description?: boolean;
  // Legacy format for backwards compatibility
  ai_provider?: "google" | "openrouter";
  image_model?: string;
  text_model?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get authorization header for user verification
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is admin
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      throw new Error("Admin access required");
    }

    // Get AI settings from database
    const { data: settingsData } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "ai_settings")
      .maybeSingle();

    const aiSettings: AISettings = settingsData?.value as AISettings || {};

    // Parse request body
    const { type, prompt, productName, category, model, referenceImages, aspectRatio } = await req.json() as GenerateRequest;

    // Determine provider based on type (image or text/chat)
    // Support both new format (image_provider/chat_provider) and legacy format (ai_provider)
    let provider: "google" | "openrouter";
    
    if (type === "image") {
      provider = aiSettings.image_provider || aiSettings.ai_provider || "google";
    } else {
      provider = aiSettings.chat_provider || aiSettings.ai_provider || "google";
    }

    console.log(`Using AI provider: ${provider}, type: ${type}, referenceImages: ${referenceImages?.length || 0}, aspectRatio: ${aspectRatio || '1:1'}`);

    if (provider === "openrouter") {
      return await handleOpenRouter(type, prompt, productName, category, model, aiSettings, referenceImages, aspectRatio);
    } else {
      return await handleGoogleAI(type, prompt, productName, category, model, aiSettings, referenceImages, aspectRatio);
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("AI generation error:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

// Handle Google AI (Gemini/Imagen) requests
async function handleGoogleAI(
  type: string,
  prompt: string,
  productName?: string,
  category?: string,
  model?: string,
  aiSettings?: AISettings,
  referenceImages?: string[],
  aspectRatio?: string
) {
  const googleApiKey = Deno.env.get("GOOGLE_AI_API_KEY");
  if (!googleApiKey) {
    throw new Error("Google AI API key not configured. Please add GOOGLE_AI_API_KEY to Supabase secrets.");
  }

  if (type === "text") {
    // Use new format first, then legacy format, then default
    const textModel = model || aiSettings?.google_text_model || aiSettings?.text_model || "gemini-2.0-flash";
    
    console.log(`Google text generation with model: ${textModel}`);
    
    const systemPrompt = `You are a professional e-commerce copywriter specializing in lighting and electrical products. 
Generate compelling, SEO-friendly product descriptions that highlight features, benefits, and use cases.
Keep descriptions between 100-200 words. Use a professional but engaging tone.
Focus on quality, durability, energy efficiency, and aesthetic appeal where relevant.`;

    const userPrompt = prompt || `Write a product description for: "${productName}"${category ? ` in the category "${category}"` : ""}.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${textModel}:generateContent?key=${googleApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: systemPrompt + "\n\n" + userPrompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const result = await response.json();
    const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return new Response(
      JSON.stringify({ success: true, text: generatedText }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } else if (type === "image") {
    // Use new format first, then legacy format, then default
    const imageModel = model || aiSettings?.google_image_model || aiSettings?.image_model || "gemini-2.5-flash-image";
    
    console.log(`Google image generation with model: ${imageModel}`);
    
    const imagePrompt = prompt || `Professional product photo of "${productName}", high-quality lighting product, white background, studio lighting, commercial photography, 4K quality`;

    // Check if using Nano Banana models (gemini-based) vs Imagen models
    const isNanoBanana = imageModel.includes("gemini") && imageModel.includes("image");
    
    let response;
    
    if (isNanoBanana) {
      // Build content parts - include reference images if provided
      const contentParts: any[] = [];
      
      // Add reference images first
      if (referenceImages && referenceImages.length > 0) {
        console.log(`Including ${referenceImages.length} reference image(s) in generation`);
        for (const imgBase64 of referenceImages) {
          contentParts.push({
            inlineData: {
              mimeType: "image/jpeg",
              data: imgBase64,
            },
          });
        }
      }
      
      // Add the prompt text with aspect ratio hint
      const aspectHint = aspectRatio ? ` The image should have an aspect ratio of ${aspectRatio}.` : '';
      contentParts.push({ text: imagePrompt + aspectHint });

      // Use Gemini generateContent endpoint for Nano Banana models
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${imageModel}:generateContent?key=${googleApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: contentParts }],
            generationConfig: {
              responseModalities: ["TEXT", "IMAGE"],
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Nano Banana API error:", errorText);
        throw new Error(`Image generation error: ${response.status}`);
      }

      const result = await response.json();
      
      // Find image part in response
      const imagePart = result.candidates?.[0]?.content?.parts?.find(
        (p: any) => p.inlineData?.mimeType?.startsWith("image/")
      );
      
      if (!imagePart?.inlineData?.data) {
        throw new Error("No image generated. Please try a different prompt.");
      }

      return new Response(
        JSON.stringify({ success: true, imageBase64: imagePart.inlineData.data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else {
      // Use Imagen predict endpoint for older Imagen models
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${imageModel}:predict?key=${googleApiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
          instances: [{ prompt: imagePrompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: aspectRatio || "1:1",
            safetyFilterLevel: "block_medium_and_above",
            personGeneration: "dont_allow",
          },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Imagen API error:", errorText);
        
        if (response.status === 400) {
          throw new Error("Invalid image generation request. Please try a different prompt.");
        } else if (response.status === 403) {
          throw new Error("Imagen API access denied. Please check your API key permissions.");
        }
        throw new Error(`Imagen API error: ${response.status}`);
      }

      const result = await response.json();
      const imageBase64 = result.predictions?.[0]?.bytesBase64Encoded;

      if (!imageBase64) {
        throw new Error("No image generated. Please try a different prompt.");
      }

      return new Response(
        JSON.stringify({ success: true, imageBase64 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } else {
    throw new Error("Invalid generation type. Use 'text' or 'image'.");
  }
}

// Handle OpenRouter API requests
async function handleOpenRouter(
  type: string,
  prompt: string,
  productName?: string,
  category?: string,
  model?: string,
  aiSettings?: AISettings,
  referenceImages?: string[],
  aspectRatio?: string
) {
  const openrouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
  if (!openrouterApiKey) {
    throw new Error("OpenRouter API key not configured. Please add OPENROUTER_API_KEY to Supabase secrets.");
  }

  if (type === "text") {
    const textModel = model || aiSettings?.openrouter_text_model || "openai/gpt-4o-mini";
    
    const systemPrompt = `You are a professional e-commerce copywriter specializing in lighting and electrical products. 
Generate compelling, SEO-friendly product descriptions that highlight features, benefits, and use cases.
Keep descriptions between 100-200 words. Use a professional but engaging tone.
Focus on quality, durability, energy efficiency, and aesthetic appeal where relevant.`;

    const userPrompt = prompt || `Write a product description for: "${productName}"${category ? ` in the category "${category}"` : ""}.`;

    console.log(`OpenRouter text generation with model: ${textModel}`);

    const requestBody = {
      model: textModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 1024,
      temperature: 0.7,
    };

    console.log(`OpenRouter request body: ${JSON.stringify(requestBody)}`);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openrouterApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://qlightkw.lovable.app",
        "X-Title": "Quality Light Kuwait",
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log(`OpenRouter raw response: ${responseText.substring(0, 500)}`);

    if (!response.ok) {
      console.error("OpenRouter API error:", responseText);
      throw new Error(`OpenRouter API error: ${response.status} - ${responseText}`);
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse OpenRouter response:", parseError);
      throw new Error(`Failed to parse OpenRouter response: ${responseText.substring(0, 200)}`);
    }

    // Check for OpenRouter error response
    if (result.error) {
      console.error("OpenRouter returned error:", result.error);
      throw new Error(`OpenRouter error: ${result.error.message || JSON.stringify(result.error)}`);
    }

    const generatedText = result.choices?.[0]?.message?.content || "";
    
    if (!generatedText) {
      console.warn("OpenRouter returned empty content. Full response:", JSON.stringify(result));
    }

    return new Response(
      JSON.stringify({ success: true, text: generatedText }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } else if (type === "image") {
    const imageModel = model || aiSettings?.openrouter_image_model;
    
    if (!imageModel) {
      throw new Error("No image model selected. Please configure an image model in AI settings.");
    }

    const imagePrompt = prompt || `Professional product photo of "${productName}", high-quality lighting product, white background, studio lighting, commercial photography, 4K quality`;

    console.log(`OpenRouter image generation with model: ${imageModel}`);

    // OpenRouter image generation varies by model, using standard API format
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openrouterApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://qlightkw.lovable.app",
        "X-Title": "Quality Light Kuwait",
      },
      body: JSON.stringify({
        model: imageModel,
        messages: [
          { role: "user", content: imagePrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter image API error:", errorText);
      throw new Error(`OpenRouter image API error: ${response.status}`);
    }

    const result = await response.json();
    
    // Check for image in response (format varies by model)
    const content = result.choices?.[0]?.message?.content;
    
    // If it's a URL-based response
    if (content && (content.startsWith("http") || content.includes("![image]"))) {
      return new Response(
        JSON.stringify({ success: true, imageUrl: content }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // If it's base64
    if (result.data?.[0]?.b64_json) {
      return new Response(
        JSON.stringify({ success: true, imageBase64: result.data[0].b64_json }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Image generation failed. The selected model may not support image generation.");
  } else {
    throw new Error("Invalid generation type. Use 'text' or 'image'.");
  }
}

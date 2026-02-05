// Blog Content Generator Edge Function
// Uses AI to generate SEO-optimized blog content with HTML formatting
// Supports both Google AI and OpenRouter based on settings

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Updated AI settings interface with separate providers
interface AISettings {
  image_provider?: "google" | "openrouter";
  chat_provider?: "google" | "openrouter";
  google_image_model?: string;
  google_text_model?: string;
  openrouter_text_model?: string;
  openrouter_image_model?: string;
  // Legacy format
  ai_provider?: "google" | "openrouter";
  text_model?: string;
}

interface GenerateRequest {
  topic: string;
  language: 'en' | 'ar' | 'both';
  tone?: 'professional' | 'casual' | 'educational';
  includeImages?: boolean;
  keywords?: string[];
  existingTitleEn?: string;
  existingTitleAr?: string;
}

interface BlogContent {
  title_en: string;
  title_ar: string;
  excerpt_en: string;
  excerpt_ar: string;
  content_en: string;
  content_ar: string;
  seo_keywords: string[];
  image_suggestions: string[];
  slug: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    
    // Create Supabase client to fetch settings
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: authHeader ? { Authorization: authHeader } : {} },
    });

    // Get AI settings from database
    const { data: settingsData } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "ai_settings")
      .maybeSingle();

    const aiSettings: AISettings = settingsData?.value as AISettings || {};

    // Determine chat provider (new format first, then legacy)
    const chatProvider = aiSettings.chat_provider || aiSettings.ai_provider || "google";

    const { 
      topic, 
      language = 'both', 
      tone = 'professional',
      includeImages = true,
      keywords = [],
      existingTitleEn,
      existingTitleAr
    }: GenerateRequest = await req.json();

    if (!topic?.trim()) {
      throw new Error('Topic is required');
    }

    console.log(`Generating blog content for topic: ${topic}, provider: ${chatProvider}`);

    // Build comprehensive prompt for blog generation
    const prompt = buildBlogPrompt(topic, language, tone, keywords, includeImages, existingTitleEn, existingTitleAr);

    let rawContent: string;

    if (chatProvider === "openrouter") {
      rawContent = await generateWithOpenRouter(prompt, aiSettings);
    } else {
      rawContent = await generateWithGoogle(prompt, aiSettings);
    }

    if (!rawContent) {
      throw new Error('No content generated from AI');
    }

    // Parse the generated content
    const blogContent = parseGeneratedContent(rawContent, topic);

    console.log('Blog content generated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        content: blogContent,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Blog generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Generate content with Google AI
async function generateWithGoogle(prompt: string, aiSettings: AISettings): Promise<string> {
  const googleApiKey = Deno.env.get('GOOGLE_AI_API_KEY');
  if (!googleApiKey) {
    throw new Error('Google AI API key not configured. Please add GOOGLE_AI_API_KEY secret.');
  }

  // Use new format first, then legacy format, then default
  const textModel = aiSettings.google_text_model || aiSettings.text_model || "gemini-2.0-flash";
  
  console.log(`Using Google model: ${textModel}`);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${textModel}:generateContent?key=${googleApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 8192,
          topP: 0.95,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Gemini API error:', errorData);
    throw new Error(`AI service error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// Generate content with OpenRouter
async function generateWithOpenRouter(prompt: string, aiSettings: AISettings): Promise<string> {
  const openrouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!openrouterApiKey) {
    throw new Error('OpenRouter API key not configured. Please add OPENROUTER_API_KEY secret.');
  }

  const textModel = aiSettings.openrouter_text_model || "openai/gpt-4o-mini";
  
  console.log(`Using OpenRouter model: ${textModel}`);

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openrouterApiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://qlightkw.lovable.app",
      "X-Title": "Quality Light Kuwait",
    },
    body: JSON.stringify({
      model: textModel,
      messages: [
        { role: "user", content: prompt },
      ],
      max_tokens: 8192,
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('OpenRouter API error:', errorData);
    throw new Error(`AI service error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

// Build comprehensive prompt for SEO-optimized blog content
function buildBlogPrompt(
  topic: string, 
  language: string, 
  tone: string,
  keywords: string[],
  includeImages: boolean,
  existingTitleEn?: string,
  existingTitleAr?: string
): string {
  const keywordsText = keywords.length > 0 
    ? `Include these SEO keywords naturally: ${keywords.join(', ')}` 
    : 'Include relevant SEO keywords for lighting and electrical products';

  const titleInstruction = existingTitleEn 
    ? `Use this exact English title: "${existingTitleEn}"${existingTitleAr ? ` and Arabic title: "${existingTitleAr}"` : ''}`
    : 'Create an engaging, SEO-optimized title (50-60 characters)';

  return `You are an expert content writer specializing in lighting, electrical products, and home improvement for Quality Light store in Kuwait.

Generate a comprehensive, well-structured, SEO-optimized blog post about: "${topic}"

CRITICAL: Your response MUST be valid JSON with this exact structure (no markdown code blocks, just raw JSON):

{
  "title_en": "Engaging English title",
  "title_ar": "العنوان بالعربية",
  "excerpt_en": "Compelling excerpt for SEO meta description (150-160 chars)",
  "excerpt_ar": "مقتطف مقنع للوصف التعريفي",
  "content_en": "Full HTML content in English",
  "content_ar": "المحتوى الكامل بالعربية",
  "seo_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "image_suggestions": ["Professional description for hero image", "Description for supporting image", "Description for infographic"],
  "slug": "url-friendly-slug"
}

═══════════════════════════════════════════════════════════════
CONTENT STRUCTURE REQUIREMENTS (MUST FOLLOW):
═══════════════════════════════════════════════════════════════

1️⃣ TITLE: ${titleInstruction}
   - Include the main keyword near the beginning
   - Creates curiosity or promises value

2️⃣ EXCERPT: Write a compelling meta description (150-160 characters)
   - Include a call-to-action
   - Summarizes the article value

3️⃣ CONTENT HTML FORMAT (800-1500 words) - MUST BE WELL ORGANIZED:

   📌 INTRODUCTION SECTION:
   <div class="blog-intro">
     <p class="lead">Opening paragraph with hook and topic overview. Use <strong>bold</strong> for key terms.</p>
   </div>

   📌 MAIN SECTIONS (Use 3-5 sections with clear headings):
   <section class="blog-section">
     <h2>🔆 Section Title with Emoji</h2>
     <p>Detailed paragraph explaining the topic...</p>
     
     <h3>📋 Subsection Title</h3>
     <ul class="feature-list">
       <li>✅ <strong>Key Point 1:</strong> Explanation of the point</li>
       <li>✅ <strong>Key Point 2:</strong> Explanation of the point</li>
       <li>✅ <strong>Key Point 3:</strong> Explanation of the point</li>
     </ul>
   </section>

   📌 TIPS/STEPS SECTION (numbered steps):
   <section class="blog-section">
     <h2>📝 Step-by-Step Guide / Tips</h2>
     <ol class="steps-list">
       <li><strong>Step 1:</strong> Description of the first step</li>
       <li><strong>Step 2:</strong> Description of the second step</li>
       <li><strong>Step 3:</strong> Description of the third step</li>
     </ol>
   </section>

   📌 EXPERT TIP BOX:
   <blockquote class="expert-tip">
     <span class="tip-icon">💡</span>
     <strong>Expert Tip:</strong> Professional advice or important note here.
   </blockquote>

   📌 COMPARISON TABLE (if relevant):
   <div class="comparison-table">
     <table>
       <thead>
         <tr><th>Feature</th><th>Option A</th><th>Option B</th></tr>
       </thead>
       <tbody>
         <tr><td>Feature 1</td><td>Value A</td><td>Value B</td></tr>
       </tbody>
     </table>
   </div>

   📌 CONCLUSION:
   <section class="blog-conclusion">
     <h2>🎯 Conclusion</h2>
     <p>Summary of key points and call-to-action...</p>
     <div class="cta-box">
       <p>Ready to upgrade your lighting? <strong>Visit Quality Light</strong> for premium lighting solutions!</p>
     </div>
   </section>

═══════════════════════════════════════════════════════════════
REQUIRED FORMATTING ELEMENTS:
═══════════════════════════════════════════════════════════════

✅ Use EMOJIS in headings for visual appeal:
   - 🔆 💡 ✨ for lighting topics
   - 📋 📝 📌 for lists and tips
   - ✅ ⚡ 🏠 for features
   - 💰 🎯 🌟 for benefits
   - ⚠️ for warnings/important notes

✅ Use HTML classes for styling:
   - class="lead" for intro paragraphs
   - class="feature-list" for feature lists
   - class="steps-list" for numbered steps
   - class="expert-tip" for blockquotes
   - class="cta-box" for call-to-action boxes

✅ Text formatting:
   - <strong> for important terms and key points
   - <em> for emphasis
   - Break long paragraphs into shorter ones (2-3 sentences each)

═══════════════════════════════════════════════════════════════
CONTENT QUALITY REQUIREMENTS:
═══════════════════════════════════════════════════════════════

📌 TONE: Write in a ${tone} tone
   - Professional: Authoritative yet approachable
   - Casual: Friendly and conversational
   - Educational: Informative and detailed

📌 SEO: ${keywordsText}
   - Use keywords in headings and first paragraph
   - Include related terms naturally throughout

📌 ARABIC CONTENT:
   - Must be proper Arabic, not transliteration
   - Use Arabic emojis and formatting
   - Right-to-left friendly structure
   - Match the quality and structure of English content

📌 IMAGE SUGGESTIONS: Provide 3-4 detailed prompts for AI image generation:
   - Hero image: Professional, visually striking
   - Supporting images that illustrate key points
   - Include lighting, atmosphere, and style details

TOPIC FOCUS: Quality Light Kuwait - Home and commercial lighting solutions, LED technology, energy efficiency, interior design with lighting, electrical safety.

Generate high-quality, original, well-organized content that ranks well on Google and provides genuine value to readers.`;
}

// Parse the generated content from AI response
function parseGeneratedContent(rawContent: string, topic: string): BlogContent {
  try {
    // Try to extract JSON from the response
    let jsonStr = rawContent;
    
    // Remove markdown code blocks if present
    if (rawContent.includes('```json')) {
      jsonStr = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (rawContent.includes('```')) {
      jsonStr = rawContent.replace(/```\n?/g, '');
    }
    
    // Trim whitespace
    jsonStr = jsonStr.trim();
    
    // Parse JSON
    const parsed = JSON.parse(jsonStr);
    
    // Generate slug if not provided
    const slug = parsed.slug || generateSlug(parsed.title_en || topic);
    
    return {
      title_en: parsed.title_en || `Guide to ${topic}`,
      title_ar: parsed.title_ar || topic,
      excerpt_en: parsed.excerpt_en || `Learn everything about ${topic}`,
      excerpt_ar: parsed.excerpt_ar || topic,
      content_en: parsed.content_en || `<p>Content about ${topic}</p>`,
      content_ar: parsed.content_ar || `<p>${topic}</p>`,
      seo_keywords: parsed.seo_keywords || [],
      image_suggestions: parsed.image_suggestions || [],
      slug,
    };
  } catch (error) {
    console.error('Error parsing AI response:', error);
    console.log('Raw content:', rawContent.substring(0, 500));
    
    // Return a fallback structure
    const slug = generateSlug(topic);
    return {
      title_en: `Guide to ${topic}`,
      title_ar: topic,
      excerpt_en: `Learn everything about ${topic} in this comprehensive guide.`,
      excerpt_ar: `تعلم كل شيء عن ${topic} في هذا الدليل الشامل.`,
      content_en: `<h2>About ${topic}</h2><p>${rawContent.substring(0, 2000)}</p>`,
      content_ar: `<h2>حول ${topic}</h2><p>محتوى حول ${topic}</p>`,
      seo_keywords: [topic.toLowerCase()],
      image_suggestions: [`Hero image for ${topic}`, `Infographic about ${topic}`],
      slug,
    };
  }
}

// Generate URL-friendly slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60);
}

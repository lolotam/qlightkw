// AI Assistant Edge Function - Gemini powered with database access
// Provides conversational AI with access to products, orders, and customer data

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Get Gemini API key from environment
const GEMINI_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY');

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AssistantRequest {
  message: string;
  conversationHistory?: Message[];
  userId?: string;
  language?: 'en' | 'ar';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate API key
    if (!GEMINI_API_KEY) {
      console.error('GOOGLE_AI_API_KEY is not configured');
      throw new Error('AI service not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { message, conversationHistory = [], userId, language = 'en' }: AssistantRequest = await req.json();

    if (!message?.trim()) {
      throw new Error('Message is required');
    }

    // Detect message language - if Arabic characters are present, respond in Arabic
    const detectedLanguage = detectMessageLanguage(message);
    const responseLanguage = detectedLanguage || language;

    console.log('Processing AI request:', { messageLength: message.length, userId, language, detectedLanguage: responseLanguage });

    // Fetch relevant context from database
    const contextData = await fetchDatabaseContext(supabase, message);
    
    // Build system prompt with database context - use detected language
    const systemPrompt = buildSystemPrompt(contextData, responseLanguage);

    // Build conversation for Gemini
    const contents = buildGeminiContents(systemPrompt, conversationHistory, message);

    // Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
            topP: 0.9,
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          ],
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text();
      console.error('Gemini API error:', errorData);
      throw new Error(`AI service error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const assistantResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 
      (language === 'ar' ? 'عذراً، لم أتمكن من معالجة طلبك.' : 'Sorry, I could not process your request.');

    console.log('AI response generated successfully');

    return new Response(
      JSON.stringify({
        response: assistantResponse,
        context: {
          productsFound: contextData.products?.length || 0,
          categoriesFound: contextData.categories?.length || 0,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('AI Assistant error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Fetch relevant database context based on user query
async function fetchDatabaseContext(supabase: any, query: string) {
  const context: {
    products?: any[];
    categories?: any[];
    faqs?: any[];
  } = {};

  try {
    // Search products relevant to query
    const { data: products } = await supabase
      .from('products')
      .select('name_en, name_ar, base_price, sale_price, short_description_en, short_description_ar, is_active')
      .eq('is_active', true)
      .limit(10);
    
    context.products = products || [];

    // Get categories
    const { data: categories } = await supabase
      .from('categories')
      .select('name_en, name_ar, description_en, description_ar')
      .eq('is_active', true)
      .limit(10);
    
    context.categories = categories || [];

    // Get FAQs
    const { data: faqs } = await supabase
      .from('faqs')
      .select('question_en, question_ar, answer_en, answer_ar')
      .eq('is_active', true)
      .limit(5);
    
    context.faqs = faqs || [];

  } catch (error) {
    console.error('Error fetching context:', error);
  }

  return context;
}

// Detect the language of the user's message
function detectMessageLanguage(message: string): 'ar' | 'en' | null {
  // Check for Arabic characters (Arabic Unicode range)
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
  if (arabicPattern.test(message)) {
    return 'ar';
  }
  // Check for primarily English/Latin characters
  const latinPattern = /[a-zA-Z]/;
  if (latinPattern.test(message)) {
    return 'en';
  }
  return null;
}

// Build system prompt with context
function buildSystemPrompt(context: any, language: string) {
  const isArabic = language === 'ar';
  
  let prompt = isArabic 
    ? `أنت مساعد Qlight الذكي والودود لمتجر Quality Light للإضاءة في الكويت. مهمتك مساعدة العملاء في الإجابة عن أسئلتهم حول المنتجات والطلبات والخدمات.

قواعد مهمة:
- كن مهذباً وودوداً دائماً
- أجب باللغة العربية لأن المستخدم يتحدث العربية
- إذا سُئلت عن منتج غير موجود، اقترح منتجات مشابهة
- شجع العملاء على التواصل عبر واتساب للطلبات على الرقم +96551111725
- العملة المستخدمة: دينار كويتي (KWD)

`
    : `You are Qlight Assistant, a friendly AI assistant for Quality Light, a lighting store in Kuwait. Your job is to help customers with questions about products, orders, and services.

Important rules:
- Always be polite and helpful
- Reply in English because the user is writing in English
- If asked about a product that doesn't exist, suggest similar products
- Encourage customers to contact via WhatsApp for orders at +96551111725
- Currency used: Kuwaiti Dinar (KWD)

`;

  // Add product context
  if (context.products?.length > 0) {
    prompt += isArabic ? '\n\nالمنتجات المتوفرة:\n' : '\n\nAvailable Products:\n';
    context.products.forEach((p: any) => {
      const name = isArabic ? p.name_ar : p.name_en;
      const price = p.sale_price || p.base_price;
      prompt += `- ${name}: ${price} KWD\n`;
    });
  }

  // Add category context  
  if (context.categories?.length > 0) {
    prompt += isArabic ? '\n\nالفئات المتوفرة:\n' : '\n\nAvailable Categories:\n';
    context.categories.forEach((c: any) => {
      const name = isArabic ? c.name_ar : c.name_en;
      prompt += `- ${name}\n`;
    });
  }

  // Add FAQ context
  if (context.faqs?.length > 0) {
    prompt += isArabic ? '\n\nالأسئلة الشائعة:\n' : '\n\nFrequently Asked Questions:\n';
    context.faqs.forEach((f: any) => {
      const q = isArabic ? f.question_ar : f.question_en;
      const a = isArabic ? f.answer_ar : f.answer_en;
      if (q && a) {
        prompt += `Q: ${q}\nA: ${a}\n\n`;
      }
    });
  }

  return prompt;
}

// Build Gemini API contents array
function buildGeminiContents(systemPrompt: string, history: Message[], currentMessage: string) {
  const contents: any[] = [];
  
  // Add system prompt as first user message
  contents.push({
    role: 'user',
    parts: [{ text: systemPrompt + '\n\n---\nNow respond to user messages as the AI assistant.' }]
  });
  contents.push({
    role: 'model',
    parts: [{ text: 'I understand. I am ready to help customers with their questions about Quality Light products and services.' }]
  });

  // Add conversation history
  for (const msg of history) {
    contents.push({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    });
  }

  // Add current message
  contents.push({
    role: 'user',
    parts: [{ text: currentMessage }]
  });

  return contents;
}

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate API key
    const apiKey = req.headers.get("x-api-key");
    const expectedKey = Deno.env.get("PRODUCT_API_KEY");
    if (!expectedKey || apiKey !== expectedKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { product_id, images, tags } = await req.json();

    if (!product_id) {
      return new Response(JSON.stringify({ error: "product_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if ((!images || images.length === 0) && (!tags || tags.length === 0)) {
      return new Response(JSON.stringify({ error: "At least one of images or tags is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let images_inserted = 0;
    let tags_inserted = 0;

    // Insert images
    if (images && images.length > 0) {
      const imageRows = images.map((img: any, index: number) => ({
        product_id,
        url: img.url,
        is_primary: img.is_primary ?? (index === 0),
        sort_order: img.sort_order ?? index,
        alt_text_en: img.alt_text_en ?? null,
        alt_text_ar: img.alt_text_ar ?? null,
      }));

      const { data, error } = await supabase.from("product_images").insert(imageRows).select();
      if (error) {
        return new Response(JSON.stringify({ error: `Images insert failed: ${error.message}` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      images_inserted = data?.length ?? 0;
    }

    // Insert tags
    if (tags && tags.length > 0) {
      const tagRows = tags.map((tag_id: string) => ({
        product_id,
        tag_id,
      }));

      const { data, error } = await supabase.from("product_tags").insert(tagRows).select();
      if (error) {
        return new Response(JSON.stringify({ error: `Tags insert failed: ${error.message}` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      tags_inserted = data?.length ?? 0;
    }

    return new Response(JSON.stringify({ success: true, images_inserted, tags_inserted }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

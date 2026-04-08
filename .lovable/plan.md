

# Create Edge Function: Product Assets (Images + Tags) Bulk Insert

## Overview
Create a single edge function `product-assets` that accepts a product ID, an array of image URLs, and an array of tag IDs — inserting them all into `product_images` and `product_tags` in one request. Authentication via a custom API key stored as a secret.

## Authentication
- Create a new secret called `PRODUCT_API_KEY` with a generated key value
- The edge function validates the `x-api-key` header against this secret
- No JWT required (public endpoint secured by API key)

## Edge Function: `supabase/functions/product-assets/index.ts`

**Request body:**
```json
{
  "product_id": "uuid",
  "images": [
    { "url": "https://...", "is_primary": true, "sort_order": 0, "alt_text_en": "...", "alt_text_ar": "..." }
  ],
  "tags": ["tag-uuid-1", "tag-uuid-2"]
}
```

**Logic:**
1. Validate `x-api-key` header against `PRODUCT_API_KEY` secret
2. Validate request body (product_id required, at least one of images/tags)
3. Use Supabase service role client to:
   - Insert all images into `product_images` with the given `product_id`
   - Insert all tags into `product_tags` mapping `product_id` → `tag_id`
4. Return success with inserted counts

**Response:**
```json
{
  "success": true,
  "images_inserted": 3,
  "tags_inserted": 2
}
```

## Config
- Add `[functions.product-assets]` with `verify_jwt = false` to `supabase/config.toml`

## Secret
- Add `PRODUCT_API_KEY` secret with a generated UUID-based key

## Curl Example (provided in chat after implementation)
```bash
curl -X POST \
  "https://yubebbfsmlopmnluajgf.supabase.co/functions/v1/product-assets" \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "product_id": "product-uuid",
    "images": [
      {"url": "https://example.com/img1.jpg", "is_primary": true, "sort_order": 0},
      {"url": "https://example.com/img2.jpg", "is_primary": false, "sort_order": 1}
    ],
    "tags": ["tag-uuid-1", "tag-uuid-2"]
  }'
```

## Files Changed
1. **`supabase/functions/product-assets/index.ts`** — New edge function
2. **`supabase/config.toml`** — Add function config entry
3. **New secret: `PRODUCT_API_KEY`** — API key for authentication


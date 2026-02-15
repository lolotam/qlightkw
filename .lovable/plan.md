
# Fix Broken Images: MinIO Server Unreachable

## Problem Diagnosis

The browser console reveals the root cause: **ALL MinIO URLs are failing with `ERR_TUNNEL_CONNECTION_FAILED`**. The MinIO server at `minio.walidmohamed.com` is completely unreachable from the browser.

Current state:
- **Database URLs**: All point to MinIO (`minio.walidmohamed.com/qlifgtkw/...`)
- **MinIO server**: Unreachable (`ERR_TUNNEL_CONNECTION_FAILED` for every request)
- **Supabase Storage**: Contains copies, but 54 out of 61 files are corrupted HTML (from a failed migration). Only 7 are real images.

Valid images in Supabase Storage:
- `brands/1769987379992-ceazl.png` (Lenovo logo) -- this is why Lenovo works
- `categories/1769987377383-tvnf2.png` (Lenovo category)
- `products/1769987375336-ml7o9h.png` (1 product image)

Everything else in Supabase is a corrupted 128KB HTML file.

## Solution (Two Parts)

### Part 1 -- Re-enable MinIO-to-Supabase URL conversion

Since MinIO is unreachable, we must convert MinIO URLs back to Supabase Storage URLs. This will at least make the 3 valid images display (Lenovo brand/category and 1 product). The corrupted files will still show as broken, but this is the necessary foundation.

**File: `src/lib/storage.ts`**
- Restore the MinIO-to-Supabase conversion logic in `normalizeStorageUrl`
- Map MinIO paths like `categories/xxx.jpg` to `product-images/categories/xxx.jpg` in Supabase

### Part 2 -- Add image error fallback in components

Since most Supabase copies are corrupted HTML, add `onError` handlers to `<img>` tags in the affected components so broken images show a graceful fallback (icon/placeholder) instead of a broken link icon.

**Files to update:**
- `src/components/storefront/ProductCard.tsx` -- Add `onError` handler to product images that hides the broken image and shows the lightbulb emoji fallback
- `src/components/storefront/FeaturedCategories.tsx` -- Add `onError` handler on category images to fall back to the icon-based display
- `src/components/storefront/BrandsShowcase.tsx` -- Add `onError` handler on brand logos to fall back to the text name display

## What This Achieves

| Section | Before | After |
|---------|--------|-------|
| Categories | All broken (MinIO unreachable) | Lenovo shows image; others show icon + name fallback |
| Products | All broken | 1 product shows image; others show lightbulb fallback |
| Brands | All broken except Lenovo | Lenovo shows logo; others show brand name text |
| Hero | Broken (MinIO unreachable) | Still broken -- hero videos also come from MinIO |

## Permanent Fix Required (User Action)

The images will remain partially broken until the actual image files are available. Two options:

1. **Fix the MinIO server**: Make `minio.walidmohamed.com` accessible again, then revert `normalizeStorageUrl` to pass through MinIO URLs
2. **Re-run Storage Migration**: Fix the Cloudflare/WAF on `s3.walidmohamed.com` so the migration tool copies real image bytes (not HTML error pages) into Supabase Storage. After a successful migration, all images will load from Supabase.

## Technical Details

### `src/lib/storage.ts` changes

Restore the conversion logic:

```text
MinIO URL: https://minio.walidmohamed.com/qlifgtkw/categories/xxx.jpg
            |
            v  (extract path after bucket prefix)
Path: categories/xxx.jpg
            |
            v  (map folder "categories" -> bucket "product-images")
Supabase URL: https://yubebbfsmlopmnluajgf.supabase.co/storage/v1/object/public/product-images/categories/xxx.jpg
```

### Image fallback pattern

Each component gets an `onError` handler on its `<img>` tag:

```text
<img onError={(e) => { hide image, show fallback UI }} />
```

This ensures the user sees a clean placeholder instead of a broken image icon, while the valid Supabase copies (Lenovo, etc.) display correctly.



# Fix All Missing Images Across the Website

## Problem Summary

The database stores image URLs pointing to MinIO (`minio.walidmohamed.com/qlifgtkw/...`). The `normalizeStorageUrl()` function converts these to Supabase Storage URLs. However, the files in Supabase Storage are **corrupted HTML pages** (Cloudflare challenge pages copied during migration), not actual images.

Evidence from database:
- Products: 19 out of 20 files are `text/html` (~128KB)
- Brands: 5 out of 7 are `text/html`
- Categories: 7 out of 9 are `text/html`
- Only files uploaded directly (Lenovo brand/category) are real images

## Solution: Use MinIO URLs Directly

Since the MinIO server at `minio.walidmohamed.com` is working (hero videos already load from it), the fastest fix is to **stop converting MinIO URLs to broken Supabase copies**.

### Step 1 - Update `normalizeStorageUrl` in `src/lib/storage.ts`

Change the function so MinIO URLs pass through unchanged. MinIO is serving files correctly via the Nginx reverse proxy.

```text
Before: MinIO URL -> converted to Supabase Storage URL (broken HTML files)
After:  MinIO URL -> used as-is (working images from MinIO)
```

The function will only convert URLs if the files are confirmed to exist in Supabase with correct mimetypes (Supabase URLs pass through unchanged as before).

### Step 2 - Fix Build Error in `generate-ai-content`

The import `https://esm.sh/@supabase/supabase-js@2.95.1` is failing with a 500 error from esm.sh. Change to the unversioned `@2` import that the file already uses (this is a transient CDN issue - no code change needed if the file already has `@2`).

### Step 3 - Verify Image Display Across All Pages

Confirm images render on:
- Homepage: Featured categories, product cards, brand logos
- Shop page: Product grid images
- Product detail page: Image gallery

## Technical Details

### File Changes

**`src/lib/storage.ts`** - Remove the MinIO-to-Supabase conversion logic. Return MinIO URLs as-is since the MinIO server is accessible and serving correct files.

### What This Fixes

| Section | Current State | After Fix |
|---------|--------------|-----------|
| Categories | Broken (loading HTML from Supabase) | Working (loading from MinIO) |
| Products | Broken (loading HTML from Supabase) | Working (loading from MinIO) |
| Brands | Broken (loading HTML from Supabase) | Working (loading from MinIO) |
| Hero slides | Already working (using MinIO directly) | No change |

### Future Consideration

Once the Cloudflare/WAF issue on `s3.walidmohamed.com` is resolved, you can re-run the Storage Migration tool to properly copy real image data into Supabase Storage. At that point, the normalization can be re-enabled to serve everything from Supabase.


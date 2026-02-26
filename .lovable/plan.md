
# Restore Website Visuals using Local Images

## Problem
The website's images are currently broken because the database points to an unreachable MinIO server (`minio.walidmohamed.com`), and the fallback Supabase files are corrupted (returning HTML error pages). The user has requested to immediately restore visuals using the local image assets already present in the project.

## Solution
I will implement a robust "Image Resolver" system that bypasses the broken database URLs and serves local project images instead. This will be done by mapping content (Products, Categories, Brands, etc.) to the existing files in `public/images` and `src/assets`.

## Implementation Steps

### 1. Create Image Resolver Utility (`src/lib/image-resolver.ts`)
Create a new utility file to handle image fallback logic centrally.
- Use `import.meta.glob` to dynamically load all local assets from `src/assets`.
- Define lists of available images in `public/images`.
- Implement a `resolveImageUrl(url, type, slug)` function that:
    1. Checks if the provided URL is a known broken MinIO/Supabase URL.
    2. If broken (or missing), tries to find a matching local image based on the `slug` or `name`.
    3. If no exact match is found, picks a consistent "fallback" image from the local set (based on a hash of the ID/slug) so every item has a valid image.

### 2. Update Storefront Components
Replace the simple `normalizeStorageUrl` calls with the new `resolveImageUrl` in all key storefront sections.

*   **Hero Section** (`src/components/storefront/HeroSection.tsx`)
    *   Map slides to local hero assets if the DB URL fails.
    
*   **Categories** (`src/components/storefront/FeaturedCategories.tsx`)
    *   Map category slugs (e.g., `ceiling-lights`) to `public/images/categories/ceiling-lights.jpg`.
    
*   **Products** (`src/components/storefront/ProductsSection.tsx` & `ProductCard.tsx`)
    *   Map product slugs to `public/images/products/...`.
    *   Ensure every product gets an image, even if it's a random selection from the available local product images.
    
*   **Brands** (`src/components/storefront/BrandsShowcase.tsx`)
    *   Map brand names to `public/images/brands/...`.
    
*   **Projects** (`src/components/storefront/ProjectsSection.tsx`)
    *   Map project slugs to `src/assets/projects/...`.
    
*   **Blog** (`src/components/storefront/BlogSection.tsx`)
    *   Map post slugs to `src/assets/blog/...`.

### 3. Clean up `src/lib/storage.ts`
*   Modify `normalizeStorageUrl` to integrate with or delegate to the new resolver, ensuring that any other usages in the app also benefit from the fix.

## Impact
- **Immediate Fix**: All "broken image" icons will be replaced with high-quality local images.
- **No Data Loss**: The database URLs remain untouched; we are just overriding them on the frontend.
- **Resilient**: The site will look complete and professional regardless of the backend storage status.


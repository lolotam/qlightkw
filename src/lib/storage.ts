/**
 * Storage URL utilities
 * 
 * This module provides functions to normalize storage URLs,
 * converting MinIO URLs back to Supabase Storage URLs.
 */

const SUPABASE_PROJECT_ID = 'yubebbfsmlopmnluajgf';
const SUPABASE_STORAGE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public`;

// MinIO URL patterns to match
const MINIO_PATTERNS = [
  /^https?:\/\/minio\.walidmohamed\.com\/qlifgtkw\//,
  /^https?:\/\/s3\.walidmohamed\.com\/qlifgtkw\//,
];

// Folder to bucket mapping
const FOLDER_TO_BUCKET: Record<string, string> = {
  'hero': 'hero-section',
  'hero-desktop': 'hero-section',
  'hero-mobile': 'hero-section',
  'products': 'product-images',
  'categories': 'product-images',
  'brands': 'product-images',
  'projects': 'project-images',
  'posts': 'blog-images',
  'blog': 'blog-images',
};

/**
 * Normalize a storage URL - converts MinIO URLs to Supabase Storage URLs
 * If the URL is already a Supabase URL or external URL, returns as-is.
 * 
 * @param url - The URL to normalize
 * @returns The normalized Supabase Storage URL
 */
export function normalizeStorageUrl(url: string | null | undefined): string {
  if (!url) return '';
  
  // Already a Supabase URL - return as-is
  if (url.includes('supabase.co/storage')) {
    return url;
  }
  
  // Check if it's a MinIO URL
  for (const pattern of MINIO_PATTERNS) {
    if (pattern.test(url)) {
      // Extract the path after the bucket name
      const path = url.replace(pattern, '');
      
      // Determine the bucket based on the folder in the path
      const folder = path.split('/')[0];
      const bucket = FOLDER_TO_BUCKET[folder] || 'hero-section';
      
      // Construct Supabase Storage URL
      return `${SUPABASE_STORAGE_URL}/${bucket}/${path}`;
    }
  }
  
  // Not a MinIO URL - return as-is (could be external URL, placeholder, etc.)
  return url;
}

/**
 * Get the Supabase Storage public URL for a file
 * 
 * @param bucket - The storage bucket name
 * @param path - The file path within the bucket
 * @returns The public URL
 */
export function getStorageUrl(bucket: string, path: string): string {
  return `${SUPABASE_STORAGE_URL}/${bucket}/${path}`;
}

/**
 * Extract file info from a storage URL
 * 
 * @param url - The storage URL
 * @returns Object with bucket and path, or null if not a storage URL
 */
export function parseStorageUrl(url: string): { bucket: string; path: string } | null {
  if (!url) return null;
  
  // Parse Supabase Storage URL
  const supabaseMatch = url.match(/supabase\.co\/storage\/v1\/object\/public\/([^/]+)\/(.+)/);
  if (supabaseMatch) {
    return { bucket: supabaseMatch[1], path: supabaseMatch[2] };
  }
  
  // Parse MinIO URL
  for (const pattern of MINIO_PATTERNS) {
    if (pattern.test(url)) {
      const path = url.replace(pattern, '');
      const folder = path.split('/')[0];
      const bucket = FOLDER_TO_BUCKET[folder] || 'hero-section';
      return { bucket, path };
    }
  }
  
  return null;
}

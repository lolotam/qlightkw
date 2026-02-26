/**
 * Image Resolver - Maps broken MinIO/Supabase URLs to local project images.
 * 
 * The database stores URLs pointing to an unreachable MinIO server.
 * This module intercepts those URLs and serves local images instead.
 */

// Available local images by type
const LOCAL_IMAGES: Record<string, string[]> = {
  products: [
    '/images/products/ceiling-light-1.jpg',
    '/images/products/ceiling-panel-2.jpg',
    '/images/products/crystal-chandelier-1.jpg',
    '/images/products/downlight-1.jpg',
    '/images/products/floor-lamp-1.jpg',
    '/images/products/floor-lamp-2.jpg',
    '/images/products/gold-chandelier-2.jpg',
    '/images/products/led-strip-1.jpg',
    '/images/products/led-strip-2.jpg',
    '/images/products/outdoor-bollard-1.jpg',
    '/images/products/outdoor-solar-2.jpg',
    '/images/products/pendant-globe-1.jpg',
    '/images/products/pendant-industrial-2.jpg',
    '/images/products/spotlight-2.jpg',
    '/images/products/wall-light-2.jpg',
    '/images/products/wall-sconce-1.jpg',
  ],
  categories: [
    '/images/categories/ceiling-lights.jpg',
    '/images/categories/chandeliers.jpg',
    '/images/categories/floor-lamps.jpg',
    '/images/categories/led-strips.jpg',
    '/images/categories/outdoor-lighting.jpg',
    '/images/categories/pendant-lights.jpg',
    '/images/categories/spotlights.jpg',
    '/images/categories/wall-lights.jpg',
  ],
  brands: [
    '/images/brands/ge-lighting.jpg',
    '/images/brands/havells.jpg',
    '/images/brands/legrand.jpg',
    '/images/brands/osram.jpg',
    '/images/brands/panasonic.jpg',
    '/images/brands/philips.jpg',
  ],
};

// Eager-imported src/assets images (for projects & blog which use src/assets)
import bedroomInstallation from '@/assets/projects/bedroom-installation.jpg';
import gardenOutdoor from '@/assets/projects/garden-outdoor.jpg';
import kitchenInstallation from '@/assets/projects/kitchen-installation.jpg';
import majlisChandelier from '@/assets/projects/majlis-chandelier.jpg';
import officeLighting from '@/assets/projects/office-lighting.jpg';
import restaurantLighting from '@/assets/projects/restaurant-lighting.jpg';
import salonLighting from '@/assets/projects/salon-lighting.jpg';
import villaLivingRoom from '@/assets/projects/villa-living-room.jpg';

import bedroomLighting from '@/assets/blog/bedroom-lighting.jpg';
import choosingRightLight from '@/assets/blog/choosing-right-light.jpg';
import commercialLighting from '@/assets/blog/commercial-lighting.jpg';
import energySavings from '@/assets/blog/energy-savings.jpg';
import kitchenLighting from '@/assets/blog/kitchen-lighting.jpg';
import ledVsTraditional from '@/assets/blog/led-vs-traditional.jpg';
import outdoorLighting from '@/assets/blog/outdoor-lighting.jpg';
import perfectChandelier from '@/assets/blog/perfect-chandelier.jpg';
import smartLightingGuide from '@/assets/blog/smart-lighting-guide.jpg';
import warmVsCoolLight from '@/assets/blog/warm-vs-cool-light.jpg';

const PROJECT_IMAGES: string[] = [
  bedroomInstallation, gardenOutdoor, kitchenInstallation, majlisChandelier,
  officeLighting, restaurantLighting, salonLighting, villaLivingRoom,
];

const BLOG_IMAGES: string[] = [
  bedroomLighting, choosingRightLight, commercialLighting, energySavings,
  kitchenLighting, ledVsTraditional, outdoorLighting, perfectChandelier,
  smartLightingGuide, warmVsCoolLight,
];

// Slug-to-image mappings for exact matches
const CATEGORY_SLUG_MAP: Record<string, string> = {
  'ceiling-lights': '/images/categories/ceiling-lights.jpg',
  'chandeliers': '/images/categories/chandeliers.jpg',
  'floor-lamps': '/images/categories/floor-lamps.jpg',
  'led-strips': '/images/categories/led-strips.jpg',
  'outdoor-lighting': '/images/categories/outdoor-lighting.jpg',
  'pendant-lights': '/images/categories/pendant-lights.jpg',
  'spotlights': '/images/categories/spotlights.jpg',
  'wall-lights': '/images/categories/wall-lights.jpg',
};

const BRAND_SLUG_MAP: Record<string, string> = {
  'philips': '/images/brands/philips.jpg',
  'osram': '/images/brands/osram.jpg',
  'ge-lighting': '/images/brands/ge-lighting.jpg',
  'havells': '/images/brands/havells.jpg',
  'panasonic': '/images/brands/panasonic.jpg',
  'legrand': '/images/brands/legrand.jpg',
};

/** Simple hash for consistent fallback selection */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Check if a URL is known to be broken (MinIO or corrupted Supabase) */
function isBrokenUrl(url: string | null | undefined): boolean {
  if (!url) return true;
  if (url.includes('minio.walidmohamed.com')) return true;
  if (url.includes('s3.walidmohamed.com')) return true;
  return false;
}

export type ImageType = 'product' | 'category' | 'brand' | 'project' | 'blog' | 'hero';

/**
 * Resolve an image URL, falling back to local images if the URL is broken.
 * 
 * @param url - The original URL from the database
 * @param type - The type of image (product, category, brand, project, blog, hero)
 * @param slugOrId - A slug or ID used for consistent fallback selection
 * @returns A working image URL (local or original)
 */
export function resolveImageUrl(
  url: string | null | undefined,
  type: ImageType,
  slugOrId: string = ''
): string {
  // If URL looks valid (not MinIO), return as-is
  if (url && !isBrokenUrl(url)) return url;

  const hash = simpleHash(slugOrId || 'default');

  switch (type) {
    case 'category': {
      const exactMatch = CATEGORY_SLUG_MAP[slugOrId];
      if (exactMatch) return exactMatch;
      const images = LOCAL_IMAGES.categories;
      return images[hash % images.length];
    }
    case 'brand': {
      const exactMatch = BRAND_SLUG_MAP[slugOrId];
      if (exactMatch) return exactMatch;
      const images = LOCAL_IMAGES.brands;
      return images[hash % images.length];
    }
    case 'product': {
      const images = LOCAL_IMAGES.products;
      return images[hash % images.length];
    }
    case 'project': {
      return PROJECT_IMAGES[hash % PROJECT_IMAGES.length];
    }
    case 'blog': {
      return BLOG_IMAGES[hash % BLOG_IMAGES.length];
    }
    case 'hero': {
      // For hero, fall back to a category image as a placeholder
      const images = LOCAL_IMAGES.categories;
      return images[hash % images.length];
    }
    default: {
      const images = LOCAL_IMAGES.products;
      return images[hash % images.length];
    }
  }
}

/**
 * Get a secondary product image (different from primary) for hover effects.
 */
export function resolveSecondaryImageUrl(
  url: string | null | undefined,
  primarySlug: string = ''
): string {
  if (url && !isBrokenUrl(url)) return url;
  const images = LOCAL_IMAGES.products;
  // Use a different hash offset to get a different image
  const hash = simpleHash(primarySlug + '_secondary');
  return images[hash % images.length];
}

-- Add SEO fields to categories table
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS seo_title_en text,
ADD COLUMN IF NOT EXISTS seo_title_ar text,
ADD COLUMN IF NOT EXISTS seo_description_en text,
ADD COLUMN IF NOT EXISTS seo_description_ar text;

-- Add SEO fields to brands table
ALTER TABLE public.brands
ADD COLUMN IF NOT EXISTS seo_title_en text,
ADD COLUMN IF NOT EXISTS seo_title_ar text,
ADD COLUMN IF NOT EXISTS seo_description_en text,
ADD COLUMN IF NOT EXISTS seo_description_ar text;

-- Add SEO fields to projects table
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS seo_title_en text,
ADD COLUMN IF NOT EXISTS seo_title_ar text,
ADD COLUMN IF NOT EXISTS seo_description_en text,
ADD COLUMN IF NOT EXISTS seo_description_ar text;
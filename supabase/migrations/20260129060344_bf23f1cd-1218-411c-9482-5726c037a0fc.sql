-- Create promo_banners table for Phase 4
CREATE TABLE public.promo_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en TEXT NOT NULL,
  title_ar TEXT,
  subtitle_en TEXT,
  subtitle_ar TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  button_text_en TEXT DEFAULT 'Shop Now',
  button_text_ar TEXT DEFAULT 'تسوق الآن',
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_promo_banners_active ON public.promo_banners(is_active, display_order);

-- Enable RLS
ALTER TABLE public.promo_banners ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view active banners"
ON public.promo_banners FOR SELECT
USING (
  is_active = true 
  AND (starts_at IS NULL OR starts_at <= now())
  AND (ends_at IS NULL OR ends_at >= now())
  OR is_admin()
);

CREATE POLICY "Admins can manage banners"
ON public.promo_banners FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Create product-images storage bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for product-images bucket
CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images' AND is_admin());

CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images' AND is_admin());

CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images' AND is_admin());
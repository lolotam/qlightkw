-- First, let's create a tags table if not exists
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6366f1',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on tags
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tags
CREATE POLICY "Anyone can view active tags" ON public.tags FOR SELECT USING (is_active = true OR is_admin());
CREATE POLICY "Admins can insert tags" ON public.tags FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update tags" ON public.tags FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete tags" ON public.tags FOR DELETE USING (is_admin());

-- Create product_tags junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS public.product_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(product_id, tag_id)
);

-- Enable RLS on product_tags
ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_tags
CREATE POLICY "Anyone can view product tags" ON public.product_tags FOR SELECT USING (true);
CREATE POLICY "Admins can manage product tags" ON public.product_tags FOR ALL USING (is_admin());

-- Insert brands
INSERT INTO public.brands (name, name_ar, slug, logo_url, description_en, description_ar, is_active) VALUES
('Philips', 'فيليبس', 'philips', '/images/brands/philips.jpg', 'Global leader in lighting solutions and technology', 'رائد عالمي في حلول وتقنيات الإضاءة', true),
('OSRAM', 'أوسرام', 'osram', '/images/brands/osram.jpg', 'Premium lighting manufacturer from Germany', 'شركة إضاءة متميزة من ألمانيا', true),
('Panasonic', 'باناسونيك', 'panasonic', '/images/brands/panasonic.jpg', 'Japanese electronics and lighting excellence', 'التميز الياباني في الإلكترونيات والإضاءة', true),
('GE Lighting', 'جي إي للإضاءة', 'ge-lighting', '/images/brands/ge-lighting.jpg', 'American innovation in lighting technology', 'الابتكار الأمريكي في تقنية الإضاءة', true),
('Havells', 'هافلز', 'havells', '/images/brands/havells.jpg', 'Fast moving electrical goods company', 'شركة سريعة النمو في المنتجات الكهربائية', true),
('Legrand', 'ليجراند', 'legrand', '/images/brands/legrand.jpg', 'French specialist in electrical and digital infrastructure', 'متخصص فرنسي في البنية التحتية الكهربائية والرقمية', true);

-- Insert categories
INSERT INTO public.categories (name_en, name_ar, slug, image_url, description_en, description_ar, is_active, sort_order) VALUES
('Chandeliers', 'ثريات', 'chandeliers', '/images/categories/chandeliers.jpg', 'Elegant chandeliers for luxury interiors', 'ثريات أنيقة للديكورات الفاخرة', true, 1),
('Ceiling Lights', 'إضاءة سقفية', 'ceiling-lights', '/images/categories/ceiling-lights.jpg', 'Modern flush mount and semi-flush ceiling lights', 'إضاءة سقفية عصرية مباشرة وشبه مباشرة', true, 2),
('Wall Lights', 'إضاءة جدارية', 'wall-lights', '/images/categories/wall-lights.jpg', 'Stylish wall sconces and accent lighting', 'شمعدانات جدارية أنيقة وإضاءة مميزة', true, 3),
('Pendant Lights', 'مصابيح معلقة', 'pendant-lights', '/images/categories/pendant-lights.jpg', 'Hanging pendant lights for every space', 'مصابيح معلقة لكل مكان', true, 4),
('LED Strips', 'شرائط LED', 'led-strips', '/images/categories/led-strips.jpg', 'Flexible LED strip lights for accent lighting', 'شرائط LED مرنة للإضاءة المميزة', true, 5),
('Floor Lamps', 'مصابيح أرضية', 'floor-lamps', '/images/categories/floor-lamps.jpg', 'Standing floor lamps for living spaces', 'مصابيح أرضية قائمة للمساحات المعيشية', true, 6),
('Outdoor Lighting', 'إضاءة خارجية', 'outdoor-lighting', '/images/categories/outdoor-lighting.jpg', 'Weather-resistant outdoor lighting solutions', 'حلول إضاءة خارجية مقاومة للعوامل الجوية', true, 7),
('Spotlights', 'سبوت لايت', 'spotlights', '/images/categories/spotlights.jpg', 'Recessed downlights and track spotlights', 'إضاءة غائرة وسبوت لايت تتبع', true, 8);

-- Insert tags
INSERT INTO public.tags (name_en, name_ar, slug, color) VALUES
('New Arrival', 'وصل حديثاً', 'new-arrival', '#22c55e'),
('Best Seller', 'الأكثر مبيعاً', 'best-seller', '#f59e0b'),
('On Sale', 'تخفيضات', 'on-sale', '#ef4444'),
('Energy Efficient', 'موفر للطاقة', 'energy-efficient', '#3b82f6'),
('Smart Home', 'منزل ذكي', 'smart-home', '#8b5cf6'),
('Dimmable', 'قابل للتعتيم', 'dimmable', '#06b6d4'),
('Waterproof', 'مقاوم للماء', 'waterproof', '#14b8a6'),
('Premium', 'فاخر', 'premium', '#a855f7');
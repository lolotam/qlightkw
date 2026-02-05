import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProductCard from './ProductCard';
import { ArrowRight } from 'lucide-react';
import { normalizeStorageUrl } from '@/lib/storage';

interface Product {
  id: string;
  name_en: string;
  name_ar: string;
  slug: string;
  base_price: number;
  sale_price: number | null;
  is_new: boolean | null;
  is_bestseller: boolean | null;
  is_featured: boolean | null;
  image_url?: string | null;
  secondary_image_url?: string | null;
}

const ProductsSection = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('featured');

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      
      let query = supabase
        .from('products')
        .select('id, name_en, name_ar, slug, base_price, sale_price, is_new, is_bestseller, is_featured')
        .eq('is_active', true)
        .limit(8);

      if (activeTab === 'featured') {
        query = query.eq('is_featured', true);
      } else if (activeTab === 'new') {
        query = query.eq('is_new', true);
      } else if (activeTab === 'bestseller') {
        query = query.eq('is_bestseller', true);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (!error && data) {
        // Fetch all images for products (to get primary and secondary)
        const productIds = data.map(p => p.id);
        const { data: images } = await supabase
          .from('product_images')
          .select('product_id, url, is_primary, sort_order')
          .in('product_id', productIds)
          .order('is_primary', { ascending: false })
          .order('sort_order', { ascending: true });
        
        // Map images to products - get primary and secondary image
        const productsWithImages = data.map(product => {
          const productImages = images?.filter(img => img.product_id === product.id) || [];
          const primaryImage = productImages.find(img => img.is_primary) || productImages[0];
          const secondaryImage = productImages.find(img => !img.is_primary && img.url !== primaryImage?.url) || productImages[1];
          
          return {
            ...product,
            image_url: normalizeStorageUrl(primaryImage?.url),
            secondary_image_url: normalizeStorageUrl(secondaryImage?.url)
          };
        });
        
        setProducts(productsWithImages);
      }
      setLoading(false);
    };

    fetchProducts();
  }, [activeTab]);

  // Demo products if no data exists
  const demoProducts: Product[] = [
    { id: '1', name_en: 'Modern LED Chandelier', name_ar: 'ثريا LED حديثة', slug: 'modern-led-chandelier', base_price: 85.000, sale_price: 69.990, is_new: true, is_bestseller: false, is_featured: true },
    { id: '2', name_en: 'Wall Sconce Light', name_ar: 'مصباح حائط', slug: 'wall-sconce', base_price: 25.000, sale_price: null, is_new: false, is_bestseller: true, is_featured: true },
    { id: '3', name_en: 'Pendant Light Globe', name_ar: 'مصباح معلق كروي', slug: 'pendant-globe', base_price: 45.000, sale_price: 39.990, is_new: true, is_bestseller: false, is_featured: true },
    { id: '4', name_en: 'Outdoor Garden Light', name_ar: 'إضاءة حديقة خارجية', slug: 'outdoor-garden', base_price: 35.000, sale_price: null, is_new: false, is_bestseller: true, is_featured: true },
    { id: '5', name_en: 'Smart LED Strip', name_ar: 'شريط LED ذكي', slug: 'smart-led-strip', base_price: 15.000, sale_price: 12.000, is_new: true, is_bestseller: true, is_featured: true },
    { id: '6', name_en: 'Crystal Table Lamp', name_ar: 'مصباح طاولة كريستال', slug: 'crystal-table-lamp', base_price: 55.000, sale_price: null, is_new: false, is_bestseller: false, is_featured: true },
    { id: '7', name_en: 'Recessed Downlight', name_ar: 'إضاءة سقف غائرة', slug: 'recessed-downlight', base_price: 8.500, sale_price: 6.990, is_new: false, is_bestseller: true, is_featured: true },
    { id: '8', name_en: 'Floor Standing Lamp', name_ar: 'مصباح أرضي', slug: 'floor-lamp', base_price: 75.000, sale_price: null, is_new: true, is_bestseller: false, is_featured: true },
  ];

  const displayProducts = products.length > 0 ? products : demoProducts;

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">
              {t('home.products.title', 'Our Products')}
            </h2>
            <p className="text-muted-foreground">
              {t('home.products.subtitle', 'Discover quality lighting for your space')}
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/shop" className="flex items-center gap-2">
              {t('home.products.viewAll', 'View All')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="featured">{t('home.products.featured', 'Featured')}</TabsTrigger>
            <TabsTrigger value="new">{t('home.products.new', 'New Arrivals')}</TabsTrigger>
            <TabsTrigger value="bestseller">{t('home.products.bestseller', 'Best Sellers')}</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-square rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {displayProducts.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default ProductsSection;

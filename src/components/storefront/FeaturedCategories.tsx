import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Lightbulb, Lamp, Sun, Building2 } from 'lucide-react';
import { resolveImageUrl } from '@/lib/image-resolver';

interface Category {
  id: string;
  name_en: string;
  name_ar: string;
  slug: string;
  image_url: string | null;
  description_en: string | null;
  description_ar: string | null;
}

const categoryIcons: Record<string, React.ReactNode> = {
  indoor: <Lamp className="h-8 w-8" />,
  outdoor: <Sun className="h-8 w-8" />,
  decorative: <Lightbulb className="h-8 w-8" />,
  commercial: <Building2 className="h-8 w-8" />,
};

const CategoryWithImage = ({ category, language }: { category: Category; language: string }) => {
  const [error, setError] = useState(false);
  if (error) {
    return (
      <>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10" />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
          <div className="bg-primary/10 rounded-full p-4 mb-3">
            {categoryIcons[category.slug] || <Lightbulb className="h-8 w-8" />}
          </div>
          <h3 className="font-semibold text-lg">
            {language === 'ar' ? category.name_ar : category.name_en}
          </h3>
        </div>
      </>
    );
  }
  return (
    <>
      <img
        src={resolveImageUrl(category.image_url, 'category', category.slug)}
        alt={language === 'ar' ? category.name_ar : category.name_en}
        onError={() => setError(true)}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-all duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
        <h3 className="font-semibold text-lg text-foreground drop-shadow-md">
          {language === 'ar' ? category.name_ar : category.name_en}
        </h3>
      </div>
    </>
  );
};

const FeaturedCategories = () => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .is('parent_id', null)
        .eq('is_active', true)
        .order('sort_order')
        .limit(8);

      if (!error && data) {
        setCategories(data);
      }
      setLoading(false);
    };

    fetchCategories();
  }, []);

  // Default categories if none exist in DB
  const defaultCategories = [
    { id: '1', name_en: 'Indoor Lighting', name_ar: 'إضاءة داخلية', slug: 'indoor', icon: 'indoor' },
    { id: '2', name_en: 'Outdoor Lighting', name_ar: 'إضاءة خارجية', slug: 'outdoor', icon: 'outdoor' },
    { id: '3', name_en: 'Decorative', name_ar: 'ديكورية', slug: 'decorative', icon: 'decorative' },
    { id: '4', name_en: 'Commercial', name_ar: 'تجارية', slug: 'commercial', icon: 'commercial' },
    { id: '5', name_en: 'Chandeliers', name_ar: 'ثريات', slug: 'chandeliers', icon: 'decorative' },
    { id: '6', name_en: 'Wall Lights', name_ar: 'إضاءة جدارية', slug: 'wall-lights', icon: 'indoor' },
    { id: '7', name_en: 'LED Strips', name_ar: 'شرائط LED', slug: 'led-strips', icon: 'decorative' },
    { id: '8', name_en: 'Smart Lighting', name_ar: 'إضاءة ذكية', slug: 'smart', icon: 'indoor' },
  ];

  const displayCategories = categories.length > 0 ? categories : defaultCategories;

  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('home.categories.title', 'Shop by Category')}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('home.categories.subtitle', 'Explore our wide range of lighting solutions for every need')}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {displayCategories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={`/shop?category=${category.slug}`}
                  className="group relative block aspect-square overflow-hidden rounded-xl bg-gradient-to-br from-muted to-muted/50 border border-border hover:border-primary transition-all duration-300"
                >
                  {/* Background Image or Gradient */}
                  {category.image_url ? (
                    <CategoryWithImage category={category} language={language} />
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-300" />
                      {/* Icon only shown when no image */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                        <div className="bg-primary/10 rounded-full p-4 mb-3 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                          {categoryIcons[(category as any).icon || category.slug] || <Lightbulb className="h-8 w-8" />}
                        </div>
                        <h3 className="font-semibold text-lg">
                          {language === 'ar' ? category.name_ar : category.name_en}
                        </h3>
                      </div>
                    </>
                  )}
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedCategories;

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { InfiniteSlider } from '@/components/ui/infinite-slider';
import { normalizeStorageUrl } from '@/lib/storage';

interface Brand {
  id: string;
  name: string;
  logo_url: string | null;
}

const BrandItem = ({ brand }: { brand: Brand }) => {
  const [error, setError] = useState(false);
  return (
    <div className="flex-shrink-0 w-40 h-20 bg-card rounded-lg border border-border flex items-center justify-center px-6 hover:border-primary hover:shadow-lg transition-all duration-300">
      {brand.logo_url && !error ? (
        <img
          src={normalizeStorageUrl(brand.logo_url)}
          alt={brand.name}
          onError={() => setError(true)}
          className="max-w-full max-h-12 object-contain grayscale hover:grayscale-0 transition-all duration-300"
        />
      ) : (
        <span className="font-semibold text-muted-foreground text-center">
          {brand.name}
        </span>
      )}
    </div>
  );
};

const BrandsShowcase = () => {
  const { t } = useTranslation();
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    const fetchBrands = async () => {
      const { data, error } = await supabase
        .from('brands')
        .select('id, name, logo_url')
        .eq('is_active', true)
        .limit(12);

      if (!error && data) {
        setBrands(data);
      }
    };

    fetchBrands();
  }, []);

  // Demo brands if no data exists
  const demoBrands = [
    { id: '1', name: 'Philips', logo_url: null },
    { id: '2', name: 'Osram', logo_url: null },
    { id: '3', name: 'Ledvance', logo_url: null },
    { id: '4', name: 'Signify', logo_url: null },
    { id: '5', name: 'GE Lighting', logo_url: null },
    { id: '6', name: 'Cree', logo_url: null },
  ];

  const displayBrands = brands.length > 0 ? brands : demoBrands;

  return (
    <section className="py-16 md:py-24 bg-muted/30 overflow-hidden">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('home.brands.title', 'Our Brands')}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('home.brands.subtitle', 'We partner with leading lighting manufacturers')}
          </p>
        </div>
      </div>

      {/* Infinite Slider Marquee */}
      <div className="relative">
        <InfiniteSlider 
          gap={32} 
          duration={20} 
          durationOnHover={40}
          className="py-4"
        >
          {displayBrands.map((brand) => (
            <BrandItem key={brand.id} brand={brand} />
          ))}
        </InfiniteSlider>

        {/* Gradient Overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-muted/30 to-transparent pointer-events-none z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-muted/30 to-transparent pointer-events-none z-10" />
      </div>
    </section>
  );
};

export default BrandsShowcase;

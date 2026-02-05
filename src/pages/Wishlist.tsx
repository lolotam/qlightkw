import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StorefrontLayout from '@/layouts/StorefrontLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';

// Demo wishlist items (will be replaced with actual wishlist logic)
const demoWishlistItems = [
  {
    id: '1',
    name: 'Modern LED Chandelier',
    name_ar: 'ثريا LED حديثة',
    price: 69.990,
    originalPrice: 85.000,
    image: null,
  },
  {
    id: '2',
    name: 'Crystal Table Lamp',
    name_ar: 'مصباح طاولة كريستال',
    price: 55.000,
    originalPrice: null,
    image: null,
  },
  {
    id: '3',
    name: 'Smart LED Strip',
    name_ar: 'شريط LED ذكي',
    price: 12.000,
    originalPrice: 15.000,
    image: null,
  },
];

const Wishlist = () => {
  const { t } = useTranslation();

  return (
    <StorefrontLayout>
      {/* Page Header */}
      <div className="bg-muted/30 py-8">
        <div className="container">
          <nav className="text-sm text-muted-foreground mb-4">
            <Link to="/" className="hover:text-primary">{t('nav.home', 'Home')}</Link>
            <span className="mx-2">/</span>
            <span>{t('wishlist.title', 'Wishlist')}</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold">
            {t('wishlist.title', 'Wishlist')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('wishlist.itemCount', '{{count}} items', { count: demoWishlistItems.length })}
          </p>
        </div>
      </div>

      <div className="container py-8">
        {demoWishlistItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {demoWishlistItems.map((item) => (
              <Card key={item.id} className="group overflow-hidden">
                <div className="relative aspect-square bg-muted">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl">💡</span>
                    </div>
                  )}
                  
                  {/* Remove Button */}
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute top-3 right-3 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <CardContent className="p-4">
                  <h3 className="font-medium mb-2 line-clamp-2">{item.name}</h3>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg font-bold text-primary">
                      {item.price.toFixed(3)} {t('currency', 'KWD')}
                    </span>
                    {item.originalPrice && (
                      <span className="text-sm text-muted-foreground line-through">
                        {item.originalPrice.toFixed(3)}
                      </span>
                    )}
                  </div>

                  <Button className="w-full" size="sm">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {t('wishlist.addToCart', 'Add to Cart')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">{t('wishlist.empty', 'Your wishlist is empty')}</h2>
            <p className="text-muted-foreground mb-6">{t('wishlist.emptyDescription', 'Save items you love for later.')}</p>
            <Button asChild>
              <Link to="/shop">{t('wishlist.startShopping', 'Browse Products')}</Link>
            </Button>
          </div>
        )}
      </div>
    </StorefrontLayout>
  );
};

export default Wishlist;

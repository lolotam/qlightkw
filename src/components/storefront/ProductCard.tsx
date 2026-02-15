import { forwardRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, ShoppingCart, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
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

interface ProductCardProps {
  product: Product;
  index?: number;
}

const ProductCard = forwardRef<HTMLDivElement, ProductCardProps>(({ product, index = 0 }, ref) => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { addItem } = useCart();
  const [isHovered, setIsHovered] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [secondaryImgError, setSecondaryImgError] = useState(false);

  const name = language === 'ar' ? product.name_ar : product.name_en;
  const price = product.sale_price || product.base_price;
  const originalPrice = product.sale_price ? product.base_price : null;
  const discount = originalPrice 
    ? Math.round(((originalPrice - price) / originalPrice) * 100) 
    : 0;

  // Check if there's a different secondary image
  const hasSecondaryImage = product.secondary_image_url && product.secondary_image_url !== product.image_url;
  
  // Normalize URLs for MinIO compatibility
  const primaryImageUrl = normalizeStorageUrl(product.image_url);
  const secondaryImageUrl = normalizeStorageUrl(product.secondary_image_url);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsAddingToCart(true);
    try {
      await addItem(product.id, 1);
      toast.success(t('cart.itemAdded', 'Added to cart!'), {
        description: name,
      });
    } catch (error) {
      toast.error(t('cart.addError', 'Failed to add to cart'));
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toast.success(t('wishlist.added', 'Added to wishlist!'));
  };

  return (
    <div
      ref={ref}
      className="group"
      style={{ animationDelay: `${index * 50}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative w-full overflow-visible">
        {/* Card Container */}
        <div className="relative rounded-lg overflow-hidden bg-card shadow-[0_0_10px_1px_rgba(0,0,0,0.2)] dark:shadow-[0_0_10px_1px_rgba(0,0,0,0.5)]">
          
          {/* Image Container */}
          <Link to={`/product/${product.slug}`} className="block">
            <div className="relative aspect-[3/4] overflow-hidden">
              {/* Primary Image */}
              {primaryImageUrl && !imgError ? (
                <img
                  src={primaryImageUrl}
                  alt={name}
                  onError={() => setImgError(true)}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                    isHovered && hasSecondaryImage && !secondaryImgError ? 'opacity-0' : 'opacity-100'
                  }`}
                />
              ) : (
                <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                  <span className="text-5xl">💡</span>
                </div>
              )}
              
              {/* Secondary Image (only if different from primary) */}
              {hasSecondaryImage && secondaryImageUrl && !secondaryImgError && (
                <img
                  src={secondaryImageUrl}
                  alt={`${name} - alternate`}
                  onError={() => setSecondaryImgError(true)}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                    isHovered ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              )}

              {/* Animated gradient border on hover */}
              <div 
                className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
                  isHovered ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <div className="absolute inset-0 rounded-lg" style={{
                  background: 'linear-gradient(90deg, transparent, hsl(var(--primary) / 0.3), transparent)',
                  animation: 'shimmer 2s linear infinite'
                }} />
              </div>

              {/* Badges */}
              <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-10">
                {product.is_new && (
                  <Badge className="bg-green-500/90 text-white backdrop-blur-sm text-[10px] px-2 py-0.5">
                    {t('product.new', 'New')}
                  </Badge>
                )}
                {product.is_bestseller && (
                  <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-sm text-[10px] px-2 py-0.5">
                    {t('product.bestseller', 'Bestseller')}
                  </Badge>
                )}
                {discount > 0 && (
                  <Badge variant="destructive" className="backdrop-blur-sm text-[10px] px-2 py-0.5">
                    -{discount}%
                  </Badge>
                )}
              </div>

              {/* Quick actions on hover */}
              <div 
                className={`absolute top-3 right-3 z-10 transition-all duration-300 ${
                  isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
                }`}
              >
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 w-8 p-0 rounded-full shadow-md backdrop-blur-sm"
                  onClick={handleWishlist}
                >
                  <Heart className="h-4 w-4" />
                </Button>
              </div>

              {/* Description overlay on hover */}
              <div 
                className={`absolute bottom-0 left-0 right-0 p-3 transition-all duration-300 ${
                  isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
              >
                <div className="bg-black/60 backdrop-blur-md rounded-lg p-3 shadow-[0_0_10px_5px_rgba(0,0,0,0.3)]">
                  <Button
                    size="sm"
                    className="w-full h-8 text-xs"
                    onClick={handleAddToCart}
                    disabled={isAddingToCart}
                  >
                    {isAddingToCart ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <ShoppingCart className="h-3 w-3 mr-1" />
                        {t('product.addToCart', 'Add to Cart')}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </Link>

          {/* Product Info */}
          <div className="p-3 bg-card">
            <Link to={`/product/${product.slug}`}>
              <h3 className="font-medium text-sm text-foreground line-clamp-2 mb-2 hover:text-primary transition-colors">
                {name}
              </h3>
            </Link>
            
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-primary">
                {price.toFixed(3)} {t('currency', 'KWD')}
              </span>
              {originalPrice && (
                <span className="text-xs text-muted-foreground line-through">
                  {originalPrice.toFixed(3)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;

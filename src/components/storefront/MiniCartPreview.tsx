import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ShoppingBag, Trash2, Loader2 } from 'lucide-react';

const MiniCartPreview = () => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { items, itemCount, subtotal, isLoading, removeItem } = useCart();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <ShoppingBag className="h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground mb-4">
          {t('cart.empty', 'Your cart is empty')}
        </p>
        <Button asChild size="sm">
          <Link to="/shop">{t('cart.continueShopping', 'Continue Shopping')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-80">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-sm">
          {t('cart.title', 'Shopping Cart')} ({itemCount})
        </h4>
      </div>

      <ScrollArea className="max-h-64">
        <div className="space-y-3 pr-2">
          {items.slice(0, 4).map((item) => {
            const productName = language === 'ar' && item.product?.name_ar 
              ? item.product.name_ar 
              : item.product?.name_en || 'Product';
            const price = item.product?.sale_price || item.product?.base_price || 0;
            const modifier = item.variation?.price_modifier || 0;
            const itemTotal = (price + modifier) * item.quantity;

            return (
              <div key={item.id} className="flex gap-3 group">
                {/* Product Image */}
                <div className="w-14 h-14 rounded-md overflow-hidden bg-muted shrink-0">
                  {item.product?.image_url ? (
                    <img
                      src={item.product.image_url}
                      alt={productName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <Link 
                    to={`/product/${item.product?.slug || item.product_id}`}
                    className="text-sm font-medium line-clamp-1 hover:text-primary transition-colors"
                  >
                    {productName}
                  </Link>
                  {item.variation && (
                    <p className="text-xs text-muted-foreground">
                      {language === 'ar' && item.variation.name_ar 
                        ? item.variation.name_ar 
                        : item.variation.name_en}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">
                      {t('cart.qty', 'Qty')}: {item.quantity}
                    </span>
                    <span className="text-sm font-semibold text-primary">
                      {itemTotal.toFixed(3)} KD
                    </span>
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeItem(item.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </button>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {items.length > 4 && (
        <p className="text-xs text-muted-foreground text-center mt-2">
          +{items.length - 4} {t('cart.moreItems', 'more items')}
        </p>
      )}

      <Separator className="my-3" />

      {/* Subtotal */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">{t('cart.subtotal', 'Subtotal')}</span>
        <span className="font-bold text-primary">{subtotal.toFixed(3)} KD</span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" asChild>
          <Link to="/cart">{t('cart.viewCart', 'View Cart')}</Link>
        </Button>
        <Button size="sm" className="flex-1" asChild>
          <Link to="/checkout">{t('cart.checkout', 'Checkout')}</Link>
        </Button>
      </div>
    </div>
  );
};

export default MiniCartPreview;

import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import StorefrontLayout from '@/layouts/StorefrontLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Loader2 } from 'lucide-react';
import { useCart } from '@/hooks/useCart';

const Cart = () => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { items, isLoading, subtotal, removeItem, updateQuantity } = useCart();

  const shipping = 3.000;
  const total = subtotal + shipping;

  return (
    <StorefrontLayout>
      {/* Page Header */}
      <div className="bg-muted/30 py-8">
        <div className="container">
          <nav className="text-sm text-muted-foreground mb-4">
            <Link to="/" className="hover:text-primary">{t('nav.home', 'Home')}</Link>
            <span className="mx-2">/</span>
            <span>{t('cart.title', 'Shopping Cart')}</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold">
            {t('cart.title', 'Shopping Cart')}
          </h1>
        </div>
      </div>

      <div className="container py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : items.length > 0 ? (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => {
                const name = language === 'ar' ? (item.product?.name_ar || item.product?.name_en) : item.product?.name_en;
                const price = item.product?.sale_price || item.product?.base_price || 0;
                const modifier = item.variation?.price_modifier || 0;
                const itemPrice = price + modifier;

                return (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {/* Image */}
                        <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center shrink-0">
                          {item.product?.image_url ? (
                            <img src={item.product.image_url} alt={name || ''} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <span className="text-3xl">💡</span>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium">{name || 'Unknown Product'}</h3>
                          {item.variation && (
                            <p className="text-sm text-muted-foreground">
                              {language === 'ar' ? item.variation.name_ar : item.variation.name_en}
                            </p>
                          )}
                          <p className="text-primary font-bold mt-1">
                            {itemPrice.toFixed(3)} {t('currency', 'KWD')}
                          </p>
                        </div>

                        {/* Quantity & Actions */}
                        <div className="flex flex-col items-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          
                          <div className="flex items-center border rounded-md">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm">{item.quantity}</span>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          <p className="text-sm font-medium">
                            {(itemPrice * item.quantity).toFixed(3)} {t('currency', 'KWD')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-24">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-4">{t('cart.orderSummary', 'Order Summary')}</h2>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('cart.subtotal', 'Subtotal')}</span>
                      <span>{subtotal.toFixed(3)} {t('currency', 'KWD')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('cart.shipping', 'Shipping')}</span>
                      <span>{shipping.toFixed(3)} {t('currency', 'KWD')}</span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between font-semibold">
                      <span>{t('cart.total', 'Total')}</span>
                      <span className="text-primary">{total.toFixed(3)} {t('currency', 'KWD')}</span>
                    </div>
                  </div>

                  {/* Coupon Code */}
                  <div className="mt-6">
                    <div className="flex gap-2">
                      <Input placeholder={t('cart.couponPlaceholder', 'Coupon code')} />
                      <Button variant="outline">{t('cart.apply', 'Apply')}</Button>
                    </div>
                  </div>

                  <Button className="w-full mt-6" size="lg" asChild>
                    <Link to="/checkout">
                      {t('cart.checkout', 'Proceed to Checkout')}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>

                  <Button variant="ghost" className="w-full mt-2" asChild>
                    <Link to="/shop">{t('cart.continueShopping', 'Continue Shopping')}</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">{t('cart.empty.title', 'Your cart is empty')}</h2>
            <p className="text-muted-foreground mb-6">{t('cart.empty.subtitle', 'Start shopping to add items')}</p>
            <Button asChild>
              <Link to="/shop">{t('cart.startShopping', 'Start Shopping')}</Link>
            </Button>
          </div>
        )}
      </div>
    </StorefrontLayout>
  );
};

export default Cart;

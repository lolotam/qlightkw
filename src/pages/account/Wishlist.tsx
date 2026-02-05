import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Heart,
  ShoppingCart,
  Trash2,
  Loader2,
} from 'lucide-react';

interface WishlistProduct {
  id: string;
  wishlist_item_id: string;
  name_en: string;
  name_ar: string | null;
  slug: string;
  base_price: number;
  sale_price: number | null;
  is_new: boolean | null;
  image_url: string | null;
}

export default function AccountWishlist() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const isRTL = i18n.language === 'ar';

  const [products, setProducts] = useState<WishlistProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchWishlist = async () => {
      setIsLoading(true);

      // Get user's wishlist
      const { data: wishlist } = await supabase
        .from('wishlists')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (wishlist) {
        // Get wishlist items with product details
        const { data: items } = await supabase
          .from('wishlist_items')
          .select(`
            id,
            product_id,
            products (
              id,
              name_en,
              name_ar,
              slug,
              base_price,
              sale_price,
              is_new
            )
          `)
          .eq('wishlist_id', wishlist.id);

        if (items) {
          const productsWithImages = await Promise.all(
            items.map(async (item: any) => {
              // Get primary image
              const { data: image } = await supabase
                .from('product_images')
                .select('url')
                .eq('product_id', item.product_id)
                .eq('is_primary', true)
                .maybeSingle();

              return {
                id: item.products.id,
                wishlist_item_id: item.id,
                name_en: item.products.name_en,
                name_ar: item.products.name_ar,
                slug: item.products.slug,
                base_price: item.products.base_price,
                sale_price: item.products.sale_price,
                is_new: item.products.is_new,
                image_url: image?.url || null,
              };
            })
          );

          setProducts(productsWithImages);
        }
      }

      setIsLoading(false);
    };

    fetchWishlist();
  }, [user]);

  const handleRemove = async (wishlistItemId: string) => {
    const { error } = await supabase
      .from('wishlist_items')
      .delete()
      .eq('id', wishlistItemId);

    if (error) {
      toast({
        variant: 'destructive',
        title: t('common.error', 'Error'),
        description: t('wishlist.removeError', 'Failed to remove item.'),
      });
    } else {
      setProducts(products.filter((p) => p.wishlist_item_id !== wishlistItemId));
      toast({
        title: t('common.success', 'Success'),
        description: t('wishlist.removed', 'Item removed from wishlist.'),
      });
    }
  };

  const handleAddToCart = async (product: WishlistProduct) => {
    // For now, just show a toast - actual cart integration is in the next step
    toast({
      title: t('cart.added', 'Added to Cart'),
      description: `${isRTL && product.name_ar ? product.name_ar : product.name_en}`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('account.myWishlist', 'My Wishlist')}</h1>
        <p className="text-muted-foreground mt-1">
          {products.length} {t('account.savedItems', 'saved items')}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t('wishlist.empty', 'Your wishlist is empty')}
            </h3>
            <p className="text-muted-foreground mb-6">
              {t('wishlist.emptyMessage', 'Save items you love to buy later.')}
            </p>
            <Button asChild>
              <Link to="/shop">{t('common.browseProducts', 'Browse Products')}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="overflow-hidden group">
                <Link to={`/product/${product.slug}`}>
                  <div className="aspect-square relative overflow-hidden bg-muted">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={isRTL && product.name_ar ? product.name_ar : product.name_en}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Heart className="h-16 w-16 text-muted-foreground/50" />
                      </div>
                    )}
                    {product.is_new && (
                      <Badge className="absolute top-2 left-2">{t('product.new', 'New')}</Badge>
                    )}
                    {product.sale_price && (
                      <Badge variant="destructive" className="absolute top-2 right-2">
                        {t('product.sale', 'Sale')}
                      </Badge>
                    )}
                  </div>
                </Link>

                <CardContent className="p-4">
                  <Link to={`/product/${product.slug}`}>
                    <h3 className="font-medium hover:text-primary transition-colors line-clamp-2 mb-2">
                      {isRTL && product.name_ar ? product.name_ar : product.name_en}
                    </h3>
                  </Link>

                  <div className="flex items-center gap-2 mb-4">
                    {product.sale_price ? (
                      <>
                        <span className="text-lg font-bold text-destructive">
                          {product.sale_price.toFixed(3)} {t('common.kwd', 'KWD')}
                        </span>
                        <span className="text-sm text-muted-foreground line-through">
                          {product.base_price.toFixed(3)}
                        </span>
                      </>
                    ) : (
                      <span className="text-lg font-bold">
                        {product.base_price.toFixed(3)} {t('common.kwd', 'KWD')}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleAddToCart(product)}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {t('cart.addToCart', 'Add to Cart')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(product.wishlist_item_id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

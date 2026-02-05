import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { supabase } from '@/integrations/supabase/client';
import StorefrontLayout from '@/layouts/StorefrontLayout';
import ProductCard from '@/components/storefront/ProductCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  Heart,
  ShoppingCart,
  Share2,
  Minus,
  Plus,
  Check,
  Truck,
  Shield,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { normalizeStorageUrl } from '@/lib/storage';

interface ProductVariation {
  id: string;
  name_en: string | null;
  name_ar: string | null;
  color: string | null;
  color_hex: string | null;
  size: string | null;
  wattage: string | null;
  price_modifier: number | null;
  stock_quantity: number | null;
  image_url: string | null;
}

interface ProductImage {
  id: string;
  url: string;
  alt_text_en: string | null;
  alt_text_ar: string | null;
  is_primary: boolean | null;
  sort_order: number | null;
}

interface Product {
  id: string;
  name_en: string;
  name_ar: string;
  slug: string;
  description_en: string | null;
  description_ar: string | null;
  short_description_en: string | null;
  short_description_ar: string | null;
  base_price: number;
  sale_price: number | null;
  sku: string | null;
  stock_quantity: number | null;
  is_new: boolean | null;
  is_bestseller: boolean | null;
  is_featured: boolean | null;
  specifications: Record<string, string> | null;
  category_id: string | null;
  brand_id: string | null;
}

interface RelatedProduct {
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

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { isAdmin } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = async () => {
    if (!product) return;
    
    setIsAddingToCart(true);
    try {
      await addItem(product.id, quantity, selectedVariation?.id);
      const productName = language === 'ar' ? product.name_ar : product.name_en;
      toast.success(t('cart.itemAdded', 'Added to cart!'), {
        description: `${quantity}x ${productName}`,
      });
    } catch (error) {
      toast.error(t('cart.addError', 'Failed to add to cart'));
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!product) return;
    
    setIsDeleting(true);
    try {
      // Delete product images first
      await supabase
        .from('product_images')
        .delete()
        .eq('product_id', product.id);

      // Delete product variations
      await supabase
        .from('product_variations')
        .delete()
        .eq('product_id', product.id);

      // Delete the product
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id);

      if (error) throw error;

      toast.success(t('admin.productDeleted', 'Product deleted successfully'));
      navigate('/shop');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error(t('admin.deleteError', 'Failed to delete product'));
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;

      setLoading(true);

      // Fetch product
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (productError || !productData) {
        setLoading(false);
        return;
      }

      // Cast specifications to expected type
      const typedProduct: Product = {
        ...productData,
        specifications: productData.specifications as Record<string, string> | null,
      };
      setProduct(typedProduct);

      // Fetch variations and images in parallel
      const [variationsRes, imagesRes] = await Promise.all([
        supabase
          .from('product_variations')
          .select('*')
          .eq('product_id', productData.id)
          .eq('is_active', true),
        supabase
          .from('product_images')
          .select('*')
          .eq('product_id', productData.id)
          .order('sort_order'),
      ]);

      if (variationsRes.data) {
        setVariations(variationsRes.data);
        if (variationsRes.data.length > 0) {
          setSelectedVariation(variationsRes.data[0]);
        }
      }

      if (imagesRes.data) {
        setImages(imagesRes.data);
      }

      // Fetch related products
      if (productData.category_id) {
        const { data: relatedData } = await supabase
          .from('products')
          .select('id, name_en, name_ar, slug, base_price, sale_price, is_new, is_bestseller, is_featured')
          .eq('category_id', productData.category_id)
          .eq('is_active', true)
          .neq('id', productData.id)
          .limit(4);

        if (relatedData && relatedData.length > 0) {
          // Fetch images for related products
          const relatedProductIds = relatedData.map(p => p.id);
          const { data: relatedImages } = await supabase
            .from('product_images')
            .select('product_id, url, is_primary, sort_order')
            .in('product_id', relatedProductIds)
            .order('is_primary', { ascending: false })
            .order('sort_order', { ascending: true });

          // Map images to related products
          const relatedWithImages: RelatedProduct[] = relatedData.map(product => {
            const productImages = relatedImages?.filter(img => img.product_id === product.id) || [];
            const primaryImage = productImages.find(img => img.is_primary) || productImages[0];
            const secondaryImage = productImages.find(img => !img.is_primary && img.url !== primaryImage?.url) || productImages[1];
            
            return {
              ...product,
              image_url: normalizeStorageUrl(primaryImage?.url),
              secondary_image_url: normalizeStorageUrl(secondaryImage?.url)
            };
          });

          setRelatedProducts(relatedWithImages);
        }
      }

      setLoading(false);
    };

    fetchProduct();
  }, [slug]);

  // Demo product if no data
  const demoProduct: Product = {
    id: 'demo',
    name_en: 'Modern LED Chandelier',
    name_ar: 'ثريا LED حديثة',
    slug: 'modern-led-chandelier',
    description_en: 'This stunning modern LED chandelier features a sleek design with adjustable brightness and color temperature. Perfect for living rooms, dining areas, and modern office spaces. The energy-efficient LED technology provides long-lasting illumination while reducing electricity costs.',
    description_ar: 'هذه الثريا LED الحديثة المذهلة تتميز بتصميم أنيق مع سطوع قابل للتعديل ودرجة حرارة اللون. مثالية لغرف المعيشة ومناطق تناول الطعام والمكاتب الحديثة.',
    short_description_en: 'Elegant LED chandelier with adjustable brightness',
    short_description_ar: 'ثريا LED أنيقة مع سطوع قابل للتعديل',
    base_price: 85.000,
    sale_price: 69.990,
    sku: 'QL-CHAN-001',
    stock_quantity: 15,
    is_new: true,
    is_bestseller: true,
    is_featured: true,
    specifications: {
      'Voltage': '220-240V',
      'Wattage': '48W',
      'Lumens': '4800lm',
      'Color Temperature': '3000K-6500K',
      'Material': 'Aluminum + Acrylic',
      'Warranty': '2 Years',
    },
    category_id: null,
    brand_id: null,
  };

  const demoVariations: ProductVariation[] = [
    { id: '1', name_en: 'Small', name_ar: 'صغير', color: null, color_hex: null, size: '60cm', wattage: '36W', price_modifier: -10, stock_quantity: 5, image_url: null },
    { id: '2', name_en: 'Medium', name_ar: 'متوسط', color: null, color_hex: null, size: '80cm', wattage: '48W', price_modifier: 0, stock_quantity: 15, image_url: null },
    { id: '3', name_en: 'Large', name_ar: 'كبير', color: null, color_hex: null, size: '100cm', wattage: '60W', price_modifier: 20, stock_quantity: 8, image_url: null },
  ];

  const displayProduct = product || demoProduct;
  const displayVariations = variations.length > 0 ? variations : demoVariations;
  const activeVariation = selectedVariation || displayVariations[0];

  const name = language === 'ar' ? displayProduct.name_ar : displayProduct.name_en;
  const description = language === 'ar' ? displayProduct.description_ar : displayProduct.description_en;
  const shortDescription = language === 'ar' ? displayProduct.short_description_ar : displayProduct.short_description_en;

  const basePrice = displayProduct.sale_price || displayProduct.base_price;
  const priceModifier = activeVariation?.price_modifier || 0;
  const finalPrice = basePrice + priceModifier;
  const originalPrice = displayProduct.sale_price ? displayProduct.base_price + priceModifier : null;
  const discount = originalPrice ? Math.round(((originalPrice - finalPrice) / originalPrice) * 100) : 0;

  const stockQuantity = activeVariation?.stock_quantity ?? displayProduct.stock_quantity ?? 0;
  const inStock = stockQuantity > 0;

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % Math.max(images.length, 1));
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + Math.max(images.length, 1)) % Math.max(images.length, 1));
  };

  if (loading) {
    return (
      <StorefrontLayout>
        <div className="container py-8">
          <div className="grid lg:grid-cols-2 gap-8">
            <Skeleton className="aspect-square rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-24" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </StorefrontLayout>
    );
  }

  return (
    <StorefrontLayout>
      {/* Breadcrumb */}
      <div className="bg-muted/30 py-4">
        <div className="container">
          <nav className="text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary">{t('nav.home', 'Home')}</Link>
            <span className="mx-2">/</span>
            <Link to="/shop" className="hover:text-primary">{t('nav.products', 'Products')}</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{name}</span>
          </nav>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-muted rounded-xl overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full"
                >
                  {images.length > 0 ? (
                    <img
                      src={normalizeStorageUrl(images[selectedImage]?.url)}
                      alt={name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                      <span className="text-8xl">💡</span>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {displayProduct.is_new && (
                  <Badge className="bg-green-500 text-white">{t('product.new', 'New')}</Badge>
                )}
                {displayProduct.is_bestseller && (
                  <Badge className="bg-primary text-primary-foreground">{t('product.bestseller', 'Bestseller')}</Badge>
                )}
                {discount > 0 && (
                  <Badge variant="destructive">-{discount}%</Badge>
                )}
              </div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImage(index)}
                    className={`shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      index === selectedImage ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <img
                      src={normalizeStorageUrl(image.url)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">{name}</h1>
                {displayProduct.sku && (
                  <p className="text-sm text-muted-foreground">SKU: {displayProduct.sku}</p>
                )}
              </div>
              
              {/* Admin Actions */}
              {isAdmin && product && (
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <Link to={`/admin/products/${product.id}`}>
                      <Pencil className="h-4 w-4 mr-2" />
                      {t('admin.edit', 'Edit')}
                    </Link>
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-2" />
                        )}
                        {t('admin.delete', 'Delete')}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {t('admin.deleteProduct', 'Delete Product')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('admin.deleteProductConfirm', 'Are you sure you want to delete this product? This action cannot be undone and will remove all associated images and variations.')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          {t('common.cancel', 'Cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteProduct}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {t('admin.delete', 'Delete')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-primary">
                {finalPrice.toFixed(3)} {t('currency', 'KWD')}
              </span>
              {originalPrice && (
                <span className="text-xl text-muted-foreground line-through">
                  {originalPrice.toFixed(3)}
                </span>
              )}
            </div>

            {/* Short Description */}
            {shortDescription && (
              <p className="text-muted-foreground">{shortDescription}</p>
            )}

            {/* Variations */}
            {displayVariations.length > 0 && (
              <div className="space-y-3">
                <label className="font-medium">
                  {t('product.selectVariation', 'Select Size/Wattage')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {displayVariations.map((variation) => (
                    <Button
                      key={variation.id}
                      variant={selectedVariation?.id === variation.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedVariation(variation)}
                      disabled={!variation.stock_quantity || variation.stock_quantity <= 0}
                    >
                      {variation.size || variation.wattage || (language === 'ar' ? variation.name_ar : variation.name_en)}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {inStock ? (
                <>
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="text-green-600 font-medium">
                    {t('product.inStock', 'In Stock')} ({stockQuantity} {t('product.available', 'available')})
                  </span>
                </>
              ) : (
                <span className="text-destructive font-medium">{t('product.outOfStock', 'Out of Stock')}</span>
              )}
            </div>

            {/* Quantity & Add to Cart */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center border rounded-lg">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(Math.min(stockQuantity, quantity + 1))}
                  disabled={quantity >= stockQuantity}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <Button 
                className="flex-1" 
                size="lg" 
                disabled={!inStock || isAddingToCart}
                onClick={handleAddToCart}
              >
                {isAddingToCart ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <ShoppingCart className="h-5 w-5 mr-2" />
                )}
                {t('product.addToCart', 'Add to Cart')}
              </Button>

              <Button variant="outline" size="lg">
                <Heart className="h-5 w-5" />
              </Button>

              <Button variant="outline" size="lg">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <Truck className="h-6 w-6 mx-auto mb-1 text-primary" />
                <p className="text-xs text-muted-foreground">{t('product.freeShipping', 'Free Shipping')}</p>
              </div>
              <div className="text-center">
                <Shield className="h-6 w-6 mx-auto mb-1 text-primary" />
                <p className="text-xs text-muted-foreground">{t('product.warranty', '2 Year Warranty')}</p>
              </div>
              <div className="text-center">
                <RotateCcw className="h-6 w-6 mx-auto mb-1 text-primary" />
                <p className="text-xs text-muted-foreground">{t('product.easyReturns', 'Easy Returns')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs: Description, Specifications, Reviews */}
        <div className="mt-12">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="description">{t('product.description', 'Description')}</TabsTrigger>
              <TabsTrigger value="specifications">{t('product.specifications', 'Specifications')}</TabsTrigger>
              <TabsTrigger value="reviews">{t('product.reviews', 'Reviews')}</TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-6">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p>{description}</p>
              </div>
            </TabsContent>

            <TabsContent value="specifications" className="mt-6">
              {displayProduct.specifications ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(displayProduct.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b">
                      <span className="font-medium">{key}</span>
                      <span className="text-muted-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">{t('product.noSpecifications', 'No specifications available.')}</p>
              )}
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              <p className="text-muted-foreground">{t('product.noReviews', 'No reviews yet. Be the first to review this product!')}</p>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">{t('product.relatedProducts', 'Related Products')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          </div>
        )}
      </div>
    </StorefrontLayout>
  );
};

export default ProductDetail;

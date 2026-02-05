import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Package,
  Filter,
  Loader2,
  Download,
  DollarSign,
} from 'lucide-react';

// Product type from database
interface Product {
  id: string;
  sku: string | null;
  name_en: string;
  name_ar: string;
  slug: string;
  base_price: number;
  sale_price: number | null;
  stock_quantity: number;
  is_featured: boolean;
  is_new: boolean;
  is_active: boolean;
  created_at: string;
  categories: { name_en: string } | null;
  brands: { name: string } | null;
  primary_image_url?: string | null;
}

export default function ProductsPage() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isRTL = i18n.language === 'ar';

  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Fetch products with images
  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products', searchQuery],
    queryFn: async (): Promise<Product[]> => {
      let query = supabase
        .from('products')
        .select(`
          id,
          sku,
          name_en,
          name_ar,
          slug,
          base_price,
          sale_price,
          stock_quantity,
          is_featured,
          is_new,
          is_active,
          created_at,
          categories:category_id (name_en),
          brands:brand_id (name)
        `)
        .order('created_at', { ascending: false });

      // Apply search filter
      if (searchQuery) {
        query = query.or(`name_en.ilike.%${searchQuery}%,name_ar.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Fetch primary images for all products
      const productIds = (data || []).map((p: any) => p.id);
      if (productIds.length > 0) {
        const { data: images } = await supabase
          .from('product_images')
          .select('product_id, url, is_primary')
          .in('product_id', productIds)
          .order('is_primary', { ascending: false })
          .order('sort_order', { ascending: true });
        
        // Map images to products - prioritize primary image
        return (data || []).map((product: any) => {
          const productImages = images?.filter(img => img.product_id === product.id) || [];
          const primaryImage = productImages.find(img => img.is_primary) || productImages[0];
          return {
            ...product,
            primary_image_url: primaryImage?.url || null
          };
        }) as Product[];
      }
      
      return (data as unknown as Product[]) || [];
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast({
        title: t('admin.productDeleted', 'Product deleted'),
        description: t('admin.productDeletedDesc', 'The product has been deleted successfully.'),
      });
      setDeleteDialogOpen(false);
      setSelectedProduct(null);
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: t('admin.error', 'Error'),
        description: error.message,
      });
    },
  });

  // Toggle product status
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast({
        title: t('admin.statusUpdated', 'Status updated'),
      });
    },
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KW', {
      style: 'currency',
      currency: 'KWD',
      minimumFractionDigits: 3,
    }).format(amount);
  };

  // Export products to CSV
  const exportToCSV = () => {
    if (!products?.length) return;

    const headers = ['SKU', 'Name (EN)', 'Name (AR)', 'Base Price', 'Sale Price', 'Stock', 'Category', 'Brand', 'Active'];
    const csvContent = [
      headers.join(','),
      ...products.map((p) =>
        [
          p.sku || '',
          `"${p.name_en.replace(/"/g, '""')}"`,
          `"${p.name_ar.replace(/"/g, '""')}"`,
          p.base_price,
          p.sale_price || '',
          p.stock_quantity,
          p.categories?.name_en || '',
          p.brands?.name || '',
          p.is_active ? 'Yes' : 'No',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `products_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: t('admin.exportSuccess', 'Export successful'),
      description: t('admin.csvDownloaded', 'CSV file downloaded'),
    });
  };

  // Handle delete confirmation
  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('admin.products.title', 'Products')}
          </h1>
          <p className="text-muted-foreground">
            {t('admin.productsDescription', 'Manage your product catalog')}
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/products/new" className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('admin.addProduct', 'Add Product')}
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
              <Input
                placeholder={t('admin.searchProducts', 'Search products...')}
                className={isRTL ? 'pr-10' : 'pl-10'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Filter className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('admin.filters', 'Filters')}
            </Button>
            <Button variant="outline" onClick={exportToCSV} disabled={!products?.length} className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Download className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('admin.exportCSV', 'Export CSV')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {t('admin.allProducts', 'All Products')}
            {products && (
              <Badge variant="secondary" className="ml-2">
                {products.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : products?.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {t('admin.noProducts', 'No products yet')}
              </h3>
              <p className="text-muted-foreground mb-4">
                {t('admin.noProductsDesc', 'Get started by adding your first product.')}
              </p>
              <Button asChild>
                <Link to="/admin/products/new" className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('admin.addProduct', 'Add Product')}
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>{t('admin.product', 'Product')}</TableHead>
                    <TableHead>{t('admin.sku', 'SKU')}</TableHead>
                    <TableHead>{t('admin.category', 'Category')}</TableHead>
                    <TableHead>{t('admin.price', 'Price')}</TableHead>
                    <TableHead>{t('admin.stock', 'Stock')}</TableHead>
                    <TableHead>{t('admin.status', 'Status')}</TableHead>
                    <TableHead className={isRTL ? 'text-left' : 'text-right'}>{t('admin.actions', 'Actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products?.map((product, index) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                            {product.primary_image_url ? (
                              <img 
                                src={product.primary_image_url} 
                                alt={isRTL ? product.name_ar : product.name_en}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Package className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate max-w-[200px]">
                              {isRTL ? product.name_ar : product.name_en}
                            </p>
                            <div className="flex gap-1 mt-1">
                              {product.is_featured && (
                                <Badge variant="outline" className="text-xs">
                                  {t('admin.featured', 'Featured')}
                                </Badge>
                              )}
                              {product.is_new && (
                                <Badge variant="outline" className="text-xs bg-success/10 text-success">
                                  {t('admin.new', 'New')}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {product.sku || '-'}
                      </TableCell>
                      <TableCell>
                        {product.categories?.name_en || '-'}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{formatCurrency(product.base_price)}</p>
                          {product.sale_price && (
                            <p className="text-sm text-destructive line-through">
                              {formatCurrency(product.sale_price)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={product.stock_quantity > 10 ? 'default' : product.stock_quantity > 0 ? 'secondary' : 'destructive'}
                        >
                          {product.stock_quantity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={product.is_active ? 'default' : 'secondary'}
                          className="cursor-pointer"
                          onClick={() => toggleStatusMutation.mutate({ id: product.id, is_active: product.is_active })}
                        >
                          {product.is_active ? t('admin.active', 'Active') : t('admin.inactive', 'Inactive')}
                        </Badge>
                      </TableCell>
                      <TableCell className={isRTL ? 'text-left' : 'text-right'}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                            <DropdownMenuItem asChild>
                              <Link to={`/product/${product.slug}`} target="_blank" className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <Eye className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                {t('admin.view', 'View')}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/admin/products/${product.id}`} className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <Pencil className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                {t('admin.edit', 'Edit')}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className={`text-destructive flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}
                              onClick={() => handleDeleteClick(product)}
                            >
                              <Trash2 className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                              {t('admin.delete', 'Delete')}
                              {t('admin.delete', 'Delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.deleteProduct', 'Delete Product')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.deleteProductDesc', 'Are you sure you want to delete this product? This action cannot be undone.')}
              <br />
              <strong>{selectedProduct?.name_en}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('admin.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => selectedProduct && deleteMutation.mutate(selectedProduct.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              {t('admin.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

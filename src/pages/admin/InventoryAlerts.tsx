import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertTriangle,
  Package,
  PackageX,
  PackageMinus,
  RefreshCw,
  Plus,
  ExternalLink,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface Product {
  id: string;
  name_en: string;
  name_ar: string;
  sku: string | null;
  stock_quantity: number | null;
  low_stock_threshold: number | null;
  base_price: number;
  sale_price: number | null;
}

export default function AdminInventoryAlerts() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isRTL = i18n.language === 'ar';

  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockQuantity, setRestockQuantity] = useState('');

  // Fetch low stock products
  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-inventory-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name_en, name_ar, sku, stock_quantity, low_stock_threshold, base_price, sale_price')
        .eq('is_active', true)
        .or('stock_quantity.lte.10,stock_quantity.is.null')
        .order('stock_quantity', { ascending: true, nullsFirst: true });

      if (error) throw error;
      return data as Product[];
    },
  });

  // Restock mutation
  const restockMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const { error } = await supabase
        .from('products')
        .update({ stock_quantity: quantity })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-inventory-alerts'] });
      toast({
        title: isRTL ? 'تم التحديث' : 'Updated',
        description: isRTL ? 'تم تحديث المخزون بنجاح' : 'Stock updated successfully',
      });
      setRestockProduct(null);
      setRestockQuantity('');
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: isRTL ? 'خطأ' : 'Error',
        description: error.message,
      });
    },
  });

  // Categorize products
  const outOfStock = products?.filter((p) => !p.stock_quantity || p.stock_quantity === 0) || [];
  const criticalStock = products?.filter((p) => p.stock_quantity && p.stock_quantity > 0 && p.stock_quantity <= 5) || [];
  const lowStock = products?.filter((p) => p.stock_quantity && p.stock_quantity > 5 && p.stock_quantity <= 10) || [];

  // Get stock status badge
  const getStockBadge = (quantity: number | null) => {
    if (!quantity || quantity === 0) {
      return (
        <Badge variant="destructive" className="gap-1">
          <PackageX className="h-3 w-3" />
          {isRTL ? 'نفذ' : 'Out of Stock'}
        </Badge>
      );
    }
    if (quantity <= 5) {
      return (
        <Badge variant="destructive" className="gap-1 bg-red-500/20 text-red-600 border-red-500/30">
          <AlertTriangle className="h-3 w-3" />
          {isRTL ? 'حرج' : 'Critical'}
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1 bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
        <PackageMinus className="h-3 w-3" />
        {isRTL ? 'منخفض' : 'Low'}
      </Badge>
    );
  };

  const handleRestock = () => {
    if (!restockProduct || !restockQuantity) return;
    restockMutation.mutate({
      id: restockProduct.id,
      quantity: parseInt(restockQuantity, 10),
    });
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            {t('admin.inventory.title', 'Inventory Alerts')}
          </h1>
          <p className="text-muted-foreground">
            {t('admin.inventory.description', 'Monitor and manage low stock products')}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-inventory-alerts'] })}
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          {t('common.refresh', 'Refresh')}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-red-500/30 bg-red-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-600">
                <PackageX className="h-4 w-4" />
                {t('admin.inventory.outOfStock', 'Out of Stock')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{outOfStock.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('admin.inventory.needsImmediate', 'Needs immediate attention')}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-orange-500/30 bg-orange-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-4 w-4" />
                {t('admin.inventory.critical', 'Critical Stock')}
              </CardTitle>
              <CardDescription className="text-xs">≤ 5 {t('admin.inventory.units', 'units')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{criticalStock.length}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-yellow-600">
                <PackageMinus className="h-4 w-4" />
                {t('admin.inventory.lowStock', 'Low Stock')}
              </CardTitle>
              <CardDescription className="text-xs">6-10 {t('admin.inventory.units', 'units')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{lowStock.length}</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {t('admin.inventory.productsNeedingAttention', 'Products Needing Attention')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array(5).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : products?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('admin.inventory.allGood', 'All products have sufficient stock!')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.inventory.product', 'Product')}</TableHead>
                  <TableHead>{t('admin.inventory.sku', 'SKU')}</TableHead>
                  <TableHead>{t('admin.inventory.currentStock', 'Current Stock')}</TableHead>
                  <TableHead>{t('admin.inventory.status', 'Status')}</TableHead>
                  <TableHead>{t('admin.inventory.price', 'Price')}</TableHead>
                  <TableHead>{t('common.actions', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products?.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      {isRTL ? product.name_ar : product.name_en}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.sku || '-'}
                    </TableCell>
                    <TableCell>
                      <span className={`font-bold ${!product.stock_quantity ? 'text-destructive' : ''}`}>
                        {product.stock_quantity ?? 0}
                      </span>
                    </TableCell>
                    <TableCell>{getStockBadge(product.stock_quantity)}</TableCell>
                    <TableCell>
                      {(product.sale_price || product.base_price).toFixed(3)} KWD
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setRestockProduct(product);
                            setRestockQuantity(String((product.stock_quantity || 0) + 20));
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {t('admin.inventory.restock', 'Restock')}
                        </Button>
                        <Button size="sm" variant="ghost" asChild>
                          <Link to={`/admin/products/${product.id}`}>
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Restock Dialog */}
      <Dialog open={!!restockProduct} onOpenChange={() => setRestockProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('admin.inventory.restockTitle', 'Restock Product')}
            </DialogTitle>
          </DialogHeader>
          {restockProduct && (
            <div className="space-y-4">
              <div>
                <p className="font-medium">{isRTL ? restockProduct.name_ar : restockProduct.name_en}</p>
                <p className="text-sm text-muted-foreground">
                  {t('admin.inventory.currentQuantity', 'Current quantity')}: {restockProduct.stock_quantity || 0}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">
                  {t('admin.inventory.newQuantity', 'New Quantity')}
                </label>
                <Input
                  type="number"
                  min="0"
                  value={restockQuantity}
                  onChange={(e) => setRestockQuantity(e.target.value)}
                  placeholder="Enter new stock quantity"
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestockProduct(null)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button onClick={handleRestock} disabled={!restockQuantity || restockMutation.isPending}>
              {restockMutation.isPending
                ? t('common.saving', 'Saving...')
                : t('admin.inventory.updateStock', 'Update Stock')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

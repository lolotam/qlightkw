import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  ImageOff,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Image as ImageIcon,
  Trash2,
  ExternalLink,
} from 'lucide-react';

interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  is_primary: boolean;
  product_name: string;
  status: 'valid' | 'broken' | 'pending' | 'checking';
}

export default function ImageValidatorPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [imageStatuses, setImageStatuses] = useState<Map<string, 'valid' | 'broken' | 'checking'>>(new Map());

  // Fetch product images
  const { data: productImages, isLoading } = useQuery({
    queryKey: ['admin-product-images-validation'],
    queryFn: async (): Promise<ProductImage[]> => {
      const { data, error } = await supabase
        .from('product_images')
        .select(`
          id,
          product_id,
          url,
          is_primary,
          products:product_id (name_en)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((img: any) => ({
        id: img.id,
        product_id: img.product_id,
        url: img.url,
        is_primary: img.is_primary,
        product_name: img.products?.name_en || 'Unknown Product',
        status: 'pending' as const,
      }));
    },
  });

  // Check if an image URL is valid
  const checkImageUrl = async (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
      // Timeout after 10 seconds
      setTimeout(() => resolve(false), 10000);
    });
  };

  // Scan all images
  const handleScanImages = async () => {
    if (!productImages?.length) return;

    setIsScanning(true);
    setScanProgress(0);
    const newStatuses = new Map<string, 'valid' | 'broken' | 'checking'>();

    for (let i = 0; i < productImages.length; i++) {
      const image = productImages[i];
      newStatuses.set(image.id, 'checking');
      setImageStatuses(new Map(newStatuses));

      const isValid = await checkImageUrl(image.url);
      newStatuses.set(image.id, isValid ? 'valid' : 'broken');
      setImageStatuses(new Map(newStatuses));

      setScanProgress(((i + 1) / productImages.length) * 100);
    }

    setIsScanning(false);
    
    const brokenCount = Array.from(newStatuses.values()).filter(s => s === 'broken').length;
    toast({
      title: t('admin.scanComplete', 'Scan Complete'),
      description: t('admin.foundBrokenImages', `Found ${brokenCount} broken images`),
    });
  };

  // Delete broken image mutation
  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: string) => {
      const { error } = await supabase
        .from('product_images')
        .delete()
        .eq('id', imageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-product-images-validation'] });
      toast({ title: t('admin.imageDeleted', 'Image deleted') });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: t('admin.error', 'Error'),
        description: error.message,
      });
    },
  });

  // Get status for an image
  const getImageStatus = (imageId: string) => {
    return imageStatuses.get(imageId) || 'pending';
  };

  // Count by status
  const validCount = Array.from(imageStatuses.values()).filter(s => s === 'valid').length;
  const brokenCount = Array.from(imageStatuses.values()).filter(s => s === 'broken').length;
  const pendingCount = (productImages?.length || 0) - validCount - brokenCount;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('admin.imageValidator', 'Image Validator')}
          </h1>
          <p className="text-muted-foreground">
            {t('admin.imageValidatorDescription', 'Detect and fix broken product images')}
          </p>
        </div>
        <Button onClick={handleScanImages} disabled={isScanning || isLoading}>
          {isScanning ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          {t('admin.scanAllImages', 'Scan All Images')}
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              {t('admin.totalImages', 'Total Images')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productImages?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              {t('admin.validImages', 'Valid')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{validCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              {t('admin.brokenImages', 'Broken')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{brokenCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              {t('admin.pendingScan', 'Pending')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{pendingCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Scan progress */}
      {isScanning && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{t('admin.scanningImages', 'Scanning images...')}</span>
                <span>{Math.round(scanProgress)}%</span>
              </div>
              <Progress value={scanProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Images table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageOff className="h-5 w-5" />
            {t('admin.imageValidation', 'Image Validation Results')}
          </CardTitle>
          <CardDescription>
            {t('admin.imageValidationDesc', 'Scan to check for broken or missing images')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : productImages?.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {t('admin.noImages', 'No product images found')}
              </h3>
              <p className="text-muted-foreground">
                {t('admin.noImagesDesc', 'Add images to your products first.')}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">{t('admin.preview', 'Preview')}</TableHead>
                    <TableHead>{t('admin.product', 'Product')}</TableHead>
                    <TableHead>{t('admin.url', 'URL')}</TableHead>
                    <TableHead>{t('admin.status', 'Status')}</TableHead>
                    <TableHead className="text-right">{t('admin.actions', 'Actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productImages?.map((image) => {
                    const status = getImageStatus(image.id);
                    return (
                      <TableRow key={image.id}>
                        <TableCell>
                          <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                            {status === 'broken' ? (
                              <ImageOff className="h-6 w-6 text-destructive" />
                            ) : (
                              <img
                                src={image.url}
                                alt=""
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{image.product_name}</p>
                            {image.is_primary && (
                              <Badge variant="outline" className="text-xs mt-1">
                                {t('admin.primary', 'Primary')}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                            {image.url}
                          </p>
                        </TableCell>
                        <TableCell>
                          {status === 'pending' && (
                            <Badge variant="secondary">
                              {t('admin.notScanned', 'Not Scanned')}
                            </Badge>
                          )}
                          {status === 'checking' && (
                            <Badge variant="outline" className="animate-pulse">
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              {t('admin.checking', 'Checking...')}
                            </Badge>
                          )}
                          {status === 'valid' && (
                            <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {t('admin.valid', 'Valid')}
                            </Badge>
                          )}
                          {status === 'broken' && (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              {t('admin.broken', 'Broken')}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                            >
                              <a href={image.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                            {status === 'broken' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => deleteImageMutation.mutate(image.id)}
                                disabled={deleteImageMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

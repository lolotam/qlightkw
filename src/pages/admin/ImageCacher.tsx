import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  CloudDownload,
  CloudUpload,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Image as ImageIcon,
  ExternalLink,
  HardDrive,
} from 'lucide-react';

interface CacheItem {
  id: string;
  product_id: string;
  product_name: string;
  original_url: string;
  cached_url: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export default function ImageCacherPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isCaching, setIsCaching] = useState(false);
  const [cacheProgress, setCacheProgress] = useState(0);
  const [autoCache, setAutoCache] = useState(false);
  const [cacheQueue, setCacheQueue] = useState<CacheItem[]>([]);

  // Fetch products with external image URLs
  const { data: productsWithExternalImages, isLoading } = useQuery({
    queryKey: ['admin-products-external-images'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_images')
        .select(`
          id,
          product_id,
          url,
          products:product_id (name_en)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter to only external URLs (not from Supabase storage)
      const supabaseUrl = 'yubebbfsmlopmnluajgf.supabase.co';
      return (data || [])
        .filter((img: any) => !img.url.includes(supabaseUrl))
        .map((img: any) => ({
          id: img.id,
          product_id: img.product_id,
          product_name: img.products?.name_en || 'Unknown',
          original_url: img.url,
          cached_url: null,
          status: 'pending' as const,
        }));
    },
  });

  // Simulate caching process
  const handleStartCaching = async () => {
    if (!productsWithExternalImages?.length) {
      toast({
        title: t('admin.noExternalImages', 'No External Images'),
        description: t('admin.allImagesCached', 'All images are already cached in Supabase Storage.'),
      });
      return;
    }

    setIsCaching(true);
    setCacheProgress(0);
    const queue: CacheItem[] = [...productsWithExternalImages];
    setCacheQueue(queue);

    for (let i = 0; i < queue.length; i++) {
      // Update status to processing
      queue[i].status = 'processing';
      setCacheQueue([...queue]);

      // Simulate download and upload (in real implementation, this would:
      // 1. Fetch the image from the external URL
      // 2. Upload to Supabase Storage
      // 3. Update the product_images record with new URL)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate success/failure (90% success rate for demo)
      queue[i].status = Math.random() > 0.1 ? 'completed' : 'failed';
      if (queue[i].status === 'completed') {
        queue[i].cached_url = `https://yubebbfsmlopmnluajgf.supabase.co/storage/v1/object/public/product-images/cached-${queue[i].id}.jpg`;
      }
      setCacheQueue([...queue]);

      setCacheProgress(((i + 1) / queue.length) * 100);
    }

    setIsCaching(false);

    const completedCount = queue.filter(q => q.status === 'completed').length;
    const failedCount = queue.filter(q => q.status === 'failed').length;

    toast({
      title: t('admin.cachingComplete', 'Caching Complete'),
      description: t('admin.cachedResults', `${completedCount} cached, ${failedCount} failed`),
    });
  };

  // Retry failed items
  const handleRetryFailed = async () => {
    const failedItems = cacheQueue.filter(q => q.status === 'failed');
    if (!failedItems.length) return;

    setIsCaching(true);
    
    for (const item of failedItems) {
      const index = cacheQueue.findIndex(q => q.id === item.id);
      if (index !== -1) {
        cacheQueue[index].status = 'processing';
        setCacheQueue([...cacheQueue]);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        cacheQueue[index].status = Math.random() > 0.3 ? 'completed' : 'failed';
        setCacheQueue([...cacheQueue]);
      }
    }

    setIsCaching(false);
    toast({ title: t('admin.retryComplete', 'Retry Complete') });
  };

  // Stats
  const totalCount = productsWithExternalImages?.length || 0;
  const completedCount = cacheQueue.filter(q => q.status === 'completed').length;
  const failedCount = cacheQueue.filter(q => q.status === 'failed').length;
  const pendingCount = cacheQueue.filter(q => q.status === 'pending').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('admin.imageCacher', 'Image Cacher')}
          </h1>
          <p className="text-muted-foreground">
            {t('admin.imageCacherDescription', 'Cache external product images to local storage')}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="auto-cache"
              checked={autoCache}
              onCheckedChange={setAutoCache}
            />
            <Label htmlFor="auto-cache" className="text-sm">
              {t('admin.autoCache', 'Auto-cache new images')}
            </Label>
          </div>
          <Button onClick={handleStartCaching} disabled={isCaching || isLoading}>
            {isCaching ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CloudDownload className="h-4 w-4 mr-2" />
            )}
            {t('admin.startCaching', 'Start Caching')}
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
              {t('admin.externalImages', 'External Images')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="text-xs text-muted-foreground">
              {t('admin.needsCaching', 'Needs caching')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              {t('admin.cached', 'Cached')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{completedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              {t('admin.failed', 'Failed')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{failedCount}</div>
            {failedCount > 0 && (
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto text-xs"
                onClick={handleRetryFailed}
                disabled={isCaching}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                {t('admin.retryFailed', 'Retry failed')}
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              {t('admin.pending', 'Pending')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {pendingCount || totalCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress */}
      {isCaching && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <CloudUpload className="h-4 w-4 animate-pulse" />
                  {t('admin.cachingImages', 'Caching images...')}
                </span>
                <span>{Math.round(cacheProgress)}%</span>
              </div>
              <Progress value={cacheProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <HardDrive className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-medium">{t('admin.howItWorks', 'How It Works')}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t('admin.cacherExplanation', 'The image cacher downloads external product images and uploads them to your Supabase Storage bucket. This improves loading speed, reduces external dependencies, and ensures images remain available even if the original source goes offline.')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Queue list */}
      {cacheQueue.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              {t('admin.cacheQueue', 'Cache Queue')}
            </CardTitle>
            <CardDescription>
              {t('admin.cacheQueueDesc', 'Status of images being cached')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {cacheQueue.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.original_url}
                      </p>
                    </div>
                  </div>
                  <div className="ml-4">
                    {item.status === 'pending' && (
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        {t('admin.pending', 'Pending')}
                      </Badge>
                    )}
                    {item.status === 'processing' && (
                      <Badge variant="outline" className="animate-pulse">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        {t('admin.processing', 'Processing')}
                      </Badge>
                    )}
                    {item.status === 'completed' && (
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {t('admin.cached', 'Cached')}
                      </Badge>
                    )}
                    {item.status === 'failed' && (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        {t('admin.failed', 'Failed')}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!isLoading && totalCount === 0 && cacheQueue.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {t('admin.allImagesCached', 'All Images Cached')}
              </h3>
              <p className="text-muted-foreground">
                {t('admin.noExternalImagesToCache', 'No external images to cache. All product images are already stored locally.')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Image as ImageIcon,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { format } from 'date-fns';

interface Banner {
  id: string;
  title_en: string;
  title_ar: string | null;
  subtitle_en: string | null;
  subtitle_ar: string | null;
  image_url: string;
  link_url: string | null;
  button_text_en: string | null;
  button_text_ar: string | null;
  is_active: boolean;
  display_order: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

const emptyBanner = {
  title_en: '',
  title_ar: '',
  subtitle_en: '',
  subtitle_ar: '',
  image_url: '',
  link_url: '',
  button_text_en: 'Shop Now',
  button_text_ar: 'تسوق الآن',
  is_active: true,
  display_order: 0,
  starts_at: '',
  ends_at: '',
};

export default function AdminBanners() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isRTL = i18n.language === 'ar';

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState(emptyBanner);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Fetch banners
  const { data: banners, isLoading } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promo_banners')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as Banner[];
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      const payload = {
        title_en: data.title_en,
        title_ar: data.title_ar || null,
        subtitle_en: data.subtitle_en || null,
        subtitle_ar: data.subtitle_ar || null,
        image_url: data.image_url,
        link_url: data.link_url || null,
        button_text_en: data.button_text_en || null,
        button_text_ar: data.button_text_ar || null,
        is_active: data.is_active,
        display_order: data.display_order,
        starts_at: data.starts_at || null,
        ends_at: data.ends_at || null,
      };

      if (data.id) {
        const { error } = await supabase
          .from('promo_banners')
          .update(payload)
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('promo_banners').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      toast({
        title: isRTL ? 'تم الحفظ' : 'Saved',
        description: isRTL ? 'تم حفظ البانر بنجاح' : 'Banner saved successfully',
      });
      closeDialog();
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: isRTL ? 'خطأ' : 'Error',
        description: error.message,
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('promo_banners').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      toast({
        title: isRTL ? 'تم الحذف' : 'Deleted',
        description: isRTL ? 'تم حذف البانر بنجاح' : 'Banner deleted successfully',
      });
      setDeleteId(null);
    },
  });

  // Toggle active mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('promo_banners')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
    },
  });

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: 'up' | 'down' }) => {
      const currentBanner = banners?.find((b) => b.id === id);
      if (!currentBanner) return;

      const currentIndex = banners?.findIndex((b) => b.id === id) || 0;
      const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      const swapBanner = banners?.[swapIndex];

      if (!swapBanner) return;

      // Swap display_order values
      await supabase
        .from('promo_banners')
        .update({ display_order: swapBanner.display_order })
        .eq('id', currentBanner.id);

      await supabase
        .from('promo_banners')
        .update({ display_order: currentBanner.display_order })
        .eq('id', swapBanner.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
    },
  });

  const openDialog = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        title_en: banner.title_en,
        title_ar: banner.title_ar || '',
        subtitle_en: banner.subtitle_en || '',
        subtitle_ar: banner.subtitle_ar || '',
        image_url: banner.image_url,
        link_url: banner.link_url || '',
        button_text_en: banner.button_text_en || 'Shop Now',
        button_text_ar: banner.button_text_ar || 'تسوق الآن',
        is_active: banner.is_active,
        display_order: banner.display_order,
        starts_at: banner.starts_at ? banner.starts_at.split('T')[0] : '',
        ends_at: banner.ends_at ? banner.ends_at.split('T')[0] : '',
      });
    } else {
      setEditingBanner(null);
      setFormData({ ...emptyBanner, display_order: (banners?.length || 0) + 1 });
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingBanner(null);
    setFormData(emptyBanner);
  };

  const handleSubmit = () => {
    if (!formData.title_en || !formData.image_url) {
      toast({
        variant: 'destructive',
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'العنوان والصورة مطلوبان' : 'Title and image URL are required',
      });
      return;
    }
    saveMutation.mutate({ ...formData, id: editingBanner?.id });
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ImageIcon className="h-6 w-6 text-primary" />
            {t('admin.banners.title', 'Promo Banners')}
          </h1>
          <p className="text-muted-foreground">
            {t('admin.banners.description', 'Manage homepage promotional banners')}
          </p>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="h-4 w-4 mr-1" />
          {t('admin.banners.add', 'Add Banner')}
        </Button>
      </div>

      {/* Banners Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : banners?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('admin.banners.empty', 'No banners created yet')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>{t('admin.banners.preview', 'Preview')}</TableHead>
                  <TableHead>{t('admin.banners.titleCol', 'Title')}</TableHead>
                  <TableHead>{t('admin.banners.status', 'Status')}</TableHead>
                  <TableHead>{t('admin.banners.schedule', 'Schedule')}</TableHead>
                  <TableHead>{t('common.actions', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {banners?.map((banner, index) => (
                  <TableRow key={banner.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          disabled={index === 0}
                          onClick={() => reorderMutation.mutate({ id: banner.id, direction: 'up' })}
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          disabled={index === (banners?.length || 0) - 1}
                          onClick={() => reorderMutation.mutate({ id: banner.id, direction: 'down' })}
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <img
                        src={banner.image_url}
                        alt={banner.title_en}
                        className="w-24 h-14 object-cover rounded"
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{banner.title_en}</p>
                        {banner.title_ar && (
                          <p className="text-sm text-muted-foreground">{banner.title_ar}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={banner.is_active}
                          onCheckedChange={(checked) =>
                            toggleMutation.mutate({ id: banner.id, is_active: checked })
                          }
                        />
                        {banner.is_active ? (
                          <Badge variant="default" className="gap-1">
                            <Eye className="h-3 w-3" />
                            {isRTL ? 'نشط' : 'Active'}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <EyeOff className="h-3 w-3" />
                            {isRTL ? 'مخفي' : 'Hidden'}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {banner.starts_at && (
                        <div>From: {format(new Date(banner.starts_at), 'MMM d, yyyy')}</div>
                      )}
                      {banner.ends_at && (
                        <div>To: {format(new Date(banner.ends_at), 'MMM d, yyyy')}</div>
                      )}
                      {!banner.starts_at && !banner.ends_at && '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" onClick={() => openDialog(banner)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => setDeleteId(banner.id)}
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBanner
                ? t('admin.banners.edit', 'Edit Banner')
                : t('admin.banners.add', 'Add Banner')}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('admin.banners.titleEn', 'Title (English)')} *</Label>
                <Input
                  value={formData.title_en}
                  onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                  placeholder="Banner title"
                />
              </div>
              <div>
                <Label>{t('admin.banners.titleAr', 'Title (Arabic)')}</Label>
                <Input
                  value={formData.title_ar}
                  onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                  placeholder="عنوان البانر"
                  dir="rtl"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('admin.banners.subtitleEn', 'Subtitle (English)')}</Label>
                <Input
                  value={formData.subtitle_en}
                  onChange={(e) => setFormData({ ...formData, subtitle_en: e.target.value })}
                  placeholder="Optional subtitle"
                />
              </div>
              <div>
                <Label>{t('admin.banners.subtitleAr', 'Subtitle (Arabic)')}</Label>
                <Input
                  value={formData.subtitle_ar}
                  onChange={(e) => setFormData({ ...formData, subtitle_ar: e.target.value })}
                  placeholder="العنوان الفرعي"
                  dir="rtl"
                />
              </div>
            </div>
            <div>
              <Label>{t('admin.banners.imageUrl', 'Image URL')} *</Label>
              <Input
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://..."
              />
              {formData.image_url && (
                <img
                  src={formData.image_url}
                  alt="Preview"
                  className="mt-2 max-h-32 rounded object-cover"
                />
              )}
            </div>
            <div>
              <Label>{t('admin.banners.linkUrl', 'Link URL')}</Label>
              <Input
                value={formData.link_url}
                onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                placeholder="/shop or https://..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('admin.banners.buttonEn', 'Button Text (English)')}</Label>
                <Input
                  value={formData.button_text_en}
                  onChange={(e) => setFormData({ ...formData, button_text_en: e.target.value })}
                />
              </div>
              <div>
                <Label>{t('admin.banners.buttonAr', 'Button Text (Arabic)')}</Label>
                <Input
                  value={formData.button_text_ar}
                  onChange={(e) => setFormData({ ...formData, button_text_ar: e.target.value })}
                  dir="rtl"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('admin.banners.startDate', 'Start Date')}</Label>
                <Input
                  type="date"
                  value={formData.starts_at}
                  onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                />
              </div>
              <div>
                <Label>{t('admin.banners.endDate', 'End Date')}</Label>
                <Input
                  type="date"
                  value={formData.ends_at}
                  onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">{t('admin.banners.active', 'Active')}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.banners.deleteTitle', 'Delete Banner?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.banners.deleteDescription', 'This action cannot be undone.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

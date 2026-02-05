import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Plus, 
  Copy, 
  Trash2, 
  Ticket, 
  Percent, 
  DollarSign,
  Calendar,
  Users,
  Search,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  description_ar: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  valid_from: string | null;
  valid_until: string | null;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  created_at: string;
}

interface CouponForm {
  code: string;
  description: string;
  description_ar: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: string;
  min_order_amount: string;
  max_discount_amount: string;
  valid_from: string;
  valid_until: string;
  max_uses: string;
  is_active: boolean;
}

const emptyForm: CouponForm = {
  code: '',
  description: '',
  description_ar: '',
  discount_type: 'percentage',
  discount_value: '',
  min_order_amount: '0',
  max_discount_amount: '',
  valid_from: '',
  valid_until: '',
  max_uses: '',
  is_active: true,
};

export default function AdminCoupons() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isRTL = i18n.language === 'ar';

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [deletingCoupon, setDeletingCoupon] = useState<Coupon | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState<CouponForm>(emptyForm);

  // Fetch coupons
  const { data: coupons, isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Coupon[];
    },
  });

  // Filter coupons
  const filteredCoupons = coupons?.filter(coupon =>
    coupon.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    coupon.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: CouponForm) => {
      const payload = {
        code: data.code.toUpperCase(),
        description: data.description || null,
        description_ar: data.description_ar || null,
        discount_type: data.discount_type,
        discount_value: parseFloat(data.discount_value),
        min_order_amount: parseFloat(data.min_order_amount) || 0,
        max_discount_amount: data.max_discount_amount ? parseFloat(data.max_discount_amount) : null,
        valid_from: data.valid_from || null,
        valid_until: data.valid_until || null,
        max_uses: data.max_uses ? parseInt(data.max_uses) : null,
        is_active: data.is_active,
      };

      if (editingCoupon) {
        const { error } = await supabase
          .from('coupons')
          .update(payload)
          .eq('id', editingCoupon.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('coupons')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast({
        title: editingCoupon 
          ? t('admin.coupons.updated', 'Coupon updated') 
          : t('admin.coupons.created', 'Coupon created'),
      });
      setDialogOpen(false);
      setEditingCoupon(null);
      setForm(emptyForm);
    },
    onError: (error: any) => {
      toast({
        title: t('common.error', 'Error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast({ title: t('admin.coupons.deleted', 'Coupon deleted') });
      setDeleteDialogOpen(false);
      setDeletingCoupon(null);
    },
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
    },
  });

  // Open edit dialog
  const openEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code,
      description: coupon.description || '',
      description_ar: coupon.description_ar || '',
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      min_order_amount: coupon.min_order_amount.toString(),
      max_discount_amount: coupon.max_discount_amount?.toString() || '',
      valid_from: coupon.valid_from?.slice(0, 16) || '',
      valid_until: coupon.valid_until?.slice(0, 16) || '',
      max_uses: coupon.max_uses?.toString() || '',
      is_active: coupon.is_active,
    });
    setDialogOpen(true);
  };

  // Get coupon status
  const getCouponStatus = (coupon: Coupon) => {
    if (!coupon.is_active) return { label: t('common.inactive', 'Inactive'), variant: 'secondary' as const };
    if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
      return { label: t('admin.coupons.expired', 'Expired'), variant: 'destructive' as const };
    }
    if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
      return { label: t('admin.coupons.maxedOut', 'Maxed Out'), variant: 'outline' as const };
    }
    return { label: t('common.active', 'Active'), variant: 'default' as const };
  };

  // Copy code to clipboard
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: t('admin.coupons.copied', 'Code copied to clipboard') });
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Ticket className="h-6 w-6" />
            {t('admin.coupons.title', 'Coupons')}
          </h1>
          <p className="text-muted-foreground">
            {t('admin.coupons.description', 'Manage discount codes and promotions')}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingCoupon(null);
            setForm(emptyForm);
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('admin.coupons.add', 'Add Coupon')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingCoupon 
                  ? t('admin.coupons.edit', 'Edit Coupon') 
                  : t('admin.coupons.create', 'Create Coupon')}
              </DialogTitle>
              <DialogDescription>
                {t('admin.coupons.formDescription', 'Set up discount code details')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Code */}
              <div className="space-y-2">
                <Label>{t('admin.coupons.code', 'Code')}</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="SAVE20"
                  className="uppercase"
                />
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('admin.coupons.discountType', 'Discount Type')}</Label>
                  <Select
                    value={form.discount_type}
                    onValueChange={(v: 'percentage' | 'fixed') => setForm({ ...form, discount_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">
                        <div className="flex items-center gap-2">
                          <Percent className="h-4 w-4" />
                          {t('admin.coupons.percentage', 'Percentage')}
                        </div>
                      </SelectItem>
                      <SelectItem value="fixed">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          {t('admin.coupons.fixed', 'Fixed Amount')}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('admin.coupons.discountValue', 'Value')}</Label>
                  <Input
                    type="number"
                    value={form.discount_value}
                    onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                    placeholder={form.discount_type === 'percentage' ? '20' : '5.00'}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('admin.coupons.descriptionEn', 'Description (EN)')}</Label>
                  <Input
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Summer sale discount"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('admin.coupons.descriptionAr', 'Description (AR)')}</Label>
                  <Input
                    value={form.description_ar}
                    onChange={(e) => setForm({ ...form, description_ar: e.target.value })}
                    placeholder="خصم الصيف"
                    dir="rtl"
                  />
                </div>
              </div>

              {/* Min Order & Max Discount */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('admin.coupons.minOrder', 'Min Order (KWD)')}</Label>
                  <Input
                    type="number"
                    value={form.min_order_amount}
                    onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('admin.coupons.maxDiscount', 'Max Discount (KWD)')}</Label>
                  <Input
                    type="number"
                    value={form.max_discount_amount}
                    onChange={(e) => setForm({ ...form, max_discount_amount: e.target.value })}
                    placeholder="No limit"
                  />
                </div>
              </div>

              {/* Validity */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('admin.coupons.validFrom', 'Valid From')}</Label>
                  <Input
                    type="datetime-local"
                    value={form.valid_from}
                    onChange={(e) => setForm({ ...form, valid_from: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('admin.coupons.validUntil', 'Valid Until')}</Label>
                  <Input
                    type="datetime-local"
                    value={form.valid_until}
                    onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                  />
                </div>
              </div>

              {/* Max Uses */}
              <div className="space-y-2">
                <Label>{t('admin.coupons.maxUses', 'Max Uses (leave empty for unlimited)')}</Label>
                <Input
                  type="number"
                  value={form.max_uses}
                  onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                  placeholder="Unlimited"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between">
                <Label>{t('admin.coupons.isActive', 'Active')}</Label>
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button 
                onClick={() => saveMutation.mutate(form)}
                disabled={saveMutation.isPending || !form.code || !form.discount_value}
              >
                {saveMutation.isPending ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('admin.coupons.search', 'Search coupons...')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Coupons Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>{t('admin.coupons.code', 'Code')}</TableHead>
                <TableHead>{t('admin.coupons.discount', 'Discount')}</TableHead>
                <TableHead>{t('admin.coupons.usage', 'Usage')}</TableHead>
                <TableHead>{t('admin.coupons.validity', 'Validity')}</TableHead>
                <TableHead>{t('common.status', 'Status')}</TableHead>
                <TableHead className="text-right">{t('common.actions', 'Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : filteredCoupons?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {t('admin.coupons.noCoupons', 'No coupons found')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCoupons?.map((coupon, index) => {
                  const status = getCouponStatus(coupon);
                  return (
                    <TableRow key={coupon.id}>
                      <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="font-mono font-bold text-primary">{coupon.code}</code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyCode(coupon.code)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        {coupon.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {isRTL ? coupon.description_ar || coupon.description : coupon.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {coupon.discount_type === 'percentage' ? (
                            <>
                              <Percent className="h-3 w-3" />
                              {coupon.discount_value}%
                            </>
                          ) : (
                            <>
                              {coupon.discount_value} KWD
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          {coupon.current_uses} / {coupon.max_uses || '∞'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {coupon.valid_until ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {format(new Date(coupon.valid_until), 'MMM d, yyyy')}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            {t('admin.coupons.noExpiry', 'No expiry')}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Switch
                            checked={coupon.is_active}
                            onCheckedChange={(checked) => 
                              toggleActiveMutation.mutate({ id: coupon.id, is_active: checked })
                            }
                          />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(coupon)}>
                                {t('common.edit', 'Edit')}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => {
                                  setDeletingCoupon(coupon);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                {t('common.delete', 'Delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.coupons.deleteTitle', 'Delete Coupon?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.coupons.deleteDescription', 'This action cannot be undone. The coupon code will no longer be valid.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingCoupon && deleteMutation.mutate(deletingCoupon.id)}
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

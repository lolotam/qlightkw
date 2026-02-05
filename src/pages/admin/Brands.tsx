import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Tags,
  Pencil,
  Trash2,
  Loader2,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import ImageUploader from '@/components/admin/ImageUploader';
import SEOSection from '@/components/admin/SEOSection';

// Brand type
interface Brand {
  id: string;
  name: string;
  name_ar: string | null;
  slug: string;
  logo_url: string | null;
  description_en: string | null;
  description_ar: string | null;
  website_url: string | null;
  is_active: boolean;
  seo_title_en?: string | null;
  seo_title_ar?: string | null;
  seo_description_en?: string | null;
  seo_description_ar?: string | null;
}

// Form state
interface BrandForm {
  name: string;
  name_ar: string;
  slug: string;
  logo_url: string;
  description_en: string;
  description_ar: string;
  website_url: string;
  is_active: boolean;
  seo_title_en: string;
  seo_title_ar: string;
  seo_description_en: string;
  seo_description_ar: string;
}

const emptyForm: BrandForm = {
  name: '',
  name_ar: '',
  slug: '',
  logo_url: '',
  description_en: '',
  description_ar: '',
  website_url: '',
  is_active: true,
  seo_title_en: '',
  seo_title_ar: '',
  seo_description_en: '',
  seo_description_ar: '',
};

export default function BrandsPage() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isRTL = i18n.language === 'ar';
  const [searchParams, setSearchParams] = useSearchParams();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [form, setForm] = useState<BrandForm>(emptyForm);
  const [generatingDescription, setGeneratingDescription] = useState(false);

  // Generate descriptions using AI
  const generateDescriptions = async () => {
    const nameEn = form.name;
    const nameAr = form.name_ar;
    
    if (!nameEn && !nameAr) {
      toast({
        title: t('admin.error', 'Error'),
        description: isRTL
          ? 'يرجى إدخال الاسم بالإنجليزية أو العربية أولاً'
          : 'Please enter a name in English or Arabic first',
        variant: 'destructive',
      });
      return;
    }

    setGeneratingDescription(true);

    try {
      const prompt = `Generate brand descriptions for an e-commerce lighting store.

Brand Name (English): ${nameEn || 'N/A'}
Brand Name (Arabic): ${nameAr || 'N/A'}
Website: ${form.website_url || 'N/A'}

Generate compelling, SEO-friendly descriptions for this lighting brand. The descriptions should:
- Be 2-3 sentences long
- Highlight the brand's reputation in lighting products
- Be suitable for an e-commerce lighting store
- Be engaging and professional

Return a JSON object with these exact fields:
{
  "description_en": "English description here",
  "description_ar": "Arabic description here"
}

Return ONLY the JSON object, no other text.`;

      const { data: result, error } = await supabase.functions.invoke('generate-ai-content', {
        body: {
          type: 'text',
          prompt,
        },
      });

      if (error) throw error;

      const responseContent = result?.text || result?.content;
      
      if (result?.success && responseContent) {
        let descData: { description_en?: string; description_ar?: string };
        
        if (typeof responseContent === 'string') {
          let cleanedContent = responseContent
            .replace(/```json\s*/gi, '')
            .replace(/```\s*/g, '')
            .trim();
          
          const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            descData = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('Invalid response format');
          }
        } else {
          descData = responseContent;
        }

        if (descData.description_en) handleChange('description_en', descData.description_en);
        if (descData.description_ar) handleChange('description_ar', descData.description_ar);

        toast({
          title: isRTL ? 'تم إنشاء الوصف' : 'Descriptions Generated',
          description: isRTL
            ? 'تم إنشاء الأوصاف بنجاح'
            : 'Descriptions generated successfully',
        });
      } else {
        throw new Error(result?.error || 'Failed to generate descriptions');
      }
    } catch (error) {
      console.error('Description generation error:', error);
      toast({
        title: t('admin.error', 'Error'),
        description: error instanceof Error ? error.message : 'Failed to generate descriptions',
        variant: 'destructive',
      });
    } finally {
      setGeneratingDescription(false);
    }
  };

  // Auto-open dialog if action=add in URL
  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setEditingBrand(null);
      setForm(emptyForm);
      setDialogOpen(true);
      // Clear the action param
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Fetch brands
  const { data: brands, isLoading } = useQuery({
    queryKey: ['admin-brands'],
    queryFn: async (): Promise<Brand[]> => {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: BrandForm & { id?: string }) => {
      const brandData = {
        name: data.name,
        name_ar: data.name_ar || null,
        slug: data.slug,
        logo_url: data.logo_url || null,
        description_en: data.description_en || null,
        description_ar: data.description_ar || null,
        website_url: data.website_url || null,
        is_active: data.is_active,
        seo_title_en: data.seo_title_en || null,
        seo_title_ar: data.seo_title_ar || null,
        seo_description_en: data.seo_description_en || null,
        seo_description_ar: data.seo_description_ar || null,
      };

      if (data.id) {
        const { error } = await supabase
          .from('brands')
          .update(brandData)
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('brands').insert(brandData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] });
      toast({
        title: editingBrand
          ? t('admin.brandUpdated', 'Brand updated')
          : t('admin.brandCreated', 'Brand created'),
      });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: t('admin.error', 'Error'),
        description: error.message,
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('brands').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] });
      toast({ title: t('admin.brandDeleted', 'Brand deleted') });
      setDeleteDialogOpen(false);
      setEditingBrand(null);
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: t('admin.error', 'Error'),
        description: error.message,
      });
    },
  });

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  // Handle form field change
  const handleChange = (field: keyof BrandForm, value: string | boolean) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'name' && typeof value === 'string') {
        updated.slug = generateSlug(value);
      }
      return updated;
    });
  };

  // Open dialog for editing
  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setForm({
      name: brand.name,
      name_ar: brand.name_ar || '',
      slug: brand.slug,
      logo_url: brand.logo_url || '',
      description_en: brand.description_en || '',
      description_ar: brand.description_ar || '',
      website_url: brand.website_url || '',
      is_active: brand.is_active,
      seo_title_en: brand.seo_title_en || '',
      seo_title_ar: brand.seo_title_ar || '',
      seo_description_en: brand.seo_description_en || '',
      seo_description_ar: brand.seo_description_ar || '',
    });
    setDialogOpen(true);
  };

  // Open dialog for new brand
  const handleAdd = () => {
    setEditingBrand(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingBrand(null);
    setForm(emptyForm);
  };

  // Submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      ...form,
      id: editingBrand?.id,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('admin.brands', 'Brands')}
          </h1>
          <p className="text-muted-foreground">
            {t('admin.brandsDescription', 'Manage product brands')}
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          {t('admin.addBrand', 'Add Brand')}
        </Button>
      </div>

      {/* Brands grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tags className="h-5 w-5" />
            {t('admin.allBrands', 'All Brands')}
            {brands && (
              <Badge variant="secondary" className="ml-2">
                {brands.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : brands?.length === 0 ? (
            <div className="text-center py-12">
              <Tags className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {t('admin.noBrands', 'No brands yet')}
              </h3>
              <p className="text-muted-foreground mb-4">
                {t('admin.noBrandsDesc', 'Start by adding your first brand.')}
              </p>
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                {t('admin.addBrand', 'Add Brand')}
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {brands?.map((brand) => (
                <Card key={brand.id} className="relative group">
                  <CardContent className="pt-6">
                    {/* Brand logo placeholder */}
                    <div className="h-16 w-16 mx-auto mb-4 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                      {brand.logo_url ? (
                        <img
                          src={brand.logo_url}
                          alt={brand.name}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <Tags className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>

                    {/* Brand name */}
                    <h3 className="font-semibold text-center">
                      {isRTL && brand.name_ar ? brand.name_ar : brand.name}
                    </h3>
                    <p className="text-sm text-muted-foreground text-center">
                      {brand.slug}
                    </p>

                    {/* Status badge */}
                    <div className="flex justify-center mt-2">
                      <Badge variant={brand.is_active ? 'default' : 'secondary'}>
                        {brand.is_active ? t('admin.active', 'Active') : t('admin.inactive', 'Inactive')}
                      </Badge>
                    </div>

                    {/* Website link */}
                    {brand.website_url && (
                      <a
                        href={brand.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary flex items-center justify-center mt-2 hover:underline"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        {t('admin.website', 'Website')}
                      </a>
                    )}

                    {/* Action buttons */}
                    <div className="flex justify-center gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(brand)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingBrand(brand);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit dialog with scroll support */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg h-[90vh] max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              {editingBrand
                ? t('admin.editBrand', 'Edit Brand')
                : t('admin.addBrand', 'Add Brand')}
            </DialogTitle>
            <DialogDescription>
              {t('admin.brandFormDesc', 'Fill in the brand details below.')}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea type="always" className="flex-1 min-h-0 -mx-6 px-6">
            <form id="brand-form" onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">{t('admin.name', 'Name')} *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                  />
                </div>

                {/* Arabic Name */}
                <div className="space-y-2">
                  <Label htmlFor="name_ar">{t('admin.nameAr', 'Name (Arabic)')}</Label>
                  <Input
                    id="name_ar"
                    value={form.name_ar}
                    onChange={(e) => handleChange('name_ar', e.target.value)}
                    dir="rtl"
                  />
                </div>

                {/* Slug */}
                <div className="space-y-2">
                  <Label htmlFor="slug">{t('admin.slug', 'Slug')} *</Label>
                  <Input
                    id="slug"
                    value={form.slug}
                    onChange={(e) => handleChange('slug', e.target.value)}
                    required
                  />
                </div>

                {/* Brand Logo */}
                <div className="space-y-2">
                  <Label>{t('admin.brandLogo', 'Brand Logo')}</Label>
                  <ImageUploader
                    value={form.logo_url}
                    onChange={(url) => handleChange('logo_url', url)}
                    bucket="product-images"
                    folder="brands"
                    aspectRatio="square"
                    contextName={form.name}
                    contextType="brand"
                  />
                </div>

                {/* Website URL */}
                <div className="space-y-2">
                  <Label htmlFor="website_url">{t('admin.websiteUrl', 'Website URL')}</Label>
                  <Input
                    id="website_url"
                    type="url"
                    value={form.website_url}
                    onChange={(e) => handleChange('website_url', e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                {/* Description Section with AI Generate */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{t('admin.descriptions', 'Descriptions')}</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateDescriptions}
                      disabled={generatingDescription || (!form.name && !form.name_ar)}
                      className="gap-2"
                    >
                      {generatingDescription ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      {t('admin.generateDescriptions', 'Generate Descriptions')}
                    </Button>
                  </div>
                </div>

                {/* Description English */}
                <div className="space-y-2">
                  <Label htmlFor="description_en">{t('admin.descriptionEn', 'Description (English)')}</Label>
                  <Textarea
                    id="description_en"
                    value={form.description_en}
                    onChange={(e) => handleChange('description_en', e.target.value)}
                    rows={2}
                  />
                </div>

                {/* Description Arabic */}
                <div className="space-y-2">
                  <Label htmlFor="description_ar">{t('admin.descriptionAr', 'Description (Arabic)')}</Label>
                  <Textarea
                    id="description_ar"
                    value={form.description_ar}
                    onChange={(e) => handleChange('description_ar', e.target.value)}
                    dir="rtl"
                    rows={2}
                  />
                </div>

                {/* Active toggle */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">{t('admin.active', 'Active')}</Label>
                  <Switch
                    id="is_active"
                    checked={form.is_active}
                    onCheckedChange={(checked) => handleChange('is_active', checked)}
                  />
                </div>

                {/* SEO Section */}
                <SEOSection
                  data={{
                    seo_title_en: form.seo_title_en,
                    seo_title_ar: form.seo_title_ar,
                    seo_description_en: form.seo_description_en,
                    seo_description_ar: form.seo_description_ar,
                  }}
                  onChange={(field, value) => handleChange(field, value)}
                  referenceData={{
                    name_en: form.name,
                    name_ar: form.name_ar,
                    slug: form.slug,
                    description_en: form.description_en,
                    description_ar: form.description_ar,
                  }}
                  entityType="brand"
                />
              </div>
            </form>
          </ScrollArea>
          <DialogFooter className="flex-shrink-0 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleCloseDialog}>
              {t('admin.cancel', 'Cancel')}
            </Button>
            <Button type="submit" form="brand-form" disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingBrand ? t('admin.update', 'Update') : t('admin.create', 'Create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.deleteBrand', 'Delete Brand')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.deleteBrandDesc', 'Are you sure you want to delete this brand?')}
              <br />
              <strong>{editingBrand?.name}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('admin.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => editingBrand && deleteMutation.mutate(editingBrand.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t('admin.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

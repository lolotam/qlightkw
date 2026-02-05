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
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  FolderTree,
  Pencil,
  Trash2,
  ChevronRight,
  Loader2,
  Sparkles,
} from 'lucide-react';
import ImageUploader from '@/components/admin/ImageUploader';
import SEOSection from '@/components/admin/SEOSection';
import { ScrollArea } from '@/components/ui/scroll-area';

// Category type
interface Category {
  id: string;
  parent_id: string | null;
  name_en: string;
  name_ar: string;
  slug: string;
  description_en: string | null;
  description_ar: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  seo_title_en?: string | null;
  seo_title_ar?: string | null;
  seo_description_en?: string | null;
  seo_description_ar?: string | null;
}

// Form state type
interface CategoryForm {
  name_en: string;
  name_ar: string;
  slug: string;
  description_en: string;
  description_ar: string;
  image_url: string;
  parent_id: string | null;
  is_active: boolean;
  seo_title_en: string;
  seo_title_ar: string;
  seo_description_en: string;
  seo_description_ar: string;
}

const emptyForm: CategoryForm = {
  name_en: '',
  name_ar: '',
  slug: '',
  description_en: '',
  description_ar: '',
  image_url: '',
  parent_id: null,
  is_active: true,
  seo_title_en: '',
  seo_title_ar: '',
  seo_description_en: '',
  seo_description_ar: '',
};

export default function CategoriesPage() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isRTL = i18n.language === 'ar';
  const [searchParams, setSearchParams] = useSearchParams();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [generatingDescription, setGeneratingDescription] = useState(false);

  // Generate descriptions using AI
  const generateDescriptions = async () => {
    const nameEn = form.name_en;
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
      const prompt = `Generate product category descriptions for an e-commerce lighting store.

Category Name (English): ${nameEn || 'N/A'}
Category Name (Arabic): ${nameAr || 'N/A'}

Generate compelling, SEO-friendly descriptions for this category. The descriptions should:
- Be 2-3 sentences long
- Highlight the types of products in this category
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

      // Check if the API call succeeded
      if (!result?.success) {
        throw new Error(result?.error || 'AI generation failed');
      }

      const responseContent = result?.text || result?.content;
      
      // Handle empty response from AI
      if (!responseContent || responseContent.trim() === '') {
        throw new Error(
          isRTL 
            ? 'نموذج الذكاء الاصطناعي أرجع استجابة فارغة. يرجى التحقق من إعدادات الذكاء الاصطناعي أو تجربة نموذج مختلف.'
            : 'AI model returned empty response. Please check AI settings or try a different model.'
        );
      }

      let descData: { description_en?: string; description_ar?: string };
      
      if (typeof responseContent === 'string') {
        let cleanedContent = responseContent
          .replace(/```json\s*/gi, '')
          .replace(/```\s*/g, '')
          .trim();
        
        const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            descData = JSON.parse(jsonMatch[0]);
          } catch (parseError) {
            console.error('Failed to parse AI response as JSON:', cleanedContent);
            throw new Error(
              isRTL
                ? 'فشل في تحليل استجابة الذكاء الاصطناعي. يرجى المحاولة مرة أخرى.'
                : 'Failed to parse AI response. Please try again.'
            );
          }
        } else {
          throw new Error('Invalid response format - no JSON found');
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
      setEditingCategory(null);
      setForm(emptyForm);
      setDialogOpen(true);
      // Clear the action param
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Fetch categories
  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: CategoryForm & { id?: string }) => {
      const categoryData = {
        name_en: data.name_en,
        name_ar: data.name_ar,
        slug: data.slug,
        description_en: data.description_en || null,
        description_ar: data.description_ar || null,
        image_url: data.image_url || null,
        parent_id: data.parent_id,
        is_active: data.is_active,
        seo_title_en: data.seo_title_en || null,
        seo_title_ar: data.seo_title_ar || null,
        seo_description_en: data.seo_description_en || null,
        seo_description_ar: data.seo_description_ar || null,
      };

      if (data.id) {
        // Update
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', data.id);
        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase.from('categories').insert(categoryData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast({
        title: editingCategory
          ? t('admin.categoryUpdated', 'Category updated')
          : t('admin.categoryCreated', 'Category created'),
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
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast({ title: t('admin.categoryDeleted', 'Category deleted') });
      setDeleteDialogOpen(false);
      setEditingCategory(null);
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
  const handleChange = (field: keyof CategoryForm, value: string | boolean | null) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      // Auto-generate slug from English name
      if (field === 'name_en' && typeof value === 'string') {
        updated.slug = generateSlug(value);
      }
      return updated;
    });
  };

  // Open dialog for editing
  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setForm({
      name_en: category.name_en,
      name_ar: category.name_ar,
      slug: category.slug,
      description_en: category.description_en || '',
      description_ar: category.description_ar || '',
      image_url: category.image_url || '',
      parent_id: category.parent_id,
      is_active: category.is_active,
      seo_title_en: category.seo_title_en || '',
      seo_title_ar: category.seo_title_ar || '',
      seo_description_en: category.seo_description_en || '',
      seo_description_ar: category.seo_description_ar || '',
    });
    setDialogOpen(true);
  };

  // Open dialog for new category
  const handleAdd = (parentId: string | null = null) => {
    setEditingCategory(null);
    setForm({ ...emptyForm, parent_id: parentId });
    setDialogOpen(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCategory(null);
    setForm(emptyForm);
  };

  // Submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      ...form,
      id: editingCategory?.id,
    });
  };

  // Build category tree
  const buildTree = (parentId: string | null = null): Category[] => {
    return (categories || []).filter((cat) => cat.parent_id === parentId);
  };

  // Render category item with children
  const renderCategory = (category: Category, level: number = 0) => {
    const children = buildTree(category.id);

    return (
      <div key={category.id}>
        <div
          className={`flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors ${
            level > 0 ? (isRTL ? 'mr-6 border-r-2 pr-4' : 'ml-6 border-l-2 pl-4') + ' border-muted' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <FolderTree className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">
                {isRTL ? category.name_ar : category.name_en}
              </p>
              <p className="text-sm text-muted-foreground">
                {category.slug}
              </p>
            </div>
            <Badge variant={category.is_active ? 'default' : 'secondary'}>
              {category.is_active ? t('admin.active', 'Active') : t('admin.inactive', 'Inactive')}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAdd(category.id)}
              title={t('admin.addSubcategory', 'Add subcategory')}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(category)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditingCategory(category);
                setDeleteDialogOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
        {children.length > 0 && (
          <div className="mt-1">
            {children.map((child) => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const rootCategories = buildTree(null);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('admin.categories', 'Categories')}
          </h1>
          <p className="text-muted-foreground">
            {t('admin.categoriesDescription', 'Organize your products into categories')}
          </p>
        </div>
        <Button onClick={() => handleAdd()} className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t('admin.addCategory', 'Add Category')}
        </Button>
      </div>

      {/* Categories tree */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="h-5 w-5" />
            {t('admin.categoryTree', 'Category Tree')}
            {categories && (
              <Badge variant="secondary" className="ml-2">
                {categories.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : rootCategories.length === 0 ? (
            <div className="text-center py-12">
              <FolderTree className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {t('admin.noCategories', 'No categories yet')}
              </h3>
              <p className="text-muted-foreground mb-4">
                {t('admin.noCategoriesDesc', 'Start by creating your first category.')}
              </p>
              <Button onClick={() => handleAdd()} className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('admin.addCategory', 'Add Category')}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {rootCategories.map((cat) => renderCategory(cat))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg h-[90vh] max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              {editingCategory
                ? t('admin.editCategory', 'Edit Category')
                : t('admin.addCategory', 'Add Category')}
            </DialogTitle>
            <DialogDescription>
              {t('admin.categoryFormDesc', 'Fill in the category details below.')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <ScrollArea type="always" className="flex-1 min-h-0 -mx-6 px-6">
              <div className="space-y-4 py-4 pr-4">
                {/* English Name */}
                <div className="space-y-2">
                  <Label htmlFor="name_en">{t('admin.nameEn', 'Name (English)')} *</Label>
                  <Input
                    id="name_en"
                    value={form.name_en}
                    onChange={(e) => handleChange('name_en', e.target.value)}
                    required
                  />
                </div>

                {/* Arabic Name */}
                <div className="space-y-2">
                  <Label htmlFor="name_ar">{t('admin.nameAr', 'Name (Arabic)')} *</Label>
                  <Input
                    id="name_ar"
                    value={form.name_ar}
                    onChange={(e) => handleChange('name_ar', e.target.value)}
                    dir="rtl"
                    required
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

                {/* Parent Category */}
                <div className="space-y-2">
                  <Label htmlFor="parent_id">{t('admin.parentCategory', 'Parent Category')}</Label>
                  <select
                    id="parent_id"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.parent_id || ''}
                    onChange={(e) => handleChange('parent_id', e.target.value || null)}
                  >
                    <option value="">{t('admin.noParent', 'No parent (root category)')}</option>
                    {categories
                      ?.filter((cat) => cat.id !== editingCategory?.id)
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {isRTL ? cat.name_ar : cat.name_en}
                        </option>
                      ))}
                  </select>
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
                      disabled={generatingDescription || (!form.name_en && !form.name_ar)}
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

                {/* Category Image */}
                <div className="space-y-2">
                  <Label>{t('admin.categoryImage', 'Category Image')}</Label>
                  <ImageUploader
                    value={form.image_url}
                    onChange={(url) => handleChange('image_url', url)}
                    bucket="product-images"
                    folder="categories"
                    aspectRatio="landscape"
                    contextName={form.name_en}
                    contextType="category"
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
                    name_en: form.name_en,
                    name_ar: form.name_ar,
                    slug: form.slug,
                    description_en: form.description_en,
                    description_ar: form.description_ar,
                  }}
                  entityType="category"
                />
              </div>
            </ScrollArea>

            <DialogFooter className="flex-shrink-0 pt-4 border-t mt-4">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                {t('admin.cancel', 'Cancel')}
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editingCategory ? t('admin.update', 'Update') : t('admin.create', 'Create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.deleteCategory', 'Delete Category')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.deleteCategoryDesc', 'Are you sure? This will also affect any subcategories.')}
              <br />
              <strong>{editingCategory?.name_en}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('admin.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => editingCategory && deleteMutation.mutate(editingCategory.id)}
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

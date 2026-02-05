import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Save, Package, Sparkles, Wand2, ImageIcon, Search, Check, Cloud } from 'lucide-react';
import ProductImageGallery from '@/components/admin/ProductImageGallery';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface ProductForm {
  name_en: string;
  name_ar: string;
  slug: string;
  sku: string;
  description_en: string;
  description_ar: string;
  short_description_en: string;
  short_description_ar: string;
  base_price: string;
  sale_price: string;
  cost_price: string;
  stock_quantity: string;
  low_stock_threshold: string;
  category_id: string;
  brand_id: string;
  is_active: boolean;
  is_featured: boolean;
  is_new: boolean;
  is_bestseller: boolean;
  seo_title_en: string;
  seo_title_ar: string;
  seo_description_en: string;
  seo_description_ar: string;
}

const emptyForm: ProductForm = {
  name_en: '',
  name_ar: '',
  slug: '',
  sku: '',
  description_en: '',
  description_ar: '',
  short_description_en: '',
  short_description_ar: '',
  base_price: '0',
  sale_price: '',
  cost_price: '',
  stock_quantity: '0',
  low_stock_threshold: '5',
  category_id: '',
  brand_id: '',
  is_active: true,
  is_featured: false,
  is_new: true,
  is_bestseller: false,
  seo_title_en: '',
  seo_title_ar: '',
  seo_description_en: '',
  seo_description_ar: '',
};

export default function ProductFormPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isRTL = i18n.language === 'ar';
  const isEditing = Boolean(id);

  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [generatingShortDescEn, setGeneratingShortDescEn] = useState(false);
  const [generatingShortDescAr, setGeneratingShortDescAr] = useState(false);
  const [generatingSEO, setGeneratingSEO] = useState(false);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);
  
  // Auto-save state
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(true);

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories-select'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name_en, name_ar')
        .eq('is_active', true)
        .order('name_en');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch brands
  const { data: brands } = useQuery({
    queryKey: ['brands-select'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brands')
        .select('id, name, name_ar')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch product if editing
  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(id),
  });

  // Fetch product images if editing
  const { data: existingImages } = useQuery({
    queryKey: ['product-images', id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', id)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: Boolean(id),
  });

  // Set images when data loads
  useEffect(() => {
    if (existingImages && existingImages.length > 0) {
      setProductImages(existingImages.map(img => img.url));
      // Find the primary image index
      const primaryIdx = existingImages.findIndex(img => img.is_primary);
      setPrimaryImageIndex(primaryIdx >= 0 ? primaryIdx : 0);
    }
  }, [existingImages]);

  // Populate form when editing
  useEffect(() => {
    if (product) {
      setForm({
        name_en: product.name_en || '',
        name_ar: product.name_ar || '',
        slug: product.slug || '',
        sku: product.sku || '',
        description_en: product.description_en || '',
        description_ar: product.description_ar || '',
        short_description_en: product.short_description_en || '',
        short_description_ar: product.short_description_ar || '',
        base_price: String(product.base_price || 0),
        sale_price: product.sale_price ? String(product.sale_price) : '',
        cost_price: product.cost_price ? String(product.cost_price) : '',
        stock_quantity: String(product.stock_quantity || 0),
        low_stock_threshold: String(product.low_stock_threshold || 5),
        category_id: product.category_id || '',
        brand_id: product.brand_id || '',
        is_active: product.is_active ?? true,
        is_featured: product.is_featured ?? false,
        is_new: product.is_new ?? false,
        is_bestseller: product.is_bestseller ?? false,
        seo_title_en: product.seo_title_en || '',
        seo_title_ar: product.seo_title_ar || '',
        seo_description_en: product.seo_description_en || '',
        seo_description_ar: product.seo_description_ar || '',
      });
      // Mark initial load complete after form is populated
      setTimeout(() => {
        initialLoadRef.current = false;
      }, 500);
    }
  }, [product]);

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  // Auto-save function (only for editing existing products)
  const performAutoSave = useCallback(async (
    currentForm: ProductForm,
    currentImages: string[],
    currentPrimaryIndex: number
  ) => {
    // Only auto-save when editing and form has required fields
    if (!isEditing || !id || !currentForm.name_en.trim() || !currentForm.name_ar.trim() || !currentForm.slug.trim()) {
      return;
    }

    setAutoSaveStatus('saving');

    try {
      const productData = {
        name_en: currentForm.name_en,
        name_ar: currentForm.name_ar,
        slug: currentForm.slug,
        sku: currentForm.sku || null,
        description_en: currentForm.description_en || null,
        description_ar: currentForm.description_ar || null,
        short_description_en: currentForm.short_description_en || null,
        short_description_ar: currentForm.short_description_ar || null,
        base_price: parseFloat(currentForm.base_price) || 0,
        sale_price: currentForm.sale_price ? parseFloat(currentForm.sale_price) : null,
        cost_price: currentForm.cost_price ? parseFloat(currentForm.cost_price) : null,
        stock_quantity: parseInt(currentForm.stock_quantity) || 0,
        low_stock_threshold: parseInt(currentForm.low_stock_threshold) || 5,
        category_id: currentForm.category_id || null,
        brand_id: currentForm.brand_id || null,
        is_active: currentForm.is_active,
        is_featured: currentForm.is_featured,
        is_new: currentForm.is_new,
        is_bestseller: currentForm.is_bestseller,
        seo_title_en: currentForm.seo_title_en || null,
        seo_title_ar: currentForm.seo_title_ar || null,
        seo_description_en: currentForm.seo_description_en || null,
        seo_description_ar: currentForm.seo_description_ar || null,
      };

      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', id);

      if (error) throw error;

      // Always save images (even if empty - this clears old images)
      await supabase.from('product_images').delete().eq('product_id', id);
      
      if (currentImages.length > 0) {
        const imageRecords = currentImages.map((url, index) => ({
          product_id: id,
          url,
          is_primary: index === currentPrimaryIndex,
          sort_order: index,
        }));

        const { error: imgError } = await supabase.from('product_images').insert(imageRecords);
        if (imgError) throw imgError;
      }

      setAutoSaveStatus('saved');
      setHasUnsavedChanges(false);
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setAutoSaveStatus('idle');
      }, 3000);

    } catch (error) {
      console.error('Auto-save error:', error);
      setAutoSaveStatus('error');
      // Reset error status after 5 seconds
      setTimeout(() => {
        setAutoSaveStatus('idle');
      }, 5000);
    }
  }, [isEditing, id]);

  // Debounced auto-save effect - triggers 2 seconds after last change
  useEffect(() => {
    // Skip during initial load or if not editing
    if (initialLoadRef.current || !isEditing) return;

    setHasUnsavedChanges(true);

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Capture current values to avoid stale closures
    const currentForm = form;
    const currentImages = productImages;
    const currentPrimaryIndex = primaryImageIndex;

    // Set new timer for auto-save
    autoSaveTimerRef.current = setTimeout(() => {
      performAutoSave(currentForm, currentImages, currentPrimaryIndex);
    }, 2000); // 2 second debounce

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [form, productImages, primaryImageIndex, isEditing, performAutoSave]);

  // Generate description with AI
  const generateDescription = async () => {
    if (!form.name_en) {
      toast({
        variant: 'destructive',
        title: t('admin.error', 'Error'),
        description: t('admin.enterProductName', 'Please enter a product name first'),
      });
      return;
    }

    setGeneratingDescription(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-content', {
        body: {
          type: 'text',
          productName: form.name_en,
          category: categories?.find(c => c.id === form.category_id)?.name_en,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      // Update form with generated description
      setForm((prev) => ({
        ...prev,
        description_en: data.text,
      }));

      toast({
        title: t('admin.descriptionGenerated', 'Description generated'),
        description: t('admin.reviewDescription', 'Please review and edit as needed'),
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('admin.aiError', 'AI Generation Error'),
        description: error.message || t('admin.aiErrorDesc', 'Failed to generate description'),
      });
    } finally {
      setGeneratingDescription(false);
    }
  };

  // Generate short description with AI
  const generateShortDescription = async (lang: 'en' | 'ar') => {
    if (!form.name_en) {
      toast({
        variant: 'destructive',
        title: t('admin.error', 'Error'),
        description: t('admin.enterProductName', 'Please enter a product name first'),
      });
      return;
    }

    if (lang === 'en') setGeneratingShortDescEn(true);
    else setGeneratingShortDescAr(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-content', {
        body: {
          type: 'text',
          prompt: `Generate a short, compelling product description (2-3 sentences max) ${lang === 'ar' ? 'in Arabic' : 'in English'} for a lighting product named "${form.name_en}"${form.name_ar ? ` (Arabic name: "${form.name_ar}")` : ''}. 
          
${form.description_en ? `Full description for context: "${form.description_en.substring(0, 500)}"` : ''}

The short description should be concise, highlight key benefits, and be suitable for product listings. Respond with ONLY the short description, no explanations.`,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      const field = lang === 'en' ? 'short_description_en' : 'short_description_ar';
      setForm((prev) => ({
        ...prev,
        [field]: data.text.trim(),
      }));

      toast({
        title: t('admin.generated', 'Generated'),
        description: t('admin.shortDescGenerated', 'Short description generated'),
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('admin.aiError', 'AI Generation Error'),
        description: error.message || t('admin.aiErrorDesc', 'Failed to generate content'),
      });
    } finally {
      if (lang === 'en') setGeneratingShortDescEn(false);
      else setGeneratingShortDescAr(false);
    }
  };

  // Generate SEO content with AI
  const generateSEO = async () => {
    if (!form.name_en || !form.name_ar) {
      toast({
        variant: 'destructive',
        title: t('admin.error', 'Error'),
        description: t('admin.enterProductNames', 'Please enter product names in both languages first'),
      });
      return;
    }

    setGeneratingSEO(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-content', {
        body: {
          type: 'text',
          prompt: `Generate SEO optimized content for a lighting product. Return a JSON object with these exact keys:
- seo_title_en: SEO title in English (max 60 characters)
- seo_title_ar: SEO title in Arabic (max 60 characters)
- seo_description_en: SEO meta description in English (max 160 characters)
- seo_description_ar: SEO meta description in Arabic (max 160 characters)

Product Information:
- English Name: "${form.name_en}"
- Arabic Name: "${form.name_ar}"
${form.description_en ? `- English Description: "${form.description_en.substring(0, 300)}"` : ''}
${form.description_ar ? `- Arabic Description: "${form.description_ar.substring(0, 300)}"` : ''}

The SEO content should:
- Include relevant keywords naturally
- Be compelling and encourage clicks
- Accurately describe the product
- Be optimized for search engines

Respond with ONLY the JSON object, no markdown, no explanations.`,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      // Get the text content from response
      const textContent = data.text || data.content || '';
      
      if (!textContent) {
        throw new Error('No content received from AI');
      }

      try {
        // Clean and parse the JSON response - handle various formats
        let cleanedText = textContent.trim();
        // Remove markdown code blocks
        cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/\n?```/g, '');
        // Find JSON object in text
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON object found in response');
        }
        
        const seoData = JSON.parse(jsonMatch[0]);
        
        setForm((prev) => ({
          ...prev,
          seo_title_en: seoData.seo_title_en || prev.seo_title_en,
          seo_title_ar: seoData.seo_title_ar || prev.seo_title_ar,
          seo_description_en: seoData.seo_description_en || prev.seo_description_en,
          seo_description_ar: seoData.seo_description_ar || prev.seo_description_ar,
        }));

        toast({
          title: t('admin.seoGenerated', 'SEO Generated'),
          description: t('admin.seoGeneratedDesc', 'SEO titles and descriptions have been generated'),
        });
      } catch (parseError) {
        console.error('Failed to parse SEO JSON:', parseError, 'Content:', textContent);
        throw new Error('Failed to parse AI response - please try again');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('admin.aiError', 'AI Generation Error'),
        description: error.message || t('admin.aiErrorDesc', 'Failed to generate SEO content'),
      });
    } finally {
      setGeneratingSEO(false);
    }
  };

  // Handle form field change
  const handleChange = (field: keyof ProductForm, value: string | boolean) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'name_en' && typeof value === 'string' && !isEditing) {
        updated.slug = generateSlug(value);
      }
      return updated;
    });
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const productData = {
        name_en: form.name_en,
        name_ar: form.name_ar,
        slug: form.slug,
        sku: form.sku || null,
        description_en: form.description_en || null,
        description_ar: form.description_ar || null,
        short_description_en: form.short_description_en || null,
        short_description_ar: form.short_description_ar || null,
        base_price: parseFloat(form.base_price) || 0,
        sale_price: form.sale_price ? parseFloat(form.sale_price) : null,
        cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
        stock_quantity: parseInt(form.stock_quantity) || 0,
        low_stock_threshold: parseInt(form.low_stock_threshold) || 5,
        category_id: form.category_id || null,
        brand_id: form.brand_id || null,
        is_active: form.is_active,
        is_featured: form.is_featured,
        is_new: form.is_new,
        is_bestseller: form.is_bestseller,
        seo_title_en: form.seo_title_en || null,
        seo_title_ar: form.seo_title_ar || null,
        seo_description_en: form.seo_description_en || null,
        seo_description_ar: form.seo_description_ar || null,
      };

      let productId = id;

      if (isEditing && id) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert(productData)
          .select('id')
          .single();
        if (error) throw error;
        productId = data.id;
      }

      // Save product images
      if (productId && productImages.length > 0) {
        // Delete existing images first
        await supabase
          .from('product_images')
          .delete()
          .eq('product_id', productId);

        // Insert new images
        const imageRecords = productImages.map((url, index) => ({
          product_id: productId,
          url,
          is_primary: index === primaryImageIndex,
          sort_order: index,
        }));

        const { error: imgError } = await supabase
          .from('product_images')
          .insert(imageRecords);
        
        if (imgError) throw imgError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['product-images'] });
      toast({
        title: isEditing
          ? t('admin.productUpdated', 'Product updated successfully')
          : t('admin.productCreated', 'Product created successfully'),
      });
      navigate('/admin/products');
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: t('admin.error', 'Error'),
        description: error.message,
      });
    },
  });

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!form.name_en.trim()) {
      toast({
        variant: 'destructive',
        title: t('admin.validationError', 'Validation Error'),
        description: t('admin.nameEnRequired', 'English name is required'),
      });
      return;
    }
    if (!form.name_ar.trim()) {
      toast({
        variant: 'destructive',
        title: t('admin.validationError', 'Validation Error'),
        description: t('admin.nameArRequired', 'Arabic name is required'),
      });
      return;
    }
    if (!form.slug.trim()) {
      toast({
        variant: 'destructive',
        title: t('admin.validationError', 'Validation Error'),
        description: t('admin.slugRequired', 'Slug is required'),
      });
      return;
    }

    saveMutation.mutate();
  };

  if (productLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header with auto-save indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/products')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isEditing ? t('admin.editProduct', 'Edit Product') : t('admin.addProduct', 'Add Product')}
            </h1>
            <p className="text-muted-foreground">
              {isEditing
                ? t('admin.editProductDesc', 'Update product information')
                : t('admin.addProductDesc', 'Create a new product for your store')}
            </p>
          </div>
        </div>
        
        {/* Auto-save status indicator - only show when editing */}
        {isEditing && (
          <div className="flex items-center gap-2">
            {autoSaveStatus === 'saving' && (
              <Badge variant="secondary" className="gap-1.5 animate-pulse">
                <Cloud className="h-3 w-3" />
                {t('admin.saving', 'Saving...')}
              </Badge>
            )}
            {autoSaveStatus === 'saved' && (
              <Badge variant="secondary" className="gap-1.5 text-green-600 dark:text-green-400">
                <Check className="h-3 w-3" />
                {t('admin.autoSaved', 'Auto-saved')}
              </Badge>
            )}
            {autoSaveStatus === 'error' && (
              <Badge variant="destructive" className="gap-1.5">
                {t('admin.saveFailed', 'Save failed')}
              </Badge>
            )}
            {hasUnsavedChanges && autoSaveStatus === 'idle' && (
              <Badge variant="outline" className="gap-1.5 text-muted-foreground">
                {t('admin.unsavedChanges', 'Unsaved changes')}
              </Badge>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {t('admin.basicInfo', 'Basic Information')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Name English */}
                <div className="space-y-2">
                  <Label htmlFor="name_en">{t('admin.nameEn', 'Name (English)')} *</Label>
                  <Input
                    id="name_en"
                    value={form.name_en}
                    onChange={(e) => handleChange('name_en', e.target.value)}
                    placeholder="Product name in English"
                  />
                </div>

                {/* Name Arabic */}
                <div className="space-y-2">
                  <Label htmlFor="name_ar">{t('admin.nameAr', 'Name (Arabic)')} *</Label>
                  <Input
                    id="name_ar"
                    value={form.name_ar}
                    onChange={(e) => handleChange('name_ar', e.target.value)}
                    dir="rtl"
                    placeholder="اسم المنتج بالعربية"
                  />
                </div>

                {/* Slug */}
                <div className="space-y-2">
                  <Label htmlFor="slug">{t('admin.slug', 'URL Slug')} *</Label>
                  <Input
                    id="slug"
                    value={form.slug}
                    onChange={(e) => handleChange('slug', e.target.value)}
                    placeholder="product-url-slug"
                  />
                </div>

                {/* SKU */}
                <div className="space-y-2">
                  <Label htmlFor="sku">{t('admin.sku', 'SKU')}</Label>
                  <Input
                    id="sku"
                    value={form.sku}
                    onChange={(e) => handleChange('sku', e.target.value)}
                    placeholder="ABC-123"
                  />
                </div>

                {/* Short Description English */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="short_description_en">{t('admin.shortDescriptionEn', 'Short Description (English)')}</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => generateShortDescription('en')}
                      disabled={generatingShortDescEn || !form.name_en}
                      className="gap-1"
                    >
                      {generatingShortDescEn ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3" />
                      )}
                      {t('admin.generateWithAI', 'Generate with AI')}
                    </Button>
                  </div>
                  <Textarea
                    id="short_description_en"
                    value={form.short_description_en}
                    onChange={(e) => handleChange('short_description_en', e.target.value)}
                    rows={2}
                  />
                </div>

                {/* Short Description Arabic */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="short_description_ar">{t('admin.shortDescriptionAr', 'Short Description (Arabic)')}</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => generateShortDescription('ar')}
                      disabled={generatingShortDescAr || !form.name_en}
                      className="gap-1"
                    >
                      {generatingShortDescAr ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3" />
                      )}
                      {t('admin.generateWithAI', 'Generate with AI')}
                    </Button>
                  </div>
                  <Textarea
                    id="short_description_ar"
                    value={form.short_description_ar}
                    onChange={(e) => handleChange('short_description_ar', e.target.value)}
                    dir="rtl"
                    rows={2}
                  />
                </div>

                {/* Description English */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="description_en">{t('admin.descriptionEn', 'Description (English)')}</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateDescription}
                      disabled={generatingDescription || !form.name_en}
                      className="gap-1"
                    >
                      {generatingDescription ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3" />
                      )}
                      {t('admin.generateWithAI', 'Generate with AI')}
                    </Button>
                  </div>
                  <Textarea
                    id="description_en"
                    value={form.description_en}
                    onChange={(e) => handleChange('description_en', e.target.value)}
                    rows={4}
                    placeholder={generatingDescription ? t('admin.generating', 'Generating...') : ''}
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
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pricing & Stock */}
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.pricingStock', 'Pricing & Stock')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  {/* Base Price */}
                  <div className="space-y-2">
                    <Label htmlFor="base_price">{t('admin.basePrice', 'Base Price')} (KWD) *</Label>
                    <Input
                      id="base_price"
                      type="number"
                      step="0.001"
                      min="0"
                      value={form.base_price}
                      onChange={(e) => handleChange('base_price', e.target.value)}
                    />
                  </div>

                  {/* Sale Price */}
                  <div className="space-y-2">
                    <Label htmlFor="sale_price">{t('admin.salePrice', 'Sale Price')} (KWD)</Label>
                    <Input
                      id="sale_price"
                      type="number"
                      step="0.001"
                      min="0"
                      value={form.sale_price}
                      onChange={(e) => handleChange('sale_price', e.target.value)}
                      placeholder="Leave empty if no sale"
                    />
                  </div>

                  {/* Cost Price */}
                  <div className="space-y-2">
                    <Label htmlFor="cost_price">{t('admin.costPrice', 'Cost Price')} (KWD)</Label>
                    <Input
                      id="cost_price"
                      type="number"
                      step="0.001"
                      min="0"
                      value={form.cost_price}
                      onChange={(e) => handleChange('cost_price', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Stock Quantity */}
                  <div className="space-y-2">
                    <Label htmlFor="stock_quantity">{t('admin.stockQuantity', 'Stock Quantity')}</Label>
                    <Input
                      id="stock_quantity"
                      type="number"
                      min="0"
                      value={form.stock_quantity}
                      onChange={(e) => handleChange('stock_quantity', e.target.value)}
                    />
                  </div>

                  {/* Low Stock Threshold */}
                  <div className="space-y-2">
                    <Label htmlFor="low_stock_threshold">{t('admin.lowStockThreshold', 'Low Stock Threshold')}</Label>
                    <Input
                      id="low_stock_threshold"
                      type="number"
                      min="0"
                      value={form.low_stock_threshold}
                      onChange={(e) => handleChange('low_stock_threshold', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SEO */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Search className="h-5 w-5" />
                      {t('admin.seo', 'SEO Settings')}
                    </CardTitle>
                    <CardDescription>{t('admin.seoDesc', 'Search engine optimization settings')}</CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateSEO}
                    disabled={generatingSEO || !form.name_en || !form.name_ar}
                    className="gap-2"
                  >
                    {generatingSEO ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {t('admin.generateAllSEO', 'Generate All SEO')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="seo_title_en">{t('admin.seoTitleEn', 'SEO Title (English)')}</Label>
                    <Input
                      id="seo_title_en"
                      value={form.seo_title_en}
                      onChange={(e) => handleChange('seo_title_en', e.target.value)}
                      maxLength={60}
                    />
                    <p className="text-xs text-muted-foreground">{form.seo_title_en.length}/60</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seo_title_ar">{t('admin.seoTitleAr', 'SEO Title (Arabic)')}</Label>
                    <Input
                      id="seo_title_ar"
                      value={form.seo_title_ar}
                      onChange={(e) => handleChange('seo_title_ar', e.target.value)}
                      dir="rtl"
                      maxLength={60}
                    />
                    <p className="text-xs text-muted-foreground">{form.seo_title_ar.length}/60</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="seo_description_en">{t('admin.seoDescEn', 'SEO Description (English)')}</Label>
                    <Textarea
                      id="seo_description_en"
                      value={form.seo_description_en}
                      onChange={(e) => handleChange('seo_description_en', e.target.value)}
                      rows={2}
                      maxLength={160}
                    />
                    <p className="text-xs text-muted-foreground">{form.seo_description_en.length}/160</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seo_description_ar">{t('admin.seoDescAr', 'SEO Description (Arabic)')}</Label>
                    <Textarea
                      id="seo_description_ar"
                      value={form.seo_description_ar}
                      onChange={(e) => handleChange('seo_description_ar', e.target.value)}
                      dir="rtl"
                      rows={2}
                      maxLength={160}
                    />
                    <p className="text-xs text-muted-foreground">{form.seo_description_ar.length}/160</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Images */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  {t('admin.productImages', 'Product Images')}
                </CardTitle>
                <CardDescription>
                  {t('admin.productImagesDesc', 'Upload or generate product images. Click on an image to set it as primary.')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProductImageGallery
                  images={productImages}
                  primaryIndex={primaryImageIndex}
                  onImagesChange={setProductImages}
                  onPrimaryChange={setPrimaryImageIndex}
                  contextName={form.name_en}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publish */}
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.publish', 'Publish')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">{t('admin.active', 'Active')}</Label>
                  <Switch
                    id="is_active"
                    checked={form.is_active}
                    onCheckedChange={(checked) => handleChange('is_active', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_featured">{t('admin.featured', 'Featured')}</Label>
                  <Switch
                    id="is_featured"
                    checked={form.is_featured}
                    onCheckedChange={(checked) => handleChange('is_featured', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_new">{t('admin.new', 'New')}</Label>
                  <Switch
                    id="is_new"
                    checked={form.is_new}
                    onCheckedChange={(checked) => handleChange('is_new', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_bestseller">{t('admin.bestseller', 'Bestseller')}</Label>
                  <Switch
                    id="is_bestseller"
                    checked={form.is_bestseller}
                    onCheckedChange={(checked) => handleChange('is_bestseller', checked)}
                  />
                </div>

                <div className="pt-4 border-t">
                  <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {isEditing ? t('admin.updateProduct', 'Update Product') : t('admin.saveProduct', 'Save Product')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Category */}
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.category', 'Category')}</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={form.category_id}
                  onValueChange={(value) => handleChange('category_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('admin.selectCategory', 'Select category')} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {isRTL ? cat.name_ar : cat.name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Brand */}
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.brand', 'Brand')}</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={form.brand_id}
                  onValueChange={(value) => handleChange('brand_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('admin.selectBrand', 'Select brand')} />
                  </SelectTrigger>
                  <SelectContent>
                    {brands?.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {isRTL && brand.name_ar ? brand.name_ar : brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

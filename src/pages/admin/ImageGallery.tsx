import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
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
import {
  Image as ImageIcon,
  Upload,
  Trash2,
  Copy,
  Check,
  Search,
  RefreshCw,
  FolderOpen,
  FileImage,
  ChevronLeft,
  Folder,
  Package,
  Tag,
  Layers,
  Home,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

// Folder structure configuration
const FOLDERS = [
  { name: 'products', label_en: 'Products', label_ar: 'المنتجات', icon: Package },
  { name: 'categories', label_en: 'Categories', label_ar: 'الفئات', icon: Layers },
  { name: 'brands', label_en: 'Brands', label_ar: 'العلامات التجارية', icon: Tag },
  { name: 'projects', label_en: 'Projects', label_ar: 'المشاريع', icon: Home },
  { name: 'posts', label_en: 'Blog Posts', label_ar: 'المقالات', icon: FileText },
];

interface GalleryImage {
  id: string;
  url: string;
  entityId: string;
  entityName: string;
  entityNameAr?: string;
  entityType: string;
  isPrimary?: boolean;
  createdAt: string;
}

export default function AdminImageGallery() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isRTL = i18n.language === 'ar';

  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GalleryImage | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch product images with product details
  const { data: productImages = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['gallery-product-images'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_images')
        .select(`
          id,
          url,
          is_primary,
          created_at,
          product_id,
          products (
            id,
            name_en,
            name_ar,
            slug
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map((img: any) => ({
        id: img.id,
        url: img.url,
        entityId: img.product_id,
        entityName: img.products?.name_en || 'Unknown Product',
        entityNameAr: img.products?.name_ar,
        entityType: 'product',
        isPrimary: img.is_primary,
        createdAt: img.created_at,
        slug: img.products?.slug,
      }));
    },
    enabled: currentFolder === 'products' || currentFolder === null,
  });

  // Fetch category images
  const { data: categoryImages = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['gallery-category-images'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name_en, name_ar, image_url, slug, created_at')
        .not('image_url', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || [])
        .filter((cat: any) => cat.image_url)
        .map((cat: any) => ({
          id: cat.id,
          url: cat.image_url,
          entityId: cat.id,
          entityName: cat.name_en,
          entityNameAr: cat.name_ar,
          entityType: 'category',
          createdAt: cat.created_at,
          slug: cat.slug,
        }));
    },
    enabled: currentFolder === 'categories' || currentFolder === null,
  });

  // Fetch brand logos
  const { data: brandImages = [], isLoading: loadingBrands } = useQuery({
    queryKey: ['gallery-brand-images'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brands')
        .select('id, name, name_ar, logo_url, slug, created_at')
        .not('logo_url', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || [])
        .filter((brand: any) => brand.logo_url)
        .map((brand: any) => ({
          id: brand.id,
          url: brand.logo_url,
          entityId: brand.id,
          entityName: brand.name,
          entityNameAr: brand.name_ar,
          entityType: 'brand',
          createdAt: brand.created_at,
          slug: brand.slug,
        }));
    },
    enabled: currentFolder === 'brands' || currentFolder === null,
  });

  // Fetch project images with project details
  const { data: projectImages = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['gallery-project-images'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_images')
        .select(`
          id,
          url,
          is_primary,
          created_at,
          project_id,
          projects (
            id,
            title_en,
            title_ar,
            slug
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map((img: any) => ({
        id: img.id,
        url: img.url,
        entityId: img.project_id,
        entityName: img.projects?.title_en || 'Unknown Project',
        entityNameAr: img.projects?.title_ar,
        entityType: 'project',
        isPrimary: img.is_primary,
        createdAt: img.created_at,
        slug: img.projects?.slug,
      }));
    },
    enabled: currentFolder === 'projects' || currentFolder === null,
  });

  // Fetch blog post featured images
  const { data: blogImages = [], isLoading: loadingBlogs } = useQuery({
    queryKey: ['gallery-blog-images'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title_en, title_ar, featured_image_url, slug, created_at')
        .not('featured_image_url', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || [])
        .filter((post: any) => post.featured_image_url)
        .map((post: any) => ({
          id: post.id,
          url: post.featured_image_url,
          entityId: post.id,
          entityName: post.title_en,
          entityNameAr: post.title_ar,
          entityType: 'blog',
          createdAt: post.created_at,
          slug: post.slug,
        }));
    },
    enabled: currentFolder === 'posts' || currentFolder === null,
  });

  // Calculate folder counts
  const folderCounts = useMemo(() => ({
    products: productImages.length,
    categories: categoryImages.length,
    brands: brandImages.length,
    projects: projectImages.length,
    posts: blogImages.length,
  }), [productImages, categoryImages, brandImages, projectImages, blogImages]);

  // Get current folder images
  const currentImages = useMemo(() => {
    switch (currentFolder) {
      case 'products':
        return productImages;
      case 'categories':
        return categoryImages;
      case 'brands':
        return brandImages;
      case 'projects':
        return projectImages;
      case 'posts':
        return blogImages;
      default:
        return [];
    }
  }, [currentFolder, productImages, categoryImages, brandImages, projectImages, blogImages]);

  // Filter images by search
  const filteredImages = useMemo(() => {
    if (!searchQuery) return currentImages;
    const query = searchQuery.toLowerCase();
    return currentImages.filter(img => 
      img.entityName.toLowerCase().includes(query) ||
      img.entityNameAr?.toLowerCase().includes(query) ||
      img.url.toLowerCase().includes(query)
    );
  }, [currentImages, searchQuery]);

  // Check if loading
  const isLoading = loadingProducts || loadingCategories || loadingBrands || loadingProjects || loadingBlogs;

  // Copy URL to clipboard
  const copyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
    toast({
      title: isRTL ? 'تم النسخ' : 'Copied',
      description: isRTL ? 'تم نسخ الرابط' : 'URL copied to clipboard',
    });
  };

  // Get entity link based on type
  const getEntityLink = (image: GalleryImage) => {
    switch (image.entityType) {
      case 'product':
        return `/admin/products`;
      case 'category':
        return `/admin/categories`;
      case 'brand':
        return `/admin/brands`;
      case 'project':
        return `/admin/projects`;
      case 'blog':
        return `/admin/blog`;
      default:
        return '#';
    }
  };

  // Get entity type label
  const getEntityTypeLabel = (type: string) => {
    switch (type) {
      case 'product': return isRTL ? 'منتج' : 'Product';
      case 'category': return isRTL ? 'فئة' : 'Category';
      case 'brand': return isRTL ? 'علامة تجارية' : 'Brand';
      case 'project': return isRTL ? 'مشروع' : 'Project';
      case 'blog': return isRTL ? 'مقال' : 'Blog Post';
      default: return type;
    }
  };

  // Handle file upload
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const folder = currentFolder || 'products';
        const fileName = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const { error } = await supabase.storage
          .from('product-images')
          .upload(fileName, file);

        if (error) throw error;
      }

      toast({
        title: isRTL ? 'تم الرفع' : 'Uploaded',
        description: isRTL
          ? `تم رفع ${files.length} صورة بنجاح`
          : `${files.length} image(s) uploaded successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['gallery-product-images'] });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: isRTL ? 'خطأ في الرفع' : 'Upload Error',
        description: error.message,
      });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // Navigate to folder
  const navigateToFolder = (folderName: string) => {
    setCurrentFolder(folderName);
    setSearchQuery('');
  };

  // Navigate back
  const navigateBack = () => {
    setCurrentFolder(null);
    setSearchQuery('');
  };

  // Refetch all data
  const refetchAll = () => {
    queryClient.invalidateQueries({ queryKey: ['gallery-product-images'] });
    queryClient.invalidateQueries({ queryKey: ['gallery-category-images'] });
    queryClient.invalidateQueries({ queryKey: ['gallery-brand-images'] });
    queryClient.invalidateQueries({ queryKey: ['gallery-project-images'] });
    queryClient.invalidateQueries({ queryKey: ['gallery-blog-images'] });
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ImageIcon className="h-6 w-6 text-primary" />
            {t('admin.imageGallery.title', 'Image Gallery')}
          </h1>
          <p className="text-muted-foreground">
            {currentFolder 
              ? `${isRTL ? 'مجلد' : 'Folder'}: ${FOLDERS.find(f => f.name === currentFolder)?.[isRTL ? 'label_ar' : 'label_en'] || currentFolder}`
              : t('admin.imageGallery.description', 'View all images organized by type with linked entity details')}
          </p>
        </div>
        <div className="flex gap-2">
          {currentFolder && (
            <Button variant="outline" size="sm" onClick={navigateBack}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              {isRTL ? 'رجوع' : 'Back'}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={refetchAll}>
            <RefreshCw className="h-4 w-4 mr-1" />
            {t('common.refresh', 'Refresh')}
          </Button>
        </div>
      </div>

      {/* Search & Stats (only show when inside a folder) */}
      {currentFolder && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={isRTL ? 'ابحث بالاسم أو الرابط...' : 'Search by name or URL...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary" className="px-3 py-1">
              <FolderOpen className="h-3 w-3 mr-1" />
              {filteredImages.length} {isRTL ? 'صورة' : 'images'}
            </Badge>
          </div>
        </div>
      )}

      {/* Folder View (when no folder is selected) */}
      {!currentFolder && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {FOLDERS.map((folder, index) => {
            const IconComponent = folder.icon;
            return (
              <motion.div
                key={folder.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className="cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all group"
                  onClick={() => navigateToFolder(folder.name)}
                >
                  <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
                      <IconComponent className="h-8 w-8 text-primary" />
                    </div>
                    <p className="font-medium">
                      {isRTL ? folder.label_ar : folder.label_en}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {folderCounts[folder.name as keyof typeof folderCounts] ?? 0} {isRTL ? 'صورة' : 'images'}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Image Grid (when inside a folder) */}
      {currentFolder && (
        <>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array(12).fill(0).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          ) : filteredImages.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileImage className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery
                    ? (isRTL ? 'لم يتم العثور على صور' : 'No images found')
                    : (isRTL ? 'هذا المجلد فارغ' : 'This folder is empty')}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {isRTL 
                    ? 'أضف صورًا من صفحات إدارة المنتجات أو الفئات أو العلامات التجارية'
                    : 'Add images from Products, Categories, or Brands management pages'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredImages.map((image, index) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <Card className="group overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all">
                    <div
                      className="aspect-square relative bg-muted cursor-pointer"
                      onClick={() => setSelectedImage(image)}
                    >
                      <img
                        src={image.url}
                        alt={image.entityName}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                      {/* Primary badge */}
                      {'isPrimary' in image && image.isPrimary && (
                        <Badge className="absolute top-2 left-2 bg-primary">
                          {isRTL ? 'رئيسية' : 'Primary'}
                        </Badge>
                      )}
                      {/* Overlay actions */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyUrl(image.url);
                          }}
                        >
                          {copiedUrl === image.url ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="secondary"
                          asChild
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link to={getEntityLink(image)}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <p className="text-sm font-medium truncate">
                        {isRTL && image.entityNameAr ? image.entityNameAr : image.entityName}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <Badge variant="outline" className="text-xs">
                          {getEntityTypeLabel(image.entityType)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(image.createdAt).toLocaleDateString(isRTL ? 'ar' : 'en')}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedImage && (isRTL && selectedImage.entityNameAr ? selectedImage.entityNameAr : selectedImage?.entityName)}
              {selectedImage && selectedImage.isPrimary && (
                <Badge className="bg-primary">{isRTL ? 'رئيسية' : 'Primary'}</Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="flex flex-col gap-4">
              <img
                src={selectedImage.url}
                alt={selectedImage.entityName}
                className="max-h-[60vh] object-contain mx-auto rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
              
              {/* Image Details */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">{isRTL ? 'النوع' : 'Type'}</p>
                  <p className="font-medium">{getEntityTypeLabel(selectedImage.entityType)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{isRTL ? 'تاريخ الإضافة' : 'Added'}</p>
                  <p className="font-medium">
                    {new Date(selectedImage.createdAt).toLocaleDateString(isRTL ? 'ar' : 'en', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              {/* URL Display */}
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">{isRTL ? 'رابط الصورة' : 'Image URL'}</p>
                <p className="text-sm font-mono break-all">{selectedImage.url}</p>
              </div>

              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => copyUrl(selectedImage.url)}>
                  <Copy className="h-4 w-4 mr-1" />
                  {isRTL ? 'نسخ الرابط' : 'Copy URL'}
                </Button>
                <Button variant="outline" asChild>
                  <Link to={getEntityLink(selectedImage)}>
                    <ExternalLink className="h-4 w-4 mr-1" />
                    {isRTL ? 'عرض' : 'View'} {getEntityTypeLabel(selectedImage.entityType)}
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

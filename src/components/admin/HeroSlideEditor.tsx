import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { 
  Image, Video, Loader2, Save, Upload, FolderOpen, 
  Info, Monitor, Smartphone, X, Check, Search, RefreshCw 
} from 'lucide-react';

interface HeroSlide {
  id: string;
  title_en: string | null;
  title_ar: string | null;
  subtitle_en: string | null;
  subtitle_ar: string | null;
  button_text_en: string | null;
  button_text_ar: string | null;
  link_url: string | null;
  media_url: string;
  media_type: string;
  media_url_mobile: string | null;
  media_type_mobile: string | null;
  is_active: boolean;
  display_order: number;
}

interface StorageFile {
  name: string;
  id: string;
  created_at: string;
  bucket: string;
}

interface BucketInfo {
  id: string;
  name: string;
}

interface HeroSlideEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slide: HeroSlide | null;
  onSave: () => void;
}

const ASPECT_RATIO_GUIDANCE = {
  desktop: {
    recommended: '16:9 or 21:9',
    dimensions: '1920×1080 or 2560×1080',
    tip: 'Wide landscape format works best for desktop hero banners. Videos should be optimized for web (max 10MB).',
  },
  mobile: {
    recommended: '9:16 or 4:5',
    dimensions: '1080×1920 or 1080×1350',
    tip: 'Vertical or square format for mobile. Consider using shorter videos or static images for better performance.',
  },
};

export default function HeroSlideEditor({ open, onOpenChange, slide, onSave }: HeroSlideEditorProps) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [activeMediaTab, setActiveMediaTab] = useState<'desktop' | 'mobile'>('desktop');
  const [galleryImages, setGalleryImages] = useState<StorageFile[]>([]);
  const [buckets, setBuckets] = useState<BucketInfo[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<string>('all');
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [gallerySearch, setGallerySearch] = useState('');
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  
  // Form state
  const [form, setForm] = useState({
    title_en: '',
    title_ar: '',
    subtitle_en: '',
    subtitle_ar: '',
    button_text_en: 'Shop Now',
    button_text_ar: 'تسوق الآن',
    link_url: '/shop',
    media_url: '',
    media_type: 'image',
    media_url_mobile: '',
    media_type_mobile: 'image',
    is_active: true,
  });

  // Reset form when slide changes
  const resetForm = useCallback(() => {
    if (slide) {
      setForm({
        title_en: slide.title_en || '',
        title_ar: slide.title_ar || '',
        subtitle_en: slide.subtitle_en || '',
        subtitle_ar: slide.subtitle_ar || '',
        button_text_en: slide.button_text_en || 'Shop Now',
        button_text_ar: slide.button_text_ar || 'تسوق الآن',
        link_url: slide.link_url || '/shop',
        media_url: slide.media_url,
        media_type: slide.media_type,
        media_url_mobile: slide.media_url_mobile || '',
        media_type_mobile: slide.media_type_mobile || 'image',
        is_active: slide.is_active,
      });
    } else {
      setForm({
        title_en: '',
        title_ar: '',
        subtitle_en: '',
        subtitle_ar: '',
        button_text_en: 'Shop Now',
        button_text_ar: 'تسوق الآن',
        link_url: '/shop',
        media_url: '',
        media_type: 'image',
        media_url_mobile: '',
        media_type_mobile: 'image',
        is_active: true,
      });
    }
    setGallerySearch('');
  }, [slide]);

  // Initialize form when dialog opens or slide changes
  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open, slide, resetForm]);

  // Fetch files from Supabase Storage buckets
  const fetchGalleryImages = async () => {
    setGalleryLoading(true);
    try {
      const allFiles: StorageFile[] = [];
      const storageBuckets = ['hero-section'];
      
      for (const bucketName of storageBuckets) {
        const { data, error } = await supabase.storage
          .from(bucketName)
          .list('', { limit: 200, sortBy: { column: 'created_at', order: 'desc' } });
        
        if (!error && data) {
          const files = data
            .filter(f => !f.name.startsWith('.') && f.id)
            .map(f => ({
              name: f.name,
              id: f.id || f.name,
              created_at: f.created_at || '',
              bucket: bucketName,
            }));
          allFiles.push(...files);
        }
      }

      // Sort by created_at descending
      allFiles.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setBuckets(storageBuckets.map(b => ({ id: b, name: b.replace(/-/g, ' ') })));
      setGalleryImages(allFiles);
    } catch (error: any) {
      console.error('Gallery fetch error:', error);
      toast.error('Failed to load gallery');
    } finally {
      setGalleryLoading(false);
    }
  };

  // Get public URL for gallery file from Supabase Storage
  const getPublicUrl = (fileName: string, bucket: string) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return data.publicUrl;
  };

  // Handle file upload to Supabase Storage
  const handleFileUpload = async (files: FileList | null, target: 'desktop' | 'mobile') => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) {
      toast.error('Only images and videos are allowed');
      return;
    }

    const setUploading = target === 'desktop' ? setUploadingDesktop : setUploadingMobile;
    setUploading(true);

    try {
      // Generate unique filename
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const bucket = 'hero-section';

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
      const publicUrl = urlData.publicUrl;
      
      if (target === 'desktop') {
        setForm(prev => ({
          ...prev,
          media_url: publicUrl,
          media_type: isVideo ? 'video' : 'image',
        }));
      } else {
        setForm(prev => ({
          ...prev,
          media_url_mobile: publicUrl,
          media_type_mobile: isVideo ? 'video' : 'image',
        }));
      }

      toast.success('Media uploaded successfully');
      // Refresh gallery
      fetchGalleryImages();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  // Select from gallery
  const selectFromGallery = (file: StorageFile, target: 'desktop' | 'mobile') => {
    const url = getPublicUrl(file.name, file.bucket);
    const isVideo = file.name.match(/\.(mp4|webm|mov)$/i);

    if (target === 'desktop') {
      setForm(prev => ({
        ...prev,
        media_url: url,
        media_type: isVideo ? 'video' : 'image',
      }));
    } else {
      setForm(prev => ({
        ...prev,
        media_url_mobile: url,
        media_type_mobile: isVideo ? 'video' : 'image',
      }));
    }
    toast.success('Media selected from gallery');
  };

  // Save slide
  const handleSave = async () => {
    if (!form.media_url) {
      toast.error('Desktop media is required');
      return;
    }

    setSaving(true);
    try {
      if (slide) {
        // Update existing slide
        const { error } = await supabase
          .from('hero_slides')
          .update({
            title_en: form.title_en || null,
            title_ar: form.title_ar || null,
            subtitle_en: form.subtitle_en || null,
            subtitle_ar: form.subtitle_ar || null,
            button_text_en: form.button_text_en || null,
            button_text_ar: form.button_text_ar || null,
            link_url: form.link_url || null,
            media_url: form.media_url,
            media_type: form.media_type,
            media_url_mobile: form.media_url_mobile || null,
            media_type_mobile: form.media_type_mobile || null,
            is_active: form.is_active,
          })
          .eq('id', slide.id);

        if (error) throw error;
        toast.success('Slide updated successfully');
      } else {
        // Get max order
        const { data: slides } = await supabase
          .from('hero_slides')
          .select('display_order')
          .order('display_order', { ascending: false })
          .limit(1);

        const maxOrder = slides && slides.length > 0 ? slides[0].display_order : 0;

        // Create new slide
        const { error } = await supabase
          .from('hero_slides')
          .insert({
            title_en: form.title_en || null,
            title_ar: form.title_ar || null,
            subtitle_en: form.subtitle_en || null,
            subtitle_ar: form.subtitle_ar || null,
            button_text_en: form.button_text_en || null,
            button_text_ar: form.button_text_ar || null,
            link_url: form.link_url || null,
            media_url: form.media_url,
            media_type: form.media_type,
            media_url_mobile: form.media_url_mobile || null,
            media_type_mobile: form.media_type_mobile || null,
            is_active: form.is_active,
            display_order: maxOrder + 1,
          });

        if (error) throw error;
        toast.success('Slide created successfully');
      }

      onSave();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to save slide');
    } finally {
      setSaving(false);
    }
  };

  // Filtered gallery
  const filteredGallery = galleryImages.filter(img => {
    const matchesSearch = img.name.toLowerCase().includes(gallerySearch.toLowerCase());
    const matchesBucket = selectedBucket === 'all' || img.bucket === selectedBucket;
    return matchesSearch && matchesBucket;
  });

  // Render media preview
  const renderMediaPreview = (url: string, type: string, size: 'sm' | 'lg' = 'lg') => {
    if (!url) return null;
    const className = size === 'lg' ? 'w-full h-40 object-cover rounded-lg' : 'w-16 h-10 object-cover rounded';

    return type === 'video' ? (
      <video src={url} className={className} muted loop autoPlay playsInline />
    ) : (
      <img src={url} alt="Preview" className={className} onError={(e) => (e.currentTarget.src = '/placeholder.svg')} />
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {slide ? t('admin.themeBuilder.editSlide', 'Edit Slide') : t('admin.themeBuilder.addNewSlide', 'Add New Slide')}
          </DialogTitle>
          <DialogDescription>
            Configure slide content and media for desktop and mobile views
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Media Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Media Assets</Label>
              <Button variant="outline" size="sm" onClick={fetchGalleryImages}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Gallery
              </Button>
            </div>

            <Tabs value={activeMediaTab} onValueChange={(v) => setActiveMediaTab(v as 'desktop' | 'mobile')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="desktop" className="gap-2">
                  <Monitor className="h-4 w-4" />
                  Desktop
                  {form.media_url && <Check className="h-3 w-3 text-green-500" />}
                </TabsTrigger>
                <TabsTrigger value="mobile" className="gap-2">
                  <Smartphone className="h-4 w-4" />
                  Mobile (Optional)
                  {form.media_url_mobile && <Check className="h-3 w-3 text-green-500" />}
                </TabsTrigger>
              </TabsList>

              {/* Desktop Media Tab */}
              <TabsContent value="desktop" className="space-y-4">
                <Card className="border-dashed">
                  <CardContent className="p-4 space-y-4">
                    {/* Aspect Ratio Guidance */}
                    <TooltipProvider>
                      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                        <Info className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="text-sm">
                          <span className="font-medium">Desktop: </span>
                          <span className="text-muted-foreground">
                            {ASPECT_RATIO_GUIDANCE.desktop.recommended} ({ASPECT_RATIO_GUIDANCE.desktop.dimensions})
                          </span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 px-2 ml-1">
                                <Info className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              {ASPECT_RATIO_GUIDANCE.desktop.tip}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </TooltipProvider>

                    {/* Current Preview */}
                    {form.media_url && (
                      <div className="relative">
                        {renderMediaPreview(form.media_url, form.media_type)}
                        <div className="absolute top-2 right-2 flex gap-2">
                          <Badge variant="secondary">
                            {form.media_type === 'video' ? <Video className="h-3 w-3 mr-1" /> : <Image className="h-3 w-3 mr-1" />}
                            {form.media_type}
                          </Badge>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => setForm(prev => ({ ...prev, media_url: '', media_type: 'image' }))}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Upload / Gallery Tabs */}
                    <Tabs defaultValue={form.media_url ? "url" : "upload"}>
                      <TabsList className="w-full">
                        <TabsTrigger value="upload" className="flex-1">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload
                        </TabsTrigger>
                        <TabsTrigger value="gallery" className="flex-1" onClick={fetchGalleryImages}>
                          <FolderOpen className="h-4 w-4 mr-2" />
                          Gallery
                        </TabsTrigger>
                        <TabsTrigger value="url" className="flex-1">
                          URL
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="upload" className="space-y-3">
                        <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                          <Input
                            type="file"
                            accept="image/*,video/*"
                            className="hidden"
                            id="desktop-upload"
                            onChange={(e) => handleFileUpload(e.target.files, 'desktop')}
                          />
                          <Label htmlFor="desktop-upload" className="cursor-pointer">
                            {uploadingDesktop ? (
                              <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
                            ) : (
                              <>
                                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground">
                                  Click to upload or drag and drop
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Images (JPG, PNG, WebP) or Videos (MP4, WebM)
                                </p>
                              </>
                            )}
                          </Label>
                        </div>
                      </TabsContent>

                      <TabsContent value="gallery">
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Search gallery..."
                                value={gallerySearch}
                                onChange={(e) => setGallerySearch(e.target.value)}
                                className="pl-9"
                              />
                            </div>
                            <Select value={selectedBucket} onValueChange={setSelectedBucket}>
                              <SelectTrigger className="w-40">
                                <SelectValue placeholder="All buckets" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Buckets</SelectItem>
                                {buckets.map(b => (
                                  <SelectItem key={b.id} value={b.id}>
                                    {b.name.replace('-', ' ')}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <ScrollArea className="h-48">
                            {galleryLoading ? (
                              <div className="flex items-center justify-center h-full">
                                <Loader2 className="h-6 w-6 animate-spin" />
                              </div>
                            ) : filteredGallery.length === 0 ? (
                              <p className="text-center text-muted-foreground py-8">No media found</p>
                            ) : (
                              <div className="grid grid-cols-4 gap-2">
                                {filteredGallery.map((file) => {
                                  const url = getPublicUrl(file.name, file.bucket);
                                  const isVideo = file.name.match(/\.(mp4|webm|mov)$/i);
                                  const isSelected = form.media_url === url;
                                  return (
                                    <div
                                      key={`${file.bucket}-${file.id}`}
                                      className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                                        isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-muted-foreground/30'
                                      }`}
                                      onClick={() => selectFromGallery(file, 'desktop')}
                                    >
                                      {isVideo ? (
                                        <video src={url} className="w-full h-16 object-cover" muted preload="metadata" />
                                      ) : (
                                        <img src={url} alt={file.name} className="w-full h-16 object-cover" loading="lazy" />
                                      )}
                                      {isSelected && (
                                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                          <Check className="h-5 w-5 text-primary" />
                                        </div>
                                      )}
                                      <Badge className="absolute bottom-1 left-1 text-[8px] px-1 py-0 bg-black/60">
                                        {file.bucket.replace('-', ' ')}
                                      </Badge>
                                      {isVideo && (
                                        <Badge className="absolute bottom-1 right-1 text-[8px] px-1 py-0">
                                          <Video className="h-2 w-2" />
                                        </Badge>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </ScrollArea>
                        </div>
                      </TabsContent>

                      <TabsContent value="url" className="space-y-3">
                        <div className="space-y-2">
                          <Label>Media URL</Label>
                          <Input
                            placeholder="https://..."
                            value={form.media_url}
                            onChange={(e) => setForm(prev => ({ ...prev, media_url: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Media Type</Label>
                          <Select
                            value={form.media_type}
                            onValueChange={(v) => setForm(prev => ({ ...prev, media_type: v }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="image">Image</SelectItem>
                              <SelectItem value="video">Video</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Mobile Media Tab */}
              <TabsContent value="mobile" className="space-y-4">
                <Card className="border-dashed">
                  <CardContent className="p-4 space-y-4">
                    {/* Aspect Ratio Guidance */}
                    <TooltipProvider>
                      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                        <Info className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="text-sm">
                          <span className="font-medium">Mobile: </span>
                          <span className="text-muted-foreground">
                            {ASPECT_RATIO_GUIDANCE.mobile.recommended} ({ASPECT_RATIO_GUIDANCE.mobile.dimensions})
                          </span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 px-2 ml-1">
                                <Info className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              {ASPECT_RATIO_GUIDANCE.mobile.tip}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </TooltipProvider>

                    <p className="text-sm text-muted-foreground">
                      Optionally specify different media for mobile devices. If not set, desktop media will be used.
                    </p>

                    {/* Current Preview */}
                    {form.media_url_mobile && (
                      <div className="relative max-w-[200px] mx-auto">
                        {renderMediaPreview(form.media_url_mobile, form.media_type_mobile || 'image')}
                        <div className="absolute top-2 right-2 flex gap-2">
                          <Badge variant="secondary" className="text-[10px]">
                            {form.media_type_mobile === 'video' ? 'Video' : 'Image'}
                          </Badge>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-5 w-5"
                            onClick={() => setForm(prev => ({ ...prev, media_url_mobile: '', media_type_mobile: 'image' }))}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Upload / Gallery Tabs */}
                    <Tabs defaultValue="upload">
                      <TabsList className="w-full">
                        <TabsTrigger value="upload" className="flex-1">Upload</TabsTrigger>
                        <TabsTrigger value="gallery" className="flex-1" onClick={fetchGalleryImages}>Gallery</TabsTrigger>
                        <TabsTrigger value="url" className="flex-1">URL</TabsTrigger>
                      </TabsList>

                      <TabsContent value="upload">
                        <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                          <Input
                            type="file"
                            accept="image/*,video/*"
                            className="hidden"
                            id="mobile-upload"
                            onChange={(e) => handleFileUpload(e.target.files, 'mobile')}
                          />
                          <Label htmlFor="mobile-upload" className="cursor-pointer">
                            {uploadingMobile ? (
                              <Loader2 className="h-6 w-6 mx-auto animate-spin text-primary" />
                            ) : (
                              <>
                                <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                                <p className="text-xs text-muted-foreground">Upload mobile asset</p>
                              </>
                            )}
                          </Label>
                        </div>
                      </TabsContent>

                      <TabsContent value="gallery">
                        <ScrollArea className="h-32">
                          {galleryLoading ? (
                            <div className="flex items-center justify-center h-full">
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                          ) : filteredGallery.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4 text-xs">No media</p>
                          ) : (
                            <div className="grid grid-cols-5 gap-1">
                              {filteredGallery.map((file) => {
                                const url = getPublicUrl(file.name, file.bucket);
                                const isSelected = form.media_url_mobile === url;
                                return (
                                  <div
                                    key={`mobile-${file.bucket}-${file.id}`}
                                    className={`relative cursor-pointer rounded overflow-hidden border-2 ${
                                      isSelected ? 'border-primary' : 'border-transparent'
                                    }`}
                                    onClick={() => selectFromGallery(file, 'mobile')}
                                  >
                                    <img src={url} alt="" className="w-full h-10 object-cover" loading="lazy" />
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </ScrollArea>
                      </TabsContent>

                      <TabsContent value="url" className="space-y-2">
                        <Input
                          placeholder="https://..."
                          value={form.media_url_mobile || ''}
                          onChange={(e) => setForm(prev => ({ ...prev, media_url_mobile: e.target.value }))}
                        />
                        <Select
                          value={form.media_type_mobile || 'image'}
                          onValueChange={(v) => setForm(prev => ({ ...prev, media_type_mobile: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="image">Image</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                          </SelectContent>
                        </Select>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Content Fields */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Title (English)</Label>
              <Input
                value={form.title_en}
                onChange={(e) => setForm(prev => ({ ...prev, title_en: e.target.value }))}
                placeholder="Illuminate Your World"
              />
            </div>
            <div className="space-y-2">
              <Label>Title (Arabic)</Label>
              <Input
                dir="rtl"
                value={form.title_ar}
                onChange={(e) => setForm(prev => ({ ...prev, title_ar: e.target.value }))}
                placeholder="أضئ عالمك"
              />
            </div>
            <div className="space-y-2">
              <Label>Subtitle (English)</Label>
              <Input
                value={form.subtitle_en}
                onChange={(e) => setForm(prev => ({ ...prev, subtitle_en: e.target.value }))}
                placeholder="Premium lighting solutions"
              />
            </div>
            <div className="space-y-2">
              <Label>Subtitle (Arabic)</Label>
              <Input
                dir="rtl"
                value={form.subtitle_ar}
                onChange={(e) => setForm(prev => ({ ...prev, subtitle_ar: e.target.value }))}
                placeholder="حلول إضاءة متميزة"
              />
            </div>
            <div className="space-y-2">
              <Label>Button Text (English)</Label>
              <Input
                value={form.button_text_en}
                onChange={(e) => setForm(prev => ({ ...prev, button_text_en: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Button Text (Arabic)</Label>
              <Input
                dir="rtl"
                value={form.button_text_ar}
                onChange={(e) => setForm(prev => ({ ...prev, button_text_ar: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Link URL</Label>
              <Input
                value={form.link_url}
                onChange={(e) => setForm(prev => ({ ...prev, link_url: e.target.value }))}
                placeholder="/shop"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex items-center gap-3 h-10">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_active: checked }))}
                />
                <span className="text-sm text-muted-foreground">
                  {form.is_active ? 'Active - Will show on homepage' : 'Inactive - Hidden from homepage'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !form.media_url}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-2" />
            {slide ? 'Update Slide' : 'Create Slide'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

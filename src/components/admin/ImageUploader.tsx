import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Upload,
  ImagePlus,
  Wand2,
  Sparkles,
  X,
  Loader2,
  RefreshCw,
  Image as ImageIcon,
  Trash2,
  FolderOpen,
  Check,
  Search,
} from 'lucide-react';

// AI Image Generation Models
const IMAGE_MODELS = [
  { id: 'gemini-2.5-flash-image', name: 'Nano Banana (Fast)', provider: 'google' },
  { id: 'gemini-3-pro-image-preview', name: 'Nano Banana Pro (Quality)', provider: 'google' },
];

// Aspect Ratio Options for AI Generation
const ASPECT_RATIO_OPTIONS = [
  { id: 'square', label: '1:1 (Square)', value: '1:1' },
  { id: 'landscape', label: '16:9 (Landscape)', value: '16:9' },
  { id: 'portrait', label: '9:16 (Portrait)', value: '9:16' },
  { id: 'wide', label: '4:3 (Wide)', value: '4:3' },
  { id: 'tall', label: '3:4 (Tall)', value: '3:4' },
];

// Storage file type from Supabase
interface StorageFile {
  name: string;
  id: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  onMultipleChange?: (urls: string[]) => void;
  multiple?: boolean;
  existingImages?: string[];
  bucket?: string;
  folder?: string;
  aspectRatio?: 'square' | 'landscape' | 'portrait';
  contextName?: string;
  contextType?: 'product' | 'category' | 'brand' | 'project' | 'post';
  className?: string;
}

export default function ImageUploader({
  value,
  onChange,
  onMultipleChange,
  multiple = false,
  existingImages = [],
  bucket = 'product-images',
  folder: folderProp,
  aspectRatio = 'square',
  contextName = '',
  contextType = 'product',
  className = '',
}: ImageUploaderProps) {
  // Map contextType to folder name
  const getFolderFromContext = (type: string): string => {
    const folderMap: Record<string, string> = {
      product: 'products',
      category: 'categories',
      brand: 'brands',
      project: 'projects',
      post: 'posts',
    };
    return folderMap[type] || 'products';
  };

  // Use provided folder or derive from contextType
  const folder = folderProp || getFolderFromContext(contextType);
  const { t } = useTranslation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);

  // States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'generate' | 'gallery'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImprovingPrompt, setIsImprovingPrompt] = useState(false);

  // Generation states
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState(IMAGE_MODELS[0].id);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(ASPECT_RATIO_OPTIONS[0].id);
  const [referenceImages, setReferenceImages] = useState<File[]>([]);
  const [referencePreviewUrls, setReferencePreviewUrls] = useState<string[]>([]);
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null);

  // Gallery states
  const [galleryImages, setGalleryImages] = useState<StorageFile[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [gallerySearch, setGallerySearch] = useState('');
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<string[]>([]);

  // Fetch gallery images when gallery tab is opened
  const fetchGalleryImages = useCallback(async () => {
    setGalleryLoading(true);
    try {
      // Fetch images from the context-specific folder
      const { data, error } = await supabase.storage
        .from('product-images')
        .list(folder, { limit: 200, sortBy: { column: 'created_at', order: 'desc' } });

      if (error) throw error;
      // Filter out placeholder files
      const images = (data || []).filter(f => !f.name.startsWith('.') && f.id) as StorageFile[];
      setGalleryImages(images);
    } catch (error: any) {
      console.error('Gallery fetch error:', error);
      toast({
        variant: 'destructive',
        title: t('admin.fetchError', 'Fetch error'),
        description: error.message,
      });
    } finally {
      setGalleryLoading(false);
    }
  }, [toast, t, folder]);

  // Load gallery when tab switches to gallery
  useEffect(() => {
    if (activeTab === 'gallery') {
      fetchGalleryImages();
    }
  }, [activeTab, fetchGalleryImages]);

  // Get public URL for gallery image
  const getGalleryImageUrl = useCallback((fileName: string) => {
    const { data } = supabase.storage.from('product-images').getPublicUrl(`${folder}/${fileName}`);
    return data.publicUrl;
  }, [folder]);

  // Toggle gallery image selection
  const toggleGalleryImageSelection = (fileName: string) => {
    const url = getGalleryImageUrl(fileName);
    if (multiple) {
      setSelectedGalleryImages(prev => 
        prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
      );
    } else {
      setSelectedGalleryImages(prev => prev.includes(url) ? [] : [url]);
    }
  };

  // Confirm gallery selection
  const confirmGallerySelection = () => {
    if (selectedGalleryImages.length === 0) return;
    
    if (multiple && onMultipleChange) {
      onMultipleChange([...existingImages, ...selectedGalleryImages]);
    } else {
      onChange(selectedGalleryImages[0]);
    }
    
    toast({
      title: t('admin.imageSelected', 'Image selected'),
      description: t('admin.imageSelectedDesc', 'Image has been added from gallery'),
    });
    
    setSelectedGalleryImages([]);
    setIsDialogOpen(false);
  };

  // Filter gallery images by search
  const filteredGalleryImages = galleryImages.filter(img =>
    img.name.toLowerCase().includes(gallerySearch.toLowerCase())
  );

  // Handle file upload from computer
  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadedUrls: string[] = [];

      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast({
            variant: 'destructive',
            title: t('admin.invalidFile', 'Invalid file'),
            description: t('admin.onlyImagesAllowed', 'Only image files are allowed'),
          });
          continue;
        }

        // Generate unique filename
        const ext = file.name.split('.').pop();
        const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

        // Upload to Supabase storage
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) throw error;

        // Get public URL
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
        uploadedUrls.push(urlData.publicUrl);
      }

      if (uploadedUrls.length > 0) {
        if (multiple && onMultipleChange) {
          onMultipleChange([...existingImages, ...uploadedUrls]);
        } else {
          onChange(uploadedUrls[0]);
        }
        
        toast({
          title: t('admin.imageUploaded', 'Image uploaded'),
          description: t('admin.imageUploadedDesc', 'Image has been uploaded successfully'),
        });
        setIsDialogOpen(false);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        variant: 'destructive',
        title: t('admin.uploadError', 'Upload error'),
        description: error.message || t('admin.uploadErrorDesc', 'Failed to upload image'),
      });
    } finally {
      setIsUploading(false);
    }
  }, [bucket, folder, multiple, existingImages, onChange, onMultipleChange, toast, t]);

  // Handle reference image selection
  const handleReferenceImageSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files);
    setReferenceImages(prev => [...prev, ...newFiles]);

    // Create preview URLs
    const urls = newFiles.map(file => URL.createObjectURL(file));
    setReferencePreviewUrls(prev => [...prev, ...urls]);
  };

  // Remove reference image
  const removeReferenceImage = (index: number) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(referencePreviewUrls[index]);
    setReferencePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Improve prompt with AI
  const improvePrompt = async () => {
    if (!prompt.trim()) {
      toast({
        variant: 'destructive',
        title: t('admin.enterPrompt', 'Enter a prompt'),
        description: t('admin.enterPromptDesc', 'Please enter a basic prompt first'),
      });
      return;
    }

    setIsImprovingPrompt(true);
    try {
      const contextHint = contextType === 'product' 
        ? `for an e-commerce product image of "${contextName || 'a lighting product'}"`
        : contextType === 'category'
        ? `for a category banner image representing "${contextName || 'lighting category'}"`
        : `for a brand logo/image for "${contextName || 'a lighting brand'}"`;

      const { data, error } = await supabase.functions.invoke('generate-ai-content', {
        body: {
          type: 'text',
          prompt: `You are an expert at writing prompts for AI image generation. Improve and expand the following basic prompt into a detailed, professional image generation prompt ${contextHint}. 
          
The image should have:
- Professional white/clean background (for e-commerce)
- Studio lighting
- High quality, 4K
- Commercial photography style

Basic prompt: "${prompt}"

Respond with ONLY the improved prompt, no explanations.`,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setPrompt(data.text.trim());
      toast({
        title: t('admin.promptImproved', 'Prompt improved'),
        description: t('admin.promptImprovedDesc', 'Your prompt has been enhanced by AI'),
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('admin.aiError', 'AI Error'),
        description: error.message,
      });
    } finally {
      setIsImprovingPrompt(false);
    }
  };

  // Generate suggested prompt
  const generateSuggestedPrompt = () => {
    let suggested = '';
    
    if (contextType === 'product') {
      suggested = contextName 
        ? `Professional e-commerce product photo of ${contextName}, modern lighting fixture, clean white background, studio lighting, high quality commercial photography, 4K resolution`
        : 'Professional e-commerce product photo of a modern LED light fixture, clean white background, studio lighting, high quality commercial photography, 4K resolution';
    } else if (contextType === 'category') {
      suggested = contextName
        ? `Category banner image representing ${contextName}, elegant lighting display, soft ambient lighting, modern interior design aesthetic, professional photography`
        : 'Category banner showcasing modern lighting solutions, elegant chandeliers and fixtures, soft ambient lighting, interior design aesthetic';
    } else {
      suggested = contextName
        ? `Minimalist logo design for ${contextName} brand, clean professional typography, lighting/electrical theme, modern corporate identity`
        : 'Modern lighting brand logo, minimalist design, professional corporate identity, clean typography';
    }

    setPrompt(suggested);
  };

  // Convert File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:image/...;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Generate image with AI
  const generateImage = async () => {
    if (!prompt.trim()) {
      toast({
        variant: 'destructive',
        title: t('admin.enterPrompt', 'Enter a prompt'),
        description: t('admin.enterPromptDesc', 'Please enter a prompt to generate an image'),
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedPreview(null);

    try {
      // Convert reference images to base64
      let referenceImagesBase64: string[] = [];
      if (referenceImages.length > 0) {
        referenceImagesBase64 = await Promise.all(
          referenceImages.map(file => fileToBase64(file))
        );
      }

      const aspectRatioValue = ASPECT_RATIO_OPTIONS.find(ar => ar.id === selectedAspectRatio)?.value || '1:1';
      
      const { data, error } = await supabase.functions.invoke('generate-ai-content', {
        body: {
          type: 'image',
          prompt: prompt,
          model: selectedModel,
          referenceImages: referenceImagesBase64,
          aspectRatio: aspectRatioValue,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      // Set preview
      const base64 = data.imageBase64;
      setGeneratedPreview(`data:image/png;base64,${base64}`);

      toast({
        title: t('admin.imageGenerated', 'Image generated'),
        description: t('admin.reviewAndSave', 'Review the image and click Save to use it'),
      });
    } catch (error: any) {
      console.error('Generation error:', error);
      toast({
        variant: 'destructive',
        title: t('admin.generationError', 'Generation error'),
        description: error.message || t('admin.generationErrorDesc', 'Failed to generate image'),
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Save generated image to storage
  const saveGeneratedImage = async () => {
    if (!generatedPreview) return;

    setIsUploading(true);
    try {
      // Convert base64 to blob
      const response = await fetch(generatedPreview);
      const blob = await response.blob();

      // Generate unique filename
      const fileName = `${folder}/ai-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/png',
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);

      if (multiple && onMultipleChange) {
        onMultipleChange([...existingImages, urlData.publicUrl]);
      } else {
        onChange(urlData.publicUrl);
      }

      toast({
        title: t('admin.imageSaved', 'Image saved'),
        description: t('admin.imageSavedDesc', 'Generated image has been saved'),
      });

      // Reset and close
      setGeneratedPreview(null);
      setPrompt('');
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('admin.saveError', 'Save error'),
        description: error.message,
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Remove current image
  const removeImage = (imageUrl?: string) => {
    if (multiple && onMultipleChange && imageUrl) {
      onMultipleChange(existingImages.filter(url => url !== imageUrl));
    } else {
      onChange('');
    }
  };

  // Get aspect ratio class
  const getAspectClass = () => {
    switch (aspectRatio) {
      case 'landscape': return 'aspect-video';
      case 'portrait': return 'aspect-[3/4]';
      default: return 'aspect-square';
    }
  };

  return (
    <div className={className}>
      {/* Current Image Preview */}
      {multiple ? (
        <div className="grid grid-cols-3 gap-2 mb-2">
          {existingImages.map((url, index) => (
            <div key={index} className={`relative ${getAspectClass()} rounded-lg overflow-hidden bg-muted group`}>
              <img src={url} alt="" className="w-full h-full object-cover" />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(url)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setIsDialogOpen(true)}
            className={`${getAspectClass()} rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary`}
          >
            <ImagePlus className="h-6 w-6" />
            <span className="text-xs">{t('admin.addImage', 'Add')}</span>
          </button>
        </div>
      ) : (
        <div className="relative">
          {value ? (
            <div className={`relative ${getAspectClass()} rounded-lg overflow-hidden bg-muted group`}>
              <img src={value} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsDialogOpen(true)}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  {t('admin.change', 'Change')}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeImage()}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsDialogOpen(true)}
              className={`w-full ${getAspectClass()} rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary`}
            >
              <ImagePlus className="h-8 w-8" />
              <span className="text-sm">{t('admin.uploadOrGenerate', 'Upload or Generate Image')}</span>
            </button>
          )}
        </div>
      )}

      {/* Upload/Generate Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              {t('admin.addImage', 'Add Image')}
            </DialogTitle>
            <DialogDescription>
              {t('admin.addImageDesc2', 'Upload, generate with AI, or select from gallery')}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'upload' | 'generate' | 'gallery')}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                {t('admin.upload', 'Upload')}
              </TabsTrigger>
              <TabsTrigger value="generate" className="flex items-center gap-2">
                <Wand2 className="h-4 w-4" />
                {t('admin.aiGenerate', 'AI Generate')}
              </TabsTrigger>
              <TabsTrigger value="gallery" className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                {t('admin.gallery', 'Gallery')}
              </TabsTrigger>
            </TabsList>

            {/* Upload Tab */}
            <TabsContent value="upload" className="space-y-4">
              <Card
                className="border-dashed cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-1">
                    {t('admin.clickToUpload', 'Click to upload')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t('admin.dragDropSupport', 'or drag and drop')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    PNG, JPG, WEBP up to 10MB
                  </p>
                </CardContent>
              </Card>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple={multiple}
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
              />
              
              {isUploading && (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('admin.uploading', 'Uploading...')}
                </div>
              )}
            </TabsContent>

            {/* Generate Tab */}
            <TabsContent value="generate" className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Model Selection */}
                <div className="space-y-2">
                  <Label>{t('admin.selectModel', 'AI Model')}</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {IMAGE_MODELS.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Aspect Ratio Selection */}
                <div className="space-y-2">
                  <Label>{t('admin.aspectRatio', 'Aspect Ratio')}</Label>
                  <Select value={selectedAspectRatio} onValueChange={setSelectedAspectRatio}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ASPECT_RATIO_OPTIONS.map((ratio) => (
                        <SelectItem key={ratio.id} value={ratio.id}>
                          {ratio.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Prompt Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{t('admin.prompt', 'Prompt')}</Label>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={generateSuggestedPrompt}
                      className="h-7 text-xs"
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      {t('admin.suggest', 'Suggest')}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={improvePrompt}
                      disabled={isImprovingPrompt || !prompt.trim()}
                      className="h-7 text-xs"
                    >
                      {isImprovingPrompt ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <Wand2 className="h-3 w-3 mr-1" />
                      )}
                      {t('admin.improve', 'Improve')}
                    </Button>
                  </div>
                </div>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={t('admin.promptPlaceholder', 'Describe the image you want to generate...')}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  {t('admin.promptTip', 'Tip: Be specific about style, lighting, background, and quality')}
                </p>
              </div>

              {/* Reference Images (Optional) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{t('admin.referenceImages', 'Reference Images')} <span className="text-muted-foreground">({t('admin.optional', 'optional')})</span></Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => referenceInputRef.current?.click()}
                    className="h-7"
                  >
                    <ImagePlus className="h-3 w-3 mr-1" />
                    {t('admin.addReference', 'Add')}
                  </Button>
                </div>
                <input
                  ref={referenceInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleReferenceImageSelect(e.target.files)}
                />
                {referencePreviewUrls.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {referencePreviewUrls.map((url, index) => (
                      <div key={index} className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeReferenceImage(index)}
                          className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-bl p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {t('admin.referenceTip', 'Reference images help maintain style consistency')}
                </p>
              </div>

              {/* Generate Button */}
              <Button
                type="button"
                onClick={generateImage}
                disabled={isGenerating || !prompt.trim()}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {t('admin.generating', 'Generating...')}
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    {t('admin.generateImage', 'Generate Image')}
                  </>
                )}
              </Button>

              {/* Generated Preview */}
              {generatedPreview && (
                <div className="space-y-3">
                  <Label>{t('admin.generatedPreview', 'Generated Image')}</Label>
                  <div className={`relative ${getAspectClass()} rounded-lg overflow-hidden bg-muted`}>
                    <img src={generatedPreview} alt="Generated" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateImage}
                      disabled={isGenerating}
                      className="flex-1"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      {t('admin.regenerate', 'Regenerate')}
                    </Button>
                    <Button
                      type="button"
                      onClick={saveGeneratedImage}
                      disabled={isUploading}
                      className="flex-1"
                    >
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      {t('admin.saveImage', 'Save Image')}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Gallery Tab */}
            <TabsContent value="gallery" className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('admin.searchGallery', 'Search images...')}
                  value={gallerySearch}
                  onChange={(e) => setGallerySearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Gallery Grid */}
              {galleryLoading ? (
                <div className="grid grid-cols-4 gap-2">
                  {Array(12).fill(0).map((_, i) => (
                    <Skeleton key={i} className="aspect-square rounded-lg" />
                  ))}
                </div>
              ) : filteredGalleryImages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FolderOpen className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>{gallerySearch 
                    ? t('admin.noSearchResults', 'No images found') 
                    : t('admin.emptyGallery', 'No images in gallery')}</p>
                </div>
              ) : (
                <ScrollArea className="h-[300px]">
                  <div className="grid grid-cols-4 gap-2 pr-3">
                    {filteredGalleryImages.map((image) => {
                      const imageUrl = getGalleryImageUrl(image.name);
                      const isSelected = selectedGalleryImages.includes(imageUrl);
                      return (
                        <button
                          key={image.id}
                          type="button"
                          onClick={() => toggleGalleryImageSelection(image.name)}
                          className={`relative aspect-square rounded-lg overflow-hidden bg-muted border-2 transition-all hover:ring-2 hover:ring-primary/50 ${
                            isSelected ? 'border-primary ring-2 ring-primary' : 'border-transparent'
                          }`}
                        >
                          <img
                            src={imageUrl}
                            alt={image.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                              <div className="bg-primary rounded-full p-1">
                                <Check className="h-4 w-4 text-primary-foreground" />
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}

              {/* Refresh & Selection Actions */}
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={fetchGalleryImages}
                  disabled={galleryLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${galleryLoading ? 'animate-spin' : ''}`} />
                  {t('admin.refresh', 'Refresh')}
                </Button>
                
                {selectedGalleryImages.length > 0 && (
                  <Button
                    type="button"
                    onClick={confirmGallerySelection}
                    className="gap-1"
                  >
                    <Check className="h-4 w-4" />
                    {t('admin.selectImages', 'Select')} ({selectedGalleryImages.length})
                  </Button>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                {t('admin.galleryTip', 'Click on images to select. All uploaded and AI-generated images are saved here.')}
              </p>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t('admin.cancel', 'Cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

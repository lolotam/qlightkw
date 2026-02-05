import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Sparkles,
  Loader2,
  Image as ImageIcon,
  FileText,
  Globe,
  Calendar as CalendarIcon,
  Star,
  Upload,
  Clock,
  Wand2,
  ExternalLink,
  Save,
  Check,
  FolderOpen,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import RichTextEditor from '@/components/admin/RichTextEditor';
import BlogPreview from '@/components/admin/BlogPreview';

// Blog post type from database
interface BlogPost {
  id: string;
  slug: string;
  title_en: string;
  title_ar: string | null;
  excerpt_en: string | null;
  excerpt_ar: string | null;
  content_en: string | null;
  content_ar: string | null;
  featured_image_url: string | null;
  category: string | null;
  author_name: string | null;
  is_published: boolean | null;
  is_featured: boolean | null;
  published_at: string | null;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
}

// Form data for creating/editing posts
interface PostFormData {
  title_en: string;
  title_ar: string;
  slug: string;
  excerpt_en: string;
  excerpt_ar: string;
  content_en: string;
  content_ar: string;
  category: string;
  author_name: string;
  featured_image_url: string;
  is_published: boolean;
  is_featured: boolean;
  scheduled_at: Date | null;
}

const initialFormData: PostFormData = {
  title_en: '',
  title_ar: '',
  slug: '',
  excerpt_en: '',
  excerpt_ar: '',
  content_en: '',
  content_ar: '',
  category: 'tips',
  author_name: 'Quality Light Team',
  featured_image_url: '',
  is_published: false,
  is_featured: false,
  scheduled_at: null,
};

const CATEGORIES = [
  { value: 'tips', label_en: 'Tips', label_ar: 'نصائح' },
  { value: 'guide', label_en: 'Guide', label_ar: 'دليل' },
  { value: 'inspiration', label_en: 'Inspiration', label_ar: 'إلهام' },
  { value: 'news', label_en: 'News', label_ar: 'أخبار' },
  { value: 'tutorial', label_en: 'Tutorial', label_ar: 'تعليمي' },
];

const ASPECT_RATIOS = [
  { value: '1:1', label: '1:1 (Square)', width: 1024, height: 1024 },
  { value: '16:9', label: '16:9 (Landscape)', width: 1920, height: 1080 },
  { value: '4:3', label: '4:3 (Standard)', width: 1024, height: 768 },
  { value: '3:2', label: '3:2 (Photo)', width: 1024, height: 683 },
  { value: '9:16', label: '9:16 (Portrait)', width: 1080, height: 1920 },
];

// Google AI Image Models (from admin settings)
const GOOGLE_IMAGE_MODELS = [
  { value: 'gemini-2.5-flash-image', label: 'Nano Banana (Gemini 2.5 Flash)', description: 'Fast & efficient image generation' },
  { value: 'gemini-3-pro-image-preview', label: 'Nano Banana Pro (Gemini 3 Pro)', description: 'Professional quality' },
  { value: 'imagen-3.0-generate-002', label: 'Imagen 3.0', description: 'High quality Imagen model' },
  { value: 'imagen-3.0-fast-generate-001', label: 'Imagen 3.0 Fast', description: 'Faster Imagen generation' },
];

// OpenRouter Image Models (commonly used)
const OPENROUTER_IMAGE_MODELS = [
  { value: 'openai/dall-e-3', label: 'DALL-E 3', description: 'OpenAI image generation' },
  { value: 'stabilityai/stable-diffusion-xl', label: 'Stable Diffusion XL', description: 'High quality SD model' },
];

// AI Settings interface
interface AISettings {
  image_provider?: 'google' | 'openrouter';
  chat_provider?: 'google' | 'openrouter';
  google_image_model?: string;
  google_text_model?: string;
  openrouter_text_model?: string;
  openrouter_image_model?: string;
  auto_generate_description?: boolean;
  ai_provider?: 'google' | 'openrouter';
  image_model?: string;
  text_model?: string;
}

// HTML Templates for blog content
const HTML_TEMPLATES = [
  {
    id: 'intro-section',
    label_en: 'Introduction Section',
    label_ar: 'قسم المقدمة',
    html: `<div class="blog-intro">
  <p class="lead">📌 <strong>Write your engaging introduction here.</strong> Hook your readers with an interesting fact or question about the topic.</p>
</div>`,
  },
  {
    id: 'feature-list',
    label_en: 'Feature List with Icons',
    label_ar: 'قائمة الميزات',
    html: `<section class="blog-section">
  <h2>🔆 Key Features</h2>
  <ul class="feature-list">
    <li>✅ <strong>Feature 1:</strong> Description of the first feature</li>
    <li>✅ <strong>Feature 2:</strong> Description of the second feature</li>
    <li>✅ <strong>Feature 3:</strong> Description of the third feature</li>
  </ul>
</section>`,
  },
  {
    id: 'steps-guide',
    label_en: 'Step-by-Step Guide',
    label_ar: 'دليل خطوة بخطوة',
    html: `<section class="blog-section">
  <h2>📝 Step-by-Step Guide</h2>
  <ol class="steps-list">
    <li><strong>Step 1:</strong> Description of the first step</li>
    <li><strong>Step 2:</strong> Description of the second step</li>
    <li><strong>Step 3:</strong> Description of the third step</li>
    <li><strong>Step 4:</strong> Description of the fourth step</li>
  </ol>
</section>`,
  },
  {
    id: 'expert-tip',
    label_en: 'Expert Tip Box',
    label_ar: 'نصيحة خبير',
    html: `<blockquote class="expert-tip">
  💡 <strong>Expert Tip:</strong> Add your professional advice or important note here. This helps establish authority and provides value to readers.
</blockquote>`,
  },
  {
    id: 'comparison-table',
    label_en: 'Comparison Table',
    label_ar: 'جدول مقارنة',
    html: `<div class="comparison-table">
  <h3>📊 Comparison</h3>
  <table>
    <thead>
      <tr>
        <th>Feature</th>
        <th>Option A</th>
        <th>Option B</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Feature 1</td>
        <td>✅ Yes</td>
        <td>❌ No</td>
      </tr>
      <tr>
        <td>Feature 2</td>
        <td>Good</td>
        <td>Better</td>
      </tr>
    </tbody>
  </table>
</div>`,
  },
  {
    id: 'cta-box',
    label_en: 'Call to Action Box',
    label_ar: 'صندوق الدعوة للعمل',
    html: `<section class="blog-conclusion">
  <h2>🎯 Ready to Get Started?</h2>
  <div class="cta-box">
    <p>✨ <strong>Visit Quality Light</strong> today for premium lighting solutions that transform your space!</p>
  </div>
</section>`,
  },
  {
    id: 'warning-box',
    label_en: 'Warning/Important Box',
    label_ar: 'صندوق تحذير',
    html: `<div class="warning-box">
  ⚠️ <strong>Important:</strong> Add your safety warning or critical information here. Always prioritize reader safety.
</div>`,
  },
];

export default function BlogPosts() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState<PostFormData>(initialFormData);
  const [aiTopic, setAiTopic] = useState('');
  const [aiTone, setAiTone] = useState<'professional' | 'casual' | 'educational'>('professional');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [generatingImageIndex, setGeneratingImageIndex] = useState<number | null>(null);
  const [generatedImageUrls, setGeneratedImageUrls] = useState<{ [key: number]: string }>({});
  const [customImagePrompt, setCustomImagePrompt] = useState('');
  const [isGeneratingCustomImage, setIsGeneratingCustomImage] = useState(false);
  const [customGeneratedImage, setCustomGeneratedImage] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isGeneratingImagePrompt, setIsGeneratingImagePrompt] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState('16:9');
  const [imageModel, setImageModel] = useState('');
  const suppressResetOnDialogCloseRef = useRef(false);
  
  // Auto-save state
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'unsaved'>('idle');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const draftIdRef = useRef<string | null>(null);
  const hasTypedRef = useRef(false);

  // Fetch AI settings from database
  const { data: aiSettings } = useQuery({
    queryKey: ['ai-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'ai_settings')
        .maybeSingle();
      
      if (error) throw error;
      return (data?.value as AISettings) || {};
    },
  });

  // Get the image provider and available models based on settings
  const imageProvider = aiSettings?.image_provider || aiSettings?.ai_provider || 'google';
  const configuredGoogleModel = aiSettings?.google_image_model || 'gemini-2.5-flash-image';
  const configuredOpenRouterModel = aiSettings?.openrouter_image_model || '';
  
  // Get available image models based on provider
  const availableImageModels = useMemo(() => {
    if (imageProvider === 'openrouter') {
      // Add the configured model if it's not already in the list
      const models = [...OPENROUTER_IMAGE_MODELS];
      if (configuredOpenRouterModel && !models.find(m => m.value === configuredOpenRouterModel)) {
        models.unshift({
          value: configuredOpenRouterModel,
          label: configuredOpenRouterModel.split('/').pop() || configuredOpenRouterModel,
          description: 'Configured in Settings',
        });
      }
      return models;
    } else {
      return GOOGLE_IMAGE_MODELS;
    }
  }, [imageProvider, configuredOpenRouterModel]);

  // Set default model when settings load
  useEffect(() => {
    if (!imageModel && aiSettings) {
      if (imageProvider === 'openrouter') {
        setImageModel(configuredOpenRouterModel || 'openai/dall-e-3');
      } else {
        setImageModel(configuredGoogleModel);
      }
    }
  }, [aiSettings, imageModel, imageProvider, configuredGoogleModel, configuredOpenRouterModel]);

  // Fetch blog posts from database
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['admin-blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as BlogPost[];
    },
  });

  // Filter posts by search - only show published posts (drafts are in separate page)
  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.title_ar?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.category?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Generate slug from title
  const generateSlug = useCallback((title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 60);
  }, []);

  // Auto-save function
  const performAutoSave = useCallback(async (data: PostFormData) => {
    // Only auto-save if user has typed something meaningful
    if (!data.title_en.trim() && !data.content_en.trim()) {
      return;
    }

    setAutoSaveStatus('saving');

    try {
      const postData = {
        title_en: data.title_en || 'Untitled Draft',
        title_ar: data.title_ar || null,
        slug: data.slug || generateSlug(data.title_en) || `draft-${Date.now()}`,
        excerpt_en: data.excerpt_en || null,
        excerpt_ar: data.excerpt_ar || null,
        content_en: data.content_en || null,
        content_ar: data.content_ar || null,
        category: data.category,
        author_name: data.author_name,
        featured_image_url: data.featured_image_url || null,
        is_published: false,
        is_featured: data.is_featured,
        scheduled_at: data.scheduled_at ? data.scheduled_at.toISOString() : null,
      };

      if (editingPost || draftIdRef.current) {
        // Update existing post/draft
        const { error } = await supabase
          .from('blog_posts')
          .update(postData)
          .eq('id', editingPost?.id || draftIdRef.current);
        if (error) throw error;
      } else {
        // Create new draft
        const { data: newDraft, error } = await supabase
          .from('blog_posts')
          .insert(postData)
          .select('id')
          .single();
        if (error) throw error;
        draftIdRef.current = newDraft.id;
      }

      setAutoSaveStatus('saved');
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-blog-drafts'] });
    } catch (error) {
      console.error('Auto-save error:', error);
      setAutoSaveStatus('unsaved');
    }
  }, [editingPost, generateSlug, queryClient]);

  // Trigger auto-save with debounce
  const triggerAutoSave = useCallback((data: PostFormData) => {
    if (!hasTypedRef.current) {
      hasTypedRef.current = true;
    }
    
    setAutoSaveStatus('unsaved');
    
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    autoSaveTimerRef.current = setTimeout(() => {
      performAutoSave(data);
    }, 2000); // 2 second debounce
  }, [performAutoSave]);

  // Handle form data changes with auto-save
  const updateFormData = useCallback((updater: (prev: PostFormData) => PostFormData) => {
    setFormData(prev => {
      const newData = updater(prev);
      triggerAutoSave(newData);
      return newData;
    });
  }, [triggerAutoSave]);

  // Handle edit from URL param (from drafts page)
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && posts.length > 0) {
      const postToEdit = posts.find(p => p.id === editId);
      if (postToEdit) {
        setEditingPost(postToEdit);
        setFormData({
          title_en: postToEdit.title_en,
          title_ar: postToEdit.title_ar || '',
          slug: postToEdit.slug,
          excerpt_en: postToEdit.excerpt_en || '',
          excerpt_ar: postToEdit.excerpt_ar || '',
          content_en: postToEdit.content_en || '',
          content_ar: postToEdit.content_ar || '',
          category: postToEdit.category || 'tips',
          author_name: postToEdit.author_name || 'Quality Light Team',
          featured_image_url: postToEdit.featured_image_url || '',
          is_published: postToEdit.is_published || false,
          is_featured: postToEdit.is_featured || false,
          scheduled_at: postToEdit.scheduled_at ? new Date(postToEdit.scheduled_at) : null,
        });
        setIsDialogOpen(true);
        // Clear the URL param
        setSearchParams({});
      }
    }
  }, [searchParams, posts, setSearchParams]);

  // Cleanup auto-save timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: PostFormData) => {
      // Convert Date to ISO string for database
      const postData = {
        title_en: data.title_en,
        title_ar: data.title_ar,
        slug: data.slug,
        excerpt_en: data.excerpt_en,
        excerpt_ar: data.excerpt_ar,
        content_en: data.content_en,
        content_ar: data.content_ar,
        category: data.category,
        author_name: data.author_name,
        featured_image_url: data.featured_image_url,
        is_published: data.is_published,
        is_featured: data.is_featured,
        scheduled_at: data.scheduled_at ? data.scheduled_at.toISOString() : null,
        published_at: data.is_published && !data.scheduled_at ? new Date().toISOString() : null,
      };

      if (editingPost) {
        const { error } = await supabase
          .from('blog_posts')
          .update(postData)
          .eq('id', editingPost.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('blog_posts')
          .insert(postData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      toast({
        title: isRTL ? 'تم الحفظ' : 'Saved',
        description: isRTL ? 'تم حفظ المقال بنجاح' : 'Blog post saved successfully',
      });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      toast({
        title: isRTL ? 'تم الحذف' : 'Deleted',
        description: isRTL ? 'تم حذف المقال' : 'Blog post deleted',
      });
    },
  });

  // AI Content Generation
  const generateAIContent = async () => {
    if (!aiTopic.trim()) {
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'الرجاء إدخال موضوع' : 'Please enter a topic',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-blog-content', {
        body: {
          topic: aiTopic,
          language: 'both',
          tone: aiTone,
          includeImages: true,
        },
      });

      if (error) throw error;

      if (data?.success && data.content) {
        const content = data.content;
        
        // Fill form with generated content
        setFormData(prev => ({
          ...prev,
          title_en: content.title_en || prev.title_en,
          title_ar: content.title_ar || prev.title_ar,
          excerpt_en: content.excerpt_en || prev.excerpt_en,
          excerpt_ar: content.excerpt_ar || prev.excerpt_ar,
          content_en: content.content_en || prev.content_en,
          content_ar: content.content_ar || prev.content_ar,
          slug: content.slug || prev.slug,
        }));

        // Store image suggestions
        if (content.image_suggestions?.length > 0) {
          setGeneratedImages(content.image_suggestions);
        }

        toast({
          title: isRTL ? 'تم إنشاء المحتوى' : 'Content Generated',
          description: isRTL 
            ? 'تم إنشاء المحتوى بنجاح. راجعه قبل النشر.' 
            : 'Content generated successfully. Review before publishing.',
        });

        setIsAIDialogOpen(false);
        setIsDialogOpen(true);
      } else {
        throw new Error(data?.error || 'Failed to generate content');
      }
    } catch (error: unknown) {
      console.error('AI generation error:', error);
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate content',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate All Fields from Title
  const generateAllFromTitle = async () => {
    const titleEn = formData.title_en.trim();
    const titleAr = formData.title_ar.trim();

    if (!titleEn && !titleAr) {
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'يرجى إدخال عنوان واحد على الأقل' : 'Please enter at least one title',
        variant: 'destructive',
      });
      return;
    }

    setIsGeneratingAll(true);

    try {
      const titleToUse = titleEn || titleAr;
      
      const { data, error } = await supabase.functions.invoke('generate-blog-content', {
        body: {
          topic: titleToUse,
          language: 'both',
          tone: 'professional',
          includeImages: true,
          existingTitleEn: titleEn || undefined,
          existingTitleAr: titleAr || undefined,
        },
      });

      if (error) throw error;

      if (data?.success && data.content) {
        const content = data.content;
        
        // Fill form with generated content (keep existing titles if provided)
        updateFormData(prev => ({
          ...prev,
          title_en: titleEn || content.title_en || prev.title_en,
          title_ar: titleAr || content.title_ar || prev.title_ar,
          excerpt_en: content.excerpt_en || prev.excerpt_en,
          excerpt_ar: content.excerpt_ar || prev.excerpt_ar,
          content_en: content.content_en || prev.content_en,
          content_ar: content.content_ar || prev.content_ar,
          slug: content.slug || prev.slug || generateSlug(titleEn || content.title_en),
        }));

        // Store image suggestions
        if (content.image_suggestions?.length > 0) {
          setGeneratedImages(content.image_suggestions);
        }

        toast({
          title: isRTL ? 'تم إنشاء المحتوى' : 'Content Generated',
          description: isRTL 
            ? 'تم إنشاء جميع الحقول بنجاح' 
            : 'All fields generated successfully',
        });
      } else {
        throw new Error(data?.error || 'Failed to generate content');
      }
    } catch (error: unknown) {
      console.error('AI generation error:', error);
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate content',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingAll(false);
    }
  };

  // AI Image Generation from suggestion
  const generateImageFromSuggestion = async (suggestion: string, index: number) => {
    setGeneratingImageIndex(index);

    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-content', {
        body: {
          type: 'image',
          prompt: suggestion,
          productName: formData.title_en || 'Blog Post',
        },
      });

      if (error) throw error;

      if (data?.success && data.imageBase64) {
        // Convert base64 to data URL for preview
        const imageDataUrl = `data:image/png;base64,${data.imageBase64}`;
        
        // Store the generated image
        setGeneratedImageUrls(prev => ({ ...prev, [index]: imageDataUrl }));
        
        toast({
          title: isRTL ? 'تم إنشاء الصورة' : 'Image Generated',
          description: isRTL 
            ? 'انقر على "استخدام كصورة رئيسية" لتعيينها' 
            : 'Click "Use as Featured" to set it as the featured image',
        });
      } else {
        throw new Error(data?.error || 'Failed to generate image');
      }
    } catch (error: unknown) {
      console.error('Image generation error:', error);
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate image',
        variant: 'destructive',
      });
    } finally {
      setGeneratingImageIndex(null);
    }
  };

  // Use generated image as featured image (uploads to Supabase Storage)
  const useGeneratedImageAsFeatured = async (imageDataUrl: string) => {
    try {
      toast({
        title: isRTL ? 'جاري رفع الصورة...' : 'Uploading image...',
        description: isRTL ? 'يرجى الانتظار' : 'Please wait',
      });

      // Convert data URL to blob
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      
      // Generate unique filename
      const filename = `blog-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
      const filePath = `${filename}`;
      
      // Upload to Supabase Storage - blog-images bucket
      const { error: uploadError } = await supabase.storage
        .from('blog-images')
        .upload(filePath, blob, {
          contentType: 'image/png',
          cacheControl: '3600',
        });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('blog-images')
        .getPublicUrl(filePath);
      
      // Set as featured image
      updateFormData(prev => ({ ...prev, featured_image_url: urlData.publicUrl }));
      
      toast({
        title: isRTL ? '✅ تم حفظ الصورة' : '✅ Image Saved',
        description: isRTL 
          ? 'تم رفع الصورة إلى المعرض وتعيينها كصورة رئيسية' 
          : 'Image uploaded to gallery and set as featured image',
      });
    } catch (error: unknown) {
      console.error('Upload error:', error);
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload image',
        variant: 'destructive',
      });
    }
  };

  // Insert HTML template into content
  const insertHtmlTemplate = (templateId: string, language: 'en' | 'ar') => {
    const template = HTML_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    const fieldKey = language === 'en' ? 'content_en' : 'content_ar';
    updateFormData(prev => ({
      ...prev,
      [fieldKey]: prev[fieldKey] + '\n\n' + template.html,
    }));

    toast({
      title: isRTL ? 'تم إضافة القالب' : 'Template Added',
      description: isRTL ? 'تم إضافة القالب إلى المحتوى' : 'Template inserted into content',
    });
  };

  // Generate custom image from user prompt
  const generateCustomImage = async () => {
    if (!customImagePrompt.trim()) {
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'الرجاء إدخال وصف للصورة' : 'Please enter an image description',
        variant: 'destructive',
      });
      return;
    }

    setIsGeneratingCustomImage(true);

    try {
      // Get dimensions from selected aspect ratio
      const aspectRatioConfig = ASPECT_RATIOS.find(ar => ar.value === imageAspectRatio) || ASPECT_RATIOS[1];
      
      const { data, error } = await supabase.functions.invoke('generate-ai-content', {
        body: {
          type: 'image',
          prompt: customImagePrompt,
          productName: formData.title_en || 'Blog Post Image',
          width: aspectRatioConfig.width,
          height: aspectRatioConfig.height,
          model: imageModel,
        },
      });

      if (error) throw error;

      if (data?.success && data.imageBase64) {
        const imageDataUrl = `data:image/png;base64,${data.imageBase64}`;
        setCustomGeneratedImage(imageDataUrl);
        
        toast({
          title: isRTL ? 'تم إنشاء الصورة' : 'Image Generated',
          description: isRTL 
            ? 'انقر على "استخدام كصورة رئيسية" لتعيينها' 
            : 'Click "Use as Featured" to set it as the featured image',
        });
      } else {
        throw new Error(data?.error || 'Failed to generate image');
      }
    } catch (error: unknown) {
      console.error('Custom image generation error:', error);
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate image',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingCustomImage(false);
    }
  };

  // Generate image prompt from post content using AI
  const generateImagePromptFromContent = async () => {
    if (!formData.content_en.trim() && !formData.title_en.trim()) {
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'يرجى إضافة محتوى المقال أولاً' : 'Please add post content first',
        variant: 'destructive',
      });
      return;
    }

    setIsGeneratingImagePrompt(true);

    try {
      // Strip HTML tags from content for cleaner analysis
      const stripHtml = (html: string) => {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
      };

      const plainContent = stripHtml(formData.content_en);
      const truncatedContent = plainContent.substring(0, 2000); // Limit content length

      const { data, error } = await supabase.functions.invoke('generate-ai-content', {
        body: {
          type: 'text',
          prompt: `You are an expert at creating image generation prompts. Based on the following blog post content, create a detailed and descriptive image prompt that would generate a professional, visually appealing featured image for this article.

The image should:
- Be relevant to the main topic and theme of the article
- Be professional and suitable for a lighting/home decor e-commerce blog
- Include specific visual elements mentioned or implied in the content
- Have good composition and lighting descriptions
- Be in a modern, clean style

Blog Title: ${formData.title_en}

Blog Content:
${truncatedContent}

Respond with ONLY the image generation prompt, no explanations or additional text. The prompt should be 2-4 sentences describing the ideal featured image.`,
          productName: formData.title_en,
        },
      });

      if (error) throw error;

      if (data?.success && data.text) {
        // Clean up the response - remove quotes if present
        let imagePrompt = data.text.trim();
        if (imagePrompt.startsWith('"') && imagePrompt.endsWith('"')) {
          imagePrompt = imagePrompt.slice(1, -1);
        }
        
        setCustomImagePrompt(imagePrompt);
        
        toast({
          title: isRTL ? 'تم إنشاء وصف الصورة' : 'Image Prompt Generated',
          description: isRTL 
            ? 'تم تحليل المحتوى وإنشاء وصف للصورة. يمكنك تعديله ثم إنشاء الصورة.'
            : 'Content analyzed and image prompt created. You can edit it before generating.',
        });
      } else {
        throw new Error(data?.error || 'Failed to generate image prompt');
      }
    } catch (error: unknown) {
      console.error('Image prompt generation error:', error);
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate image prompt',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingImagePrompt(false);
    }
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    // Clear auto-save timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    setIsDialogOpen(false);
    setEditingPost(null);
    setFormData(initialFormData);
    setGeneratedImages([]);
    setGeneratedImageUrls({});
    setCustomImagePrompt('');
    setCustomGeneratedImage(null);
    setAutoSaveStatus('idle');
    draftIdRef.current = null;
    hasTypedRef.current = false;
  };

  const handleEditorDialogOpenChange = (open: boolean) => {
    if (open) {
      setIsDialogOpen(true);
      return;
    }

    // When we close the dialog to show Preview Mode, we don't want to reset form state.
    if (suppressResetOnDialogCloseRef.current) {
      suppressResetOnDialogCloseRef.current = false;
      setIsDialogOpen(false);
      return;
    }

    handleCloseDialog();
  };

  const openPreview = () => {
    // Close the dialog (to avoid the Dialog overlay covering the preview)
    // but keep form data intact.
    suppressResetOnDialogCloseRef.current = true;
    setIsDialogOpen(false);
    setIsPreviewMode(true);
  };

  const closePreview = () => {
    setIsPreviewMode(false);
    // Return to the editor after preview
    setIsDialogOpen(true);
  };

  // Handle edit
  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title_en: post.title_en,
      title_ar: post.title_ar || '',
      slug: post.slug,
      excerpt_en: post.excerpt_en || '',
      excerpt_ar: post.excerpt_ar || '',
      content_en: post.content_en || '',
      content_ar: post.content_ar || '',
      category: post.category || 'tips',
      author_name: post.author_name || 'Quality Light Team',
      featured_image_url: post.featured_image_url || '',
      is_published: post.is_published || false,
      is_featured: post.is_featured || false,
      scheduled_at: post.scheduled_at ? new Date(post.scheduled_at) : null,
    });
    setIsDialogOpen(true);
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!formData.title_en.trim()) {
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'العنوان مطلوب' : 'Title is required',
        variant: 'destructive',
      });
      return;
    }

    // Auto-generate slug if empty
    if (!formData.slug.trim()) {
      formData.slug = generateSlug(formData.title_en);
    }

    saveMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className={`flex flex-col gap-4 md:flex-row md:items-center md:justify-between ${isRTL ? 'md:flex-row-reverse' : ''}`}>
        <div>
          <h1 className="text-2xl font-bold">
            {isRTL ? 'إدارة المدونة' : 'Blog Management'}
          </h1>
          <p className="text-muted-foreground">
            {isRTL ? 'إنشاء وتحرير مقالات المدونة' : 'Create and manage blog posts'}
          </p>
        </div>
        <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {/* View Drafts Button */}
          <Button variant="outline" asChild className="gap-2">
            <Link to="/admin/blog-drafts">
              <FolderOpen className="h-4 w-4" />
              {isRTL ? 'المسودات' : 'Drafts'}
            </Link>
          </Button>
          {/* AI Generate Button */}
          <Button 
            variant="outline" 
            onClick={() => setIsAIDialogOpen(true)}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {isRTL ? 'إنشاء بالذكاء الاصطناعي' : 'AI Generate'}
          </Button>
          {/* New Post Button */}
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {isRTL ? 'مقال جديد' : 'New Post'}
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
            <Input
              placeholder={isRTL ? 'البحث في المقالات...' : 'Search posts...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={isRTL ? 'pr-10' : 'pl-10'}
            />
          </div>
        </CardContent>
      </Card>

      {/* Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <FileText className="h-5 w-5" />
            {isRTL ? 'المقالات' : 'Posts'} ({filteredPosts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{isRTL ? 'لا توجد مقالات' : 'No posts found'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead className={isRTL ? 'text-right' : ''}>{isRTL ? 'العنوان' : 'Title'}</TableHead>
                    <TableHead className={isRTL ? 'text-right' : ''}>{isRTL ? 'الفئة' : 'Category'}</TableHead>
                    <TableHead className={isRTL ? 'text-right' : ''}>{isRTL ? 'الحالة' : 'Status'}</TableHead>
                    <TableHead className={isRTL ? 'text-right' : ''}>{isRTL ? 'التاريخ' : 'Date'}</TableHead>
                    <TableHead className={isRTL ? 'text-left' : 'text-right'}>{isRTL ? 'إجراءات' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPosts.map((post, index) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className={isRTL ? 'text-right' : ''}>
                        <div className="flex items-center gap-3">
                          {post.featured_image_url ? (
                            <img 
                              src={post.featured_image_url} 
                              alt="" 
                              className="h-10 w-10 rounded object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                              <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium line-clamp-1">
                              {isRTL ? post.title_ar || post.title_en : post.title_en}
                            </p>
                            <p className="text-xs text-muted-foreground">/{post.slug}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className={isRTL ? 'text-right' : ''}>
                        <Badge variant="secondary">
                          {CATEGORIES.find(c => c.value === post.category)?.[isRTL ? 'label_ar' : 'label_en'] || post.category}
                        </Badge>
                      </TableCell>
                      <TableCell className={isRTL ? 'text-right' : ''}>
                        <div className="flex items-center gap-2 flex-wrap">
                          {post.is_published ? (
                            <Badge className="bg-green-500">{isRTL ? 'منشور' : 'Published'}</Badge>
                          ) : post.scheduled_at && new Date(post.scheduled_at) > new Date() ? (
                            <Badge className="bg-amber-500 gap-1">
                              <Clock className="h-3 w-3" />
                              {isRTL ? 'مجدول' : 'Scheduled'}
                            </Badge>
                          ) : post.scheduled_at && new Date(post.scheduled_at) <= new Date() ? (
                            <Badge className="bg-orange-600 gap-1">
                              <Clock className="h-3 w-3" />
                              {isRTL ? 'مؤجل' : 'Postponed'}
                            </Badge>
                          ) : (
                            <Badge variant="outline">{isRTL ? 'مسودة' : 'Draft'}</Badge>
                          )}
                          {post.is_featured && (
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                        {post.scheduled_at && !post.is_published && new Date(post.scheduled_at) > new Date() && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(post.scheduled_at), 'MMM d, HH:mm')}
                          </p>
                        )}
                        {post.scheduled_at && !post.is_published && new Date(post.scheduled_at) <= new Date() && (
                          <p className="text-xs text-orange-500 mt-1">
                            {isRTL ? 'كان مجدولاً في' : 'Was scheduled for'} {format(new Date(post.scheduled_at), 'MMM d, HH:mm')}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className={isRTL ? 'text-right' : ''}>
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">
                            {format(new Date(post.created_at), 'MMM d, yyyy')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(post.created_at), 'h:mm a')}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className={isRTL ? 'text-left' : 'text-right'}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                            <DropdownMenuItem onClick={() => window.open(`/blog/${post.slug}`, '_blank')}>
                              <Eye className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                              {isRTL ? 'عرض' : 'View'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(post)}>
                              <Pencil className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                              {isRTL ? 'تحرير' : 'Edit'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => deleteMutation.mutate(post.id)}
                              className="text-destructive"
                            >
                              <Trash2 className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                              {isRTL ? 'حذف' : 'Delete'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Generation Dialog */}
      <Dialog open={isAIDialogOpen} onOpenChange={setIsAIDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Sparkles className="h-5 w-5 text-primary" />
              {isRTL ? 'إنشاء محتوى بالذكاء الاصطناعي' : 'AI Content Generator'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{isRTL ? 'الموضوع' : 'Topic'}</Label>
              <Textarea
                placeholder={isRTL 
                  ? 'مثال: كيف تختار الإضاءة المناسبة لغرفة المعيشة' 
                  : 'e.g., How to choose the right lighting for your living room'}
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground">
                {isRTL 
                  ? 'اكتب موضوعاً وسيقوم الذكاء الاصطناعي بإنشاء مقال كامل محسّن لمحركات البحث' 
                  : 'Enter a topic and AI will generate a complete SEO-optimized blog post'}
              </p>
            </div>
            <div className="space-y-2">
              <Label>{isRTL ? 'النبرة' : 'Tone'}</Label>
              <Select value={aiTone} onValueChange={(v: 'professional' | 'casual' | 'educational') => setAiTone(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">{isRTL ? 'احترافي' : 'Professional'}</SelectItem>
                  <SelectItem value="casual">{isRTL ? 'غير رسمي' : 'Casual'}</SelectItem>
                  <SelectItem value="educational">{isRTL ? 'تعليمي' : 'Educational'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAIDialogOpen(false)}>
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={generateAIContent} disabled={isGenerating} className="gap-2">
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isRTL ? 'جاري الإنشاء...' : 'Generating...'}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {isRTL ? 'إنشاء المحتوى' : 'Generate Content'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Post Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleEditorDialogOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>
                {editingPost 
                  ? (isRTL ? 'تحرير المقال' : 'Edit Post')
                  : (isRTL ? 'مقال جديد' : 'New Post')}
              </DialogTitle>
              {/* Auto-save status indicator */}
              <div className="flex items-center gap-2 text-sm">
                {autoSaveStatus === 'saving' && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {isRTL ? 'جاري الحفظ...' : 'Saving...'}
                  </span>
                )}
                {autoSaveStatus === 'saved' && (
                  <span className="flex items-center gap-1 text-green-500">
                    <Check className="h-3 w-3" />
                    {isRTL ? 'تم الحفظ تلقائياً' : 'Auto-saved'}
                  </span>
                )}
                {autoSaveStatus === 'unsaved' && (
                  <span className="flex items-center gap-1 text-amber-500">
                    <Save className="h-3 w-3" />
                    {isRTL ? 'تغييرات غير محفوظة' : 'Unsaved changes'}
                  </span>
                )}
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="content" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="content" className="gap-2">
                <FileText className="h-4 w-4" />
                {isRTL ? 'المحتوى' : 'Content'}
              </TabsTrigger>
              <TabsTrigger value="seo" className="gap-2">
                <Globe className="h-4 w-4" />
                {isRTL ? 'SEO' : 'SEO'}
              </TabsTrigger>
              <TabsTrigger value="media" className="gap-2">
                <ImageIcon className="h-4 w-4" />
                {isRTL ? 'الوسائط' : 'Media'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4 mt-4">
              {/* Titles Section */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{isRTL ? 'العنوان (إنجليزي)' : 'Title (English)'} *</Label>
                  <Input
                    value={formData.title_en}
                    onChange={(e) => updateFormData(prev => ({ 
                      ...prev, 
                      title_en: e.target.value,
                      slug: prev.slug || generateSlug(e.target.value)
                    }))}
                    placeholder="Enter title..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isRTL ? 'العنوان (عربي)' : 'Title (Arabic)'}</Label>
                  <Input
                    value={formData.title_ar}
                    onChange={(e) => updateFormData(prev => ({ ...prev, title_ar: e.target.value }))}
                    placeholder="أدخل العنوان..."
                    dir="rtl"
                  />
                </div>
              </div>

              {/* Generate All with AI Button */}
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateAllFromTitle}
                  disabled={isGeneratingAll || (!formData.title_en.trim() && !formData.title_ar.trim())}
                  className="gap-2"
                >
                  {isGeneratingAll ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {isRTL ? 'جاري الإنشاء...' : 'Generating...'}
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4" />
                      {isRTL ? 'إنشاء جميع الحقول بالذكاء الاصطناعي' : 'Generate All Fields with AI'}
                    </>
                  )}
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{isRTL ? 'المقتطف (إنجليزي)' : 'Excerpt (English)'}</Label>
                  <Textarea
                    value={formData.excerpt_en}
                    onChange={(e) => updateFormData(prev => ({ ...prev, excerpt_en: e.target.value }))}
                    placeholder="Brief description..."
                    className="min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isRTL ? 'المقتطف (عربي)' : 'Excerpt (Arabic)'}</Label>
                  <Textarea
                    value={formData.excerpt_ar}
                    onChange={(e) => updateFormData(prev => ({ ...prev, excerpt_ar: e.target.value }))}
                    placeholder="وصف مختصر..."
                    className="min-h-[80px]"
                    dir="rtl"
                  />
                </div>
              </div>

              {/* HTML Templates Section */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <Label className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-primary" />
                  {isRTL ? 'قوالب HTML جاهزة' : 'HTML Templates'}
                </Label>
                <div className="flex flex-wrap gap-2">
                  {HTML_TEMPLATES.map((template) => (
                    <DropdownMenu key={template.id}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1">
                          {isRTL ? template.label_ar : template.label_en}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => insertHtmlTemplate(template.id, 'en')}>
                          {isRTL ? 'إدراج في المحتوى الإنجليزي' : 'Insert to English Content'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => insertHtmlTemplate(template.id, 'ar')}>
                          {isRTL ? 'إدراج في المحتوى العربي' : 'Insert to Arabic Content'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {isRTL 
                    ? 'انقر على القالب واختر اللغة لإدراجه في المحتوى'
                    : 'Click a template and choose language to insert into content'}
                </p>
              </div>

              {/* Rich Text Editor for English Content */}
              <div className="space-y-2">
                <Label>{isRTL ? 'المحتوى (إنجليزي)' : 'Content (English)'}</Label>
                <RichTextEditor
                  content={formData.content_en}
                  onChange={(html) => updateFormData(prev => ({ ...prev, content_en: html }))}
                  placeholder="Start writing your blog post..."
                  dir="ltr"
                />
              </div>

              {/* Rich Text Editor for Arabic Content */}
              <div className="space-y-2">
                <Label>{isRTL ? 'المحتوى (عربي)' : 'Content (Arabic)'}</Label>
                <RichTextEditor
                  content={formData.content_ar}
                  onChange={(html) => updateFormData(prev => ({ ...prev, content_ar: html }))}
                  placeholder="ابدأ كتابة مقالك..."
                  dir="rtl"
                />
              </div>
            </TabsContent>

            {/* SEO Tab */}
            <TabsContent value="seo" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>{isRTL ? 'الرابط (Slug)' : 'URL Slug'}</Label>
                <div className="flex gap-2">
                  <span className="flex items-center text-muted-foreground text-sm">/blog/</span>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="url-friendly-slug"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{isRTL ? 'الفئة' : 'Category'}</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {isRTL ? cat.label_ar : cat.label_en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{isRTL ? 'الكاتب' : 'Author'}</Label>
                  <Input
                    value={formData.author_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, author_name: e.target.value }))}
                    placeholder="Author name"
                  />
                </div>
              </div>

              {/* Publishing Options */}
              <div className="space-y-4 border rounded-lg p-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {isRTL ? 'خيارات النشر' : 'Publishing Options'}
                </h4>
                
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_published}
                      onCheckedChange={(checked) => setFormData(prev => ({ 
                        ...prev, 
                        is_published: checked,
                        // Clear schedule if publishing immediately
                        scheduled_at: checked && prev.scheduled_at ? null : prev.scheduled_at
                      }))}
                    />
                    <Label>{isRTL ? 'منشور' : 'Published'}</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_featured}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
                    />
                    <Label>{isRTL ? 'مميز' : 'Featured'}</Label>
                  </div>
                </div>

                {/* Schedule Post */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {isRTL ? 'جدولة النشر' : 'Schedule Publishing'}
                  </Label>
                  <div className="flex flex-wrap gap-3 items-center">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-[280px] justify-start text-left font-normal",
                            !formData.scheduled_at && "text-muted-foreground"
                          )}
                          disabled={formData.is_published}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.scheduled_at ? (
                            format(formData.scheduled_at, "PPP 'at' HH:mm")
                          ) : (
                            <span>{isRTL ? 'اختر تاريخ ووقت' : 'Pick a date and time'}</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.scheduled_at || undefined}
                          onSelect={(date) => {
                            if (date) {
                              // Preserve time if already set, otherwise use current time
                              const existingTime = formData.scheduled_at;
                              if (existingTime) {
                                date.setHours(existingTime.getHours(), existingTime.getMinutes());
                              } else {
                                const now = new Date();
                                date.setHours(now.getHours(), now.getMinutes());
                              }
                            }
                            setFormData(prev => ({ ...prev, scheduled_at: date || null }));
                          }}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                        {/* Time picker */}
                        <div className="border-t p-3 flex items-center gap-2">
                          <Label className="text-sm">{isRTL ? 'الوقت:' : 'Time:'}</Label>
                          <Input
                            type="time"
                            className="w-32"
                            value={formData.scheduled_at ? format(formData.scheduled_at, 'HH:mm') : ''}
                            onChange={(e) => {
                              const [hours, minutes] = e.target.value.split(':').map(Number);
                              const newDate = formData.scheduled_at ? new Date(formData.scheduled_at) : new Date();
                              newDate.setHours(hours, minutes);
                              setFormData(prev => ({ ...prev, scheduled_at: newDate }));
                            }}
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                    
                    {formData.scheduled_at && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, scheduled_at: null }))}
                      >
                        {isRTL ? 'مسح' : 'Clear'}
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formData.is_published 
                      ? (isRTL ? 'المقال منشور بالفعل. ألغ النشر لجدولته.' : 'Post is already published. Unpublish to schedule.')
                      : (isRTL ? 'حدد تاريخًا ووقتًا لنشر المقال تلقائيًا' : 'Set a date and time to automatically publish this post')}
                  </p>
                </div>

                {/* Schedule Status Badge */}
                {formData.scheduled_at && !formData.is_published && (
                  <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <span className="text-sm">
                      {isRTL 
                        ? `سيتم النشر في ${format(formData.scheduled_at, "d MMMM yyyy 'الساعة' HH:mm")}`
                        : `Scheduled for ${format(formData.scheduled_at, "MMMM d, yyyy 'at' HH:mm")}`}
                    </span>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Media Tab */}
            <TabsContent value="media" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>{isRTL ? 'رابط الصورة الرئيسية' : 'Featured Image URL'}</Label>
                <Input
                  value={formData.featured_image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, featured_image_url: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              {formData.featured_image_url && (
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-2">{isRTL ? 'معاينة:' : 'Preview:'}</p>
                  <img 
                    src={formData.featured_image_url} 
                    alt="Preview" 
                    className="max-w-full h-48 object-cover rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                </div>
              )}

              {/* Custom AI Image Generator */}
              <div className="space-y-3 border rounded-lg p-4">
                <Label className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-primary" />
                  {isRTL ? 'إنشاء صورة مخصصة بالذكاء الاصطناعي' : 'Custom AI Image Generator'}
                </Label>
                
                {/* AI Describe from Content Button */}
                <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {isRTL ? 'إنشاء وصف الصورة من المحتوى' : 'Generate prompt from content'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isRTL 
                        ? 'تحليل محتوى المقال وإنشاء وصف صورة مناسب تلقائياً'
                        : 'Analyze your post content and auto-generate a relevant image prompt'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateImagePromptFromContent}
                    disabled={isGeneratingImagePrompt || (!formData.content_en.trim() && !formData.title_en.trim())}
                    className="gap-2 shrink-0"
                  >
                    {isGeneratingImagePrompt ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {isRTL ? 'جاري التحليل...' : 'Analyzing...'}
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4" />
                        {isRTL ? 'تحليل المحتوى' : 'Describe from Content'}
                      </>
                    )}
                  </Button>
                </div>

                {/* Aspect Ratio and Model Selection */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{isRTL ? 'نسبة الأبعاد' : 'Aspect Ratio'}</Label>
                    <Select value={imageAspectRatio} onValueChange={setImageAspectRatio}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ASPECT_RATIOS.map((ar) => (
                          <SelectItem key={ar.value} value={ar.value}>
                            {ar.label} ({ar.width}×{ar.height})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      {isRTL ? 'نموذج الذكاء الاصطناعي' : 'AI Model'}
                      <Badge variant="secondary" className="text-xs">
                        {imageProvider === 'google' ? 'Google AI' : 'OpenRouter'}
                      </Badge>
                    </Label>
                    <Select value={imageModel} onValueChange={setImageModel}>
                      <SelectTrigger>
                        <SelectValue placeholder={isRTL ? 'اختر النموذج' : 'Select model'} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableImageModels.map((model) => (
                          <SelectItem key={model.value} value={model.value}>
                            <div>
                              <span>{model.label}</span>
                              <span className="text-xs text-muted-foreground ms-2">
                                - {model.description}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {isRTL 
                        ? `المزود: ${imageProvider === 'google' ? 'Google AI Studio' : 'OpenRouter'} - يمكنك تغييره من الإعدادات`
                        : `Provider: ${imageProvider === 'google' ? 'Google AI Studio' : 'OpenRouter'} - Change in Settings`}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Textarea
                    value={customImagePrompt}
                    onChange={(e) => setCustomImagePrompt(e.target.value)}
                    placeholder={isRTL 
                      ? 'اكتب وصفاً للصورة التي تريد إنشاءها... مثال: صورة احترافية لمصباح LED حديث في غرفة معيشة أنيقة'
                      : 'Describe the image you want to generate... e.g., Professional photo of a modern LED lamp in an elegant living room'}
                    className="min-h-[80px]"
                  />
                </div>
                <Button
                  onClick={generateCustomImage}
                  disabled={isGeneratingCustomImage || !customImagePrompt.trim()}
                  className="gap-2"
                >
                  {isGeneratingCustomImage ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {isRTL ? 'جاري الإنشاء...' : 'Generating...'}
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      {isRTL ? 'إنشاء صورة' : 'Generate Image'}
                    </>
                  )}
                </Button>

                {/* Custom Generated Image Preview */}
                {customGeneratedImage && (
                  <div className="relative mt-3">
                    <img 
                      src={customGeneratedImage} 
                      alt="Custom generated"
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    <Button
                      size="sm"
                      className="absolute bottom-2 right-2 gap-1"
                      onClick={() => useGeneratedImageAsFeatured(customGeneratedImage)}
                    >
                      <Upload className="h-3 w-3" />
                      {isRTL ? 'استخدام كصورة رئيسية' : 'Use as Featured'}
                    </Button>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  {isRTL 
                    ? 'اكتب وصفاً تفصيلياً للحصول على أفضل النتائج. يمكنك ذكر الأسلوب واللون والإضاءة والخلفية.'
                    : 'Write a detailed description for best results. You can mention style, colors, lighting, and background.'}
                </p>
              </div>

              {/* AI Image Suggestions with Generation */}
              {generatedImages.length > 0 && (
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    {isRTL ? 'اقتراحات الصور من الذكاء الاصطناعي' : 'AI Image Suggestions'}
                  </Label>
                  <div className="grid gap-3">
                    {generatedImages.map((suggestion, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                            {index + 1}
                          </span>
                          <p className="text-sm flex-1">{suggestion}</p>
                        </div>
                        
                        {/* Generated Image Preview */}
                        {generatedImageUrls[index] && (
                          <div className="relative">
                            <img 
                              src={generatedImageUrls[index]} 
                              alt={`Generated ${index + 1}`}
                              className="w-full h-48 object-cover rounded-lg border"
                            />
                            <Button
                              size="sm"
                              className="absolute bottom-2 right-2 gap-1"
                              onClick={() => useGeneratedImageAsFeatured(generatedImageUrls[index])}
                            >
                              <Upload className="h-3 w-3" />
                              {isRTL ? 'استخدام كصورة رئيسية' : 'Use as Featured'}
                            </Button>
                          </div>
                        )}
                        
                        {/* Generate Button */}
                        {!generatedImageUrls[index] && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => generateImageFromSuggestion(suggestion, index)}
                            disabled={generatingImageIndex !== null}
                          >
                            {generatingImageIndex === index ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {isRTL ? 'جاري الإنشاء...' : 'Generating...'}
                              </>
                            ) : (
                              <>
                                <ImageIcon className="h-4 w-4" />
                                {isRTL ? 'إنشاء صورة' : 'Generate Image'}
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isRTL 
                      ? 'هذه اقتراحات تم إنشاؤها تلقائياً بناءً على موضوع المقال'
                      : 'These are auto-generated suggestions based on your post topic'}
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6 flex-col sm:flex-row gap-2">
            <Button 
              variant="secondary" 
              onClick={openPreview}
              className="gap-2 w-full sm:w-auto"
            >
              <ExternalLink className="h-4 w-4" />
              {isRTL ? 'معاينة' : 'Preview'}
            </Button>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={handleCloseDialog}>
                {isRTL ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button onClick={handleSubmit} disabled={saveMutation.isPending} className="gap-2">
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isRTL ? 'جاري الحفظ...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    {formData.is_published ? (
                      <>{isRTL ? 'نشر' : 'Publish'}</>
                    ) : (
                      <>{isRTL ? 'حفظ كمسودة' : 'Save as Draft'}</>
                    )}
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Blog Preview Mode */}
      <AnimatePresence>
        {isPreviewMode && (
            <BlogPreview
            title_en={formData.title_en}
            title_ar={formData.title_ar}
            excerpt_en={formData.excerpt_en}
            excerpt_ar={formData.excerpt_ar}
            content_en={formData.content_en}
            content_ar={formData.content_ar}
            featured_image_url={formData.featured_image_url}
            category={formData.category}
            author_name={formData.author_name}
            isRTL={isRTL}
              onClose={closePreview}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

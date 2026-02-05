import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Sparkles,
  Loader2,
  Star,
  Upload,
  Wand2,
  Quote,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Testimonial type from database
interface Testimonial {
  id: string;
  author_name: string;
  author_name_ar: string | null;
  author_title: string | null;
  author_title_ar: string | null;
  author_image_url: string | null;
  content_en: string;
  content_ar: string | null;
  rating: number | null;
  is_active: boolean | null;
  is_featured: boolean | null;
  created_at: string;
  updated_at: string;
}

// Form data for creating/editing testimonials
interface TestimonialFormData {
  author_name: string;
  author_name_ar: string;
  author_title: string;
  author_title_ar: string;
  author_image_url: string;
  content_en: string;
  content_ar: string;
  rating: number;
  is_active: boolean;
  is_featured: boolean;
}

const initialFormData: TestimonialFormData = {
  author_name: '',
  author_name_ar: '',
  author_title: '',
  author_title_ar: '',
  author_image_url: '',
  content_en: '',
  content_ar: '',
  rating: 5,
  is_active: true,
  is_featured: false,
};

export default function AdminTestimonials() {
  const { t } = useTranslation();
  const { isRTL, language } = useLanguage();
  const queryClient = useQueryClient();

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [formData, setFormData] = useState<TestimonialFormData>(initialFormData);
  const [aiTopic, setAiTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Fetch testimonials from database
  const { data: testimonials = [], isLoading } = useQuery({
    queryKey: ['admin-testimonials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Testimonial[];
    },
  });

  // Filter testimonials by search
  const filteredTestimonials = testimonials.filter(testimonial => 
    testimonial.author_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    testimonial.author_name_ar?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    testimonial.content_en.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: TestimonialFormData) => {
      const testimonialData = {
        author_name: data.author_name,
        author_name_ar: data.author_name_ar || null,
        author_title: data.author_title || null,
        author_title_ar: data.author_title_ar || null,
        author_image_url: data.author_image_url || null,
        content_en: data.content_en,
        content_ar: data.content_ar || null,
        rating: data.rating,
        is_active: data.is_active,
        is_featured: data.is_featured,
      };

      if (editingTestimonial) {
        const { error } = await supabase
          .from('testimonials')
          .update(testimonialData)
          .eq('id', editingTestimonial.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('testimonials')
          .insert(testimonialData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] });
      toast({
        title: isRTL ? 'تم الحفظ' : 'Saved',
        description: isRTL ? 'تم حفظ الشهادة بنجاح' : 'Testimonial saved successfully',
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
        .from('testimonials')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] });
      toast({
        title: isRTL ? 'تم الحذف' : 'Deleted',
        description: isRTL ? 'تم حذف الشهادة' : 'Testimonial deleted',
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
      const { data, error } = await supabase.functions.invoke('generate-ai-content', {
        body: {
          type: 'testimonial',
          prompt: `Generate a realistic customer testimonial for a lighting company: ${aiTopic}. Include author name, title/profession, and the testimonial content. Make it sound authentic and professional.`,
          language: 'both',
        },
      });

      if (error) throw error;

      if (data?.success && data.content) {
        const content = data.content;
        
        setFormData(prev => ({
          ...prev,
          author_name: content.author_name || prev.author_name,
          author_name_ar: content.author_name_ar || prev.author_name_ar,
          author_title: content.author_title || prev.author_title,
          author_title_ar: content.author_title_ar || prev.author_title_ar,
          content_en: content.content_en || prev.content_en,
          content_ar: content.content_ar || prev.content_ar,
          rating: content.rating || 5,
        }));

        toast({
          title: isRTL ? 'تم إنشاء المحتوى' : 'Content Generated',
          description: isRTL 
            ? 'تم إنشاء الشهادة بنجاح' 
            : 'Testimonial generated successfully',
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

  // AI Avatar Generation
  const generateAIAvatar = async () => {
    setIsGeneratingImage(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-content', {
        body: {
          type: 'image',
          prompt: `Professional headshot portrait of ${formData.author_title || 'a business professional'}, clean background, corporate style, high quality photo`,
          productName: formData.author_name || 'Customer',
        },
      });

      if (error) throw error;

      if (data?.success && data.imageBase64) {
        // Convert base64 to blob and upload
        const response = await fetch(`data:image/png;base64,${data.imageBase64}`);
        const blob = await response.blob();
        
        const filename = `testimonial-avatar-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
        const filePath = `testimonial-avatars/${filename}`;
        
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, blob, {
            contentType: 'image/png',
            cacheControl: '3600',
          });
        
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);
        
        setFormData(prev => ({ ...prev, author_image_url: urlData.publicUrl }));
        
        toast({
          title: isRTL ? 'تم إنشاء الصورة' : 'Avatar Generated',
          description: isRTL ? 'تم إنشاء صورة الملف الشخصي بنجاح' : 'Profile image generated successfully',
        });
      } else {
        throw new Error(data?.error || 'Failed to generate avatar');
      }
    } catch (error: unknown) {
      console.error('Avatar generation error:', error);
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate avatar',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);

    try {
      const filename = `testimonial-avatar-${Date.now()}-${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
      const filePath = `testimonial-avatars/${filename}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          contentType: file.type,
          cacheControl: '3600',
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, author_image_url: urlData.publicUrl }));

      toast({
        title: isRTL ? 'تم الرفع' : 'Uploaded',
        description: isRTL ? 'تم رفع الصورة بنجاح' : 'Image uploaded successfully',
      });
    } catch (error: unknown) {
      console.error('Upload error:', error);
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTestimonial(null);
    setFormData(initialFormData);
  };

  // Handle edit
  const handleEdit = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    setFormData({
      author_name: testimonial.author_name,
      author_name_ar: testimonial.author_name_ar || '',
      author_title: testimonial.author_title || '',
      author_title_ar: testimonial.author_title_ar || '',
      author_image_url: testimonial.author_image_url || '',
      content_en: testimonial.content_en,
      content_ar: testimonial.content_ar || '',
      rating: testimonial.rating ?? 5,
      is_active: testimonial.is_active ?? true,
      is_featured: testimonial.is_featured ?? false,
    });
    setIsDialogOpen(true);
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!formData.author_name.trim() || !formData.content_en.trim()) {
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'اسم المؤلف والمحتوى مطلوبان' : 'Author name and content are required',
        variant: 'destructive',
      });
      return;
    }

    saveMutation.mutate(formData);
  };

  // Render stars
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={cn(
              'h-4 w-4',
              i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('admin.testimonials.title', 'Testimonials')}
          </h1>
          <p className="text-muted-foreground">
            {t('admin.testimonials.description', 'Manage customer testimonials')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsAIDialogOpen(true)}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {t('admin.testimonials.generateWithAI', 'Generate with AI')}
          </Button>
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('admin.testimonials.add', 'Add Testimonial')}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('admin.testimonials.search', 'Search testimonials...')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Testimonials Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>{t('admin.testimonials.author', 'Author')}</TableHead>
                <TableHead>{t('admin.testimonials.content', 'Content')}</TableHead>
                <TableHead>{t('admin.testimonials.rating', 'Rating')}</TableHead>
                <TableHead>{t('admin.testimonials.status', 'Status')}</TableHead>
                <TableHead>{t('admin.testimonials.featured', 'Featured')}</TableHead>
                <TableHead className="text-right">{t('common.actions', 'Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredTestimonials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {t('admin.testimonials.noTestimonials', 'No testimonials found')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTestimonials.map((testimonial, index) => (
                  <TableRow key={testimonial.id}>
                    <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={testimonial.author_image_url || undefined} />
                          <AvatarFallback>
                            {testimonial.author_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {language === 'ar' && testimonial.author_name_ar 
                              ? testimonial.author_name_ar 
                              : testimonial.author_name}
                          </p>
                          {testimonial.author_title && (
                            <p className="text-sm text-muted-foreground">
                              {language === 'ar' && testimonial.author_title_ar 
                                ? testimonial.author_title_ar 
                                : testimonial.author_title}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm line-clamp-2 max-w-xs">
                        {language === 'ar' && testimonial.content_ar 
                          ? testimonial.content_ar 
                          : testimonial.content_en}
                      </p>
                    </TableCell>
                    <TableCell>
                      {renderStars(testimonial.rating ?? 5)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={testimonial.is_active ? 'default' : 'secondary'}>
                        {testimonial.is_active 
                          ? t('admin.testimonials.active', 'Active') 
                          : t('admin.testimonials.inactive', 'Inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {testimonial.is_featured && (
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600">
                          {t('admin.testimonials.featuredBadge', 'Featured')}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(testimonial)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            {t('common.edit', 'Edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deleteMutation.mutate(testimonial.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t('common.delete', 'Delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* AI Generation Dialog */}
      <Dialog open={isAIDialogOpen} onOpenChange={setIsAIDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              {t('admin.testimonials.generateWithAI', 'Generate with AI')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('admin.testimonials.aiTopic', 'Customer Type / Scenario')}</Label>
              <Textarea
                placeholder={isRTL 
                  ? 'مثال: مصمم داخلي يشتري إضاءة لفيلا فاخرة...'
                  : 'Example: Interior designer buying lighting for a luxury villa...'}
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAIDialogOpen(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button onClick={generateAIContent} disabled={isGenerating}>
              {isGenerating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('admin.testimonials.generate', 'Generate')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTestimonial 
                ? t('admin.testimonials.edit', 'Edit Testimonial') 
                : t('admin.testimonials.add', 'Add Testimonial')}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="author" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="author">{t('admin.testimonials.author', 'Author')}</TabsTrigger>
              <TabsTrigger value="content">{t('admin.testimonials.content', 'Content')}</TabsTrigger>
              <TabsTrigger value="settings">{t('admin.testimonials.settings', 'Settings')}</TabsTrigger>
            </TabsList>

            <TabsContent value="author" className="space-y-4 mt-4">
              {/* Author Avatar */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={formData.author_image_url || undefined} />
                  <AvatarFallback className="text-2xl">
                    {formData.author_name?.charAt(0) || <User className="h-8 w-8" />}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2 flex-1">
                  <Label>{t('admin.testimonials.authorImage', 'Author Image')}</Label>
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={isUploadingImage}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateAIAvatar}
                      disabled={isGeneratingImage}
                    >
                      {isGeneratingImage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Wand2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Author Name English */}
              <div className="space-y-2">
                <Label>{t('admin.testimonials.authorNameEn', 'Author Name (English)')}</Label>
                <Input
                  value={formData.author_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, author_name: e.target.value }))}
                  placeholder="John Smith"
                />
              </div>

              {/* Author Name Arabic */}
              <div className="space-y-2">
                <Label>{t('admin.testimonials.authorNameAr', 'Author Name (Arabic)')}</Label>
                <Input
                  value={formData.author_name_ar}
                  onChange={(e) => setFormData(prev => ({ ...prev, author_name_ar: e.target.value }))}
                  placeholder="جون سميث"
                  dir="rtl"
                />
              </div>

              {/* Author Title English */}
              <div className="space-y-2">
                <Label>{t('admin.testimonials.authorTitleEn', 'Title/Profession (English)')}</Label>
                <Input
                  value={formData.author_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, author_title: e.target.value }))}
                  placeholder="Interior Designer"
                />
              </div>

              {/* Author Title Arabic */}
              <div className="space-y-2">
                <Label>{t('admin.testimonials.authorTitleAr', 'Title/Profession (Arabic)')}</Label>
                <Input
                  value={formData.author_title_ar}
                  onChange={(e) => setFormData(prev => ({ ...prev, author_title_ar: e.target.value }))}
                  placeholder="مصمم داخلي"
                  dir="rtl"
                />
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-4 mt-4">
              {/* Content English */}
              <div className="space-y-2">
                <Label>{t('admin.testimonials.contentEn', 'Testimonial (English)')}</Label>
                <Textarea
                  value={formData.content_en}
                  onChange={(e) => setFormData(prev => ({ ...prev, content_en: e.target.value }))}
                  placeholder="The customer's testimonial in English..."
                  rows={5}
                />
              </div>

              {/* Content Arabic */}
              <div className="space-y-2">
                <Label>{t('admin.testimonials.contentAr', 'Testimonial (Arabic)')}</Label>
                <Textarea
                  value={formData.content_ar}
                  onChange={(e) => setFormData(prev => ({ ...prev, content_ar: e.target.value }))}
                  placeholder="شهادة العميل بالعربية..."
                  rows={5}
                  dir="rtl"
                />
              </div>

              {/* Rating */}
              <div className="space-y-4">
                <Label>{t('admin.testimonials.rating', 'Rating')}</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[formData.rating]}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, rating: value[0] }))}
                    min={1}
                    max={5}
                    step={1}
                    className="flex-1"
                  />
                  <div className="flex gap-0.5">
                    {renderStars(formData.rating)}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 mt-4">
              {/* Status Toggles */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label>{t('admin.testimonials.active', 'Active')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('admin.testimonials.activeDesc', 'Show this testimonial on the website')}
                  </p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <Label>{t('admin.testimonials.featured', 'Featured')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('admin.testimonials.featuredDesc', 'Show on the home page')}
                  </p>
                </div>
                <Switch
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={handleCloseDialog}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('common.save', 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

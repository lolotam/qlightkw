import { useState } from 'react';
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
  Sparkles,
  Loader2,
  Image as ImageIcon,
  MapPin,
  Calendar,
  Upload,
  Wand2,
  Building2,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import SEOSection from '@/components/admin/SEOSection';

// Project type from database
interface Project {
  id: string;
  slug: string;
  title_en: string;
  title_ar: string;
  description_en: string | null;
  description_ar: string | null;
  location: string | null;
  client_name: string | null;
  completion_date: string | null;
  is_active: boolean | null;
  is_featured: boolean | null;
  created_at: string;
  updated_at: string;
  seo_title_en?: string | null;
  seo_title_ar?: string | null;
  seo_description_en?: string | null;
  seo_description_ar?: string | null;
}

interface ProjectImage {
  id: string;
  project_id: string;
  url: string;
  alt_text_en: string | null;
  alt_text_ar: string | null;
  is_primary: boolean | null;
  sort_order: number | null;
}

// Form data for creating/editing projects
interface ProjectFormData {
  title_en: string;
  title_ar: string;
  slug: string;
  description_en: string;
  description_ar: string;
  location: string;
  client_name: string;
  completion_date: string;
  is_active: boolean;
  is_featured: boolean;
  image_url: string;
  seo_title_en: string;
  seo_title_ar: string;
  seo_description_en: string;
  seo_description_ar: string;
}

const initialFormData: ProjectFormData = {
  title_en: '',
  title_ar: '',
  slug: '',
  description_en: '',
  description_ar: '',
  location: '',
  client_name: '',
  completion_date: '',
  is_active: true,
  is_featured: false,
  image_url: '',
  seo_title_en: '',
  seo_title_ar: '',
  seo_description_en: '',
  seo_description_ar: '',
};

export default function AdminProjects() {
  const { t } = useTranslation();
  const { isRTL, language } = useLanguage();
  const queryClient = useQueryClient();

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>(initialFormData);
  const [aiTopic, setAiTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [customImagePrompt, setCustomImagePrompt] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Fetch projects from database
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['admin-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Project[];
    },
  });

  // Filter projects by search
  const filteredProjects = projects.filter(project => 
    project.title_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.title_ar?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      const projectData = {
        title_en: data.title_en,
        title_ar: data.title_ar,
        slug: data.slug,
        description_en: data.description_en,
        description_ar: data.description_ar,
        location: data.location || null,
        client_name: data.client_name || null,
        completion_date: data.completion_date || null,
        is_active: data.is_active,
        is_featured: data.is_featured,
        seo_title_en: data.seo_title_en || null,
        seo_title_ar: data.seo_title_ar || null,
        seo_description_en: data.seo_description_en || null,
        seo_description_ar: data.seo_description_ar || null,
      };

      let projectId: string;

      if (editingProject) {
        const { error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', editingProject.id);
        if (error) throw error;
        projectId = editingProject.id;
      } else {
        const { data: newProject, error } = await supabase
          .from('projects')
          .insert(projectData)
          .select()
          .single();
        if (error) throw error;
        projectId = newProject.id;
      }

      // Handle image if provided
      if (data.image_url && projectId) {
        // Check if primary image exists
        const { data: existingImages } = await supabase
          .from('project_images')
          .select('id')
          .eq('project_id', projectId)
          .eq('is_primary', true);

        if (existingImages && existingImages.length > 0) {
          // Update existing primary image
          await supabase
            .from('project_images')
            .update({ url: data.image_url })
            .eq('id', existingImages[0].id);
        } else {
          // Insert new primary image
          await supabase
            .from('project_images')
            .insert({
              project_id: projectId,
              url: data.image_url,
              is_primary: true,
              sort_order: 0,
            });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
      toast({
        title: isRTL ? 'تم الحفظ' : 'Saved',
        description: isRTL ? 'تم حفظ المشروع بنجاح' : 'Project saved successfully',
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
      // Delete images first
      await supabase
        .from('project_images')
        .delete()
        .eq('project_id', id);
      
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
      toast({
        title: isRTL ? 'تم الحذف' : 'Deleted',
        description: isRTL ? 'تم حذف المشروع' : 'Project deleted',
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
          type: 'project',
          prompt: `Generate content for a lighting project: ${aiTopic}. Include title, description, and location suggestions.`,
          language: 'both',
        },
      });

      if (error) throw error;

      if (data?.success && data.content) {
        const content = data.content;
        
        setFormData(prev => ({
          ...prev,
          title_en: content.title_en || prev.title_en,
          title_ar: content.title_ar || prev.title_ar,
          description_en: content.description_en || prev.description_en,
          description_ar: content.description_ar || prev.description_ar,
          location: content.location || prev.location,
          slug: generateSlug(content.title_en || aiTopic),
        }));

        toast({
          title: isRTL ? 'تم إنشاء المحتوى' : 'Content Generated',
          description: isRTL 
            ? 'تم إنشاء المحتوى بنجاح' 
            : 'Content generated successfully',
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

  // AI Image Generation
  const generateAIImage = async () => {
    const prompt = customImagePrompt || `Professional lighting project photo for ${formData.title_en || 'commercial building'}, modern interior design, warm lighting, high quality architectural photography`;

    setIsGeneratingImage(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-content', {
        body: {
          type: 'image',
          prompt: prompt,
          productName: formData.title_en || 'Project',
        },
      });

      if (error) throw error;

      if (data?.success && data.imageBase64) {
        // Convert base64 to blob and upload
        const response = await fetch(`data:image/png;base64,${data.imageBase64}`);
        const blob = await response.blob();
        
        const filename = `project-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
        const filePath = `project-images/${filename}`;
        
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
        
        setFormData(prev => ({ ...prev, image_url: urlData.publicUrl }));
        
        toast({
          title: isRTL ? 'تم إنشاء الصورة' : 'Image Generated',
          description: isRTL ? 'تم إنشاء وتحميل الصورة بنجاح' : 'Image generated and uploaded successfully',
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
      setIsGeneratingImage(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);

    try {
      const filename = `project-${Date.now()}-${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
      const filePath = `project-images/${filename}`;

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

      setFormData(prev => ({ ...prev, image_url: urlData.publicUrl }));

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
    setEditingProject(null);
    setFormData(initialFormData);
    setCustomImagePrompt('');
  };

  // Handle edit
  const handleEdit = async (project: Project) => {
    // Fetch project image
    const { data: images } = await supabase
      .from('project_images')
      .select('url')
      .eq('project_id', project.id)
      .eq('is_primary', true)
      .maybeSingle();

    setEditingProject(project);
    setFormData({
      title_en: project.title_en,
      title_ar: project.title_ar,
      slug: project.slug,
      description_en: project.description_en || '',
      description_ar: project.description_ar || '',
      location: project.location || '',
      client_name: project.client_name || '',
      completion_date: project.completion_date || '',
      is_active: project.is_active ?? true,
      is_featured: project.is_featured ?? false,
      image_url: images?.url || '',
      seo_title_en: project.seo_title_en || '',
      seo_title_ar: project.seo_title_ar || '',
      seo_description_en: project.seo_description_en || '',
      seo_description_ar: project.seo_description_ar || '',
    });
    setIsDialogOpen(true);
  };

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 60);
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!formData.title_en.trim() || !formData.title_ar.trim()) {
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'العنوان مطلوب' : 'Title is required in both languages',
        variant: 'destructive',
      });
      return;
    }

    // Auto-generate slug if empty
    if (!formData.slug) {
      formData.slug = generateSlug(formData.title_en);
    }

    saveMutation.mutate(formData);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('admin.projects.title', 'Projects')}
          </h1>
          <p className="text-muted-foreground">
            {t('admin.projects.description', 'Manage your portfolio projects')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsAIDialogOpen(true)}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {t('admin.projects.generateWithAI', 'Generate with AI')}
          </Button>
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('admin.projects.add', 'Add Project')}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('admin.projects.search', 'Search projects...')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Projects Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>{t('admin.projects.image', 'Image')}</TableHead>
                <TableHead>{t('admin.projects.titleColumn', 'Title')}</TableHead>
                <TableHead>{t('admin.projects.location', 'Location')}</TableHead>
                <TableHead>{t('admin.projects.status', 'Status')}</TableHead>
                <TableHead>{t('admin.projects.featured', 'Featured')}</TableHead>
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
              ) : filteredProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {t('admin.projects.noProjects', 'No projects found')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredProjects.map((project, index) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                    <TableCell>
                      <div className="w-16 h-12 rounded bg-muted flex items-center justify-center overflow-hidden">
                        <Building2 className="h-6 w-6 text-muted-foreground" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{language === 'ar' ? project.title_ar : project.title_en}</p>
                        {project.client_name && (
                          <p className="text-sm text-muted-foreground">{project.client_name}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {project.location && (
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3" />
                          {project.location}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={project.is_active ? 'default' : 'secondary'}>
                        {project.is_active 
                          ? t('admin.projects.active', 'Active') 
                          : t('admin.projects.inactive', 'Inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {project.is_featured && (
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600">
                          {t('admin.projects.featuredBadge', 'Featured')}
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
                          <DropdownMenuItem onClick={() => handleEdit(project)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            {t('common.edit', 'Edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deleteMutation.mutate(project.id)}
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
              {t('admin.projects.generateWithAI', 'Generate with AI')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('admin.projects.aiTopic', 'Project Topic')}</Label>
              <Textarea
                placeholder={isRTL 
                  ? 'مثال: مشروع إضاءة فندق فاخر في مدينة الكويت...'
                  : 'Example: Luxury hotel lighting project in Kuwait City...'}
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
              {t('admin.projects.generate', 'Generate')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProject 
                ? t('admin.projects.edit', 'Edit Project') 
                : t('admin.projects.add', 'Add Project')}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="content">{t('admin.projects.content', 'Content')}</TabsTrigger>
              <TabsTrigger value="details">{t('admin.projects.details', 'Details')}</TabsTrigger>
              <TabsTrigger value="image">{t('admin.projects.image', 'Image')}</TabsTrigger>
              <TabsTrigger value="seo">{t('admin.seo', 'SEO')}</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4 mt-4">
              {/* Title English */}
              <div className="space-y-2">
                <Label>{t('admin.projects.titleEn', 'Title (English)')}</Label>
                <Input
                  value={formData.title_en}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      title_en: e.target.value,
                      slug: generateSlug(e.target.value),
                    }));
                  }}
                  placeholder="Project title in English"
                />
              </div>

              {/* Title Arabic */}
              <div className="space-y-2">
                <Label>{t('admin.projects.titleAr', 'Title (Arabic)')}</Label>
                <Input
                  value={formData.title_ar}
                  onChange={(e) => setFormData(prev => ({ ...prev, title_ar: e.target.value }))}
                  placeholder="عنوان المشروع بالعربية"
                  dir="rtl"
                />
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <Label>{t('admin.projects.slug', 'URL Slug')}</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="project-url-slug"
                />
              </div>

              {/* Description English */}
              <div className="space-y-2">
                <Label>{t('admin.projects.descriptionEn', 'Description (English)')}</Label>
                <Textarea
                  value={formData.description_en}
                  onChange={(e) => setFormData(prev => ({ ...prev, description_en: e.target.value }))}
                  placeholder="Project description in English"
                  rows={4}
                />
              </div>

              {/* Description Arabic */}
              <div className="space-y-2">
                <Label>{t('admin.projects.descriptionAr', 'Description (Arabic)')}</Label>
                <Textarea
                  value={formData.description_ar}
                  onChange={(e) => setFormData(prev => ({ ...prev, description_ar: e.target.value }))}
                  placeholder="وصف المشروع بالعربية"
                  rows={4}
                  dir="rtl"
                />
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4 mt-4">
              {/* Location */}
              <div className="space-y-2">
                <Label>{t('admin.projects.location', 'Location')}</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Kuwait City"
                />
              </div>

              {/* Client Name */}
              <div className="space-y-2">
                <Label>{t('admin.projects.clientName', 'Client Name')}</Label>
                <Input
                  value={formData.client_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, client_name: e.target.value }))}
                  placeholder="Client or company name"
                />
              </div>

              {/* Completion Date */}
              <div className="space-y-2">
                <Label>{t('admin.projects.completionDate', 'Completion Date')}</Label>
                <Input
                  type="date"
                  value={formData.completion_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, completion_date: e.target.value }))}
                />
              </div>

              {/* Status Toggles */}
              <div className="flex items-center justify-between">
                <Label>{t('admin.projects.active', 'Active')}</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>{t('admin.projects.featured', 'Featured')}</Label>
                <Switch
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
                />
              </div>
            </TabsContent>

            <TabsContent value="image" className="space-y-4 mt-4">
              {/* Current Image */}
              {formData.image_url && (
                <div className="space-y-2">
                  <Label>{t('admin.projects.currentImage', 'Current Image')}</Label>
                  <div className="relative rounded-lg overflow-hidden border">
                    <img 
                      src={formData.image_url} 
                      alt="Project" 
                      className="w-full h-48 object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Upload Image */}
              <div className="space-y-2">
                <Label>{t('admin.projects.uploadImage', 'Upload Image')}</Label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={isUploadingImage}
                  />
                  {isUploadingImage && <Loader2 className="h-5 w-5 animate-spin" />}
                </div>
              </div>

              {/* AI Image Generation */}
              <div className="space-y-2 pt-4 border-t">
                <Label className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4" />
                  {t('admin.projects.generateImage', 'Generate Image with AI')}
                </Label>
                <Textarea
                  placeholder={isRTL 
                    ? 'صف الصورة التي تريد إنشاءها...'
                    : 'Describe the image you want to generate...'}
                  value={customImagePrompt}
                  onChange={(e) => setCustomImagePrompt(e.target.value)}
                  rows={2}
                />
                <Button 
                  onClick={generateAIImage} 
                  disabled={isGeneratingImage}
                  className="w-full"
                >
                  {isGeneratingImage ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('admin.projects.generating', 'Generating...')}
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      {t('admin.projects.generateImage', 'Generate Image')}
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* SEO Tab */}
            <TabsContent value="seo" className="space-y-4 mt-4">
              <SEOSection
                data={{
                  seo_title_en: formData.seo_title_en,
                  seo_title_ar: formData.seo_title_ar,
                  seo_description_en: formData.seo_description_en,
                  seo_description_ar: formData.seo_description_ar,
                }}
                onChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
                referenceData={{
                  name_en: formData.title_en,
                  name_ar: formData.title_ar,
                  slug: formData.slug,
                  description_en: formData.description_en,
                  description_ar: formData.description_ar,
                }}
                entityType="project"
              />
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

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, GripVertical, Image, Video, Eye, EyeOff, Loader2, RotateCcw, Smartphone, Monitor } from 'lucide-react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import HeroSlideEditor from '@/components/admin/HeroSlideEditor';

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

interface FeatureToggle {
  id: string;
  feature_key: string;
  feature_name: string;
  feature_name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  category: string | null;
  is_enabled: boolean;
}

// Sortable Row Component
function SortableSlideRow({ 
  slide, 
  onEdit, 
  onDelete, 
  onToggleActive 
}: { 
  slide: HeroSlide; 
  onEdit: (slide: HeroSlide) => void;
  onDelete: (id: string) => void;
  onToggleActive: (slide: HeroSlide) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell>
        <div className="flex items-center gap-2">
          <button
            className="cursor-grab active:cursor-grabbing touch-none"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
          <span className="font-mono text-sm">{slide.display_order}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="w-20 h-12 rounded overflow-hidden bg-muted relative">
          {slide.media_type === 'video' ? (
            <div className="relative w-full h-full">
              <video 
                src={slide.media_url} 
                className="w-full h-full object-cover"
                muted
                preload="metadata"
                playsInline
                onLoadedData={(e) => {
                  // Seek to first frame to show preview
                  e.currentTarget.currentTime = 0.1;
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-black/40 rounded-full p-1">
                  <Video className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>
          ) : (
            <img 
              src={slide.media_url} 
              alt={slide.title_en || 'Slide'} 
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => (e.currentTarget.src = '/placeholder.svg')}
            />
          )}
          {slide.media_url_mobile && (
            <Badge variant="secondary" className="absolute bottom-0.5 right-0.5 text-[8px] px-1 py-0">
              <Smartphone className="h-2 w-2" />
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div>
          <p className="font-medium">{slide.title_en || 'No title'}</p>
          {slide.title_ar && (
            <p className="text-sm text-muted-foreground" dir="rtl">{slide.title_ar}</p>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Monitor className="h-3 w-3" />
            {slide.media_type === 'video' ? (
              <><Video className="h-3 w-3" /> Video</>
            ) : (
              <><Image className="h-3 w-3" /> Image</>
            )}
          </Badge>
          {slide.media_url_mobile && (
            <Badge variant="outline" className="gap-1 text-[10px]">
              <Smartphone className="h-3 w-3" />
              {slide.media_type_mobile === 'video' ? 'Vid' : 'Img'}
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Switch
            checked={slide.is_active}
            onCheckedChange={() => onToggleActive(slide)}
          />
          <Badge variant={slide.is_active ? 'default' : 'secondary'}>
            {slide.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(slide)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(slide.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

const ThemeBuilder = () => {
  const { t } = useTranslation();
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [featureToggles, setFeatureToggles] = useState<FeatureToggle[]>([]);
  const [loading, setLoading] = useState(true);
  const [slideDialogOpen, setSlideDialogOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [savingToggle, setSavingToggle] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch hero slides
      const { data: slides, error: slidesError } = await supabase
        .from('hero_slides')
        .select('*')
        .order('display_order', { ascending: true });

      if (slidesError) throw slidesError;
      setHeroSlides(slides || []);

      // Fetch feature toggles
      const { data: toggles, error: togglesError } = await supabase
        .from('feature_toggles')
        .select('*')
        .order('category', { ascending: true });

      if (togglesError) throw togglesError;
      setFeatureToggles(toggles || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(t('admin.themeBuilder.fetchError', 'Failed to fetch data'));
    } finally {
      setLoading(false);
    }
  };

  const openAddSlideDialog = () => {
    setEditingSlide(null);
    setSlideDialogOpen(true);
  };

  const openEditSlideDialog = (slide: HeroSlide) => {
    setEditingSlide(slide);
    setSlideDialogOpen(true);
  };

  const handleDeleteSlide = async (slideId: string) => {
    if (!confirm(t('admin.themeBuilder.confirmDelete', 'Are you sure you want to delete this slide?'))) {
      return;
    }

    try {
      const { error } = await supabase
        .from('hero_slides')
        .delete()
        .eq('id', slideId);

      if (error) throw error;
      toast.success(t('admin.themeBuilder.slideDeleted', 'Slide deleted successfully'));
      fetchData();
    } catch (error) {
      console.error('Error deleting slide:', error);
      toast.error(t('admin.themeBuilder.deleteError', 'Failed to delete slide'));
    }
  };

  const handleToggleSlideActive = async (slide: HeroSlide) => {
    try {
      const { error } = await supabase
        .from('hero_slides')
        .update({ is_active: !slide.is_active })
        .eq('id', slide.id);

      if (error) throw error;
      setHeroSlides(prev => 
        prev.map(s => s.id === slide.id ? { ...s, is_active: !s.is_active } : s)
      );
      toast.success(
        slide.is_active 
          ? t('admin.themeBuilder.slideDisabled', 'Slide disabled') 
          : t('admin.themeBuilder.slideEnabled', 'Slide enabled')
      );
    } catch (error) {
      console.error('Error toggling slide:', error);
      toast.error(t('admin.themeBuilder.toggleError', 'Failed to toggle slide'));
    }
  };

  // Handle drag end for reordering
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = heroSlides.findIndex(s => s.id === active.id);
    const newIndex = heroSlides.findIndex(s => s.id === over.id);

    const newSlides = arrayMove(heroSlides, oldIndex, newIndex);
    
    // Update local state immediately for responsiveness
    setHeroSlides(newSlides);
    setReordering(true);

    try {
      // Update display_order for all affected slides
      const updates = newSlides.map((slide, index) => ({
        id: slide.id,
        display_order: index + 1,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('hero_slides')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
        
        if (error) throw error;
      }

      toast.success('Slide order updated');
    } catch (error) {
      console.error('Error reordering slides:', error);
      toast.error('Failed to update order');
      // Revert on error
      fetchData();
    } finally {
      setReordering(false);
    }
  };

  const handleToggleFeature = async (toggle: FeatureToggle) => {
    setSavingToggle(toggle.id);
    try {
      const { error } = await supabase
        .from('feature_toggles')
        .update({ is_enabled: !toggle.is_enabled })
        .eq('id', toggle.id);

      if (error) throw error;
      setFeatureToggles(prev => 
        prev.map(t => t.id === toggle.id ? { ...t, is_enabled: !t.is_enabled } : t)
      );
      toast.success(
        toggle.is_enabled 
          ? t('admin.themeBuilder.featureDisabled', 'Feature disabled') 
          : t('admin.themeBuilder.featureEnabled', 'Feature enabled')
      );
    } catch (error) {
      console.error('Error toggling feature:', error);
      toast.error(t('admin.themeBuilder.toggleError', 'Failed to toggle feature'));
    } finally {
      setSavingToggle(null);
    }
  };

  const groupedFeatures = featureToggles.reduce((acc, toggle) => {
    const category = toggle.category || 'General';
    if (!acc[category]) acc[category] = [];
    acc[category].push(toggle);
    return acc;
  }, {} as Record<string, FeatureToggle[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('admin.themeBuilder.title', 'Theme Builder')}</h1>
          <p className="text-muted-foreground">
            {t('admin.themeBuilder.description', 'Manage hero slides, feature toggles, and site appearance')}
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" size="icon">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="hero-slides" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
          <TabsTrigger value="hero-slides">
            {t('admin.themeBuilder.heroSlides', 'Hero Slides')}
          </TabsTrigger>
          <TabsTrigger value="feature-toggles">
            {t('admin.themeBuilder.featureToggles', 'Feature Toggles')}
          </TabsTrigger>
        </TabsList>

        {/* Hero Slides Tab */}
        <TabsContent value="hero-slides" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>{t('admin.themeBuilder.heroSlidesTitle', 'Hero Section Slides')}</CardTitle>
                <CardDescription>
                  {t('admin.themeBuilder.heroSlidesDesc', 'Manage the slides that appear in the hero section. Drag to reorder.')}
                </CardDescription>
              </div>
              <Button onClick={openAddSlideDialog}>
                <Plus className="h-4 w-4 mr-2" />
                {t('admin.themeBuilder.addSlide', 'Add Slide')}
              </Button>
            </CardHeader>
            <CardContent>
              {heroSlides.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('admin.themeBuilder.noSlides', 'No slides yet. Add your first slide to get started.')}</p>
                </div>
              ) : (
                <div className="relative">
                  {reordering && (
                    <div className="absolute inset-0 bg-background/50 z-10 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  )}
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={heroSlides.map(s => s.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16">{t('admin.themeBuilder.order', 'Order')}</TableHead>
                            <TableHead className="w-24">{t('admin.themeBuilder.preview', 'Preview')}</TableHead>
                            <TableHead>{t('admin.themeBuilder.title', 'Title')}</TableHead>
                            <TableHead>{t('admin.themeBuilder.type', 'Type')}</TableHead>
                            <TableHead>{t('admin.themeBuilder.status', 'Status')}</TableHead>
                            <TableHead className="text-right">{t('admin.themeBuilder.actions', 'Actions')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {heroSlides.map((slide) => (
                            <SortableSlideRow
                              key={slide.id}
                              slide={slide}
                              onEdit={openEditSlideDialog}
                              onDelete={handleDeleteSlide}
                              onToggleActive={handleToggleSlideActive}
                            />
                          ))}
                        </TableBody>
                      </Table>
                    </SortableContext>
                  </DndContext>
                </div>
              )}
              
              <div className="mt-4 p-4 rounded-lg bg-muted/50 border space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong>{t('admin.themeBuilder.activeSlides', 'Active slides')}:</strong> {heroSlides.filter(s => s.is_active).length} / {heroSlides.length}
                </p>
                <p className="text-sm text-muted-foreground">
                  <GripVertical className="h-4 w-4 inline-block mr-1" />
                  Drag slides to reorder. The hero section will display slides in this order.
                </p>
                <p className="text-sm text-muted-foreground">
                  <Smartphone className="h-4 w-4 inline-block mr-1" />
                  Slides with mobile-specific media will show optimized content on mobile devices.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feature Toggles Tab */}
        <TabsContent value="feature-toggles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.themeBuilder.featureTogglesTitle', 'Feature Toggles')}</CardTitle>
              <CardDescription>
                {t('admin.themeBuilder.featureTogglesDesc', 'Enable or disable features across the site. Changes take effect immediately.')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.keys(groupedFeatures).length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>{t('admin.themeBuilder.noToggles', 'No feature toggles configured.')}</p>
                </div>
              ) : (
                Object.entries(groupedFeatures).map(([category, toggles]) => (
                  <div key={category} className="space-y-3">
                    <h3 className="text-lg font-semibold border-b pb-2">
                      {category}
                    </h3>
                    <div className="grid gap-4">
                      {toggles.map((toggle) => (
                        <div 
                          key={toggle.id}
                          className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{toggle.feature_name}</span>
                              {toggle.feature_name_ar && (
                                <span className="text-sm text-muted-foreground" dir="rtl">
                                  ({toggle.feature_name_ar})
                                </span>
                              )}
                            </div>
                            {toggle.description && (
                              <p className="text-sm text-muted-foreground">
                                {toggle.description}
                              </p>
                            )}
                            <code className="text-xs bg-muted px-1 py-0.5 rounded">
                              {toggle.feature_key}
                            </code>
                          </div>
                          <div className="flex items-center gap-3">
                            {savingToggle === toggle.id && (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                            <Switch
                              checked={toggle.is_enabled}
                              onCheckedChange={() => handleToggleFeature(toggle)}
                              disabled={savingToggle === toggle.id}
                            />
                            <Badge variant={toggle.is_enabled ? 'default' : 'secondary'} className="w-16 justify-center">
                              {toggle.is_enabled 
                                ? <><Eye className="h-3 w-3 mr-1" /> ON</>
                                : <><EyeOff className="h-3 w-3 mr-1" /> OFF</>}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Hero Slide Editor Dialog */}
      <HeroSlideEditor
        open={slideDialogOpen}
        onOpenChange={setSlideDialogOpen}
        slide={editingSlide}
        onSave={fetchData}
      />
    </div>
  );
};

export default ThemeBuilder;

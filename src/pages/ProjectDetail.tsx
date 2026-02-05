import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import StorefrontLayout from '@/layouts/StorefrontLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MapPin, Calendar, Building2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { format } from 'date-fns';

interface Project {
  id: string;
  title_en: string;
  title_ar: string;
  slug: string;
  description_en: string | null;
  description_ar: string | null;
  location: string | null;
  client_name: string | null;
  completion_date: string | null;
  is_featured: boolean | null;
}

interface ProjectImage {
  id: string;
  url: string;
  alt_text_en: string | null;
  alt_text_ar: string | null;
  is_primary: boolean | null;
  sort_order: number | null;
}

interface RelatedProject extends Project {
  image_url?: string;
}

const ProjectDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [project, setProject] = useState<Project | null>(null);
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [relatedProjects, setRelatedProjects] = useState<RelatedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      if (!slug) return;

      setLoading(true);

      // Fetch project by slug
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (projectError || !projectData) {
        setLoading(false);
        return;
      }

      setProject(projectData);

      // Fetch project images
      const { data: imagesData } = await supabase
        .from('project_images')
        .select('*')
        .eq('project_id', projectData.id)
        .order('sort_order', { ascending: true });

      setImages(imagesData || []);

      // Fetch related projects (other featured projects, excluding current)
      const { data: relatedData } = await supabase
        .from('projects')
        .select('id, title_en, title_ar, slug, description_en, description_ar, location, client_name, completion_date, is_featured')
        .eq('is_active', true)
        .neq('id', projectData.id)
        .limit(3);

      if (relatedData && relatedData.length > 0) {
        // Fetch primary images for related projects
        const relatedIds = relatedData.map(p => p.id);
        const { data: relatedImagesData } = await supabase
          .from('project_images')
          .select('project_id, url')
          .in('project_id', relatedIds)
          .eq('is_primary', true);

        const relatedWithImages = relatedData.map(p => ({
          ...p,
          image_url: relatedImagesData?.find(img => img.project_id === p.id)?.url,
        }));

        setRelatedProjects(relatedWithImages);
      }

      setLoading(false);
    };

    fetchProject();
  }, [slug]);

  const openLightbox = (index: number) => {
    setSelectedImageIndex(index);
  };

  const closeLightbox = () => {
    setSelectedImageIndex(null);
  };

  const goToPrevious = () => {
    if (selectedImageIndex !== null) {
      setSelectedImageIndex(selectedImageIndex === 0 ? images.length - 1 : selectedImageIndex - 1);
    }
  };

  const goToNext = () => {
    if (selectedImageIndex !== null) {
      setSelectedImageIndex(selectedImageIndex === images.length - 1 ? 0 : selectedImageIndex + 1);
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImageIndex === null) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImageIndex]);

  if (loading) {
    return (
      <StorefrontLayout>
        <div className="container py-12">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-12 w-2/3 mb-4" />
          <Skeleton className="h-6 w-1/3 mb-8" />
          <Skeleton className="aspect-video w-full mb-8" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="aspect-square" />
            ))}
          </div>
        </div>
      </StorefrontLayout>
    );
  }

  if (!project) {
    return (
      <StorefrontLayout>
        <div className="container py-24 text-center">
          <h1 className="text-2xl font-bold mb-4">
            {t('projects.notFound', 'Project Not Found')}
          </h1>
          <p className="text-muted-foreground mb-8">
            {t('projects.notFoundDesc', 'The project you are looking for does not exist or has been removed.')}
          </p>
          <Button asChild>
            <Link to="/projects">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('projects.backToProjects', 'Back to Projects')}
            </Link>
          </Button>
        </div>
      </StorefrontLayout>
    );
  }

  const title = language === 'ar' ? project.title_ar : project.title_en;
  const description = language === 'ar' ? project.description_ar : project.description_en;
  const primaryImage = images.find(img => img.is_primary) || images[0];
  const galleryImages = images.filter(img => !img.is_primary || images.length === 1);

  return (
    <StorefrontLayout>
      <div className="container py-8 md:py-12">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/projects" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t('projects.backToProjects', 'Back to Projects')}
          </Link>
        </Button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {project.is_featured && (
              <Badge variant="secondary">
                {t('projects.featured', 'Featured')}
              </Badge>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            {title}
          </h1>

          <div className="flex flex-wrap gap-4 text-muted-foreground">
            {project.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{project.location}</span>
              </div>
            )}
            {project.client_name && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span>{project.client_name}</span>
              </div>
            )}
            {project.completion_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(project.completion_date), 'MMMM yyyy')}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Main Image */}
        {primaryImage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="relative aspect-video rounded-xl overflow-hidden mb-6 cursor-pointer group"
            onClick={() => openLightbox(images.indexOf(primaryImage))}
          >
            <img
              src={primaryImage.url}
              alt={language === 'ar' ? primaryImage.alt_text_ar || title : primaryImage.alt_text_en || title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                {t('projects.clickToEnlarge', 'Click to enlarge')}
              </span>
            </div>
          </motion.div>
        )}

        {/* Gallery Grid */}
        {galleryImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12"
          >
            {galleryImages.map((image, index) => (
              <div
                key={image.id}
                className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                onClick={() => openLightbox(images.indexOf(image))}
              >
                <img
                  src={image.url}
                  alt={language === 'ar' ? image.alt_text_ar || '' : image.alt_text_en || ''}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
              </div>
            ))}
          </motion.div>
        )}

        {/* Description */}
        {description && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-4xl"
          >
            <h2 className="text-2xl font-semibold mb-4">
              {t('projects.aboutProject', 'About This Project')}
            </h2>
            <div 
              className="prose prose-lg dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          </motion.div>
        )}

        {/* Project Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 p-6 rounded-xl bg-muted/50 border"
        >
          <h3 className="text-xl font-semibold mb-4">
            {t('projects.projectDetails', 'Project Details')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {project.location && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {t('projects.location', 'Location')}
                </p>
                <p className="font-medium">{project.location}</p>
              </div>
            )}
            {project.client_name && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {t('projects.client', 'Client')}
                </p>
                <p className="font-medium">{project.client_name}</p>
              </div>
            )}
            {project.completion_date && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {t('projects.completionDate', 'Completion Date')}
                </p>
                <p className="font-medium">
                  {format(new Date(project.completion_date), 'MMMM yyyy')}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Related Projects Section */}
        {relatedProjects.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-16"
          >
            <h2 className="text-2xl font-semibold mb-6">
              {t('projects.relatedProjects', 'Related Projects')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedProjects.map((relatedProject, index) => (
                <Link
                  key={relatedProject.id}
                  to={`/project/${relatedProject.slug}`}
                  className="group block overflow-hidden rounded-xl border border-border bg-card hover:border-primary transition-all duration-300"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    {relatedProject.image_url ? (
                      <img
                        src={relatedProject.image_url}
                        alt={language === 'ar' ? relatedProject.title_ar : relatedProject.title_en}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                        <Building2 className="h-12 w-12 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    {relatedProject.location && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                        <MapPin className="h-3 w-3" />
                        <span>{relatedProject.location}</span>
                      </div>
                    )}
                    <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-1">
                      {language === 'ar' ? relatedProject.title_ar : relatedProject.title_en}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImageIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={closeLightbox}
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors z-10"
            >
              <X className="h-8 w-8" />
            </button>

            {/* Previous Button */}
            {images.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                className="absolute left-4 p-2 text-white/80 hover:text-white transition-colors z-10"
              >
                <ChevronLeft className="h-10 w-10" />
              </button>
            )}

            {/* Image */}
            <motion.img
              key={selectedImageIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              src={images[selectedImageIndex].url}
              alt=""
              className="max-h-[90vh] max-w-[90vw] object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Next Button */}
            {images.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="absolute right-4 p-2 text-white/80 hover:text-white transition-colors z-10"
              >
                <ChevronRight className="h-10 w-10" />
              </button>
            )}

            {/* Image Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm">
              {selectedImageIndex + 1} / {images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </StorefrontLayout>
  );
};

export default ProjectDetail;

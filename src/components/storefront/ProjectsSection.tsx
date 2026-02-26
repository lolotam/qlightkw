import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin } from 'lucide-react';
import { resolveImageUrl } from '@/lib/image-resolver';

interface Project {
  id: string;
  title_en: string;
  title_ar: string;
  slug: string;
  description_en: string | null;
  description_ar: string | null;
  location: string | null;
  image_url?: string;
}

const ProjectsSection = () => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      // Fetch featured projects
      const { data: projectsData, error } = await supabase
        .from('projects')
        .select('id, title_en, title_ar, slug, description_en, description_ar, location')
        .eq('is_active', true)
        .eq('is_featured', true)
        .limit(3);

      if (error || !projectsData) return;

      // Fetch primary images for each project
      const projectIds = projectsData.map(p => p.id);
      const { data: imagesData } = await supabase
        .from('project_images')
        .select('project_id, url')
        .in('project_id', projectIds)
        .eq('is_primary', true);

      // Combine projects with their images
      const projectsWithImages = projectsData.map(project => ({
        ...project,
        image_url: resolveImageUrl(imagesData?.find(img => img.project_id === project.id)?.url, 'project', project.slug),
      }));

      setProjects(projectsWithImages);
    };

    fetchProjects();
  }, []);

  // Demo projects if no data exists
  const demoProjects: Project[] = [
    {
      id: '1',
      title_en: 'Al Hamra Tower Lighting',
      title_ar: 'إضاءة برج الحمراء',
      slug: 'al-hamra-tower',
      description_en: 'Complete commercial lighting solution for Kuwait\'s tallest building.',
      description_ar: 'حل إضاءة تجاري متكامل لأطول مبنى في الكويت.',
      location: 'Kuwait City',
    },
    {
      id: '2',
      title_en: 'Marina Mall Renovation',
      title_ar: 'تجديد مارينا مول',
      slug: 'marina-mall',
      description_en: 'Modern LED lighting upgrade for the shopping center.',
      description_ar: 'ترقية إضاءة LED حديثة لمركز التسوق.',
      location: 'Salmiya',
    },
    {
      id: '3',
      title_en: 'Villa Lighting Design',
      title_ar: 'تصميم إضاءة فيلا',
      slug: 'villa-lighting',
      description_en: 'Luxury residential lighting with smart home integration.',
      description_ar: 'إضاءة سكنية فاخرة مع تكامل المنزل الذكي.',
      location: 'Mishref',
    },
  ];

  const displayProjects = projects.length > 0 ? projects : demoProjects;

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">
              {t('home.projects.title', 'Featured Projects')}
            </h2>
            <p className="text-muted-foreground">
              {t('home.projects.subtitle', 'See our lighting solutions in action')}
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/projects" className="flex items-center gap-2">
              {t('home.projects.viewAll', 'View All Projects')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                to={`/project/${project.slug}`}
                className="group block overflow-hidden rounded-xl border border-border bg-card hover:border-primary transition-all duration-300"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  {project.image_url ? (
                    <img
                      src={project.image_url}
                      alt={language === 'ar' ? project.title_ar : project.title_en}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                      <span className="text-6xl">🏢</span>
                    </div>
                  )}
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Content */}
                <div className="p-6">
                  {project.location && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                      <MapPin className="h-4 w-4" />
                      <span>{project.location}</span>
                    </div>
                  )}
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                    {language === 'ar' ? project.title_ar : project.title_en}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {language === 'ar' && project.description_ar 
                      ? project.description_ar 
                      : project.description_en}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProjectsSection;

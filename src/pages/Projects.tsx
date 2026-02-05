import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import StorefrontLayout from '@/layouts/StorefrontLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Calendar, Building, ArrowRight } from 'lucide-react';

interface Project {
  id: string;
  title_en: string;
  title_ar: string;
  slug: string;
  description_en: string | null;
  description_ar: string | null;
  client_name: string | null;
  location: string | null;
  completion_date: string | null;
  is_featured: boolean | null;
  images?: { url: string; alt_text_en: string | null; alt_text_ar: string | null; is_primary: boolean | null }[];
}

const Projects = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [filter, setFilter] = useState<'all' | 'featured'>('all');

  // Fetch projects from Supabase
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', filter],
    queryFn: async (): Promise<Project[]> => {
      let query = supabase
        .from('projects')
        .select('*')
        .eq('is_active', true)
        .order('completion_date', { ascending: false });

      if (filter === 'featured') {
        query = query.eq('is_featured', true);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch images for each project
      if (data && data.length > 0) {
        const projectIds = data.map(p => p.id);
        const { data: images } = await supabase
          .from('project_images')
          .select('*')
          .in('project_id', projectIds)
          .order('sort_order', { ascending: true });

        return data.map(project => ({
          ...project,
          images: images?.filter(img => img.project_id === project.id) || []
        }));
      }

      return data || [];
    },
  });

  // Demo data fallback
  const demoProjects: Project[] = [
    {
      id: '1',
      title_en: 'Al Hamra Tower',
      title_ar: 'برج الحمراء',
      slug: 'al-hamra-tower',
      description_en: 'Complete lighting solution for Kuwait\'s tallest building, featuring modern LED systems and smart controls throughout the entire structure.',
      description_ar: 'حل إضاءة متكامل لأطول مبنى في الكويت، يتضمن أنظمة LED حديثة وتحكم ذكي في جميع أنحاء الهيكل.',
      client_name: 'Al Hamra Real Estate',
      location: 'Kuwait City',
      completion_date: '2023-06-15',
      is_featured: true,
      images: [],
    },
    {
      id: '2',
      title_en: 'The Avenues Mall',
      title_ar: 'مجمع الأفنيوز',
      slug: 'avenues-mall',
      description_en: 'Extensive lighting project covering retail spaces, common areas, and architectural features of the largest mall in Kuwait.',
      description_ar: 'مشروع إضاءة واسع يغطي مساحات البيع بالتجزئة والمناطق المشتركة والميزات المعمارية لأكبر مول في الكويت.',
      client_name: 'Mabanee Company',
      location: 'Kuwait City',
      completion_date: '2023-03-20',
      is_featured: true,
      images: [],
    },
    {
      id: '3',
      title_en: 'Sheikh Jaber Causeway',
      title_ar: 'جسر الشيخ جابر',
      slug: 'jaber-causeway',
      description_en: 'Outdoor lighting installation for the iconic bridge connecting Kuwait City to Subiya.',
      description_ar: 'تركيب إضاءة خارجية للجسر الأيقوني الذي يربط مدينة الكويت بالصبية.',
      client_name: 'Ministry of Public Works',
      location: 'Kuwait Bay',
      completion_date: '2022-11-10',
      is_featured: false,
      images: [],
    },
    {
      id: '4',
      title_en: 'Grand Mosque Renovation',
      title_ar: 'تجديد المسجد الكبير',
      slug: 'grand-mosque',
      description_en: 'Elegant interior lighting upgrade preserving the mosque\'s traditional aesthetic while improving energy efficiency.',
      description_ar: 'ترقية إضاءة داخلية أنيقة تحافظ على الجمالية التقليدية للمسجد مع تحسين كفاءة الطاقة.',
      client_name: 'Ministry of Awqaf',
      location: 'Kuwait City',
      completion_date: '2022-08-25',
      is_featured: true,
      images: [],
    },
    {
      id: '5',
      title_en: 'Kuwait University Campus',
      title_ar: 'حرم جامعة الكويت',
      slug: 'ku-campus',
      description_en: 'Smart lighting system for classrooms, labs, and outdoor areas across the university campus.',
      description_ar: 'نظام إضاءة ذكي للفصول الدراسية والمختبرات والمناطق الخارجية في حرم الجامعة.',
      client_name: 'Kuwait University',
      location: 'Shuwaikh',
      completion_date: '2022-05-15',
      is_featured: false,
      images: [],
    },
    {
      id: '6',
      title_en: 'Marina Hotel',
      title_ar: 'فندق مارينا',
      slug: 'marina-hotel',
      description_en: 'Luxury lighting design for a 5-star hotel including lobby, suites, restaurants, and pool areas.',
      description_ar: 'تصميم إضاءة فاخر لفندق 5 نجوم يشمل اللوبي والأجنحة والمطاعم ومناطق المسبح.',
      client_name: 'Kuwait Hotels Company',
      location: 'Salmiya',
      completion_date: '2021-12-01',
      is_featured: true,
      images: [],
    },
  ];

  const displayProjects = projects.length > 0 ? projects : demoProjects;
  const filteredProjects = filter === 'featured' 
    ? displayProjects.filter(p => p.is_featured) 
    : displayProjects;

  return (
    <StorefrontLayout>
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary/10 via-background to-muted">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {isRTL ? 'مشاريعنا' : 'Our Projects'}
            </h1>
            <p className="text-lg text-muted-foreground">
              {isRTL 
                ? 'استعرض مجموعة مختارة من أعمالنا المميزة في مجال الإضاءة'
                : 'Explore our portfolio of distinguished lighting projects'
              }
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="py-8 border-b">
        <div className="container">
          <div className="flex justify-center gap-4">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
            >
              {isRTL ? 'جميع المشاريع' : 'All Projects'}
            </Button>
            <Button
              variant={filter === 'featured' ? 'default' : 'outline'}
              onClick={() => setFilter('featured')}
            >
              {isRTL ? 'المشاريع المميزة' : 'Featured Projects'}
            </Button>
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="py-12 md:py-16">
        <div className="container">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden animate-pulse">
                  <div className="aspect-video bg-muted" />
                  <CardContent className="p-4">
                    <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <motion.div
              layout
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {filteredProjects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link to={`/project/${project.slug}`}>
                      <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 h-full">
                        <div className="aspect-video bg-muted relative overflow-hidden">
                          {project.images && project.images.length > 0 ? (
                            <img
                              src={project.images.find(img => img.is_primary)?.url || project.images[0].url}
                              alt={isRTL ? project.title_ar : project.title_en}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Building className="h-16 w-16 text-muted-foreground/30" />
                            </div>
                          )}
                          {project.is_featured && (
                            <Badge className="absolute top-3 start-3">
                              {isRTL ? 'مميز' : 'Featured'}
                            </Badge>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-4">
                            <span className="text-white text-sm flex items-center gap-1">
                              {isRTL ? 'عرض التفاصيل' : 'View Details'}
                              <ArrowRight className="h-4 w-4" />
                            </span>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-1">
                            {isRTL ? project.title_ar : project.title_en}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {isRTL ? project.description_ar : project.description_en}
                          </p>
                          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                            {project.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {project.location}
                              </span>
                            )}
                            {project.completion_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(project.completion_date).getFullYear()}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {filteredProjects.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <Building className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {isRTL ? 'لا توجد مشاريع للعرض' : 'No projects to display'}
              </p>
            </div>
          )}
        </div>
      </section>
    </StorefrontLayout>
  );
};

export default Projects;

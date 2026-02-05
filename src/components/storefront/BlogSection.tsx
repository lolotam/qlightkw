import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, ArrowRight, BookOpen, Lightbulb, Home, Sparkles } from 'lucide-react';
import { normalizeStorageUrl } from '@/lib/storage';

interface BlogPost {
  id: string;
  slug: string;
  title_en: string;
  title_ar: string | null;
  excerpt_en: string | null;
  excerpt_ar: string | null;
  featured_image_url: string | null;
  category: string | null;
  author_name: string | null;
  published_at: string | null;
}

const BlogSection = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // Fetch blog posts from Supabase
  const { data: posts = [] } = useQuery({
    queryKey: ['blog-posts-featured'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      return data as BlogPost[];
    },
  });

  // Demo data if no posts exist
  const demoPosts: BlogPost[] = [
    {
      id: '1',
      slug: 'lighting-tips-living-room',
      title_en: '10 Lighting Tips for Your Living Room',
      title_ar: '10 نصائح لإضاءة غرفة المعيشة',
      excerpt_en: 'Transform your living space with these expert lighting techniques that create warmth and ambiance.',
      excerpt_ar: 'حوّل مساحة معيشتك مع تقنيات الإضاءة الاحترافية التي تخلق الدفء والأجواء.',
      featured_image_url: null,
      category: 'tips',
      author_name: 'Quality Light Team',
      published_at: '2024-01-15',
    },
    {
      id: '2',
      slug: 'led-vs-traditional',
      title_en: 'LED vs Traditional Bulbs: Complete Guide',
      title_ar: 'LED مقابل المصابيح التقليدية: دليل شامل',
      excerpt_en: 'Learn about the benefits of LED lighting and why it\'s the smart choice for modern homes.',
      excerpt_ar: 'تعرف على فوائد إضاءة LED ولماذا هي الخيار الذكي للمنازل الحديثة.',
      featured_image_url: null,
      category: 'guide',
      author_name: 'Quality Light Team',
      published_at: '2024-01-10',
    },
    {
      id: '3',
      slug: 'kitchen-lighting-design',
      title_en: 'Kitchen Lighting Design Ideas',
      title_ar: 'أفكار تصميم إضاءة المطبخ',
      excerpt_en: 'Discover how to create the perfect lighting scheme for your kitchen workspace.',
      excerpt_ar: 'اكتشف كيفية إنشاء مخطط إضاءة مثالي لمساحة عمل مطبخك.',
      featured_image_url: null,
      category: 'inspiration',
      author_name: 'Quality Light Team',
      published_at: '2024-01-05',
    },
  ];

  const displayPosts = posts.length > 0 ? posts : demoPosts;

  const getCategoryIcon = (category: string | null) => {
    switch (category) {
      case 'tips': return Lightbulb;
      case 'guide': return BookOpen;
      case 'inspiration': return Sparkles;
      default: return Home;
    }
  };

  const getCategoryLabel = (category: string | null) => {
    if (!category) return isRTL ? 'عام' : 'General';
    const labels: Record<string, { en: string; ar: string }> = {
      tips: { en: 'Tips', ar: 'نصائح' },
      guide: { en: 'Guide', ar: 'دليل' },
      inspiration: { en: 'Inspiration', ar: 'إلهام' },
    };
    return isRTL ? labels[category]?.ar || category : labels[category]?.en || category;
  };

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {isRTL ? 'نصائح ومقالات' : 'Tips & Articles'}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {isRTL 
              ? 'اكتشف أحدث الاتجاهات والنصائح في عالم الإضاءة والتصميم الداخلي'
              : 'Discover the latest trends and tips in lighting and interior design'
            }
          </p>
        </motion.div>

        {/* Blog Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {displayPosts.map((post, index) => {
            const CategoryIcon = getCategoryIcon(post.category);
            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full overflow-hidden group hover:shadow-lg transition-all duration-300">
                  {/* Image */}
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    {post.featured_image_url ? (
                      <img
                        src={normalizeStorageUrl(post.featured_image_url)}
                        alt={isRTL ? post.title_ar || post.title_en : post.title_en}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                        <CategoryIcon className="h-16 w-16 text-primary/30" />
                      </div>
                    )}
                    <Badge className="absolute top-3 start-3 gap-1">
                      <CategoryIcon className="h-3 w-3" />
                      {getCategoryLabel(post.category)}
                    </Badge>
                  </div>
                  
                  <CardContent className="p-5">
                    {/* Date */}
                    {post.published_at && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <Calendar className="h-4 w-4" />
                        {new Date(post.published_at).toLocaleDateString(
                          isRTL ? 'ar-KW' : 'en-US',
                          { year: 'numeric', month: 'long', day: 'numeric' }
                        )}
                      </div>
                    )}
                    
                    {/* Title */}
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {isRTL ? post.title_ar || post.title_en : post.title_en}
                    </h3>
                    
                    {/* Excerpt */}
                    <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                      {isRTL ? post.excerpt_ar || post.excerpt_en : post.excerpt_en}
                    </p>
                    
                    {/* Read More */}
                    <Link 
                      to={`/blog/${post.slug}`}
                      className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                    >
                      {isRTL ? 'اقرأ المزيد' : 'Read More'}
                      <ArrowRight className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Button variant="outline" size="lg" asChild>
            <Link to="/blog" className="gap-2">
              {isRTL ? 'عرض جميع المقالات' : 'View All Articles'}
              <ArrowRight className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default BlogSection;

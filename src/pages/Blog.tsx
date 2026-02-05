import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import StorefrontLayout from '@/layouts/StorefrontLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Search, BookOpen, Lightbulb, Home, Sparkles, User } from 'lucide-react';

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
  is_featured: boolean | null;
}

const Blog = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch blog posts from Supabase
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false });
      
      if (error) throw error;
      return data as BlogPost[];
    },
  });

  // Demo posts if none exist
  const demoPosts: BlogPost[] = [
    {
      id: '1', slug: 'lighting-tips-living-room', is_featured: true,
      title_en: '10 Lighting Tips for Your Living Room',
      title_ar: '10 نصائح لإضاءة غرفة المعيشة',
      excerpt_en: 'Transform your living space with these expert lighting techniques that create warmth, ambiance, and functionality for any occasion.',
      excerpt_ar: 'حوّل مساحة معيشتك مع تقنيات الإضاءة الاحترافية التي تخلق الدفء والأجواء والوظائف لأي مناسبة.',
      featured_image_url: null, category: 'tips', author_name: 'Quality Light Team', published_at: '2024-01-15',
    },
    {
      id: '2', slug: 'led-vs-traditional', is_featured: true,
      title_en: 'LED vs Traditional Bulbs: Complete Guide',
      title_ar: 'LED مقابل المصابيح التقليدية: دليل شامل',
      excerpt_en: 'Learn about the benefits of LED lighting and why it\'s the smart choice for modern homes and businesses.',
      excerpt_ar: 'تعرف على فوائد إضاءة LED ولماذا هي الخيار الذكي للمنازل والأعمال الحديثة.',
      featured_image_url: null, category: 'guide', author_name: 'Quality Light Team', published_at: '2024-01-10',
    },
    {
      id: '3', slug: 'kitchen-lighting-design', is_featured: false,
      title_en: 'Kitchen Lighting Design Ideas',
      title_ar: 'أفكار تصميم إضاءة المطبخ',
      excerpt_en: 'Discover how to create the perfect lighting scheme for your kitchen workspace.',
      excerpt_ar: 'اكتشف كيفية إنشاء مخطط إضاءة مثالي لمساحة عمل مطبخك.',
      featured_image_url: null, category: 'inspiration', author_name: 'Quality Light Team', published_at: '2024-01-05',
    },
    {
      id: '4', slug: 'outdoor-lighting-guide', is_featured: false,
      title_en: 'Ultimate Guide to Outdoor Lighting',
      title_ar: 'الدليل الشامل للإضاءة الخارجية',
      excerpt_en: 'Everything you need to know about illuminating your garden, patio, and outdoor spaces.',
      excerpt_ar: 'كل ما تحتاج معرفته حول إضاءة حديقتك والباحة والمساحات الخارجية.',
      featured_image_url: null, category: 'guide', author_name: 'Quality Light Team', published_at: '2024-01-01',
    },
    {
      id: '5', slug: 'bedroom-lighting-tips', is_featured: false,
      title_en: 'Creating the Perfect Bedroom Ambiance',
      title_ar: 'خلق أجواء غرفة النوم المثالية',
      excerpt_en: 'Tips for choosing the right lighting to promote relaxation and better sleep.',
      excerpt_ar: 'نصائح لاختيار الإضاءة المناسبة لتعزيز الاسترخاء والنوم الأفضل.',
      featured_image_url: null, category: 'tips', author_name: 'Quality Light Team', published_at: '2023-12-28',
    },
    {
      id: '6', slug: 'smart-lighting-systems', is_featured: false,
      title_en: 'Introduction to Smart Lighting Systems',
      title_ar: 'مقدمة إلى أنظمة الإضاءة الذكية',
      excerpt_en: 'How smart lighting can transform your home and reduce energy costs.',
      excerpt_ar: 'كيف يمكن للإضاءة الذكية أن تحول منزلك وتقلل تكاليف الطاقة.',
      featured_image_url: null, category: 'guide', author_name: 'Quality Light Team', published_at: '2023-12-20',
    },
  ];

  const displayPosts = posts.length > 0 ? posts : demoPosts;

  const categories = [
    { id: 'tips', icon: Lightbulb, label: isRTL ? 'نصائح' : 'Tips' },
    { id: 'guide', icon: BookOpen, label: isRTL ? 'أدلة' : 'Guides' },
    { id: 'inspiration', icon: Sparkles, label: isRTL ? 'إلهام' : 'Inspiration' },
  ];

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
    const cat = categories.find(c => c.id === category);
    return cat?.label || category;
  };

  // Filter posts
  const filteredPosts = displayPosts.filter((post) => {
    const matchesSearch = searchQuery === '' || 
      post.title_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.excerpt_en && post.excerpt_en.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (post.title_ar && post.title_ar.includes(searchQuery));
    
    const matchesCategory = selectedCategory === null || post.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const featuredPost = filteredPosts.find(p => p.is_featured);
  const regularPosts = filteredPosts.filter(p => p !== featuredPost);

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
              {isRTL ? 'المدونة والنصائح' : 'Blog & Tips'}
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              {isRTL 
                ? 'اكتشف أحدث الاتجاهات والنصائح والإلهام في عالم الإضاءة والتصميم الداخلي'
                : 'Discover the latest trends, tips, and inspiration in lighting and interior design'
              }
            </p>

            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute start-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder={isRTL ? 'ابحث في المقالات...' : 'Search articles...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-12 h-12 text-base"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 border-b">
        <div className="container">
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(null)}
              size="sm"
            >
              {isRTL ? 'الكل' : 'All'}
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(cat.id)}
                size="sm"
                className="gap-2"
              >
                <cat.icon className="h-4 w-4" />
                {cat.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Content */}
      <section className="py-12 md:py-16">
        <div className="container">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="aspect-video bg-muted" />
                  <CardContent className="p-5">
                    <div className="h-4 bg-muted rounded w-1/3 mb-3" />
                    <div className="h-6 bg-muted rounded w-full mb-2" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {isRTL ? 'لم يتم العثور على مقالات' : 'No articles found'}
              </p>
            </div>
          ) : (
            <>
              {/* Featured Post */}
              {featuredPost && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-12"
                >
                  <Card className="overflow-hidden group">
                    <div className="grid md:grid-cols-2">
                      <div className="aspect-video md:aspect-auto bg-muted relative overflow-hidden">
                        {featuredPost.featured_image_url ? (
                          <img
                            src={featuredPost.featured_image_url}
                            alt={isRTL ? featuredPost.title_ar || featuredPost.title_en : featuredPost.title_en}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                            <Sparkles className="h-24 w-24 text-primary/30" />
                          </div>
                        )}
                        <Badge className="absolute top-4 start-4 bg-primary">
                          {isRTL ? 'مميز' : 'Featured'}
                        </Badge>
                      </div>
                      <CardContent className="p-8 flex flex-col justify-center">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                          <Badge variant="outline" className="gap-1">
                            {getCategoryLabel(featuredPost.category)}
                          </Badge>
                          {featuredPost.published_at && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(featuredPost.published_at).toLocaleDateString(
                                isRTL ? 'ar-KW' : 'en-US',
                                { year: 'numeric', month: 'long', day: 'numeric' }
                              )}
                            </span>
                          )}
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold mb-4 group-hover:text-primary transition-colors">
                          {isRTL ? featuredPost.title_ar || featuredPost.title_en : featuredPost.title_en}
                        </h2>
                        <p className="text-muted-foreground mb-6">
                          {isRTL ? featuredPost.excerpt_ar || featuredPost.excerpt_en : featuredPost.excerpt_en}
                        </p>
                        <div className="flex items-center justify-between">
                          {featuredPost.author_name && (
                            <span className="flex items-center gap-2 text-sm text-muted-foreground">
                              <User className="h-4 w-4" />
                              {featuredPost.author_name}
                            </span>
                          )}
                          <Button asChild>
                            <Link to={`/blog/${featuredPost.slug}`}>
                              {isRTL ? 'اقرأ المقال' : 'Read Article'}
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Regular Posts Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {regularPosts.map((post, index) => {
                  const CategoryIcon = getCategoryIcon(post.category);
                  return (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="h-full overflow-hidden group hover:shadow-lg transition-all duration-300">
                        <div className="aspect-video bg-muted relative overflow-hidden">
                          {post.featured_image_url ? (
                            <img
                              src={post.featured_image_url}
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
                          {post.published_at && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                              <Calendar className="h-4 w-4" />
                              {new Date(post.published_at).toLocaleDateString(
                                isRTL ? 'ar-KW' : 'en-US',
                                { year: 'numeric', month: 'short', day: 'numeric' }
                              )}
                            </div>
                          )}
                          
                          <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                            <Link to={`/blog/${post.slug}`}>
                              {isRTL ? post.title_ar || post.title_en : post.title_en}
                            </Link>
                          </h3>
                          
                          <p className="text-muted-foreground text-sm line-clamp-3">
                            {isRTL ? post.excerpt_ar || post.excerpt_en : post.excerpt_en}
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>
    </StorefrontLayout>
  );
};

export default Blog;

import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import StorefrontLayout from '@/layouts/StorefrontLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, ChevronLeft, ChevronRight, BookOpen, Lightbulb, Home, Sparkles, User, ArrowLeft } from 'lucide-react';

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
  published_at: string | null;
  is_featured: boolean | null;
}

const BlogDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { i18n, t } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // Fetch the specific blog post
  const { data: post, isLoading, error } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();
      
      if (error) throw error;
      return data as BlogPost;
    },
    enabled: !!slug,
  });

  // Fetch related posts
  const { data: relatedPosts = [] } = useQuery({
    queryKey: ['related-posts', post?.category, post?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('is_published', true)
        .eq('category', post?.category || '')
        .neq('id', post?.id || '')
        .limit(3);
      
      if (error) throw error;
      return data as BlogPost[];
    },
    enabled: !!post?.category && !!post?.id,
  });

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

  if (isLoading) {
    return (
      <StorefrontLayout>
        <div className="container py-12">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-muted rounded w-1/4" />
              <div className="h-12 bg-muted rounded w-3/4" />
              <div className="aspect-video bg-muted rounded-lg" />
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-5/6" />
                <div className="h-4 bg-muted rounded w-4/6" />
              </div>
            </div>
          </div>
        </div>
      </StorefrontLayout>
    );
  }

  if (error || !post) {
    return (
      <StorefrontLayout>
        <div className="container py-24">
          <div className="text-center max-w-md mx-auto">
            <BookOpen className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">
              {isRTL ? 'المقال غير موجود' : 'Post Not Found'}
            </h1>
            <p className="text-muted-foreground mb-6">
              {isRTL 
                ? 'عذراً، لم نتمكن من العثور على المقال المطلوب.'
                : "Sorry, we couldn't find the article you're looking for."}
            </p>
            <Button asChild>
              <Link to="/blog">
                {isRTL ? (
                  <>
                    العودة للمدونة
                    <ChevronLeft className="ms-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    <ArrowLeft className="me-2 h-4 w-4" />
                    Back to Blog
                  </>
                )}
              </Link>
            </Button>
          </div>
        </div>
      </StorefrontLayout>
    );
  }

  const CategoryIcon = getCategoryIcon(post.category);

  return (
    <StorefrontLayout>
      {/* Hero Section */}
      <section className="relative">
        {post.featured_image_url ? (
          <div className="relative h-[50vh] min-h-[400px]">
            <img
              src={post.featured_image_url}
              alt={isRTL ? post.title_ar || post.title_en : post.title_en}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          </div>
        ) : (
          <div className="h-[30vh] min-h-[250px] bg-gradient-to-br from-primary/10 via-background to-muted flex items-center justify-center">
            <CategoryIcon className="h-32 w-32 text-primary/20" />
          </div>
        )}
      </section>

      {/* Content Section */}
      <section className="py-12 -mt-24 relative z-10">
        <div className="container">
          <motion.article
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            {/* Back Button */}
            <Button variant="outline" asChild className="mb-6 gap-2">
              <Link to="/blog">
                {isRTL ? (
                  <>
                    العودة للمدونة
                    <ChevronRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    <ChevronLeft className="h-4 w-4" />
                    Back to Blog
                  </>
                )}
              </Link>
            </Button>

            {/* Article Header */}
            <Card className="mb-8">
              <CardContent className="p-8">
                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                  <Badge variant="outline" className="gap-1">
                    <CategoryIcon className="h-3 w-3" />
                    {getCategoryLabel(post.category)}
                  </Badge>
                  {post.published_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(post.published_at).toLocaleDateString(
                        isRTL ? 'ar-KW' : 'en-US',
                        { year: 'numeric', month: 'long', day: 'numeric' }
                      )}
                    </span>
                  )}
                  {post.author_name && (
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {post.author_name}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h1 className="text-3xl md:text-4xl font-bold mb-4">
                  {isRTL ? post.title_ar || post.title_en : post.title_en}
                </h1>

                {/* Excerpt */}
                {(isRTL ? post.excerpt_ar || post.excerpt_en : post.excerpt_en) && (
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {isRTL ? post.excerpt_ar || post.excerpt_en : post.excerpt_en}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Article Content */}
            <Card>
              <CardContent className="p-8">
                <div 
                  className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-bold prose-a:text-primary prose-img:rounded-lg"
                  dangerouslySetInnerHTML={{ 
                    __html: isRTL 
                      ? post.content_ar || post.content_en || '' 
                      : post.content_en || '' 
                  }}
                />
              </CardContent>
            </Card>
          </motion.article>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="max-w-4xl mx-auto mt-12"
            >
              <h2 className="text-2xl font-bold mb-6">
                {isRTL ? 'مقالات ذات صلة' : 'Related Articles'}
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => {
                  const RelatedIcon = getCategoryIcon(relatedPost.category);
                  return (
                    <Card key={relatedPost.id} className="overflow-hidden group hover:shadow-lg transition-all duration-300">
                      <div className="aspect-video bg-muted relative overflow-hidden">
                        {relatedPost.featured_image_url ? (
                          <img
                            src={relatedPost.featured_image_url}
                            alt={isRTL ? relatedPost.title_ar || relatedPost.title_en : relatedPost.title_en}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                            <RelatedIcon className="h-12 w-12 text-primary/30" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                          <Link to={`/blog/${relatedPost.slug}`}>
                            {isRTL ? relatedPost.title_ar || relatedPost.title_en : relatedPost.title_en}
                          </Link>
                        </h3>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </motion.section>
          )}
        </div>
      </section>
    </StorefrontLayout>
  );
};

export default BlogDetail;

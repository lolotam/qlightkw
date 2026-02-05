import * as React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowLeft, User, Tag, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface BlogPreviewProps {
  title_en: string;
  title_ar: string;
  excerpt_en: string;
  excerpt_ar: string;
  content_en: string;
  content_ar: string;
  featured_image_url: string;
  category: string;
  author_name: string;
  isRTL: boolean;
  onClose: () => void;
}

const CATEGORIES: Record<string, { label_en: string; label_ar: string }> = {
  tips: { label_en: 'Tips', label_ar: 'نصائح' },
  guide: { label_en: 'Guide', label_ar: 'دليل' },
  inspiration: { label_en: 'Inspiration', label_ar: 'إلهام' },
  news: { label_en: 'News', label_ar: 'أخبار' },
  tutorial: { label_en: 'Tutorial', label_ar: 'تعليمي' },
};

const BlogPreview = React.forwardRef<HTMLDivElement, BlogPreviewProps>(function BlogPreview(
  {
    title_en,
    title_ar,
    excerpt_en,
    excerpt_ar,
    content_en,
    content_ar,
    featured_image_url,
    category,
    author_name,
    isRTL,
    onClose,
  },
  ref
) {
  const title = isRTL ? (title_ar || title_en) : (title_en || title_ar);
  const excerpt = isRTL ? (excerpt_ar || excerpt_en) : (excerpt_en || excerpt_ar);
  const content = isRTL ? (content_ar || content_en) : (content_en || content_ar);
  const categoryLabel = CATEGORIES[category]?.[isRTL ? 'label_ar' : 'label_en'] || category;

  // Check if content is meaningfully empty (handles TipTap empty state)
  const isContentEmpty = !content || content === '' || content === '<p></p>';

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background overflow-y-auto"
    >
      {/* Preview Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              {isRTL ? 'وضع المعاينة' : 'Preview Mode'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {isRTL ? 'هكذا سيظهر المقال للزوار' : 'This is how your post will appear to visitors'}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={onClose} className="gap-2">
            <X className="h-4 w-4" />
            {isRTL ? 'إغلاق المعاينة' : 'Close Preview'}
          </Button>
        </div>
      </div>

      {/* Blog Content Preview */}
      <article className={cn("py-12", isRTL && "text-right")} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="container max-w-4xl">
          {/* Back Link (decorative) */}
          <Button variant="ghost" size="sm" className="mb-6 gap-2 pointer-events-none opacity-50">
            <ArrowLeft className={cn("h-4 w-4", isRTL && "rotate-180")} />
            {isRTL ? 'العودة إلى المدونة' : 'Back to Blog'}
          </Button>

          {/* Category Badge */}
          <Badge className="mb-4">
            <Tag className="h-3 w-3 mr-1" />
            {categoryLabel}
          </Badge>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            {title || (isRTL ? 'عنوان المقال' : 'Post Title')}
          </h1>

          {/* Meta */}
          <div className={cn(
            "flex flex-wrap items-center gap-4 text-muted-foreground mb-8",
            isRTL && "flex-row-reverse"
          )}>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{author_name || 'Author Name'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(), isRTL ? 'd MMMM yyyy' : 'MMMM d, yyyy')}</span>
            </div>
          </div>

          {/* Excerpt */}
          {excerpt && (
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed border-l-4 border-primary pl-4">
              {excerpt}
            </p>
          )}

          {/* Featured Image */}
          {featured_image_url ? (
            <div className="aspect-video rounded-xl overflow-hidden mb-10">
              <img
                src={featured_image_url}
                alt={title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
            </div>
          ) : (
            <div className="aspect-video rounded-xl bg-muted flex items-center justify-center mb-10">
              <div className="text-center text-muted-foreground">
                <div className="text-4xl mb-2">🖼️</div>
                <p>{isRTL ? 'لم يتم تعيين صورة رئيسية' : 'No featured image set'}</p>
              </div>
            </div>
          )}

          {/* Content */}
          <Card>
            <CardContent className="p-6 md:p-10">
              {!isContentEmpty ? (
                <div 
                  className="prose prose-lg dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  <p className="text-lg">
                    {isRTL ? 'لا يوجد محتوى للمعاينة' : 'No content to preview'}
                  </p>
                  <p className="text-sm mt-2">
                    {isRTL ? 'ابدأ بكتابة المحتوى في علامة تبويب المحتوى' : 'Start writing content in the Content tab'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview Footer */}
          <div className="mt-10 p-6 bg-muted/50 rounded-xl border border-dashed">
            <p className="text-center text-muted-foreground text-sm">
              {isRTL 
                ? '— نهاية المعاينة — التعليقات والمقالات ذات الصلة ستظهر هنا بعد النشر'
                : '— End of Preview — Comments and related posts will appear here after publishing'}
            </p>
          </div>
        </div>
      </article>
    </motion.div>
  );
});

BlogPreview.displayName = 'BlogPreview';

export default BlogPreview;

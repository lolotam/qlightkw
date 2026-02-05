import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import {
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  FileText,
  Clock,
  Loader2,
  ArrowLeft,
  Send,
} from 'lucide-react';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';

// Blog post type from database
interface BlogPost {
  id: string;
  slug: string;
  title_en: string;
  title_ar: string | null;
  excerpt_en: string | null;
  content_en: string | null;
  featured_image_url: string | null;
  category: string | null;
  author_name: string | null;
  is_published: boolean | null;
  is_featured: boolean | null;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
}

const CATEGORIES: Record<string, { label_en: string; label_ar: string }> = {
  tips: { label_en: 'Tips', label_ar: 'نصائح' },
  guide: { label_en: 'Guide', label_ar: 'دليل' },
  inspiration: { label_en: 'Inspiration', label_ar: 'إلهام' },
  news: { label_en: 'News', label_ar: 'أخبار' },
  tutorial: { label_en: 'Tutorial', label_ar: 'تعليمي' },
};

export default function BlogDrafts() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Fetch draft blog posts from database
  const { data: drafts = [], isLoading } = useQuery({
    queryKey: ['admin-blog-drafts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('is_published', false)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data as BlogPost[];
    },
  });

  // Filter drafts by search
  const filteredDrafts = drafts.filter(post => 
    post.title_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.title_ar?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-drafts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      toast({
        title: isRTL ? 'تم الحذف' : 'Deleted',
        description: isRTL ? 'تم حذف المسودة' : 'Draft deleted',
      });
      setDeleteId(null);
    },
  });

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blog_posts')
        .update({ 
          is_published: true, 
          published_at: new Date().toISOString(),
          scheduled_at: null 
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-drafts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      toast({
        title: isRTL ? 'تم النشر' : 'Published',
        description: isRTL ? 'تم نشر المقال بنجاح' : 'Post published successfully',
      });
    },
  });

  const getStatusBadge = (post: BlogPost) => {
    if (post.scheduled_at && new Date(post.scheduled_at) > new Date()) {
      return (
        <Badge className="bg-amber-500 gap-1">
          <Clock className="h-3 w-3" />
          {isRTL ? 'مجدول' : 'Scheduled'}
        </Badge>
      );
    }
    if (post.scheduled_at && new Date(post.scheduled_at) <= new Date()) {
      return (
        <Badge className="bg-orange-600 gap-1">
          <Clock className="h-3 w-3" />
          {isRTL ? 'مؤجل' : 'Postponed'}
        </Badge>
      );
    }
    return <Badge variant="outline">{isRTL ? 'مسودة' : 'Draft'}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className={`flex flex-col gap-4 md:flex-row md:items-center md:justify-between ${isRTL ? 'md:flex-row-reverse' : ''}`}>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin/blog-posts">
              <ArrowLeft className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isRTL ? 'المسودات' : 'Drafts'}
            </h1>
            <p className="text-muted-foreground">
              {isRTL ? 'مقالات محفوظة تلقائياً غير منشورة' : 'Auto-saved unpublished posts'}
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
            <Input
              placeholder={isRTL ? 'البحث في المسودات...' : 'Search drafts...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={isRTL ? 'pr-10' : 'pl-10'}
            />
          </div>
        </CardContent>
      </Card>

      {/* Drafts Table */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <FileText className="h-5 w-5" />
            {isRTL ? 'المسودات' : 'Drafts'} ({filteredDrafts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredDrafts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{isRTL ? 'لا توجد مسودات' : 'No drafts found'}</p>
              <p className="text-sm mt-2">
                {isRTL 
                  ? 'المسودات تُحفظ تلقائياً عند كتابة المقالات'
                  : 'Drafts are auto-saved when you start writing posts'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead className={isRTL ? 'text-right' : ''}>{isRTL ? 'العنوان' : 'Title'}</TableHead>
                    <TableHead className={isRTL ? 'text-right' : ''}>{isRTL ? 'الفئة' : 'Category'}</TableHead>
                    <TableHead className={isRTL ? 'text-right' : ''}>{isRTL ? 'الحالة' : 'Status'}</TableHead>
                    <TableHead className={isRTL ? 'text-right' : ''}>{isRTL ? 'آخر تعديل' : 'Last Modified'}</TableHead>
                    <TableHead className={isRTL ? 'text-left' : 'text-right'}>{isRTL ? 'إجراءات' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDrafts.map((post, index) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className={isRTL ? 'text-right' : ''}>
                        <div>
                          <p className="font-medium line-clamp-1">
                            {(isRTL ? post.title_ar || post.title_en : post.title_en) || (
                              <span className="text-muted-foreground italic">
                                {isRTL ? 'بدون عنوان' : 'Untitled'}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">/{post.slug}</p>
                        </div>
                      </TableCell>
                      <TableCell className={isRTL ? 'text-right' : ''}>
                        <Badge variant="secondary">
                          {CATEGORIES[post.category || 'tips']?.[isRTL ? 'label_ar' : 'label_en'] || post.category}
                        </Badge>
                      </TableCell>
                      <TableCell className={isRTL ? 'text-right' : ''}>
                        {getStatusBadge(post)}
                        {post.scheduled_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(post.scheduled_at), 'MMM d, HH:mm')}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className={isRTL ? 'text-right' : ''}>
                        <div className="space-y-0.5">
                          <p className="text-sm">
                            {format(new Date(post.updated_at), 'MMM d, yyyy')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(post.updated_at), 'h:mm a')}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className={isRTL ? 'text-left' : 'text-right'}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                            <DropdownMenuItem onClick={() => navigate(`/admin/blog-posts?edit=${post.id}`)}>
                              <Pencil className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                              {isRTL ? 'تحرير' : 'Edit'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => publishMutation.mutate(post.id)}
                              disabled={publishMutation.isPending}
                            >
                              <Send className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                              {isRTL ? 'نشر الآن' : 'Publish Now'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setDeleteId(post.id)}
                              className="text-destructive"
                            >
                              <Trash2 className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                              {isRTL ? 'حذف' : 'Delete'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRTL ? 'حذف المسودة؟' : 'Delete Draft?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRTL 
                ? 'سيتم حذف هذه المسودة نهائياً ولا يمكن استعادتها.'
                : 'This draft will be permanently deleted and cannot be recovered.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isRTL ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isRTL ? 'حذف' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

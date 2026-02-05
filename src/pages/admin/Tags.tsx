import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  Tag,
  Loader2,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowUpDown,
  Download,
} from 'lucide-react';
import { format } from 'date-fns';

// Tag type
interface TagItem {
  id: string;
  name_en: string;
  name_ar: string;
  slug: string;
  color: string | null;
  is_active: boolean;
  created_at: string;
}

// Form state
interface TagForm {
  name_en: string;
  name_ar: string;
  slug: string;
  color: string;
  is_active: boolean;
}

const emptyForm: TagForm = {
  name_en: '',
  name_ar: '',
  slug: '',
  color: '#6366f1',
  is_active: true,
};

// Predefined colors for tags
const TAG_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
];

type SortField = 'name_en' | 'created_at' | 'is_active';
type SortOrder = 'asc' | 'desc';

export default function TagsPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('name_en');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagItem | null>(null);
  const [form, setForm] = useState<TagForm>(emptyForm);

  // Auto-open dialog if action=add in URL
  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setEditingTag(null);
      setForm(emptyForm);
      setDialogOpen(true);
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Fetch tags
  const { data: tags, isLoading } = useQuery({
    queryKey: ['admin-tags', searchQuery, sortField, sortOrder],
    queryFn: async (): Promise<TagItem[]> => {
      let query = supabase
        .from('tags')
        .select('*')
        .order(sortField, { ascending: sortOrder === 'asc' });

      if (searchQuery) {
        query = query.or(`name_en.ilike.%${searchQuery}%,name_ar.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: TagForm & { id?: string }) => {
      if (data.id) {
        const { error } = await supabase
          .from('tags')
          .update({
            name_en: data.name_en,
            name_ar: data.name_ar,
            slug: data.slug,
            color: data.color,
            is_active: data.is_active,
          })
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('tags').insert({
          name_en: data.name_en,
          name_ar: data.name_ar,
          slug: data.slug,
          color: data.color,
          is_active: data.is_active,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tags'] });
      toast({
        title: editingTag
          ? t('admin.tagUpdated', 'Tag updated')
          : t('admin.tagCreated', 'Tag created'),
      });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: t('admin.error', 'Error'),
        description: error.message,
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tags').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tags'] });
      toast({ title: t('admin.tagDeleted', 'Tag deleted') });
      setDeleteDialogOpen(false);
      setEditingTag(null);
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: t('admin.error', 'Error'),
        description: error.message,
      });
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('tags').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tags'] });
      toast({ title: t('admin.tagsDeleted', 'Tags deleted') });
      setSelectedIds([]);
      setBulkDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: t('admin.error', 'Error'),
        description: error.message,
      });
    },
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('tags')
        .update({ is_active: !is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tags'] });
      toast({ title: t('admin.statusUpdated', 'Status updated') });
    },
  });

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  // Handle form change
  const handleChange = (field: keyof TagForm, value: string | boolean) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'name_en' && typeof value === 'string') {
        updated.slug = generateSlug(value);
      }
      return updated;
    });
  };

  // Handle edit
  const handleEdit = (tag: TagItem) => {
    setEditingTag(tag);
    setForm({
      name_en: tag.name_en,
      name_ar: tag.name_ar,
      slug: tag.slug,
      color: tag.color || '#6366f1',
      is_active: tag.is_active,
    });
    setDialogOpen(true);
  };

  // Handle add
  const handleAdd = () => {
    setEditingTag(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  // Handle close dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTag(null);
    setForm(emptyForm);
  };

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({ ...form, id: editingTag?.id });
  };

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedIds.length === tags?.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(tags?.map(t => t.id) || []);
    }
  };

  // Handle select one
  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!tags?.length) return;

    const headers = ['Name (EN)', 'Name (AR)', 'Slug', 'Color', 'Active', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...tags.map((tag) =>
        [
          `"${tag.name_en}"`,
          `"${tag.name_ar}"`,
          tag.slug,
          tag.color || '',
          tag.is_active ? 'Yes' : 'No',
          format(new Date(tag.created_at), 'yyyy-MM-dd'),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tags_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: t('admin.exportSuccess', 'Export successful'),
      description: t('admin.csvDownloaded', 'CSV file downloaded'),
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('admin.tags', 'Tags')}
          </h1>
          <p className="text-muted-foreground">
            {t('admin.tagsDescription', 'Manage product tags and labels')}
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          {t('admin.addTag', 'Add Tag')}
        </Button>
      </div>

      {/* Filters and Bulk Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
              <Input
                placeholder={t('admin.searchTags', 'Search tags...')}
                className={isRTL ? 'pr-10' : 'pl-10'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Bulk Actions */}
            {selectedIds.length > 0 && (
              <Button 
                variant="destructive" 
                onClick={() => setBulkDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('admin.deleteSelected', 'Delete')} ({selectedIds.length})
              </Button>
            )}

            <Button variant="outline" onClick={exportToCSV} disabled={!tags?.length}>
              <Download className="h-4 w-4 mr-2" />
              {t('admin.exportCSV', 'Export CSV')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tags table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            {t('admin.allTags', 'All Tags')}
            {tags && (
              <Badge variant="secondary" className="ml-2">
                {tags.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : tags?.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {t('admin.noTags', 'No tags yet')}
              </h3>
              <p className="text-muted-foreground mb-4">
                {t('admin.noTagsDesc', 'Start by adding your first tag.')}
              </p>
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                {t('admin.addTag', 'Add Tag')}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={selectedIds.length === tags?.length && tags.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center gap-1 hover:text-foreground"
                        onClick={() => handleSort('name_en')}
                      >
                        {t('admin.tag', 'Tag')}
                        <ArrowUpDown className="h-4 w-4" />
                      </button>
                    </TableHead>
                    <TableHead>{t('admin.color', 'Color')}</TableHead>
                    <TableHead>
                      <button
                        className="flex items-center gap-1 hover:text-foreground"
                        onClick={() => handleSort('is_active')}
                      >
                        {t('admin.statusLabel', 'Status')}
                        <ArrowUpDown className="h-4 w-4" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center gap-1 hover:text-foreground"
                        onClick={() => handleSort('created_at')}
                      >
                        {t('admin.createdAt', 'Created At')}
                        <ArrowUpDown className="h-4 w-4" />
                      </button>
                    </TableHead>
                    <TableHead className={isRTL ? 'text-left' : 'text-right'}>
                      {t('admin.actions', 'Actions')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tags?.map((tag, index) => (
                    <TableRow key={tag.id}>
                      <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(tag.id)}
                          onCheckedChange={() => handleSelectOne(tag.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge
                            style={{ backgroundColor: tag.color || '#6366f1' }}
                            className="text-white"
                          >
                            {isRTL ? tag.name_ar : tag.name_en}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {tag.slug}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div
                          className="h-6 w-6 rounded-full border"
                          style={{ backgroundColor: tag.color || '#6366f1' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={tag.is_active ? 'default' : 'secondary'}
                          className="cursor-pointer"
                          onClick={() => toggleStatusMutation.mutate({ id: tag.id, is_active: tag.is_active })}
                        >
                          {tag.is_active 
                            ? t('admin.active', 'Active') 
                            : t('admin.inactive', 'Inactive')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(tag.created_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className={isRTL ? 'text-left' : 'text-right'}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                            <DropdownMenuItem onClick={() => handleEdit(tag)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              {t('admin.edit', 'Edit')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setEditingTag(tag);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {t('admin.delete', 'Delete')}
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

      {/* Add/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTag ? t('admin.editTag', 'Edit Tag') : t('admin.addTag', 'Add Tag')}
            </DialogTitle>
            <DialogDescription>
              {t('admin.tagFormDesc', 'Fill in the tag details below.')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {/* Name English */}
              <div className="space-y-2">
                <Label htmlFor="name_en">{t('admin.nameEn', 'Name (English)')} *</Label>
                <Input
                  id="name_en"
                  value={form.name_en}
                  onChange={(e) => handleChange('name_en', e.target.value)}
                  required
                />
              </div>

              {/* Name Arabic */}
              <div className="space-y-2">
                <Label htmlFor="name_ar">{t('admin.nameAr', 'Name (Arabic)')} *</Label>
                <Input
                  id="name_ar"
                  value={form.name_ar}
                  onChange={(e) => handleChange('name_ar', e.target.value)}
                  dir="rtl"
                  required
                />
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug">{t('admin.slug', 'Slug')} *</Label>
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => handleChange('slug', e.target.value)}
                  required
                />
              </div>

              {/* Color */}
              <div className="space-y-2">
                <Label>{t('admin.color', 'Color')}</Label>
                <div className="flex flex-wrap gap-2">
                  {TAG_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                        form.color === color ? 'border-foreground scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => handleChange('color', color)}
                    />
                  ))}
                  <Input
                    type="color"
                    value={form.color}
                    onChange={(e) => handleChange('color', e.target.value)}
                    className="h-8 w-8 p-0 border-0 cursor-pointer"
                  />
                </div>
              </div>

              {/* Active toggle */}
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">{t('admin.active', 'Active')}</Label>
                <Switch
                  id="is_active"
                  checked={form.is_active}
                  onCheckedChange={(checked) => handleChange('is_active', checked)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                {t('admin.cancel', 'Cancel')}
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editingTag ? t('admin.update', 'Update') : t('admin.create', 'Create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.deleteTag', 'Delete Tag')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.deleteTagDesc', 'Are you sure you want to delete this tag?')}
              <br />
              <strong>{editingTag?.name_en}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('admin.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => editingTag && deleteMutation.mutate(editingTag.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              <Trash2 className="h-4 w-4 mr-2" />
              {t('admin.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete confirmation */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.deleteTags', 'Delete Tags')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.deleteTagsDesc', 'Are you sure you want to delete {{count}} tags?', {
                count: selectedIds.length,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('admin.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => bulkDeleteMutation.mutate(selectedIds)}
              disabled={bulkDeleteMutation.isPending}
            >
              {bulkDeleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              <Trash2 className="h-4 w-4 mr-2" />
              {t('admin.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
  DropdownMenuSeparator,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  MoreHorizontal,
  Mail,
  Trash2,
  Loader2,
  Download,
  UserMinus,
  UserCheck,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';

// Subscriber type
interface Subscriber {
  id: string;
  email: string;
  is_active: boolean;
  language: string | null;
  source: string | null;
  subscribed_at: string;
  unsubscribed_at: string | null;
}

type SortField = 'email' | 'subscribed_at' | 'is_active';
type SortOrder = 'asc' | 'desc';

export default function NewsletterSubscribersPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortField, setSortField] = useState<SortField>('subscribed_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [selectedSubscriber, setSelectedSubscriber] = useState<Subscriber | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Fetch subscribers
  const { data: subscribers, isLoading } = useQuery({
    queryKey: ['admin-subscribers', searchQuery, statusFilter, sortField, sortOrder],
    queryFn: async (): Promise<Subscriber[]> => {
      let query = supabase
        .from('newsletter_subscribers')
        .select('*')
        .order(sortField, { ascending: sortOrder === 'asc' });

      // Apply search filter
      if (searchQuery) {
        query = query.ilike('email', `%${searchQuery}%`);
      }

      // Apply status filter
      if (statusFilter === 'active') {
        query = query.eq('is_active', true);
      } else if (statusFilter === 'inactive') {
        query = query.eq('is_active', false);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Toggle subscriber status
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .update({ 
          is_active: !is_active,
          unsubscribed_at: is_active ? new Date().toISOString() : null
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscribers'] });
      toast({ title: t('admin.statusUpdated', 'Status updated') });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: t('admin.error', 'Error'),
        description: error.message,
      });
    },
  });

  // Delete subscriber
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscribers'] });
      toast({ title: t('admin.subscriberDeleted', 'Subscriber deleted') });
      setDeleteDialogOpen(false);
      setSelectedSubscriber(null);
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: t('admin.error', 'Error'),
        description: error.message,
      });
    },
  });

  // Bulk delete subscribers
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .delete()
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscribers'] });
      toast({ title: t('admin.subscribersDeleted', 'Subscribers deleted') });
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

  // Bulk toggle status
  const bulkToggleStatusMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: boolean }) => {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .update({ 
          is_active: status,
          unsubscribed_at: status ? null : new Date().toISOString()
        })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscribers'] });
      toast({ title: t('admin.statusUpdated', 'Status updated') });
      setSelectedIds([]);
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: t('admin.error', 'Error'),
        description: error.message,
      });
    },
  });

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
    if (selectedIds.length === paginatedSubscribers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedSubscribers.map(s => s.id));
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
    if (!subscribers?.length) return;

    const headers = ['Email', 'Status', 'Language', 'Source', 'Subscribed At', 'Unsubscribed At'];
    const csvContent = [
      headers.join(','),
      ...subscribers.map((s) =>
        [
          s.email,
          s.is_active ? 'Active' : 'Inactive',
          s.language || '',
          s.source || '',
          format(new Date(s.subscribed_at), 'yyyy-MM-dd HH:mm'),
          s.unsubscribed_at ? format(new Date(s.unsubscribed_at), 'yyyy-MM-dd HH:mm') : '',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `newsletter_subscribers_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: t('admin.exportSuccess', 'Export successful'),
      description: t('admin.csvDownloaded', 'CSV file downloaded'),
    });
  };

  // Pagination
  const totalPages = Math.ceil((subscribers?.length || 0) / pageSize);
  const paginatedSubscribers = subscribers?.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  ) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('admin.newsletterSubscribers', 'Newsletter Subscribers')}
          </h1>
          <p className="text-muted-foreground">
            {t('admin.subscribersDescription', 'Manage newsletter subscriptions')}
          </p>
        </div>
        <Button variant="outline" onClick={exportToCSV} disabled={!subscribers?.length}>
          <Download className="h-4 w-4 mr-2" />
          {t('admin.exportCSV', 'Export CSV')}
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
                placeholder={t('admin.searchByEmail', 'Search by email...')}
                className={isRTL ? 'pr-10' : 'pl-10'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('admin.filterByStatus', 'Filter by status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.allSubscribers', 'All')}</SelectItem>
                <SelectItem value="active">{t('admin.activeOnly', 'Active only')}</SelectItem>
                <SelectItem value="inactive">{t('admin.inactiveOnly', 'Inactive only')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Bulk Actions */}
            {selectedIds.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    {t('admin.bulkActions', 'Bulk Actions')} ({selectedIds.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => bulkToggleStatusMutation.mutate({ ids: selectedIds, status: true })}>
                    <UserCheck className="h-4 w-4 mr-2" />
                    {t('admin.activateSelected', 'Activate Selected')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => bulkToggleStatusMutation.mutate({ ids: selectedIds, status: false })}>
                    <UserMinus className="h-4 w-4 mr-2" />
                    {t('admin.deactivateSelected', 'Deactivate Selected')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive" 
                    onClick={() => setBulkDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('admin.deleteSelected', 'Delete Selected')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Subscribers table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {t('admin.allSubscribers', 'All Subscribers')}
            {subscribers && (
              <Badge variant="secondary" className="ml-2">
                {subscribers.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : subscribers?.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {t('admin.noSubscribers', 'No subscribers yet')}
              </h3>
              <p className="text-muted-foreground">
                {t('admin.noSubscribersDesc', 'Subscribers will appear here when users sign up for your newsletter.')}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={selectedIds.length === paginatedSubscribers.length && paginatedSubscribers.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>
                        <button
                          className="flex items-center gap-1 hover:text-foreground"
                          onClick={() => handleSort('email')}
                        >
                          {t('admin.email', 'Email')}
                          <ArrowUpDown className="h-4 w-4" />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          className="flex items-center gap-1 hover:text-foreground"
                          onClick={() => handleSort('is_active')}
                        >
                          {t('admin.status', 'Status')}
                          <ArrowUpDown className="h-4 w-4" />
                        </button>
                      </TableHead>
                      <TableHead>{t('admin.language', 'Language')}</TableHead>
                      <TableHead>{t('admin.source', 'Source')}</TableHead>
                      <TableHead>
                        <button
                          className="flex items-center gap-1 hover:text-foreground"
                          onClick={() => handleSort('subscribed_at')}
                        >
                          {t('admin.subscribedAt', 'Subscribed At')}
                          <ArrowUpDown className="h-4 w-4" />
                        </button>
                      </TableHead>
                      <TableHead className={isRTL ? 'text-left' : 'text-right'}>
                        {t('admin.actions', 'Actions')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedSubscribers.map((subscriber, index) => (
                      <TableRow key={subscriber.id}>
                        <TableCell className="font-medium text-muted-foreground">{(currentPage - 1) * pageSize + index + 1}</TableCell>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(subscriber.id)}
                            onCheckedChange={() => handleSelectOne(subscriber.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{subscriber.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant={subscriber.is_active ? 'default' : 'secondary'}
                            className="cursor-pointer"
                            onClick={() => toggleStatusMutation.mutate({ 
                              id: subscriber.id, 
                              is_active: subscriber.is_active 
                            })}
                          >
                            {subscriber.is_active 
                              ? t('admin.active', 'Active') 
                              : t('admin.inactive', 'Inactive')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {subscriber.language === 'ar' ? 'العربية' : 'English'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {subscriber.source || 'website'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(subscriber.subscribed_at), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className={isRTL ? 'text-left' : 'text-right'}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                              <DropdownMenuItem
                                onClick={() => toggleStatusMutation.mutate({ 
                                  id: subscriber.id, 
                                  is_active: subscriber.is_active 
                                })}
                              >
                                {subscriber.is_active ? (
                                  <>
                                    <UserMinus className="h-4 w-4 mr-2" />
                                    {t('admin.deactivate', 'Deactivate')}
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    {t('admin.activate', 'Activate')}
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  setSelectedSubscriber(subscriber);
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    {t('admin.showingXofY', 'Showing {{from}}-{{to}} of {{total}}', {
                      from: (currentPage - 1) * pageSize + 1,
                      to: Math.min(currentPage * pageSize, subscribers?.length || 0),
                      total: subscribers?.length || 0,
                    })}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.deleteSubscriber', 'Delete Subscriber')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.deleteSubscriberDesc', 'Are you sure you want to delete this subscriber?')}
              <br />
              <strong>{selectedSubscriber?.email}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('admin.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => selectedSubscriber && deleteMutation.mutate(selectedSubscriber.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              <Trash2 className="h-4 w-4 mr-2" />
              {t('admin.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete confirmation dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.deleteSubscribers', 'Delete Subscribers')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.deleteSubscribersDesc', 'Are you sure you want to delete {{count}} subscribers?', {
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

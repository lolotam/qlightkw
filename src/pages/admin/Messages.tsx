import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  Mail,
  MailOpen,
  Trash2,
  Loader2,
  Star,
  StarOff,
  ExternalLink,
  Inbox,
} from 'lucide-react';

// Message type
interface Message {
  id: string;
  from_email: string;
  from_name: string | null;
  to_email: string;
  subject: string | null;
  body: string | null;
  html_body: string | null;
  is_read: boolean;
  is_starred: boolean;
  direction: string;
  status: string;
  created_at: string;
}

export default function MessagesPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);

  // Fetch messages from admin_inbox_messages table
  const { data: messages, isLoading } = useQuery({
    queryKey: ['admin-messages', searchQuery],
    queryFn: async (): Promise<Message[]> => {
      let query = supabase
        .from('admin_inbox_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.or(`from_email.ilike.%${searchQuery}%,subject.ilike.%${searchQuery}%,from_name.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as Message[]) || [];
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('admin_inbox_messages')
        .update({ is_read: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
    },
  });

  // Toggle starred mutation
  const toggleStarredMutation = useMutation({
    mutationFn: async ({ id, is_starred }: { id: string; is_starred: boolean }) => {
      const { error } = await supabase
        .from('admin_inbox_messages')
        .update({ is_starred: !is_starred })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
      toast({ title: t('admin.updated', 'Updated') });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('admin_inbox_messages')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
      toast({ title: t('admin.messageDeleted', 'Message deleted') });
      setDeleteDialogOpen(false);
      setMessageToDelete(null);
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: t('admin.error', 'Error'),
        description: error.message,
      });
    },
  });

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Handle message click
  const handleMessageClick = (message: Message) => {
    setSelectedMessage(message);
    if (!message.is_read) {
      markAsReadMutation.mutate(message.id);
    }
  };

  // Handle delete click
  const handleDeleteClick = (e: React.MouseEvent, message: Message) => {
    e.stopPropagation();
    setMessageToDelete(message);
    setDeleteDialogOpen(true);
  };

  // Unread count
  const unreadCount = messages?.filter(m => !m.is_read).length || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          {t('admin.messages', 'Messages')}
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount}</Badge>
          )}
        </h1>
        <p className="text-muted-foreground">
          {t('admin.messagesDescription', 'Manage customer inquiries and contact form submissions')}
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('admin.searchMessages', 'Search by email, name, or subject...')}
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Messages table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Inbox className="h-5 w-5" />
            {t('admin.inbox', 'Inbox')}
            {messages && (
              <Badge variant="secondary" className="ml-2">
                {messages.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : messages?.length === 0 ? (
            <div className="text-center py-12">
              <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {t('admin.noMessages', 'No messages yet')}
              </h3>
              <p className="text-muted-foreground">
                {t('admin.noMessagesDesc', 'Messages from customers will appear here.')}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead>{t('admin.from', 'From')}</TableHead>
                    <TableHead>{t('admin.subject', 'Subject')}</TableHead>
                    <TableHead>{t('admin.date', 'Date')}</TableHead>
                    <TableHead className="text-right">{t('admin.actions', 'Actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages?.map((message) => (
                    <TableRow
                      key={message.id}
                      className={`cursor-pointer hover:bg-muted/50 ${!message.is_read ? 'bg-primary/5 font-medium' : ''}`}
                      onClick={() => handleMessageClick(message)}
                    >
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStarredMutation.mutate({ id: message.id, is_starred: message.is_starred ?? false });
                          }}
                        >
                          {message.is_starred ? (
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          ) : (
                            <StarOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {message.is_read ? (
                            <MailOpen className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Mail className="h-4 w-4 text-primary" />
                          )}
                          <div>
                            <p className={!message.is_read ? 'font-semibold' : ''}>
                              {message.from_name || message.from_email}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {message.from_email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className={`truncate max-w-[300px] ${!message.is_read ? 'font-semibold' : ''}`}>
                          {message.subject || t('admin.noSubject', '(No Subject)')}
                        </p>
                        <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                          {message.body?.substring(0, 50)}...
                        </p>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(message.created_at)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={(e) => handleDeleteClick(e, message)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message detail dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedMessage?.subject || t('admin.noSubject', '(No Subject)')}</DialogTitle>
            <DialogDescription>
              {t('admin.from', 'From')}: {selectedMessage?.from_name || selectedMessage?.from_email}
              {selectedMessage?.from_name && (
                <span className="ml-1 text-muted-foreground">({selectedMessage.from_email})</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{t('admin.to', 'To')}: {selectedMessage?.to_email}</span>
              <span>{selectedMessage && formatDate(selectedMessage.created_at)}</span>
            </div>
            <div className="border-t pt-4">
              {selectedMessage?.html_body ? (
                <div
                  className="prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedMessage.html_body }}
                />
              ) : (
                <p className="whitespace-pre-wrap">{selectedMessage?.body}</p>
              )}
            </div>
            <div className="flex gap-2 pt-4 border-t">
              <Button asChild>
                <a href={`mailto:${selectedMessage?.from_email}?subject=Re: ${selectedMessage?.subject || ''}`}>
                  <Mail className="h-4 w-4 mr-2" />
                  {t('admin.reply', 'Reply')}
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href={`mailto:${selectedMessage?.from_email}`} target="_blank">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {t('admin.openInEmail', 'Open in Email Client')}
                </a>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.deleteMessage', 'Delete Message')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.deleteMessageDesc', 'Are you sure you want to delete this message? This action cannot be undone.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('admin.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => messageToDelete && deleteMutation.mutate(messageToDelete.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              {t('admin.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

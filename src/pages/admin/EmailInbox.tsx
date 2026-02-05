import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { 
  Inbox, 
  Send, 
  Search, 
  RefreshCw, 
  Mail,
  MailOpen,
  Star,
  StarOff,
  Trash2,
  Reply,
  Forward,
  MoreHorizontal,
  FileEdit,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow, format } from 'date-fns';
import EmailCompose from '@/components/admin/EmailCompose';

interface InboxMessage {
  id: string;
  from_email: string;
  from_name: string | null;
  to_email: string;
  subject: string | null;
  body: string | null;
  html_body: string | null;
  direction: 'inbound' | 'outbound';
  status: 'received' | 'sent' | 'failed' | 'draft' | 'scheduled';
  is_read: boolean;
  is_starred: boolean;
  thread_id: string | null;
  created_at: string;
}

export default function AdminEmailInbox() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isRTL = i18n.language === 'ar';

  const [activeTab, setActiveTab] = useState('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<InboxMessage | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<{ email: string; subject: string; body: string } | null>(null);

  // Fetch messages
  const { data: messages, isLoading, refetch } = useQuery({
    queryKey: ['admin-inbox-messages', activeTab],
    queryFn: async () => {
      let query = supabase
        .from('admin_inbox_messages')
        .select('*')
        .order('created_at', { ascending: false });

      switch (activeTab) {
        case 'inbox':
          query = query.eq('direction', 'inbound');
          break;
        case 'sent':
          query = query.eq('direction', 'outbound').eq('status', 'sent');
          break;
        case 'drafts':
          query = query.eq('status', 'draft');
          break;
        case 'scheduled':
          query = query.eq('status', 'scheduled');
          break;
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as InboxMessage[];
    },
  });

  // Calculate counts
  const unreadCount = messages?.filter(m => !m.is_read && m.direction === 'inbound').length || 0;

  // Filter messages
  const filteredMessages = messages?.filter(msg =>
    msg.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    msg.from_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    msg.body?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      queryClient.invalidateQueries({ queryKey: ['admin-inbox-messages'] });
    },
  });

  // Toggle star mutation
  const toggleStarMutation = useMutation({
    mutationFn: async ({ id, is_starred }: { id: string; is_starred: boolean }) => {
      const { error } = await supabase
        .from('admin_inbox_messages')
        .update({ is_starred })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-inbox-messages'] });
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
      queryClient.invalidateQueries({ queryKey: ['admin-inbox-messages'] });
      setSelectedMessage(null);
      toast({ title: t('admin.inbox.deleted', 'Message deleted') });
    },
  });

  // Select message
  const handleSelectMessage = (message: InboxMessage) => {
    setSelectedMessage(message);
    if (!message.is_read) {
      markAsReadMutation.mutate(message.id);
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'failed':
        return <XCircle className="h-3 w-3 text-destructive" />;
      case 'scheduled':
        return <Clock className="h-3 w-3 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Inbox className="h-6 w-6" />
            {t('admin.inbox.title', 'Email Inbox')}
          </h1>
          <p className="text-muted-foreground">
            {t('admin.inbox.description', 'Manage admin emails and communications')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('admin.inbox.refresh', 'Refresh')}
          </Button>
          <Button onClick={() => { setReplyToMessage(null); setShowCompose(true); }}>
            <FileEdit className="h-4 w-4 mr-2" />
            {t('admin.inbox.compose', 'Compose')}
          </Button>
        </div>
      </div>

      {/* Email Compose Dialog */}
      <EmailCompose 
        open={showCompose} 
        onOpenChange={setShowCompose}
        replyTo={replyToMessage}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="inbox" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            {t('admin.inbox.inbox', 'Inbox')}
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 px-1.5">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent">
            <Send className="h-4 w-4 mr-2" />
            {t('admin.inbox.sent', 'Sent')}
          </TabsTrigger>
          <TabsTrigger value="drafts">
            <FileEdit className="h-4 w-4 mr-2" />
            {t('admin.inbox.drafts', 'Drafts')}
          </TabsTrigger>
          <TabsTrigger value="scheduled">
            <Clock className="h-4 w-4 mr-2" />
            {t('admin.inbox.scheduled', 'Scheduled')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <div className="flex gap-4">
            {/* Message List */}
            <Card className={`flex-1 ${selectedMessage ? 'hidden md:block md:max-w-md' : ''}`}>
              <CardHeader className="pb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('admin.inbox.search', 'Search messages...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  {isLoading ? (
                    <div className="space-y-1 p-2">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="p-3 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      ))}
                    </div>
                  ) : filteredMessages?.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>{t('admin.inbox.noMessages', 'No messages found')}</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredMessages?.map((message) => (
                        <button
                          key={message.id}
                          onClick={() => handleSelectMessage(message)}
                          className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${
                            selectedMessage?.id === message.id ? 'bg-muted' : ''
                          } ${!message.is_read ? 'bg-primary/5' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleStarMutation.mutate({ 
                                  id: message.id, 
                                  is_starred: !message.is_starred 
                                });
                              }}
                            >
                              {message.is_starred ? (
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              ) : (
                                <StarOff className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className={`font-medium truncate ${!message.is_read ? 'font-semibold' : ''}`}>
                                  {message.direction === 'inbound' 
                                    ? message.from_name || message.from_email 
                                    : message.to_email}
                                </span>
                                <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                                  {getStatusIcon(message.status)}
                                  {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                                </span>
                              </div>
                              <p className={`text-sm truncate ${!message.is_read ? 'font-medium' : 'text-muted-foreground'}`}>
                                {message.subject || t('admin.inbox.noSubject', '(No subject)')}
                              </p>
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {message.body?.slice(0, 80)}...
                              </p>
                            </div>
                            {!message.is_read && (
                              <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Message Detail */}
            {selectedMessage && (
              <Card className="flex-1">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="md:hidden"
                      onClick={() => setSelectedMessage(null)}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      {t('common.back', 'Back')}
                    </Button>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setReplyToMessage({
                            email: selectedMessage.from_email,
                            subject: selectedMessage.subject || '',
                            body: selectedMessage.body || '',
                          });
                          setShowCompose(true);
                        }}
                      >
                        <Reply className="h-4 w-4 mr-2" />
                        {t('admin.inbox.reply', 'Reply')}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setReplyToMessage({
                            email: '',
                            subject: `Fwd: ${selectedMessage.subject || ''}`,
                            body: selectedMessage.body || '',
                          });
                          setShowCompose(true);
                        }}
                      >
                        <Forward className="h-4 w-4 mr-2" />
                        {t('admin.inbox.forward', 'Forward')}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => toggleStarMutation.mutate({ 
                              id: selectedMessage.id, 
                              is_starred: !selectedMessage.is_starred 
                            })}
                          >
                            <Star className="h-4 w-4 mr-2" />
                            {selectedMessage.is_starred 
                              ? t('admin.inbox.unstar', 'Unstar') 
                              : t('admin.inbox.star', 'Star')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => deleteMutation.mutate(selectedMessage.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t('common.delete', 'Delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    {/* Email Header */}
                    <div>
                      <h2 className="text-xl font-semibold mb-2">
                        {selectedMessage.subject || t('admin.inbox.noSubject', '(No subject)')}
                      </h2>
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <span className="font-medium">
                            {selectedMessage.from_name || selectedMessage.from_email}
                          </span>
                          {selectedMessage.from_name && (
                            <span className="text-muted-foreground ml-1">
                              &lt;{selectedMessage.from_email}&gt;
                            </span>
                          )}
                        </div>
                        <span className="text-muted-foreground">
                          {format(new Date(selectedMessage.created_at), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {t('admin.inbox.to', 'To')}: {selectedMessage.to_email}
                      </p>
                    </div>

                    <Separator />

                    {/* Email Body */}
                    <ScrollArea className="h-[400px]">
                      {selectedMessage.html_body ? (
                        <div 
                          className="prose prose-sm max-w-none dark:prose-invert"
                          dangerouslySetInnerHTML={{ __html: selectedMessage.html_body }}
                        />
                      ) : (
                        <pre className="whitespace-pre-wrap font-sans text-sm">
                          {selectedMessage.body || t('admin.inbox.noContent', 'No content')}
                        </pre>
                      )}
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

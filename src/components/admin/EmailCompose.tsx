import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import {
  Send,
  Paperclip,
  X,
  Loader2,
  Sparkles,
  Clock,
  Save,
  ChevronDown,
  Plus,
  Settings,
  Trash2,
  Edit3,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';

interface EmailComposeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  replyTo?: {
    email: string;
    subject: string;
    body: string;
  } | null;
}

interface EmailSignature {
  id: string;
  name: string;
  content: string;
  is_default: boolean;
}

// Available sender emails
const SENDER_EMAILS = [
  { value: 'info@qlightkw.com', label: 'Info (info@qlightkw.com)' },
  { value: 'admin@qlightkw.com', label: 'Admin (admin@qlightkw.com)' },
  { value: 'sales@qlightkw.com', label: 'Sales (sales@qlightkw.com)' },
];

export default function EmailCompose({ open, onOpenChange, replyTo }: EmailComposeProps) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isRTL = i18n.language === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [fromEmail, setFromEmail] = useState(SENDER_EMAILS[0].value);
  const [toEmail, setToEmail] = useState(replyTo?.email || '');
  const [ccEmails, setCcEmails] = useState('');
  const [subject, setSubject] = useState(replyTo ? `Re: ${replyTo.subject}` : '');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [includeSignature, setIncludeSignature] = useState(true);
  const [signaturePosition, setSignaturePosition] = useState<'top' | 'bottom'>('bottom');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showSignatureManager, setShowSignatureManager] = useState(false);
  const [newSignatureName, setNewSignatureName] = useState('');
  const [newSignatureContent, setNewSignatureContent] = useState('');
  const [editingSignature, setEditingSignature] = useState<EmailSignature | null>(null);

  // Rich text editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: replyTo ? `<br/><br/><hr/><p>On previous message:</p><blockquote>${replyTo.body}</blockquote>` : '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] p-3',
      },
    },
  });

  // Fetch signatures from settings
  const { data: signatures = [] } = useQuery({
    queryKey: ['email-signatures'],
    queryFn: async (): Promise<EmailSignature[]> => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'email_signatures')
        .maybeSingle();
      
      if (error) throw error;
      // Safely cast the value to EmailSignature array
      const value = data?.value;
      if (Array.isArray(value)) {
        return value as unknown as EmailSignature[];
      }
      return [];
    },
  });

  const defaultSignature = signatures.find(s => s.is_default);

  // Save signatures mutation
  const saveSignaturesMutation = useMutation({
    mutationFn: async (newSignatures: EmailSignature[]) => {
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('key', 'email_signatures')
        .maybeSingle();

      // Convert to JSON-compatible format
      const jsonValue = JSON.parse(JSON.stringify(newSignatures));

      if (existing) {
        const { error } = await supabase
          .from('site_settings')
          .update({ value: jsonValue })
          .eq('key', 'email_signatures');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert([{ key: 'email_signatures', value: jsonValue }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-signatures'] });
      toast({ title: t('admin.inbox.signatureSaved', 'Signature saved') });
    },
  });

  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async (data: { 
      from: string; 
      to: string; 
      cc?: string;
      subject: string; 
      html: string; 
      attachments?: any[];
    }) => {
      const { data: result, error } = await supabase.functions.invoke('send-admin-email', {
        body: data,
      });
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast({ title: t('admin.inbox.emailSent', 'Email sent successfully') });
      queryClient.invalidateQueries({ queryKey: ['admin-inbox-messages'] });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: t('admin.inbox.sendError', 'Failed to send email'),
        description: error.message,
      });
    },
  });

  // AI writing assistance
  const handleAIAssist = async (type: 'improve' | 'shorten' | 'formal' | 'friendly') => {
    if (!editor) return;
    
    const currentContent = editor.getText();
    if (!currentContent.trim()) {
      toast({
        variant: 'destructive',
        title: t('admin.inbox.noContent', 'No content to improve'),
      });
      return;
    }

    setIsGeneratingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-content', {
        body: {
          type: 'text',
          prompt: getAIPrompt(type, currentContent),
        },
      });

      if (error) throw error;
      if (data?.text) {
        editor.commands.setContent(data.text);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('admin.inbox.aiError', 'AI generation failed'),
        description: error.message,
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const getAIPrompt = (type: string, content: string) => {
    const prompts: Record<string, string> = {
      improve: `Improve and polish this email content, fixing grammar and making it more professional:\n\n${content}`,
      shorten: `Shorten this email while keeping the key points:\n\n${content}`,
      formal: `Rewrite this email in a more formal, professional tone:\n\n${content}`,
      friendly: `Rewrite this email in a warmer, friendlier tone:\n\n${content}`,
    };
    return prompts[type] || prompts.improve;
  };

  // Handle file attachment
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Handle send
  const handleSend = async () => {
    if (!toEmail.trim()) {
      toast({
        variant: 'destructive',
        title: t('admin.inbox.recipientRequired', 'Recipient email is required'),
      });
      return;
    }

    let htmlContent = editor?.getHTML() || '';

    // Add signature if enabled
    if (includeSignature && defaultSignature) {
      if (signaturePosition === 'top') {
        htmlContent = `<div>${defaultSignature.content}</div><br/>${htmlContent}`;
      } else {
        htmlContent = `${htmlContent}<br/><div>${defaultSignature.content}</div>`;
      }
    }

    // Convert attachments to base64
    const attachmentData = await Promise.all(
      attachments.map(async (file) => {
        const buffer = await file.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
        return {
          filename: file.name,
          content: base64,
          type: file.type,
        };
      })
    );

    sendEmailMutation.mutate({
      from: fromEmail,
      to: toEmail,
      cc: ccEmails || undefined,
      subject,
      html: htmlContent,
      attachments: attachmentData.length > 0 ? attachmentData : undefined,
    });
  };

  // Save as draft
  const handleSaveDraft = async () => {
    const { error } = await supabase.from('admin_inbox_messages').insert({
      from_email: fromEmail,
      to_email: toEmail || 'draft@example.com',
      subject,
      html_body: editor?.getHTML() || '',
      body: editor?.getText() || '',
      direction: 'outbound',
      status: 'draft',
    });

    if (error) {
      toast({ variant: 'destructive', title: 'Failed to save draft' });
    } else {
      toast({ title: t('admin.inbox.draftSaved', 'Draft saved') });
      queryClient.invalidateQueries({ queryKey: ['admin-inbox-messages'] });
      handleClose();
    }
  };

  // Add/edit signature
  const handleSaveSignature = () => {
    if (!newSignatureName.trim() || !newSignatureContent.trim()) return;

    const newSig: EmailSignature = {
      id: editingSignature?.id || Date.now().toString(),
      name: newSignatureName,
      content: newSignatureContent,
      is_default: editingSignature?.is_default || signatures.length === 0,
    };

    const updatedSignatures = editingSignature
      ? signatures.map(s => s.id === editingSignature.id ? newSig : s)
      : [...signatures, newSig];

    saveSignaturesMutation.mutate(updatedSignatures);
    setNewSignatureName('');
    setNewSignatureContent('');
    setEditingSignature(null);
  };

  const handleDeleteSignature = (id: string) => {
    const updatedSignatures = signatures.filter(s => s.id !== id);
    saveSignaturesMutation.mutate(updatedSignatures);
  };

  const handleSetDefaultSignature = (id: string) => {
    const updatedSignatures = signatures.map(s => ({
      ...s,
      is_default: s.id === id,
    }));
    saveSignaturesMutation.mutate(updatedSignatures);
  };

  const handleClose = () => {
    setToEmail('');
    setCcEmails('');
    setSubject('');
    setAttachments([]);
    editor?.commands.clearContent();
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              {t('admin.inbox.composeEmail', 'Compose Email')}
            </DialogTitle>
            <DialogDescription>
              {t('admin.inbox.composeDesc', 'Send emails from your admin account')}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4">
            {/* From */}
            <div className="space-y-2">
              <Label>{t('admin.inbox.from', 'From')}</Label>
              <Select value={fromEmail} onValueChange={setFromEmail}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SENDER_EMAILS.map((email) => (
                    <SelectItem key={email.value} value={email.value}>
                      {email.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* To */}
            <div className="space-y-2">
              <Label>{t('admin.inbox.to', 'To')}</Label>
              <Input
                type="email"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                placeholder="recipient@example.com"
              />
            </div>

            {/* CC */}
            <div className="space-y-2">
              <Label>{t('admin.inbox.cc', 'CC')}</Label>
              <Input
                type="text"
                value={ccEmails}
                onChange={(e) => setCcEmails(e.target.value)}
                placeholder="cc1@example.com, cc2@example.com"
              />
              <p className="text-xs text-muted-foreground">
                {t('admin.inbox.ccHint', 'Separate multiple emails with commas')}
              </p>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label>{t('admin.inbox.subject', 'Subject')}</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={t('admin.inbox.subjectPlaceholder', 'Email subject...')}
              />
            </div>

            {/* AI Assistance */}
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isGeneratingAI}>
                    {isGeneratingAI ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    {t('admin.inbox.aiAssist', 'AI Assist')}
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleAIAssist('improve')}>
                    <Edit3 className="h-4 w-4 mr-2" />
                    {t('admin.inbox.improve', 'Improve Writing')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAIAssist('shorten')}>
                    <FileText className="h-4 w-4 mr-2" />
                    {t('admin.inbox.shorten', 'Make Shorter')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAIAssist('formal')}>
                    <FileText className="h-4 w-4 mr-2" />
                    {t('admin.inbox.formal', 'More Formal')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAIAssist('friendly')}>
                    <FileText className="h-4 w-4 mr-2" />
                    {t('admin.inbox.friendly', 'More Friendly')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSignatureManager(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                {t('admin.inbox.signatures', 'Signatures')}
              </Button>
            </div>

            {/* Editor */}
            <div className="border rounded-lg overflow-hidden">
              <EditorContent editor={editor} className="min-h-[200px]" />
            </div>

            {/* Signature Settings */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={includeSignature}
                    onCheckedChange={setIncludeSignature}
                  />
                  <Label>{t('admin.inbox.includeSignature', 'Include Signature')}</Label>
                </div>
                {includeSignature && (
                  <Select value={signaturePosition} onValueChange={(v: 'top' | 'bottom') => setSignaturePosition(v)}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top">{t('admin.inbox.signatureTop', 'At Top')}</SelectItem>
                      <SelectItem value="bottom">{t('admin.inbox.signatureBottom', 'At Bottom')}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              {defaultSignature && includeSignature && (
                <Badge variant="outline">{defaultSignature.name}</Badge>
              )}
            </div>

            {/* Attachments */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t('admin.inbox.attachments', 'Attachments')}</Label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  multiple
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4 mr-2" />
                  {t('admin.inbox.addFile', 'Add File')}
                </Button>
              </div>
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {attachments.map((file, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-2">
                      {file.type.startsWith('image/') ? (
                        <ImageIcon className="h-3 w-3" />
                      ) : (
                        <FileText className="h-3 w-3" />
                      )}
                      {file.name} ({formatFileSize(file.size)})
                      <button onClick={() => removeAttachment(index)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <Separator />

          <DialogFooter className="flex-row justify-between">
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSaveDraft}>
                <Save className="h-4 w-4 mr-2" />
                {t('admin.inbox.saveDraft', 'Save Draft')}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button onClick={handleSend} disabled={sendEmailMutation.isPending}>
                {sendEmailMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {t('admin.inbox.send', 'Send')}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Signature Manager Dialog */}
      <Dialog open={showSignatureManager} onOpenChange={setShowSignatureManager}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('admin.inbox.manageSignatures', 'Manage Email Signatures')}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Existing Signatures */}
            {signatures.length > 0 && (
              <div className="space-y-2">
                <Label>{t('admin.inbox.savedSignatures', 'Saved Signatures')}</Label>
                <div className="space-y-2">
                  {signatures.map((sig) => (
                    <div key={sig.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{sig.name}</span>
                        {sig.is_default && <Badge>Default</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        {!sig.is_default && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetDefaultSignature(sig.id)}
                          >
                            Set Default
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingSignature(sig);
                            setNewSignatureName(sig.name);
                            setNewSignatureContent(sig.content);
                          }}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSignature(sig.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add/Edit Signature */}
            <div className="space-y-3">
              <Label>
                {editingSignature 
                  ? t('admin.inbox.editSignature', 'Edit Signature')
                  : t('admin.inbox.addSignature', 'Add New Signature')
                }
              </Label>
              <Input
                placeholder={t('admin.inbox.signatureName', 'Signature name...')}
                value={newSignatureName}
                onChange={(e) => setNewSignatureName(e.target.value)}
              />
              <Textarea
                placeholder={t('admin.inbox.signatureContent', 'Signature content (HTML supported)...')}
                value={newSignatureContent}
                onChange={(e) => setNewSignatureContent(e.target.value)}
                rows={4}
              />
              <div className="flex gap-2">
                <Button onClick={handleSaveSignature} disabled={!newSignatureName || !newSignatureContent}>
                  <Plus className="h-4 w-4 mr-2" />
                  {editingSignature ? t('common.update', 'Update') : t('common.add', 'Add')}
                </Button>
                {editingSignature && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingSignature(null);
                      setNewSignatureName('');
                      setNewSignatureContent('');
                    }}
                  >
                    {t('common.cancel', 'Cancel')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

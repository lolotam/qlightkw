import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowRight,
  ArrowLeft,
  Cloud,
  Database,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  FolderOpen,
  Image as ImageIcon,
  Copy,
  AlertCircle,
} from 'lucide-react';

interface StorageFile {
  name: string;
  size: number;
  lastModified: string;
  url: string;
  selected?: boolean;
  status?: 'pending' | 'copying' | 'success' | 'error';
  error?: string;
}

interface SupabaseFile {
  name: string;
  id: string;
  created_at: string;
  metadata: Record<string, any> | null;
  url: string;
  selected?: boolean;
  status?: 'pending' | 'copying' | 'success' | 'error';
  error?: string;
}

const SUPABASE_BUCKETS = [
  { id: 'hero-section', name: 'Hero Section', folder: 'hero' },
  { id: 'product-images', name: 'Product Images', folder: 'products' },
  { id: 'blog-images', name: 'Blog Images', folder: 'posts' },
  { id: 'project-images', name: 'Project Images', folder: 'projects' },
];

const S3_FOLDERS = [
  { id: 'hero', name: 'Hero', bucket: 'hero-section' },
  { id: 'hero-desktop', name: 'Hero Desktop', bucket: 'hero-section' },
  { id: 'hero-mobile', name: 'Hero Mobile', bucket: 'hero-section' },
  { id: 'products', name: 'Products', bucket: 'product-images' },
  { id: 'categories', name: 'Categories', bucket: 'product-images' },
  { id: 'brands', name: 'Brands', bucket: 'product-images' },
  { id: 'projects', name: 'Projects', bucket: 'project-images' },
  { id: 'posts', name: 'Blog Posts', bucket: 'blog-images' },
];

export default function StorageMigrationPage() {
  const { t } = useTranslation();
  const { toast } = useToast();

  // S3 to Supabase state
  const [s3Files, setS3Files] = useState<StorageFile[]>([]);
  const [s3Loading, setS3Loading] = useState(false);
  const [selectedS3Folder, setSelectedS3Folder] = useState('');
  const [s3CopyProgress, setS3CopyProgress] = useState(0);
  const [s3Copying, setS3Copying] = useState(false);

  // Supabase to S3 state
  const [supabaseFiles, setSupabaseFiles] = useState<SupabaseFile[]>([]);
  const [supabaseLoading, setSupabaseLoading] = useState(false);
  const [selectedSupabaseBucket, setSelectedSupabaseBucket] = useState('');
  const [supabaseCopyProgress, setSupabaseCopyProgress] = useState(0);
  const [supabaseCopying, setSupabaseCopying] = useState(false);

  // S3 connectivity status
  const [s3Available, setS3Available] = useState<boolean | null>(null);
  const [s3Error, setS3Error] = useState<string | null>(null);

  // Check S3 connectivity on mount
  useEffect(() => {
    const checkS3 = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('minio-storage', {
          body: { action: 'list', prefix: '', limit: 1 },
        });
        if (error || !data?.success) {
          setS3Available(false);
          setS3Error(error?.message || data?.error || 'S3 connection failed');
        } else {
          setS3Available(true);
        }
      } catch (err: any) {
        setS3Available(false);
        setS3Error(err.message || 'S3 connection failed');
      }
    };
    checkS3();
  }, []);

  // Load S3 files when folder is selected
  const loadS3Files = async (folder: string) => {
    if (!s3Available) {
      toast({ title: 'S3 not available', description: s3Error, variant: 'destructive' });
      return;
    }
    setS3Loading(true);
    setS3Files([]);
    try {
      const { data, error } = await supabase.functions.invoke('minio-storage', {
        body: { action: 'list', prefix: folder ? `${folder}/` : '' },
      });

      if (error) throw error;

      if (data?.success && data?.files) {
        setS3Files(
          data.files.map((f: any) => ({
            ...f,
            selected: false,
            status: 'pending',
          }))
        );
      }
    } catch (err: any) {
      console.error('Failed to load S3 files:', err);
      toast({
        title: 'Error loading S3 files',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setS3Loading(false);
    }
  };

  // Load Supabase files when bucket is selected
  const loadSupabaseFiles = async (bucketId: string) => {
    setSupabaseLoading(true);
    setSupabaseFiles([]);
    try {
      const { data, error } = await supabase.storage.from(bucketId).list('', {
        limit: 500,
        sortBy: { column: 'created_at', order: 'desc' },
      });

      if (error) throw error;

      const files = (data || [])
        .filter((f) => f.name && !f.name.endsWith('/'))
        .map((f) => ({
          ...f,
          url: supabase.storage.from(bucketId).getPublicUrl(f.name).data.publicUrl,
          selected: false,
          status: 'pending' as const,
        }));

      setSupabaseFiles(files);
    } catch (err: any) {
      console.error('Failed to load Supabase files:', err);
      toast({
        title: 'Error loading Supabase files',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setSupabaseLoading(false);
    }
  };

  // Toggle S3 file selection
  const toggleS3Selection = (fileName: string) => {
    setS3Files((prev) =>
      prev.map((f) => (f.name === fileName ? { ...f, selected: !f.selected } : f))
    );
  };

  // Toggle Supabase file selection
  const toggleSupabaseSelection = (fileName: string) => {
    setSupabaseFiles((prev) =>
      prev.map((f) => (f.name === fileName ? { ...f, selected: !f.selected } : f))
    );
  };

  // Select all S3 files
  const selectAllS3 = () => {
    const allSelected = s3Files.every((f) => f.selected);
    setS3Files((prev) => prev.map((f) => ({ ...f, selected: !allSelected })));
  };

  // Select all Supabase files
  const selectAllSupabase = () => {
    const allSelected = supabaseFiles.every((f) => f.selected);
    setSupabaseFiles((prev) => prev.map((f) => ({ ...f, selected: !allSelected })));
  };

  // Copy from S3 to Supabase
  const copyS3ToSupabase = async () => {
    const selectedFiles = s3Files.filter((f) => f.selected);
    if (!selectedFiles.length) {
      toast({ title: 'No files selected', variant: 'destructive' });
      return;
    }

    const folderConfig = S3_FOLDERS.find((f) => f.id === selectedS3Folder);
    if (!folderConfig) {
      toast({ title: 'Please select a folder', variant: 'destructive' });
      return;
    }

    setS3Copying(true);
    setS3CopyProgress(0);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      
      // Update status to copying
      setS3Files((prev) =>
        prev.map((f) => (f.name === file.name ? { ...f, status: 'copying' } : f))
      );

      try {
        // Download from S3 through the edge function to avoid mixed-content/CORS
        const { data: getData, error: getErr } = await supabase.functions.invoke('minio-storage', {
          body: { action: 'get', fileName: file.name },
        });

        if (getErr || !getData?.success) {
          throw new Error(getErr?.message || getData?.error || 'Failed to download from S3');
        }

        // Guard: if the reverse proxy/WAF returns an HTML page (200 OK), we must NOT upload that into Supabase Storage.
        const contentType = String(getData.contentType || '').toLowerCase();
        if (contentType.includes('text/html')) {
          throw new Error(
            `MinIO returned HTML instead of the file bytes for "${file.name}". ` +
            `This is usually caused by reverse-proxy/WAF/Cloudflare rules on s3.walidmohamed.com. ` +
            `Fix that first, then re-run the migration.`
          );
        }

        // Best-effort mime fallback (MinIO may return application/octet-stream)
        const inferredType = (() => {
          const ext = file.name.split('.').pop()?.toLowerCase();
          if (!ext) return '';
          if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
          if (ext === 'png') return 'image/png';
          if (ext === 'webp') return 'image/webp';
          if (ext === 'gif') return 'image/gif';
          if (ext === 'svg') return 'image/svg+xml';
          return '';
        })();

        const bytes = Uint8Array.from(atob(getData.fileData), (c) => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: getData.contentType || inferredType || 'application/octet-stream' });

        // Upload to Supabase (preserve the full key path so existing DB URLs can be normalized)
        const { error } = await supabase.storage.from(folderConfig.bucket).upload(file.name, blob, {
          upsert: true,
          contentType: blob.type,
        });

        if (error) throw error;

        // Update status to success
        setS3Files((prev) =>
          prev.map((f) => (f.name === file.name ? { ...f, status: 'success' } : f))
        );
        successCount++;
      } catch (err: any) {
        console.error(`Failed to copy ${file.name}:`, err);
        setS3Files((prev) =>
          prev.map((f) =>
            f.name === file.name ? { ...f, status: 'error', error: err.message } : f
          )
        );
        errorCount++;
      }

      setS3CopyProgress(((i + 1) / selectedFiles.length) * 100);
    }

    setS3Copying(false);
    toast({
      title: 'Copy Complete',
      description: `${successCount} files copied, ${errorCount} failed`,
    });
  };

  // Copy from Supabase to S3
  const copySupabaseToS3 = async () => {
    const selectedFiles = supabaseFiles.filter((f) => f.selected);
    if (!selectedFiles.length) {
      toast({ title: 'No files selected', variant: 'destructive' });
      return;
    }

    const bucketConfig = SUPABASE_BUCKETS.find((b) => b.id === selectedSupabaseBucket);
    if (!bucketConfig) {
      toast({ title: 'Please select a bucket', variant: 'destructive' });
      return;
    }

    setSupabaseCopying(true);
    setSupabaseCopyProgress(0);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      
      // Update status to copying
      setSupabaseFiles((prev) =>
        prev.map((f) => (f.name === file.name ? { ...f, status: 'copying' } : f))
      );

      try {
        // Fetch file from Supabase URL
        const response = await fetch(file.url);
        if (!response.ok) throw new Error('Failed to fetch file');
        
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );

        // Upload to S3 via edge function
        const { data, error } = await supabase.functions.invoke('minio-storage', {
          body: {
            action: 'upload',
            fileName: file.name,
            fileData: base64,
            contentType: blob.type || 'image/jpeg',
            folder: bucketConfig.folder,
            preserveName: true,
          },
        });

        if (error || !data?.success) {
          throw new Error(error?.message || data?.error || 'Upload failed');
        }

        // Update status to success
        setSupabaseFiles((prev) =>
          prev.map((f) => (f.name === file.name ? { ...f, status: 'success' } : f))
        );
        successCount++;
      } catch (err: any) {
        console.error(`Failed to copy ${file.name}:`, err);
        setSupabaseFiles((prev) =>
          prev.map((f) =>
            f.name === file.name ? { ...f, status: 'error', error: err.message } : f
          )
        );
        errorCount++;
      }

      setSupabaseCopyProgress(((i + 1) / selectedFiles.length) * 100);
    }

    setSupabaseCopying(false);
    toast({
      title: 'Copy Complete',
      description: `${successCount} files copied, ${errorCount} failed`,
    });
  };

  // Stats
  const s3SelectedCount = s3Files.filter((f) => f.selected).length;
  const s3SuccessCount = s3Files.filter((f) => f.status === 'success').length;
  const s3ErrorCount = s3Files.filter((f) => f.status === 'error').length;

  const supabaseSelectedCount = supabaseFiles.filter((f) => f.selected).length;
  const supabaseSuccessCount = supabaseFiles.filter((f) => f.status === 'success').length;
  const supabaseErrorCount = supabaseFiles.filter((f) => f.status === 'error').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t('admin.storageMigration', 'Storage Migration')}
        </h1>
        <p className="text-muted-foreground">
          {t('admin.storageMigrationDesc', 'Copy files between MinIO S3 and Supabase Storage (bidirectional)')}
        </p>
      </div>

      {/* Info card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-medium">Copy Function</h3>
              <p className="text-sm text-muted-foreground mt-1">
                This tool copies files between storage providers. Files are NOT moved or deleted from the source.
                Both copies will exist after the operation.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* S3 Connection Status */}
      {s3Available === false && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <h3 className="font-medium text-destructive">S3 Connection Unavailable</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  MinIO S3 is not accessible: {s3Error}. S3 features are disabled. 
                  You can still browse and manage Supabase Storage files.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {s3Available === null && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Checking S3 connection...</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="s3-to-supabase" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="s3-to-supabase" className="flex items-center gap-2">
            <Cloud className="h-4 w-4" />
            S3 → Supabase
          </TabsTrigger>
          <TabsTrigger value="supabase-to-s3" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Supabase → S3
          </TabsTrigger>
        </TabsList>

        {/* S3 to Supabase Tab */}
        <TabsContent value="s3-to-supabase" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                Copy from MinIO S3 to Supabase
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Database className="h-5 w-5" />
              </CardTitle>
              <CardDescription>
                Select files from S3 bucket to copy to Supabase Storage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Folder selector */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label>S3 Folder</Label>
                  <Select
                    value={selectedS3Folder}
                    onValueChange={(value) => {
                      setSelectedS3Folder(value);
                      loadS3Files(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select S3 folder..." />
                    </SelectTrigger>
                    <SelectContent>
                      {S3_FOLDERS.map((folder) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          <span className="flex items-center gap-2">
                            <FolderOpen className="h-4 w-4" />
                            {folder.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  onClick={() => selectedS3Folder && loadS3Files(selectedS3Folder)}
                  disabled={!selectedS3Folder || s3Loading}
                >
                  {s3Loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                </Button>
              </div>

              {/* Stats */}
              <div className="flex gap-4 text-sm">
                <span>Total: {s3Files.length}</span>
                <span className="text-primary">Selected: {s3SelectedCount}</span>
                <span className="text-green-500">Success: {s3SuccessCount}</span>
                <span className="text-red-500">Failed: {s3ErrorCount}</span>
              </div>

              {/* File list */}
              {s3Files.length > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={selectAllS3}>
                      {s3Files.every((f) => f.selected) ? 'Deselect All' : 'Select All'}
                    </Button>
                    <Button
                      onClick={copyS3ToSupabase}
                      disabled={s3Copying || s3SelectedCount === 0}
                    >
                      {s3Copying ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Copy className="h-4 w-4 mr-2" />
                      )}
                      Copy {s3SelectedCount} to Supabase
                    </Button>
                  </div>

                  {s3Copying && (
                    <div className="space-y-2">
                      <Progress value={s3CopyProgress} />
                      <p className="text-sm text-muted-foreground text-center">
                        Copying... {Math.round(s3CopyProgress)}%
                      </p>
                    </div>
                  )}

                  <ScrollArea className="h-[400px] border rounded-lg">
                    <div className="p-4 space-y-2">
                      {s3Files.map((file) => (
                        <div
                          key={file.name}
                          className="flex items-center gap-3 p-2 rounded-lg border hover:bg-muted/50 cursor-pointer"
                          onClick={() => toggleS3Selection(file.name)}
                        >
                          <Checkbox checked={file.selected} />
                          <div className="h-10 w-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                            <img
                              src={file.url}
                              alt=""
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                          {file.status === 'copying' && (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          )}
                          {file.status === 'success' && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          {file.status === 'error' && (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </>
              )}

              {s3Loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}

              {!s3Loading && s3Files.length === 0 && selectedS3Folder && (
                <div className="text-center py-8 text-muted-foreground">
                  No files found in this folder
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Supabase to S3 Tab */}
        <TabsContent value="supabase-to-s3" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Copy from Supabase to MinIO S3
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Cloud className="h-5 w-5" />
              </CardTitle>
              <CardDescription>
                Select files from Supabase Storage to copy to S3 bucket
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Bucket selector */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label>Supabase Bucket</Label>
                  <Select
                    value={selectedSupabaseBucket}
                    onValueChange={(value) => {
                      setSelectedSupabaseBucket(value);
                      loadSupabaseFiles(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Supabase bucket..." />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPABASE_BUCKETS.map((bucket) => (
                        <SelectItem key={bucket.id} value={bucket.id}>
                          <span className="flex items-center gap-2">
                            <FolderOpen className="h-4 w-4" />
                            {bucket.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  onClick={() => selectedSupabaseBucket && loadSupabaseFiles(selectedSupabaseBucket)}
                  disabled={!selectedSupabaseBucket || supabaseLoading}
                >
                  {supabaseLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                </Button>
              </div>

              {/* Stats */}
              <div className="flex gap-4 text-sm">
                <span>Total: {supabaseFiles.length}</span>
                <span className="text-primary">Selected: {supabaseSelectedCount}</span>
                <span className="text-green-500">Success: {supabaseSuccessCount}</span>
                <span className="text-red-500">Failed: {supabaseErrorCount}</span>
              </div>

              {/* File list */}
              {supabaseFiles.length > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={selectAllSupabase}>
                      {supabaseFiles.every((f) => f.selected) ? 'Deselect All' : 'Select All'}
                    </Button>
                    <Button
                      onClick={copySupabaseToS3}
                      disabled={supabaseCopying || supabaseSelectedCount === 0}
                    >
                      {supabaseCopying ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Copy className="h-4 w-4 mr-2" />
                      )}
                      Copy {supabaseSelectedCount} to S3
                    </Button>
                  </div>

                  {supabaseCopying && (
                    <div className="space-y-2">
                      <Progress value={supabaseCopyProgress} />
                      <p className="text-sm text-muted-foreground text-center">
                        Copying... {Math.round(supabaseCopyProgress)}%
                      </p>
                    </div>
                  )}

                  <ScrollArea className="h-[400px] border rounded-lg">
                    <div className="p-4 space-y-2">
                      {supabaseFiles.map((file) => (
                        <div
                          key={file.name}
                          className="flex items-center gap-3 p-2 rounded-lg border hover:bg-muted/50 cursor-pointer"
                          onClick={() => toggleSupabaseSelection(file.name)}
                        >
                          <Checkbox checked={file.selected} />
                          <div className="h-10 w-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                            <img
                              src={file.url}
                              alt=""
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {file.metadata?.size ? (file.metadata.size / 1024).toFixed(1) : '?'} KB
                            </p>
                          </div>
                          {file.status === 'copying' && (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          )}
                          {file.status === 'success' && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          {file.status === 'error' && (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </>
              )}

              {supabaseLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}

              {!supabaseLoading && supabaseFiles.length === 0 && selectedSupabaseBucket && (
                <div className="text-center py-8 text-muted-foreground">
                  No files found in this bucket
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

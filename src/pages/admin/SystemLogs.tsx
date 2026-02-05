import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ScrollText, 
  Search, 
  RefreshCw, 
  Trash2,
  AlertCircle,
  AlertTriangle,
  Info,
  Bug,
  ChevronDown,
  Zap,
  Shield,
  Database,
  Globe,
  ShoppingCart,
  CreditCard,
  Radio
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SystemLog {
  id: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: string;
  source: string;
  message: string;
  user_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

const LOG_CATEGORIES = [
  { value: 'all', label: 'All Logs', icon: Globe },
  { value: 'auth', label: 'Authentication', icon: Shield },
  { value: 'edge', label: 'Edge Functions', icon: Zap },
  { value: 'order', label: 'Orders', icon: ShoppingCart },
  { value: 'payment', label: 'Payments', icon: CreditCard },
  { value: 'system', label: 'System', icon: Database },
];

const LOG_LEVELS = [
  { value: 'all', label: 'All Levels' },
  { value: 'error', label: 'Error', color: 'destructive' },
  { value: 'warn', label: 'Warning', color: 'warning' },
  { value: 'info', label: 'Info', color: 'default' },
  { value: 'debug', label: 'Debug', color: 'secondary' },
];

export default function AdminSystemLogs() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isRTL = i18n.language === 'ar';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  // Fetch logs
  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ['admin-system-logs', selectedCategory, selectedLevel, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }
      if (selectedLevel !== 'all') {
        query = query.eq('level', selectedLevel);
      }
      if (searchQuery) {
        query = query.or(`message.ilike.%${searchQuery}%,source.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SystemLog[];
    },
    refetchInterval: isLiveMode ? 5000 : false,
  });

  // Calculate stats
  const stats = {
    total: logs?.length || 0,
    errors: logs?.filter(l => l.level === 'error').length || 0,
    warnings: logs?.filter(l => l.level === 'warn').length || 0,
    info: logs?.filter(l => l.level === 'info').length || 0,
  };

  // Clear old logs mutation
  const clearOldLogsMutation = useMutation({
    mutationFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { error } = await supabase
        .from('system_logs')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString());
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-system-logs'] });
      toast({ title: t('admin.logs.cleared', 'Old logs cleared') });
    },
    onError: (error: any) => {
      toast({
        title: t('common.error', 'Error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Get level icon and color
  const getLevelDisplay = (level: string) => {
    switch (level) {
      case 'error':
        return { 
          icon: <AlertCircle className="h-4 w-4" />, 
          color: 'text-destructive',
          badge: 'destructive' as const
        };
      case 'warn':
        return { 
          icon: <AlertTriangle className="h-4 w-4" />, 
          color: 'text-yellow-500',
          badge: 'outline' as const
        };
      case 'info':
        return { 
          icon: <Info className="h-4 w-4" />, 
          color: 'text-blue-500',
          badge: 'default' as const
        };
      case 'debug':
        return { 
          icon: <Bug className="h-4 w-4" />, 
          color: 'text-muted-foreground',
          badge: 'secondary' as const
        };
      default:
        return { 
          icon: <Info className="h-4 w-4" />, 
          color: 'text-muted-foreground',
          badge: 'secondary' as const
        };
    }
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    const cat = LOG_CATEGORIES.find(c => c.value === category);
    return cat ? <cat.icon className="h-3 w-3" /> : <Globe className="h-3 w-3" />;
  };

  // Toggle log expansion
  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedLogs(newExpanded);
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ScrollText className="h-6 w-6" />
            {t('admin.logs.title', 'System Logs')}
          </h1>
          <p className="text-muted-foreground">
            {t('admin.logs.description', 'Monitor system events and debug issues')}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="live-mode"
              checked={isLiveMode}
              onCheckedChange={setIsLiveMode}
            />
            <Label htmlFor="live-mode" className="flex items-center gap-1">
              <Radio className={`h-3 w-3 ${isLiveMode ? 'text-green-500 animate-pulse' : 'text-muted-foreground'}`} />
              {t('admin.logs.liveMode', 'Live')}
            </Label>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('admin.logs.refresh', 'Refresh')}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => clearOldLogsMutation.mutate()}
            disabled={clearOldLogsMutation.isPending}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t('admin.logs.clearOld', 'Clear Old')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">{t('admin.logs.total', 'Total Logs')}</p>
          </CardContent>
        </Card>
        <Card className="border-destructive/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-destructive">{stats.errors}</div>
            <p className="text-xs text-muted-foreground">{t('admin.logs.errors', 'Errors')}</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-500">{stats.warnings}</div>
            <p className="text-xs text-muted-foreground">{t('admin.logs.warnings', 'Warnings')}</p>
          </CardContent>
        </Card>
        <Card className="border-blue-500/50">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-500">{stats.info}</div>
            <p className="text-xs text-muted-foreground">{t('admin.logs.info', 'Info')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('admin.logs.search', 'Search logs...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LOG_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                <div className="flex items-center gap-2">
                  <cat.icon className="h-4 w-4" />
                  {cat.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedLevel} onValueChange={setSelectedLevel}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LOG_LEVELS.map((level) => (
              <SelectItem key={level.value} value={level.value}>
                {level.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Logs List */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="p-4">
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-4 w-4 mt-1" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                </div>
              ))
            ) : logs?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <ScrollText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t('admin.logs.noLogs', 'No logs found')}</p>
              </div>
            ) : (
              logs?.map((log) => {
                const levelDisplay = getLevelDisplay(log.level);
                const isExpanded = expandedLogs.has(log.id);
                const hasMetadata = log.metadata && Object.keys(log.metadata).length > 0;

                return (
                  <Collapsible
                    key={log.id}
                    open={isExpanded}
                    onOpenChange={() => hasMetadata && toggleExpanded(log.id)}
                  >
                    <div className={`p-4 hover:bg-muted/50 transition-colors ${isExpanded ? 'bg-muted/30' : ''}`}>
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 ${levelDisplay.color}`}>
                          {levelDisplay.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <Badge variant={levelDisplay.badge} className="text-xs">
                              {log.level.toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className="text-xs flex items-center gap-1">
                              {getCategoryIcon(log.category)}
                              {log.category}
                            </Badge>
                            <span className="text-xs text-muted-foreground font-mono">
                              {log.source}
                            </span>
                          </div>
                          <p className="text-sm break-words">{log.message}</p>
                          {hasMetadata && (
                            <CollapsibleTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 px-2 mt-1 text-xs text-muted-foreground"
                              >
                                <ChevronDown className={`h-3 w-3 mr-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                {t('admin.logs.viewDetails', 'View details')}
                              </Button>
                            </CollapsibleTrigger>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <CollapsibleContent>
                        <div className="mt-3 ml-7 p-3 bg-muted rounded-lg">
                          <pre className="text-xs overflow-x-auto whitespace-pre-wrap font-mono">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

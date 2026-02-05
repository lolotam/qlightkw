import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Activity, 
  Heart, 
  Zap, 
  Database, 
  HardDrive,
  AlertTriangle,
  Bell,
  BellOff,
  Plus,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Timer
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { format, formatDistanceToNow, subHours } from 'date-fns';

interface HealthSnapshot {
  id: string;
  overall_health_score: number;
  edge_functions_health: number | null;
  database_health: number | null;
  storage_health: number | null;
  active_errors_count: number;
  failed_functions_count: number;
  metrics_breakdown: Record<string, any>;
  captured_at: string;
}

interface AlertConfig {
  id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  threshold_value: number;
  threshold_operator: string;
  is_active: boolean;
  last_triggered_at: string | null;
  notification_channels: string[];
}

interface AlertHistory {
  id: string;
  alert_name: string;
  trigger_type: string;
  triggered_value: number;
  threshold_value: number;
  severity: string;
  is_resolved: boolean;
  resolved_at: string | null;
  created_at: string;
}

const TRIGGER_TYPES = [
  { value: 'error_rate', label: 'Error Rate (%)', icon: AlertTriangle },
  { value: 'response_time', label: 'Response Time (ms)', icon: Timer },
  { value: 'health_score', label: 'Health Score', icon: Heart },
  { value: 'storage_usage', label: 'Storage Usage (%)', icon: HardDrive },
];

const AUTO_REFRESH_INTERVAL = 30000;

export default function AdminObservability() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isRTL = i18n.language === 'ar';

  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isAddAlertOpen, setIsAddAlertOpen] = useState(false);
  const [newAlert, setNewAlert] = useState({
    name: '',
    trigger_type: 'error_rate',
    threshold_value: '10',
    notification_channels: ['email'],
  });

  // Fetch latest health snapshot
  const { data: latestHealth, isLoading: loadingHealth, refetch: refetchHealth } = useQuery({
    queryKey: ['observability-health-latest'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('observability_health_snapshots')
        .select('*')
        .order('captured_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as HealthSnapshot | null;
    },
    refetchInterval: autoRefresh ? AUTO_REFRESH_INTERVAL : false,
  });

  // Fetch health history for chart
  const { data: healthHistory } = useQuery({
    queryKey: ['observability-health-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('observability_health_snapshots')
        .select('*')
        .gte('captured_at', subHours(new Date(), 24).toISOString())
        .order('captured_at', { ascending: true });
      if (error) throw error;
      return (data || []).map(d => ({
        time: format(new Date(d.captured_at), 'HH:mm'),
        health: d.overall_health_score,
        functions: d.edge_functions_health || 0,
        database: d.database_health || 0,
      }));
    },
    refetchInterval: autoRefresh ? AUTO_REFRESH_INTERVAL : false,
  });

  // Fetch alert configs
  const { data: alertConfigs, isLoading: loadingAlerts } = useQuery({
    queryKey: ['observability-alert-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('observability_alert_configs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as AlertConfig[];
    },
  });

  // Fetch alert history
  const { data: alertHistory } = useQuery({
    queryKey: ['observability-alert-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('observability_alert_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as AlertHistory[];
    },
  });

  // Create alert mutation
  const createAlertMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('observability_alert_configs')
        .insert({
          name: newAlert.name,
          trigger_type: newAlert.trigger_type,
          threshold_value: parseFloat(newAlert.threshold_value),
          notification_channels: newAlert.notification_channels,
          is_active: true,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['observability-alert-configs'] });
      toast({ title: t('admin.observability.alertCreated', 'Alert created') });
      setIsAddAlertOpen(false);
      setNewAlert({ name: '', trigger_type: 'error_rate', threshold_value: '10', notification_channels: ['email'] });
    },
    onError: (error: any) => {
      toast({ title: t('common.error', 'Error'), description: error.message, variant: 'destructive' });
    },
  });

  // Toggle alert active mutation
  const toggleAlertMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('observability_alert_configs')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['observability-alert-configs'] });
    },
  });

  // Resolve alert mutation
  const resolveAlertMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('observability_alert_history')
        .update({ is_resolved: true, resolved_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['observability-alert-history'] });
      toast({ title: t('admin.observability.alertResolved', 'Alert resolved') });
    },
  });

  // Get health color
  const getHealthColor = (score: number | null) => {
    if (score === null) return 'text-muted-foreground';
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-destructive';
  };

  // Get severity badge
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">{t('admin.observability.critical', 'Critical')}</Badge>;
      case 'warning':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500">{t('admin.observability.warning', 'Warning')}</Badge>;
      default:
        return <Badge variant="secondary">{t('admin.observability.info', 'Info')}</Badge>;
    }
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6" />
            {t('admin.observability.title', 'Observability')}
          </h1>
          <p className="text-muted-foreground">
            {t('admin.observability.description', 'Monitor system health and configure alerts')}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
            <Label htmlFor="auto-refresh">
              {t('admin.observability.autoRefresh', 'Auto-refresh')}
            </Label>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetchHealth()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('common.refresh', 'Refresh')}
          </Button>
        </div>
      </div>

      {/* Health Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Overall Health */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Heart className="h-4 w-4" />
              {t('admin.observability.overallHealth', 'Overall Health')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingHealth ? (
              <Skeleton className="h-12 w-20" />
            ) : (
              <>
                <div className={`text-3xl font-bold ${getHealthColor(latestHealth?.overall_health_score ?? null)}`}>
                  {latestHealth?.overall_health_score ?? '--'}%
                </div>
                <Progress 
                  value={latestHealth?.overall_health_score ?? 0} 
                  className="h-2 mt-2"
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* Edge Functions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              {t('admin.observability.edgeFunctions', 'Edge Functions')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingHealth ? (
              <Skeleton className="h-12 w-20" />
            ) : (
              <>
                <div className={`text-3xl font-bold ${getHealthColor(latestHealth?.edge_functions_health ?? null)}`}>
                  {latestHealth?.edge_functions_health ?? '--'}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {latestHealth?.failed_functions_count || 0} {t('admin.observability.failedCalls', 'failed calls')}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Database */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              {t('admin.observability.database', 'Database')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingHealth ? (
              <Skeleton className="h-12 w-20" />
            ) : (
              <>
                <div className={`text-3xl font-bold ${getHealthColor(latestHealth?.database_health ?? null)}`}>
                  {latestHealth?.database_health ?? '--'}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('admin.observability.healthy', 'Healthy')}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Storage */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              {t('admin.observability.storage', 'Storage')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingHealth ? (
              <Skeleton className="h-12 w-20" />
            ) : (
              <>
                <div className={`text-3xl font-bold ${getHealthColor(latestHealth?.storage_health ?? null)}`}>
                  {latestHealth?.storage_health ?? '--'}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('admin.observability.available', 'Available')}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Health Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('admin.observability.healthTrend', 'Health Trend (24h)')}
          </CardTitle>
          <CardDescription>
            {t('admin.observability.healthTrendDescription', 'System health scores over the last 24 hours')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {healthHistory && healthHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={healthHistory}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="time" className="text-xs" />
                  <YAxis domain={[0, 100]} className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="health" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Overall"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="functions" 
                    stroke="hsl(var(--secondary))" 
                    strokeWidth={2}
                    name="Functions"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="database" 
                    stroke="hsl(var(--accent))" 
                    strokeWidth={2}
                    name="Database"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <p>{t('admin.observability.noData', 'No health data available yet')}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alerts Section */}
      <Tabs defaultValue="configs">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="configs">
              <Bell className="h-4 w-4 mr-2" />
              {t('admin.observability.alertConfigs', 'Alert Configs')}
            </TabsTrigger>
            <TabsTrigger value="history">
              <Clock className="h-4 w-4 mr-2" />
              {t('admin.observability.alertHistory', 'Alert History')}
            </TabsTrigger>
          </TabsList>

          <Dialog open={isAddAlertOpen} onOpenChange={setIsAddAlertOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('admin.observability.addAlert', 'Add Alert')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('admin.observability.createAlert', 'Create Alert')}</DialogTitle>
                <DialogDescription>
                  {t('admin.observability.createAlertDescription', 'Configure a new monitoring alert')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>{t('admin.observability.alertName', 'Alert Name')}</Label>
                  <Input
                    value={newAlert.name}
                    onChange={(e) => setNewAlert({ ...newAlert, name: e.target.value })}
                    placeholder="High Error Rate"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('admin.observability.triggerType', 'Trigger Type')}</Label>
                  <Select
                    value={newAlert.trigger_type}
                    onValueChange={(v) => setNewAlert({ ...newAlert, trigger_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRIGGER_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('admin.observability.threshold', 'Threshold Value')}</Label>
                  <Input
                    type="number"
                    value={newAlert.threshold_value}
                    onChange={(e) => setNewAlert({ ...newAlert, threshold_value: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddAlertOpen(false)}>
                  {t('common.cancel', 'Cancel')}
                </Button>
                <Button 
                  onClick={() => createAlertMutation.mutate()}
                  disabled={!newAlert.name || createAlertMutation.isPending}
                >
                  {t('common.create', 'Create')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value="configs">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.observability.name', 'Name')}</TableHead>
                    <TableHead>{t('admin.observability.trigger', 'Trigger')}</TableHead>
                    <TableHead>{t('admin.observability.threshold', 'Threshold')}</TableHead>
                    <TableHead>{t('admin.observability.lastTriggered', 'Last Triggered')}</TableHead>
                    <TableHead>{t('common.status', 'Status')}</TableHead>
                    <TableHead className="text-right">{t('common.actions', 'Actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingAlerts ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                      </TableRow>
                    ))
                  ) : alertConfigs?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {t('admin.observability.noAlerts', 'No alerts configured')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    alertConfigs?.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell className="font-medium">{alert.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{alert.trigger_type}</Badge>
                        </TableCell>
                        <TableCell>{alert.threshold_value}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {alert.last_triggered_at 
                            ? formatDistanceToNow(new Date(alert.last_triggered_at), { addSuffix: true })
                            : t('admin.observability.never', 'Never')}
                        </TableCell>
                        <TableCell>
                          {alert.is_active ? (
                            <Badge variant="default">{t('common.active', 'Active')}</Badge>
                          ) : (
                            <Badge variant="secondary">{t('common.inactive', 'Inactive')}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Switch
                            checked={alert.is_active}
                            onCheckedChange={(checked) => 
                              toggleAlertMutation.mutate({ id: alert.id, is_active: checked })
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.observability.alert', 'Alert')}</TableHead>
                    <TableHead>{t('admin.observability.severity', 'Severity')}</TableHead>
                    <TableHead>{t('admin.observability.triggeredValue', 'Value')}</TableHead>
                    <TableHead>{t('admin.observability.time', 'Time')}</TableHead>
                    <TableHead>{t('common.status', 'Status')}</TableHead>
                    <TableHead className="text-right">{t('common.actions', 'Actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alertHistory?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {t('admin.observability.noAlertHistory', 'No alert history')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    alertHistory?.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell className="font-medium">{alert.alert_name}</TableCell>
                        <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                        <TableCell>
                          {alert.triggered_value} / {alert.threshold_value}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          {alert.is_resolved ? (
                            <Badge variant="outline" className="text-green-500 border-green-500">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {t('admin.observability.resolved', 'Resolved')}
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              {t('admin.observability.active', 'Active')}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!alert.is_resolved && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => resolveAlertMutation.mutate(alert.id)}
                            >
                              {t('admin.observability.resolve', 'Resolve')}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

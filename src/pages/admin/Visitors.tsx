import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  Users, 
  Globe, 
  Smartphone, 
  Monitor,
  Tablet,
  TrendingUp,
  Clock,
  MapPin
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns';
import { motion } from 'framer-motion';

// Chart colors
const COLORS = {
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  accent: 'hsl(var(--accent))',
  success: 'hsl(142.1, 76.2%, 36.3%)',
  warning: 'hsl(38, 92%, 50%)',
  info: 'hsl(217.2, 91.2%, 59.8%)',
};

const DEVICE_COLORS = ['#f97316', '#8b5cf6', '#06b6d4'];
const BROWSER_COLORS = ['#f97316', '#10b981', '#3b82f6', '#a855f7', '#ec4899'];

export default function AdminVisitors() {
  const { t, i18n } = useTranslation();
  const [timeRange, setTimeRange] = useState('7d');
  const isRTL = i18n.language === 'ar';

  // Calculate date range
  const getDateRange = () => {
    const now = new Date();
    switch (timeRange) {
      case '24h': return { start: subDays(now, 1), end: now };
      case '7d': return { start: subDays(now, 7), end: now };
      case '30d': return { start: subDays(now, 30), end: now };
      default: return { start: subDays(now, 7), end: now };
    }
  };

  const { start, end } = getDateRange();

  // Fetch visitor stats
  const { data: visitorStats, isLoading } = useQuery({
    queryKey: ['admin-visitors-stats', timeRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_visits')
        .select('*')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate stats
      const visits = data || [];
      const uniqueVisitors = new Set(visits.map(v => v.visitor_id)).size;
      const uniqueSessions = new Set(visits.map(v => v.session_id)).size;
      const pageViews = visits.length;

      // Device breakdown
      const deviceCounts = visits.reduce((acc, v) => {
        const device = v.device_type || 'unknown';
        acc[device] = (acc[device] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Browser breakdown
      const browserCounts = visits.reduce((acc, v) => {
        const browser = v.browser || 'Other';
        acc[browser] = (acc[browser] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Top pages
      const pageCounts = visits.reduce((acc, v) => {
        const page = v.page_url || '/';
        acc[page] = (acc[page] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topPages = Object.entries(pageCounts)
        .map(([page, count]) => ({ page, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Daily trend
      const days = eachDayOfInterval({ start, end });
      const dailyTrend = days.map(day => {
        const dayVisits = visits.filter(v => {
          const d = new Date(v.created_at);
          return d >= startOfDay(day) && d <= endOfDay(day);
        });
        return {
          date: format(day, 'MMM d'),
          visitors: new Set(dayVisits.map(v => v.visitor_id)).size,
          pageViews: dayVisits.length,
        };
      });

      // Referrer breakdown
      const referrerCounts = visits.reduce((acc, v) => {
        let source = 'Direct';
        if (v.referrer) {
          try {
            const url = new URL(v.referrer);
            source = url.hostname.replace('www.', '');
          } catch {
            source = 'Other';
          }
        }
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topReferrers = Object.entries(referrerCounts)
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        uniqueVisitors,
        uniqueSessions,
        pageViews,
        avgPagesPerSession: uniqueSessions > 0 ? (pageViews / uniqueSessions).toFixed(1) : '0',
        deviceBreakdown: Object.entries(deviceCounts).map(([name, value]) => ({ name, value })),
        browserBreakdown: Object.entries(browserCounts).map(([name, value]) => ({ name, value })),
        topPages,
        dailyTrend,
        topReferrers,
      };
    },
  });

  // Get device icon
  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'tablet': return <Tablet className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Eye className="h-6 w-6 text-primary" />
            {t('admin.visitors.title', 'Visitor Analytics')}
          </h1>
          <p className="text-muted-foreground">
            {t('admin.visitors.description', 'Track and analyze your website traffic')}
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">{t('admin.visitors.last24h', 'Last 24 hours')}</SelectItem>
            <SelectItem value="7d">{t('admin.visitors.last7d', 'Last 7 days')}</SelectItem>
            <SelectItem value="30d">{t('admin.visitors.last30d', 'Last 30 days')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Unique Visitors */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('admin.visitors.uniqueVisitors', 'Unique Visitors')}
              </CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{visitorStats?.uniqueVisitors || 0}</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Page Views */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('admin.visitors.pageViews', 'Page Views')}
              </CardTitle>
              <Eye className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{visitorStats?.pageViews || 0}</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Sessions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border-cyan-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('admin.visitors.sessions', 'Sessions')}
              </CardTitle>
              <Clock className="h-4 w-4 text-cyan-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{visitorStats?.uniqueSessions || 0}</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Avg Pages/Session */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('admin.visitors.avgPages', 'Avg Pages/Session')}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{visitorStats?.avgPagesPerSession}</div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Daily Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.visitors.dailyTrend', 'Daily Traffic Trend')}</CardTitle>
          <CardDescription>
            {t('admin.visitors.trendDescription', 'Visitors and page views over time')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={visitorStats?.dailyTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="visitors"
                    stroke={COLORS.primary}
                    strokeWidth={2}
                    name={t('admin.visitors.visitors', 'Visitors')}
                    dot={{ fill: COLORS.primary }}
                  />
                  <Line
                    type="monotone"
                    dataKey="pageViews"
                    stroke={COLORS.info}
                    strokeWidth={2}
                    name={t('admin.visitors.pageViews', 'Page Views')}
                    dot={{ fill: COLORS.info }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Device & Browser Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              {t('admin.visitors.deviceBreakdown', 'Device Breakdown')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={visitorStats?.deviceBreakdown || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {visitorStats?.deviceBreakdown?.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={DEVICE_COLORS[index % DEVICE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Browser Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {t('admin.visitors.browserBreakdown', 'Browser Breakdown')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={visitorStats?.browserBreakdown || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis type="category" dataKey="name" className="text-xs" width={70} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {visitorStats?.browserBreakdown?.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={BROWSER_COLORS[index % BROWSER_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Pages & Referrers */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.visitors.topPages', 'Top Pages')}</CardTitle>
            <CardDescription>
              {t('admin.visitors.mostVisited', 'Most visited pages on your site')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))
              ) : (
                visitorStats?.topPages?.map((page, index) => (
                  <div
                    key={page.page}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground w-6">
                        {index + 1}.
                      </span>
                      <span className="text-sm font-medium truncate max-w-[200px]">
                        {page.page}
                      </span>
                    </div>
                    <Badge variant="secondary">{page.count} views</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Referrers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {t('admin.visitors.trafficSources', 'Traffic Sources')}
            </CardTitle>
            <CardDescription>
              {t('admin.visitors.whereFrom', 'Where your visitors come from')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))
              ) : (
                visitorStats?.topReferrers?.map((ref, index) => (
                  <div
                    key={ref.source}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{ref.source}</span>
                    </div>
                    <Badge variant="outline">{ref.count}</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

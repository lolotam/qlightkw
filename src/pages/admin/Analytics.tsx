import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp,
  Package,
  Eye,
  UserPlus,
  Activity
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
  Cell
} from 'recharts';
import { format, subDays, subHours, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns';

// Chart colors using CSS variables approach
const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export default function AdminAnalytics() {
  const { t, i18n } = useTranslation();
  const [timeRange, setTimeRange] = useState('7d');
  const isRTL = i18n.language === 'ar';

  // Calculate date range based on selection
  const getDateRange = () => {
    const now = new Date();
    switch (timeRange) {
      case '24h':
        return { start: subHours(now, 24), end: now };
      case '7d':
        return { start: subDays(now, 7), end: now };
      case '30d':
        return { start: subDays(now, 30), end: now };
      case '90d':
        return { start: subDays(now, 90), end: now };
      default:
        return { start: subDays(now, 7), end: now };
    }
  };

  const { start, end } = getDateRange();

  // Fetch user stats
  const { data: userStats, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-analytics-users', timeRange],
    queryFn: async () => {
      const [totalUsers, newUsers, activeProfiles] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', start.toISOString()),
        supabase.from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true),
      ]);

      return {
        totalUsers: totalUsers.count || 0,
        newUsers: newUsers.count || 0,
        activeUsers: activeProfiles.count || 0,
      };
    },
  });

  // Fetch order stats
  const { data: orderStats, isLoading: loadingOrders } = useQuery({
    queryKey: ['admin-analytics-orders', timeRange],
    queryFn: async () => {
      const [totalOrders, periodOrders, revenue] = await Promise.all([
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('orders')
          .select('id, total_amount, status')
          .gte('created_at', start.toISOString()),
        supabase.from('orders')
          .select('total_amount')
          .in('status', ['confirmed', 'processing', 'shipped', 'delivered'])
          .gte('created_at', start.toISOString()),
      ]);

      const totalRevenue = revenue.data?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const completedOrders = periodOrders.data?.filter(o => o.status === 'delivered').length || 0;

      return {
        totalOrders: totalOrders.count || 0,
        periodOrders: periodOrders.data?.length || 0,
        totalRevenue,
        completedOrders,
        conversionRate: periodOrders.data?.length 
          ? ((completedOrders / periodOrders.data.length) * 100).toFixed(1)
          : '0',
      };
    },
  });

  // Fetch signup trend for chart
  const { data: signupTrend } = useQuery({
    queryKey: ['admin-analytics-signup-trend', timeRange],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      const days = eachDayOfInterval({ start, end });
      return days.map(day => ({
        date: format(day, 'MMM d'),
        signups: data?.filter(u => {
          const d = new Date(u.created_at);
          return d >= startOfDay(day) && d <= endOfDay(day);
        }).length || 0,
      }));
    },
  });

  // Fetch orders trend
  const { data: ordersTrend } = useQuery({
    queryKey: ['admin-analytics-orders-trend', timeRange],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('created_at, total_amount')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      const days = eachDayOfInterval({ start, end });
      return days.map(day => ({
        date: format(day, 'MMM d'),
        orders: data?.filter(o => {
          const d = new Date(o.created_at);
          return d >= startOfDay(day) && d <= endOfDay(day);
        }).length || 0,
        revenue: data?.filter(o => {
          const d = new Date(o.created_at);
          return d >= startOfDay(day) && d <= endOfDay(day);
        }).reduce((sum, o) => sum + Number(o.total_amount), 0) || 0,
      }));
    },
  });

  // Fetch category distribution
  const { data: categoryStats } = useQuery({
    queryKey: ['admin-analytics-categories'],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('category_id, categories(name_en, name_ar)')
        .eq('is_active', true);

      const categoryMap = new Map<string, { name: string; count: number }>();
      data?.forEach(product => {
        const catName = isRTL 
          ? (product.categories as any)?.name_ar || 'Unknown'
          : (product.categories as any)?.name_en || 'Unknown';
        const existing = categoryMap.get(catName);
        if (existing) {
          existing.count++;
        } else {
          categoryMap.set(catName, { name: catName, count: 1 });
        }
      });

      return Array.from(categoryMap.values()).slice(0, 5);
    },
  });

  // Fetch order status distribution
  const { data: orderStatusStats } = useQuery({
    queryKey: ['admin-analytics-order-status', timeRange],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('status')
        .gte('created_at', start.toISOString());

      const statusCounts = (data || []).reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
    },
  });

  // Fetch top selling products
  const { data: topProducts } = useQuery({
    queryKey: ['admin-analytics-top-products', timeRange],
    queryFn: async () => {
      const { data } = await supabase
        .from('order_items')
        .select('product_name_en, quantity, total_price')
        .gte('created_at', start.toISOString());

      // Aggregate by product
      const productMap = new Map<string, { name: string; sales: number; revenue: number }>();
      (data || []).forEach(item => {
        const existing = productMap.get(item.product_name_en);
        if (existing) {
          existing.sales += item.quantity;
          existing.revenue += Number(item.total_price);
        } else {
          productMap.set(item.product_name_en, {
            name: item.product_name_en,
            sales: item.quantity,
            revenue: Number(item.total_price),
          });
        }
      });

      return Array.from(productMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
    },
  });

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('admin.analytics.title', 'Analytics')}</h1>
          <p className="text-muted-foreground">
            {t('admin.analytics.description', 'Track your store performance and insights')}
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">{t('admin.analytics.last24h', 'Last 24 hours')}</SelectItem>
            <SelectItem value="7d">{t('admin.analytics.last7d', 'Last 7 days')}</SelectItem>
            <SelectItem value="30d">{t('admin.analytics.last30d', 'Last 30 days')}</SelectItem>
            <SelectItem value="90d">{t('admin.analytics.last90d', 'Last 90 days')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin.analytics.totalUsers', 'Total Users')}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingUsers ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{userStats?.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  +{userStats?.newUsers} {t('admin.analytics.newThisPeriod', 'new this period')}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin.analytics.totalOrders', 'Total Orders')}
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingOrders ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{orderStats?.periodOrders}</div>
                <p className="text-xs text-muted-foreground">
                  {orderStats?.completedOrders} {t('admin.analytics.completed', 'completed')}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin.analytics.revenue', 'Revenue')}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingOrders ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {orderStats?.totalRevenue.toFixed(2)} KWD
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('admin.analytics.fromOrders', 'from')} {orderStats?.periodOrders} {t('admin.analytics.orders', 'orders')}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin.analytics.conversionRate', 'Conversion Rate')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingOrders ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{orderStats?.conversionRate}%</div>
                <p className="text-xs text-muted-foreground">
                  {t('admin.analytics.ordersCompleted', 'Orders completed')}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Signups Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              {t('admin.analytics.userSignups', 'User Signups')}
            </CardTitle>
            <CardDescription>
              {t('admin.analytics.signupTrend', 'New user registrations over time')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={signupTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="signups" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Orders & Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {t('admin.analytics.ordersRevenue', 'Orders & Revenue')}
            </CardTitle>
            <CardDescription>
              {t('admin.analytics.salesPerformance', 'Sales performance over time')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ordersTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis yAxisId="left" className="text-xs" />
                  <YAxis yAxisId="right" orientation="right" className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar yAxisId="left" dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="revenue" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Distribution */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {t('admin.analytics.productsByCategory', 'Products by Category')}
            </CardTitle>
            <CardDescription>
              {t('admin.analytics.categoryDistribution', 'Distribution of products across categories')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryStats || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="hsl(var(--primary))"
                    dataKey="count"
                    nameKey="name"
                  >
                    {categoryStats?.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Order Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              {t('admin.analytics.ordersByStatus', 'Orders by Status')}
            </CardTitle>
            <CardDescription>
              {t('admin.analytics.statusDistribution', 'Distribution of orders by current status')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatusStats || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                  >
                    {orderStatusStats?.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('admin.analytics.topProducts', 'Top Selling Products')}
          </CardTitle>
          <CardDescription>
            {t('admin.analytics.bestSellers', 'Your best performing products by revenue')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-xs" />
                <YAxis type="category" dataKey="name" className="text-xs" width={150} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)} KWD`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

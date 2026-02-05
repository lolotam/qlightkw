import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Types for dashboard data
interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  revenueChange: number;
  ordersChange: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  profiles: { full_name: string | null; email: string | null } | null;
}

// Mock chart data (will be replaced with real data later)
const chartData = [
  { name: 'Jan', revenue: 4000 },
  { name: 'Feb', revenue: 3000 },
  { name: 'Mar', revenue: 5000 },
  { name: 'Apr', revenue: 4500 },
  { name: 'May', revenue: 6000 },
  { name: 'Jun', revenue: 5500 },
  { name: 'Jul', revenue: 7000 },
];

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // Fetch dashboard statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      // Get product count
      const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      // Get order count and revenue
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount');

      const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;

      // Get user count
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      return {
        totalProducts: productCount || 0,
        totalOrders: orders?.length || 0,
        totalUsers: userCount || 0,
        totalRevenue,
        revenueChange: 12.5, // Placeholder
        ordersChange: 8.2, // Placeholder
      };
    },
  });

  // Fetch recent orders
  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-recent-orders'],
    queryFn: async (): Promise<RecentOrder[]> => {
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          total_amount,
          created_at,
          user_id
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      
      // Fetch profiles separately
      if (ordersData && ordersData.length > 0) {
        const userIds = [...new Set(ordersData.map(o => o.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);
        
        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        
        return ordersData.map(order => ({
          ...order,
          profiles: profileMap.get(order.user_id) || null,
        })) as unknown as RecentOrder[];
      }
      
      return [];
    },
  });

  // Status badge color mapping
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-warning/10 text-warning border-warning/20',
      confirmed: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      processing: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      shipped: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
      delivered: 'bg-success/10 text-success border-success/20',
      cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
      refunded: 'bg-muted text-muted-foreground border-muted',
    };
    return colors[status] || 'bg-muted text-muted-foreground';
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KW', {
      style: 'currency',
      currency: 'KWD',
      minimumFractionDigits: 3,
    }).format(amount);
  };

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t('admin.dashboardTitle', 'Dashboard')}
        </h1>
        <p className="text-muted-foreground">
          {t('admin.dashboardDescription', 'Overview of your store performance')}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin.totalRevenue', 'Total Revenue')}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : formatCurrency(stats?.totalRevenue || 0)}
            </div>
            <div className={`flex items-center text-xs text-success mt-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <TrendingUp className={`h-3 w-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
              +{stats?.revenueChange || 0}% {t('admin.fromLastMonth', 'from last month')}
            </div>
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin.totalOrders', 'Total Orders')}
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : stats?.totalOrders || 0}
            </div>
            <div className={`flex items-center text-xs text-success mt-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <TrendingUp className={`h-3 w-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
              +{stats?.ordersChange || 0}% {t('admin.fromLastMonth', 'from last month')}
            </div>
          </CardContent>
        </Card>

        {/* Total Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin.totalProducts', 'Total Products')}
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : stats?.totalProducts || 0}
            </div>
            <Link
              to="/admin/products"
              className={`text-xs text-primary hover:underline mt-1 inline-flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              {t('admin.viewAll', 'View all')}
              <ArrowRight className={`h-3 w-3 ${isRTL ? 'mr-1 rotate-180' : 'ml-1'}`} />
            </Link>
          </CardContent>
        </Card>

        {/* Total Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin.totalUsers', 'Total Users')}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : stats?.totalUsers || 0}
            </div>
            <Link
              to="/admin/users"
              className={`text-xs text-primary hover:underline mt-1 inline-flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              {t('admin.viewAll', 'View all')}
              <ArrowRight className={`h-3 w-3 ${isRTL ? 'mr-1 rotate-180' : 'ml-1'}`} />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Recent Orders */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Revenue Chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>{t('admin.revenueOverview', 'Revenue Overview')}</CardTitle>
            <CardDescription>
              {t('admin.revenueDescription', 'Monthly revenue for the current year')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t('admin.recentOrders', 'Recent Orders')}</CardTitle>
              <CardDescription>
                {t('admin.recentOrdersDescription', 'Latest orders from your store')}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/orders" className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                {t('admin.viewAll', 'View all')}
                <ArrowRight className={`h-4 w-4 ${isRTL ? 'mr-1 rotate-180' : 'ml-1'}`} />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ordersLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t('admin.loading', 'Loading...')}
                </div>
              ) : recentOrders?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t('admin.noOrders', 'No orders yet')}
                </div>
              ) : (
                recentOrders?.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                          {order.order_number}
                        </span>
                        <Badge variant="outline" className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {order.profiles?.full_name || order.profiles?.email || 'Guest'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div className={`text-right ${isRTL ? 'mr-4' : 'ml-4'}`}>
                      <p className="font-semibold">{formatCurrency(order.total_amount)}</p>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/admin/orders/${order.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.quickActions', 'Quick Actions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/admin/products/new" className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Package className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('admin.addProduct', 'Add Product')}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/categories?action=add">
                {t('admin.addCategory', 'Add Category')}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/brands?action=add">
                {t('admin.addBrand', 'Add Brand')}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/orders?status=pending">
                {t('admin.pendingOrders', 'Pending Orders')}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

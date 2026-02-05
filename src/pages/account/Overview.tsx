import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShoppingBag,
  Heart,
  MapPin,
  Package,
  Clock,
  CheckCircle,
  Truck,
  ArrowRight,
} from 'lucide-react';

interface OrderSummary {
  total: number;
  pending: number;
  delivered: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  created_at: string;
}

export default function AccountOverview() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isRTL = i18n.language === 'ar';

  const [orderSummary, setOrderSummary] = useState<OrderSummary>({ total: 0, pending: 0, delivered: 0 });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchAccountData = async () => {
      setIsLoading(true);

      // Fetch orders summary
      const { data: orders } = await supabase
        .from('orders')
        .select('id, status, order_number, total_amount, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (orders) {
        setOrderSummary({
          total: orders.length,
          pending: orders.filter(o => ['pending', 'confirmed', 'processing', 'shipped'].includes(o.status)).length,
          delivered: orders.filter(o => o.status === 'delivered').length,
        });
        setRecentOrders(orders.slice(0, 3));
      }

      // Fetch wishlist count
      const { data: wishlist } = await supabase
        .from('wishlists')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (wishlist) {
        const { count } = await supabase
          .from('wishlist_items')
          .select('id', { count: 'exact', head: true })
          .eq('wishlist_id', wishlist.id);

        setWishlistCount(count || 0);
      }

      setIsLoading(false);
    };

    fetchAccountData();
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'shipped':
        return <Truck className="h-4 w-4 text-blue-500" />;
      case 'pending':
      case 'confirmed':
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'default';
      case 'shipped':
        return 'secondary';
      case 'cancelled':
      case 'refunded':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const stats = [
    {
      icon: ShoppingBag,
      label: t('account.totalOrders', 'Total Orders'),
      value: orderSummary.total,
      color: 'bg-blue-500/10 text-blue-500',
    },
    {
      icon: Clock,
      label: t('account.activeOrders', 'Active Orders'),
      value: orderSummary.pending,
      color: 'bg-yellow-500/10 text-yellow-500',
    },
    {
      icon: CheckCircle,
      label: t('account.completedOrders', 'Completed'),
      value: orderSummary.delivered,
      color: 'bg-green-500/10 text-green-500',
    },
    {
      icon: Heart,
      label: t('account.wishlistItems', 'Wishlist Items'),
      value: wishlistCount,
      color: 'bg-pink-500/10 text-pink-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold">
          {t('account.welcomeBack', 'Welcome back')}, {user?.user_metadata?.full_name?.split(' ')[0] || t('account.user', 'User')}!
        </h1>
        <p className="text-muted-foreground mt-1">
          {t('account.overviewDescription', 'Here\'s what\'s happening with your account.')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('account.recentOrders', 'Recent Orders')}</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/account/orders" className="flex items-center gap-1">
              {t('common.viewAll', 'View All')}
              <ArrowRight className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {t('account.noOrders', 'You haven\'t placed any orders yet.')}
              </p>
              <Button className="mt-4" asChild>
                <Link to="/shop">{t('common.startShopping', 'Start Shopping')}</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  to={`/account/orders/${order.id}`}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(order.status)}
                    <div>
                      <p className="font-medium">{order.order_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString(isRTL ? 'ar-KW' : 'en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={getStatusVariant(order.status)}>
                      {t(`orderStatus.${order.status}`, order.status)}
                    </Badge>
                    <p className="font-semibold">
                      {order.total_amount.toFixed(3)} {t('common.kwd', 'KWD')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <Link to="/account/addresses">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{t('account.manageAddresses', 'Manage Addresses')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('account.addEditAddresses', 'Add or edit delivery addresses')}
                </p>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <Link to="/account/wishlist">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-pink-500/10 flex items-center justify-center">
                <Heart className="h-6 w-6 text-pink-500" />
              </div>
              <div>
                <h3 className="font-semibold">{t('account.myWishlist', 'My Wishlist')}</h3>
                <p className="text-sm text-muted-foreground">
                  {wishlistCount} {t('account.savedItems', 'saved items')}
                </p>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <Link to="/account/settings">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <h3 className="font-semibold">{t('account.accountSettings', 'Account Settings')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('account.updateProfile', 'Update your profile')}
                </p>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  );
}

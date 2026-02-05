import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  MoreHorizontal,
  Eye,
  ShoppingCart,
  Filter,
  Loader2,
  Package,
  CheckCircle,
  XCircle,
  Truck,
  Clock,
} from 'lucide-react';

// Order type
interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_method: string | null;
  payment_status: string | null;
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  total_amount: number;
  created_at: string;
  profiles: { full_name: string | null; email: string | null } | null;
}

// Order status type
type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

// Order statuses for filter
const orderStatuses: ('all' | OrderStatus)[] = [
  'all',
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
];

export default function OrdersPage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch orders
  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders', searchQuery, statusFilter],
    queryFn: async (): Promise<Order[]> => {
      let query = supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          payment_method,
          payment_status,
          subtotal,
          shipping_cost,
          discount_amount,
          total_amount,
          created_at,
          user_id
        `)
        .order('created_at', { ascending: false });

      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as OrderStatus);
      }

      // Apply search filter
      if (searchQuery) {
        query = query.ilike('order_number', `%${searchQuery}%`);
      }

      const { data: ordersData, error } = await query;
      if (error) throw error;
      
      // Fetch profiles separately for each order
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
        })) as unknown as Order[];
      }
      
      return [];
    },
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      order_number,
      customer_email,
      customer_name,
      previous_status 
    }: { 
      id: string; 
      status: OrderStatus;
      order_number: string;
      customer_email: string | null;
      customer_name: string | null;
      previous_status: string;
    }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id);
      if (error) throw error;

      // Send status update email if customer has email
      if (customer_email && status !== previous_status) {
        try {
          await supabase.functions.invoke('send-order-email', {
            body: {
              type: 'status_update',
              order_id: id,
              order_number,
              customer_email,
              customer_name: customer_name || 'Customer',
              language: isRTL ? 'ar' : 'en',
              total_amount: 0, // Not needed for status update
              status,
              previous_status,
            },
          });
          console.log('Status update email sent for order:', order_number);
        } catch (emailError) {
          console.error('Failed to send status update email:', emailError);
          // Don't block status update if email fails
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast({ title: t('admin.orderUpdated', 'Order status updated') });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: t('admin.error', 'Error'),
        description: error.message,
      });
    },
  });

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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get status color and icon
  const getStatusConfig = (status: string) => {
    const config: Record<string, { color: string; icon: React.ReactNode }> = {
      pending: {
        color: 'bg-warning/10 text-warning border-warning/20',
        icon: <Clock className="h-3 w-3" />,
      },
      confirmed: {
        color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        icon: <CheckCircle className="h-3 w-3" />,
      },
      processing: {
        color: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
        icon: <Package className="h-3 w-3" />,
      },
      shipped: {
        color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
        icon: <Truck className="h-3 w-3" />,
      },
      delivered: {
        color: 'bg-success/10 text-success border-success/20',
        icon: <CheckCircle className="h-3 w-3" />,
      },
      cancelled: {
        color: 'bg-destructive/10 text-destructive border-destructive/20',
        icon: <XCircle className="h-3 w-3" />,
      },
      refunded: {
        color: 'bg-muted text-muted-foreground border-muted',
        icon: <XCircle className="h-3 w-3" />,
      },
    };
    return config[status] || config.pending;
  };

  // Get payment status color
  const getPaymentStatusColor = (status: string | null) => {
    if (!status) return 'bg-muted text-muted-foreground';
    const colors: Record<string, string> = {
      pending: 'bg-warning/10 text-warning',
      paid: 'bg-success/10 text-success',
      failed: 'bg-destructive/10 text-destructive',
      refunded: 'bg-muted text-muted-foreground',
    };
    return colors[status] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('admin.orders.title', 'Orders')}
          </h1>
          <p className="text-muted-foreground">
            {t('admin.ordersDescription', 'Manage customer orders')}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
              <Input
                placeholder={t('admin.searchOrders', 'Search by order number...')}
                className={isRTL ? 'pr-10' : 'pl-10'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                <SelectValue placeholder={t('admin.status', 'Status')} />
              </SelectTrigger>
              <SelectContent>
                {orderStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status === 'all'
                      ? t('admin.allStatuses', 'All Statuses')
                      : t(`admin.status.${status}`, status.charAt(0).toUpperCase() + status.slice(1))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {t('admin.allOrders', 'All Orders')}
            {orders && (
              <Badge variant="secondary" className="ml-2">
                {orders.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : orders?.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {t('admin.noOrders', 'No orders yet')}
              </h3>
              <p className="text-muted-foreground">
                {t('admin.noOrdersDesc', 'Orders will appear here when customers place them.')}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>{t('admin.order', 'Order')}</TableHead>
                    <TableHead>{t('admin.customer', 'Customer')}</TableHead>
                    <TableHead>{t('admin.status', 'Status')}</TableHead>
                    <TableHead>{t('admin.payment', 'Payment')}</TableHead>
                    <TableHead>{t('admin.total', 'Total')}</TableHead>
                    <TableHead>{t('admin.date', 'Date')}</TableHead>
                    <TableHead className={isRTL ? 'text-left' : 'text-right'}>{t('admin.actions', 'Actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders?.map((order, index) => {
                    const statusConfig = getStatusConfig(order.status);
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                        <TableCell>
                          <span className="font-mono font-medium">
                            {order.order_number}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {order.profiles?.full_name || 'Guest'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {order.profiles?.email || '-'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${statusConfig.color} flex items-center gap-1 w-fit`}>
                            {statusConfig.icon}
                            {t(`admin.status.${order.status}`, order.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge variant="outline" className="text-xs">
                              {order.payment_method?.toUpperCase() || 'N/A'}
                            </Badge>
                            <Badge
                              variant="secondary"
                              className={`text-xs ${getPaymentStatusColor(order.payment_status)}`}
                            >
                              {order.payment_status || 'pending'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">
                            {formatCurrency(order.total_amount)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(order.created_at)}
                          </span>
                        </TableCell>
                        <TableCell className={isRTL ? 'text-left' : 'text-right'}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                              <DropdownMenuItem asChild>
                                <Link to={`/admin/orders/${order.id}`} className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                                  <Eye className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                                  {t('admin.viewDetails', 'View Details')}
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {orderStatuses
                                .filter((s): s is OrderStatus => s !== 'all' && s !== order.status)
                                .map((status) => (
                                  <DropdownMenuItem
                                    key={status}
                                    onClick={() =>
                                      updateStatusMutation.mutate({ 
                                        id: order.id, 
                                        status,
                                        order_number: order.order_number,
                                        customer_email: order.profiles?.email || null,
                                        customer_name: order.profiles?.full_name || null,
                                        previous_status: order.status,
                                      })
                                    }
                                  >
                                    {t(`admin.markAs.${status}`, `Mark as ${status}`)}
                                  </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

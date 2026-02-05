import { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ChevronRight,
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  CreditCard,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import StorefrontLayout from '@/layouts/StorefrontLayout';

interface OrderItem {
  id: string;
  product_name_en: string;
  product_name_ar: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  variation_name: string | null;
}

interface ShippingAddress {
  name?: string;
  address?: string;
  city?: string;
  area?: string;
  phone?: string;
  [key: string]: string | undefined;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  subtotal: number;
  shipping_cost: number | null;
  discount_amount: number | null;
  payment_method: string | null;
  payment_status: string | null;
  shipping_address: ShippingAddress | null;
  tracking_number: string | null;
  notes: string | null;
  created_at: string;
  items: OrderItem[];
}

interface StatusHistoryItem {
  id: string;
  status: string;
  created_at: string;
  notes: string | null;
}

const statusSteps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export default function AccountOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();
  const isRTL = i18n.language === 'ar';

  const [order, setOrder] = useState<Order | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) return;

    const fetchOrder = async () => {
      setIsLoading(true);

      // Fetch order
      const { data: orderData } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (orderData) {
        // Fetch order items
        const { data: itemsData } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', id);

        // Fetch status history
        const { data: historyData } = await supabase
          .from('order_status_history')
          .select('*')
          .eq('order_id', id)
          .order('created_at', { ascending: true });

        setOrder({
          id: orderData.id,
          order_number: orderData.order_number,
          status: orderData.status,
          total_amount: orderData.total_amount,
          subtotal: orderData.subtotal,
          shipping_cost: orderData.shipping_cost,
          discount_amount: orderData.discount_amount,
          payment_method: orderData.payment_method,
          payment_status: orderData.payment_status,
          shipping_address: orderData.shipping_address as ShippingAddress | null,
          tracking_number: orderData.tracking_number,
          notes: orderData.notes,
          created_at: orderData.created_at,
          items: itemsData || [],
        });
        setStatusHistory(historyData || []);
      }

      setIsLoading(false);
    };

    fetchOrder();
  }, [user, id]);

  if (authLoading || isLoading) {
    return (
      <StorefrontLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </StorefrontLayout>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!order) {
    return (
      <StorefrontLayout>
        <div className="container mx-auto px-4 py-12 text-center">
          <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">{t('account.orderNotFound', 'Order not found')}</h1>
          <Button asChild className="mt-4">
            <Link to="/account/orders">{t('account.backToOrders', 'Back to Orders')}</Link>
          </Button>
        </div>
      </StorefrontLayout>
    );
  }

  const currentStepIndex = statusSteps.indexOf(order.status);
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return CheckCircle;
      case 'shipped':
        return Truck;
      default:
        return Package;
    }
  };

  return (
    <StorefrontLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors">
            {t('common.home', 'Home')}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link to="/account" className="hover:text-primary transition-colors">
            {t('account.myAccount', 'My Account')}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link to="/account/orders" className="hover:text-primary transition-colors">
            {t('account.orders', 'Orders')}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">{order.order_number}</span>
        </nav>

        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/account/orders">
              <ArrowLeft className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{order.order_number}</h1>
            <p className="text-muted-foreground">
              {t('account.placedOn', 'Placed on')}{' '}
              {new Date(order.created_at).toLocaleDateString(isRTL ? 'ar-KW' : 'en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status Timeline */}
            {!['cancelled', 'refunded'].includes(order.status) && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('account.orderProgress', 'Order Progress')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between relative">
                    {statusSteps.map((step, index) => {
                      const isCompleted = index <= currentStepIndex;
                      const isCurrent = index === currentStepIndex;
                      const Icon = getStatusIcon(step);

                      return (
                        <div key={step} className="flex flex-col items-center relative z-10">
                          <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${
                              isCompleted
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                            } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <p
                            className={`text-xs mt-2 text-center ${
                              isCompleted ? 'font-medium' : 'text-muted-foreground'
                            }`}
                          >
                            {t(`orderStatus.${step}`, step)}
                          </p>
                        </div>
                      );
                    })}
                    {/* Progress Line */}
                    <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted -z-0">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
                      />
                    </div>
                  </div>

                  {order.tracking_number && (
                    <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        {t('account.trackingNumber', 'Tracking Number')}
                      </p>
                      <p className="font-mono font-medium">{order.tracking_number}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>{t('account.orderItems', 'Order Items')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-4 border-b last:border-0">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center">
                          <Package className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {isRTL && item.product_name_ar ? item.product_name_ar : item.product_name_en}
                          </p>
                          {item.variation_name && (
                            <p className="text-sm text-muted-foreground">{item.variation_name}</p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            {t('common.qty', 'Qty')}: {item.quantity}
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold">
                        {item.total_price.toFixed(3)} {t('common.kwd', 'KWD')}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Status History */}
            {statusHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('account.statusHistory', 'Status History')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {statusHistory.map((item, index) => (
                      <div key={item.id} className="flex gap-4">
                        <div className="relative">
                          <div className="h-3 w-3 rounded-full bg-primary mt-1.5" />
                          {index < statusHistory.length - 1 && (
                            <div className="absolute top-4 left-1.5 w-px h-full bg-border -translate-x-1/2" />
                          )}
                        </div>
                        <div className="pb-4">
                          <Badge variant="outline" className="mb-1">
                            {t(`orderStatus.${item.status}`, item.status)}
                          </Badge>
                          <p className="text-sm text-muted-foreground">
                            {new Date(item.created_at).toLocaleString(isRTL ? 'ar-KW' : 'en-US')}
                          </p>
                          {item.notes && <p className="text-sm mt-1">{item.notes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>{t('checkout.orderSummary', 'Order Summary')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('checkout.subtotal', 'Subtotal')}</span>
                  <span>{order.subtotal.toFixed(3)} {t('common.kwd', 'KWD')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('checkout.shipping', 'Shipping')}</span>
                  <span>{(order.shipping_cost || 0).toFixed(3)} {t('common.kwd', 'KWD')}</span>
                </div>
                {order.discount_amount && order.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>{t('checkout.discount', 'Discount')}</span>
                    <span>-{order.discount_amount.toFixed(3)} {t('common.kwd', 'KWD')}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>{t('checkout.total', 'Total')}</span>
                  <span>{order.total_amount.toFixed(3)} {t('common.kwd', 'KWD')}</span>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            {order.shipping_address && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {t('checkout.shippingAddress', 'Shipping Address')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-1">
                    <p className="font-medium">{order.shipping_address.name}</p>
                    <p>{order.shipping_address.address}</p>
                    <p>
                      {order.shipping_address.city}, {order.shipping_address.area}
                    </p>
                    <p>{order.shipping_address.phone}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  {t('checkout.paymentInfo', 'Payment')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('checkout.method', 'Method')}</span>
                    <span className="font-medium">
                      {order.payment_method ? t(`payment.${order.payment_method}`, order.payment_method) : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('checkout.status', 'Status')}</span>
                    <Badge variant={order.payment_status === 'paid' ? 'default' : 'outline'}>
                      {t(`payment.${order.payment_status || 'pending'}`, order.payment_status || 'Pending')}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {order.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('checkout.notes', 'Order Notes')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{order.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </StorefrontLayout>
  );
}

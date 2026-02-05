import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Package, 
  ShoppingCart, 
  AlertTriangle,
  User,
  MessageSquare,
  Check,
  Trash2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

// Notification types for different admin events
interface Notification {
  id: string;
  type: 'order' | 'low_stock' | 'user' | 'message';
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  timestamp: Date;
  read: boolean;
  link?: string;
}

export function AdminNotifications() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Fetch recent orders for notifications
  const { data: recentOrders = [] } = useQuery({
    queryKey: ['admin-notifications-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, status, created_at, total_amount')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch low stock products
  const { data: lowStockProducts = [] } = useQuery({
    queryKey: ['admin-notifications-stock'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name_en, name_ar, stock_quantity, low_stock_threshold')
        .eq('is_active', true)
        .not('stock_quantity', 'is', null)
        .limit(10);
      
      if (error) throw error;
      // Filter low stock items
      return data.filter(p => 
        p.stock_quantity !== null && 
        p.low_stock_threshold !== null && 
        p.stock_quantity <= p.low_stock_threshold
      );
    },
  });

  // Fetch unread messages
  const { data: unreadMessages = [] } = useQuery({
    queryKey: ['admin-notifications-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_inbox_messages')
        .select('id, subject, from_name, created_at')
        .eq('is_read', false)
        .eq('direction', 'inbound')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
  });

  // Build notifications list from real data
  const allNotifications: Notification[] = [
    // Pending orders
    ...recentOrders.map(order => ({
      id: `order-${order.id}`,
      type: 'order' as const,
      title: `New Order #${order.order_number}`,
      titleAr: `طلب جديد #${order.order_number}`,
      description: `Total: ${order.total_amount} KWD`,
      descriptionAr: `المجموع: ${order.total_amount} د.ك`,
      timestamp: new Date(order.created_at),
      read: false,
      link: `/admin/orders`
    })),
    // Low stock alerts
    ...lowStockProducts.map(product => ({
      id: `stock-${product.id}`,
      type: 'low_stock' as const,
      title: `Low Stock: ${product.name_en}`,
      titleAr: `مخزون منخفض: ${product.name_ar}`,
      description: `Only ${product.stock_quantity} units left`,
      descriptionAr: `${product.stock_quantity} وحدات متبقية فقط`,
      timestamp: new Date(),
      read: false,
      link: `/admin/inventory-alerts`
    })),
    // Unread messages
    ...unreadMessages.map(msg => ({
      id: `msg-${msg.id}`,
      type: 'message' as const,
      title: msg.subject || 'New Message',
      titleAr: msg.subject || 'رسالة جديدة',
      description: `From: ${msg.from_name || 'Unknown'}`,
      descriptionAr: `من: ${msg.from_name || 'غير معروف'}`,
      timestamp: new Date(msg.created_at || Date.now()),
      read: false,
      link: `/admin/messages`
    })),
  ];

  // Sort by timestamp
  const sortedNotifications = allNotifications.sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  const unreadCount = sortedNotifications.filter(n => !n.read).length;

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'order':
        return <ShoppingCart className="h-4 w-4 text-blue-500" />;
      case 'low_stock':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'user':
        return <User className="h-4 w-4 text-green-500" />;
      case 'message':
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.link) {
      window.location.href = notification.link;
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative text-muted-foreground hover:text-foreground"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className={`absolute -top-0.5 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center ${isRTL ? '-left-0.5' : '-right-0.5'}`}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0" 
        align={isRTL ? 'start' : 'end'}
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">
            {isRTL ? 'الإشعارات' : 'Notifications'}
          </h4>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadCount} {isRTL ? 'جديد' : 'new'}
            </Badge>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[300px]">
          {sortedNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">
                {isRTL ? 'لا توجد إشعارات' : 'No notifications'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {sortedNotifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full p-3 text-start hover:bg-muted/50 transition-colors ${
                    !notification.read ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {isRTL ? notification.titleAr : notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {isRTL ? notification.descriptionAr : notification.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(notification.timestamp, {
                          addSuffix: true,
                          locale: isRTL ? ar : enUS
                        })}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="flex-shrink-0">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {sortedNotifications.length > 0 && (
          <div className="p-2 border-t">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-xs"
              onClick={() => setOpen(false)}
            >
              {isRTL ? 'إغلاق' : 'Close'}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

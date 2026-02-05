// Admin Dashboard Constants
// Order status configuration with icons, colors, and translations

export const ORDER_STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    label_ar: 'قيد الانتظار',
    color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    icon: 'clock',
  },
  confirmed: {
    label: 'Confirmed',
    label_ar: 'مؤكد',
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    icon: 'check-circle',
  },
  processing: {
    label: 'Processing',
    label_ar: 'قيد المعالجة',
    color: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    icon: 'loader',
  },
  shipped: {
    label: 'Shipped',
    label_ar: 'تم الشحن',
    color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    icon: 'truck',
  },
  delivered: {
    label: 'Delivered',
    label_ar: 'تم التوصيل',
    color: 'bg-green-500/10 text-green-500 border-green-500/20',
    icon: 'check-circle',
  },
  cancelled: {
    label: 'Cancelled',
    label_ar: 'ملغي',
    color: 'bg-red-500/10 text-red-500 border-red-500/20',
    icon: 'x-circle',
  },
  refunded: {
    label: 'Refunded',
    label_ar: 'مسترد',
    color: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    icon: 'rotate-ccw',
  },
} as const;

export type OrderStatus = keyof typeof ORDER_STATUS_CONFIG;

export const STOCK_STATUS_CONFIG = {
  in_stock: {
    label: 'In Stock',
    label_ar: 'متوفر',
    color: 'bg-green-500/10 text-green-500 border-green-500/20',
    threshold: 10,
  },
  low_stock: {
    label: 'Low Stock',
    label_ar: 'مخزون منخفض',
    color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    threshold: 5,
  },
  critical_stock: {
    label: 'Critical',
    label_ar: 'حرج',
    color: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    threshold: 2,
  },
  out_of_stock: {
    label: 'Out of Stock',
    label_ar: 'غير متوفر',
    color: 'bg-red-500/10 text-red-500 border-red-500/20',
    threshold: 0,
  },
} as const;

export type StockStatus = keyof typeof STOCK_STATUS_CONFIG;

// Get stock status based on quantity
export const getStockStatus = (quantity: number | null): StockStatus => {
  const qty = quantity ?? 0;
  if (qty === 0) return 'out_of_stock';
  if (qty <= 2) return 'critical_stock';
  if (qty <= 5) return 'low_stock';
  return 'in_stock';
};

export const PAYMENT_METHOD_CONFIG = {
  knet: {
    label: 'KNET',
    label_ar: 'كي نت',
    color: 'bg-blue-500/10 text-blue-500',
  },
  cod: {
    label: 'Cash on Delivery',
    label_ar: 'الدفع عند الاستلام',
    color: 'bg-green-500/10 text-green-500',
  },
  wamad_transfer: {
    label: 'Bank Transfer',
    label_ar: 'تحويل بنكي',
    color: 'bg-purple-500/10 text-purple-500',
  },
} as const;

export type PaymentMethod = keyof typeof PAYMENT_METHOD_CONFIG;

export const PAYMENT_STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    label_ar: 'معلق',
    color: 'bg-yellow-500/10 text-yellow-500',
  },
  paid: {
    label: 'Paid',
    label_ar: 'مدفوع',
    color: 'bg-green-500/10 text-green-500',
  },
  failed: {
    label: 'Failed',
    label_ar: 'فشل',
    color: 'bg-red-500/10 text-red-500',
  },
  refunded: {
    label: 'Refunded',
    label_ar: 'مسترد',
    color: 'bg-gray-500/10 text-gray-500',
  },
} as const;

// Pagination defaults
export const PAGINATION_DEFAULTS = {
  pageSize: 20,
  pageSizeOptions: [10, 20, 50, 100],
} as const;

// Low stock threshold
export const LOW_STOCK_THRESHOLD = 5;
export const CRITICAL_STOCK_THRESHOLD = 2;

// Gaming theme colors for dashboard
export const GAMING_COLORS = {
  red: '#FF4655',
  cyan: '#00D9FF',
  purple: '#8B5CFF',
  yellow: '#FFB800',
  green: '#10B981',
} as const;

// Dashboard stat card configurations
export const STAT_CARD_CONFIG = {
  todayOrders: {
    icon: 'shopping-cart',
    color: 'cyan',
    gradient: 'from-cyan-500/20 to-cyan-500/5',
  },
  totalSales: {
    icon: 'dollar-sign',
    color: 'purple',
    gradient: 'from-purple-500/20 to-purple-500/5',
  },
  visitors: {
    icon: 'eye',
    color: 'yellow',
    gradient: 'from-yellow-500/20 to-yellow-500/5',
  },
  lowStock: {
    icon: 'alert-circle',
    color: 'red',
    gradient: 'from-red-500/20 to-red-500/5',
  },
  customers: {
    icon: 'users',
    color: 'cyan',
    gradient: 'from-cyan-500/20 to-cyan-500/5',
  },
} as const;

// Bulk operation types
export const BULK_PRICE_OPERATIONS = {
  add: { label: 'Add', label_ar: 'إضافة' },
  subtract: { label: 'Subtract', label_ar: 'طرح' },
} as const;

export const BULK_PRICE_TYPES = {
  fixed: { label: 'Fixed Amount (KWD)', label_ar: 'مبلغ ثابت (د.ك)' },
  percentage: { label: 'Percentage (%)', label_ar: 'نسبة مئوية (%)' },
} as const;

export const BULK_PRICE_TARGETS = {
  base_price: { label: 'Base Price', label_ar: 'السعر الأساسي' },
  sale_price: { label: 'Sale Price', label_ar: 'سعر العرض' },
  both: { label: 'Both Prices', label_ar: 'كلا السعرين' },
} as const;

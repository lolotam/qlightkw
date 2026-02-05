import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FileText,
  Image,
  Settings,
  ChevronUp,
  ChevronDown,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const adminLinks = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', labelKey: 'admin.nav.dashboard' },
  { to: '/admin/products', icon: Package, label: 'Products', labelKey: 'admin.nav.products' },
  { to: '/admin/orders', icon: ShoppingCart, label: 'Orders', labelKey: 'admin.nav.orders' },
  { to: '/admin/users', icon: Users, label: 'Users', labelKey: 'admin.nav.users' },
  { to: '/admin/blog-posts', icon: FileText, label: 'Blog', labelKey: 'admin.nav.blogPosts' },
  { to: '/admin/images', icon: Image, label: 'Gallery', labelKey: 'admin.nav.images' },
  { to: '/admin/settings', icon: Settings, label: 'Settings', labelKey: 'admin.nav.settings' },
];

const AdminToolbar = () => {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Don't show on admin pages or if not admin
  if (!isAdmin || location.pathname.startsWith('/admin')) {
    return null;
  }

  if (!isVisible) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <Button
          size="icon"
          className="rounded-full shadow-lg bg-primary hover:bg-primary-hover h-12 w-12"
          onClick={() => setIsVisible(true)}
        >
          <LayoutDashboard className="h-5 w-5" />
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 right-4 z-50"
    >
      <div className="bg-card/95 backdrop-blur-md border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span className="font-medium text-sm">{t('admin.toolbar', 'Admin Tools')}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => setIsVisible(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-3 grid grid-cols-4 gap-2">
                {adminLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-muted transition-colors group"
                  >
                    <link.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors text-center">
                      {t(link.labelKey, link.label)}
                    </span>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed Quick Links */}
        {!isExpanded && (
          <div className="p-2 flex items-center gap-1">
            {adminLinks.slice(0, 4).map((link) => (
              <Link key={link.to} to={link.to}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-lg"
                >
                  <link.icon className="h-4 w-4" />
                </Button>
              </Link>
            ))}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg"
              onClick={() => setIsExpanded(true)}
            >
              <span className="text-xs font-medium">+3</span>
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AdminToolbar;

import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import {
  User,
  ShoppingBag,
  MapPin,
  Heart,
  Settings,
  LogOut,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import StorefrontLayout from './StorefrontLayout';

const accountNavItems = [
  { path: '/account', icon: User, labelKey: 'account.overview' },
  { path: '/account/orders', icon: ShoppingBag, labelKey: 'account.orders' },
  { path: '/account/addresses', icon: MapPin, labelKey: 'account.addresses' },
  { path: '/account/wishlist', icon: Heart, labelKey: 'account.wishlist' },
  { path: '/account/settings', icon: Settings, labelKey: 'account.settings' },
];

export default function AccountLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, isLoading, signOut } = useAuth();

  if (isLoading) {
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

  const handleSignOut = async () => {
    await signOut();
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
          <span className="text-foreground font-medium">
            {t('account.myAccount', 'My Account')}
          </span>
        </nav>

        <div className="grid lg:grid-cols-[280px_1fr] gap-8">
          {/* Sidebar */}
          <aside className="space-y-2">
            <div className="bg-card rounded-xl p-6 border shadow-sm mb-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-lg">
                    {user.user_metadata?.full_name || t('account.user', 'User')}
                  </p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
            </div>

            <nav className="bg-card rounded-xl border shadow-sm overflow-hidden">
              {accountNavItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 transition-colors border-l-4',
                      isActive
                        ? 'bg-primary/5 border-primary text-primary'
                        : 'border-transparent hover:bg-muted'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">
                      {t(item.labelKey, item.labelKey.split('.')[1])}
                    </span>
                  </Link>
                );
              })}
              
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-4 py-3 w-full transition-colors border-l-4 border-transparent hover:bg-destructive/5 text-destructive"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">{t('auth.signOut', 'Sign Out')}</span>
              </button>
            </nav>
          </aside>

          {/* Main Content */}
          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="min-h-[60vh]"
          >
            <Outlet />
          </motion.main>
        </div>
      </div>
    </StorefrontLayout>
  );
}

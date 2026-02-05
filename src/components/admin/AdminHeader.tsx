import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { AdminNotifications } from './AdminNotifications';
import {
  Sun,
  Moon,
  Globe,
  Search,
  Store,
  HelpCircle,
} from 'lucide-react';

export function AdminHeader() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, isRTL } = useLanguage();

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
      {/* Sidebar trigger for mobile */}
      <SidebarTrigger className="md:hidden" />

      {/* Search bar - RTL aware positioning */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
          <Input
            placeholder={t('admin.searchPlaceholder', 'Search products, orders, users...')}
            className={`${isRTL ? 'pr-10' : 'pl-10'} bg-muted/50 border-transparent focus:bg-background focus:border-input transition-colors`}
          />
        </div>
      </div>

      {/* Right side actions - reverse for RTL */}
      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
        {/* Back to Store */}
        <Button variant="outline" size="sm" asChild className="hidden sm:flex">
          <Link to="/">
            <Store className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('admin.backToStore', 'Back to Store')}
          </Link>
        </Button>

        {/* Notifications - Now functional with real data */}
        <AdminNotifications />

        {/* View Store (mobile) */}
        <Button variant="ghost" size="icon" asChild className="sm:hidden text-muted-foreground hover:text-foreground">
          <Link to="/" title={t('admin.backToStore', 'Back to Store')}>
            <Store className="h-5 w-5" />
          </Link>
        </Button>

        {/* Support */}
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <HelpCircle className="h-5 w-5" />
        </Button>

        {/* Language toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <Globe className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-40">
            <DropdownMenuLabel>{t('admin.language', 'Language')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setLanguage('en')} className={language === 'en' ? 'bg-accent' : ''}>
              🇺🇸 English
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLanguage('ar')} className={language === 'ar' ? 'bg-accent' : ''}>
              🇰🇼 العربية
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="text-muted-foreground hover:text-foreground"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
      </div>
    </header>
  );
}

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import {
  Moon,
  Sun,
  Globe,
  User,
  ShoppingCart,
  LogIn,
  Menu,
  Search,
  Heart,
  ChevronDown,
  X,
} from 'lucide-react';
import AnimatedLogo from '@/components/AnimatedLogo';
import MiniCartPreview from './MiniCartPreview';

const Header = () => {
  const { t } = useTranslation();
  const { language, setLanguage, isRTL } = useLanguage();
  const { resolvedTheme, setTheme } = useTheme();
  const { user, isAdmin } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { itemCount } = useCart();
  const isNavigating = false; // Could be enhanced with navigation state

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const navLinks = [
    { href: '/', label: t('nav.home') },
    { href: '/shop', label: t('nav.products') },
    { href: '/projects', label: t('nav.projects') },
    { href: '/about', label: t('nav.about') },
    { href: '/contact', label: t('nav.contact') },
  ];

  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-border">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className={`flex items-center gap-2 shrink-0 ${isRTL ? 'order-last' : ''}`}>
          <AnimatedLogo isLoading={isNavigating} />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6 flex-1 justify-center">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors story-link"
            >
              {link.label}
            </Link>
          ))}
          
          {/* Categories Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-primary">
                {t('nav.categories', 'Categories')}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-48 bg-popover">
              <DropdownMenuItem asChild>
                <Link to="/shop?category=indoor">{t('categories.indoor', 'Indoor Lighting')}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/shop?category=outdoor">{t('categories.outdoor', 'Outdoor Lighting')}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/shop?category=decorative">{t('categories.decorative', 'Decorative')}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/shop?category=commercial">{t('categories.commercial', 'Commercial')}</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Search Bar - Desktop */}
        <div className="hidden md:flex items-center flex-1 max-w-xs">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('nav.search', 'Search products...')}
              className="pl-9 pr-4 h-9 bg-muted/50"
            />
          </div>
        </div>

        {/* Right Side Icons */}
        <div className={`flex items-center gap-1 ${isRTL ? 'order-first' : ''}`}>
          {/* Mobile Search Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            {isSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </Button>

          {/* Language Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleLanguage}
            className="relative"
            aria-label="Toggle language"
          >
            <Globe className="h-5 w-5" />
            <span className="absolute -bottom-1 -right-1 text-[10px] font-bold bg-primary text-primary-foreground rounded px-1">
              {language.toUpperCase()}
            </span>
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {/* Wishlist */}
          <Button variant="ghost" size="icon" asChild className="hidden sm:flex">
            <Link to="/wishlist">
              <Heart className="h-5 w-5" />
            </Link>
          </Button>

          {/* Cart with Mini Preview */}
          <HoverCard openDelay={100} closeDelay={200}>
            <HoverCardTrigger asChild>
              <Button variant="ghost" size="icon" className="relative" asChild>
                <Link to="/cart">
                  <ShoppingCart className="h-5 w-5" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                      {itemCount > 99 ? '99+' : itemCount}
                    </span>
                  )}
                </Link>
              </Button>
            </HoverCardTrigger>
            <HoverCardContent 
              align="end" 
              className="w-auto p-4 hidden sm:block"
              sideOffset={8}
            >
              <MiniCartPreview />
            </HoverCardContent>
          </HoverCard>

          {/* User Account / Login */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-popover">
                <DropdownMenuItem asChild>
                  <Link to="/account">{t('nav.account', 'My Account')}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/account/orders">{t('nav.orders', 'My Orders')}</Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin">{t('nav.admin', 'Admin Dashboard')}</Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
              <Link to="/auth" className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                <span>{t('nav.login', 'Login')}</span>
              </Link>
            </Button>
          )}

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side={isRTL ? 'left' : 'right'} className="w-80">
              <div className="flex flex-col gap-4 mt-8">
                <Link to="/" className="flex justify-center mb-4">
                  <AnimatedLogo />
                </Link>
                
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-lg font-medium py-2 px-4 rounded-lg hover:bg-muted transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
                
                <div className="border-t border-border my-4" />
                
                {/* User Account Links - Mobile */}
                {user ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-muted-foreground px-4 mb-2">
                      {t('nav.account', 'My Account')}
                    </p>
                    <Link
                      to="/account"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 py-2 px-4 rounded-lg hover:bg-muted transition-colors"
                    >
                      <User className="h-5 w-5" />
                      {t('nav.myAccount', 'Account Overview')}
                    </Link>
                    <Link
                      to="/account/orders"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 py-2 px-4 rounded-lg hover:bg-muted transition-colors"
                    >
                      <ShoppingCart className="h-5 w-5" />
                      {t('nav.orders', 'My Orders')}
                    </Link>
                    <Link
                      to="/wishlist"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 py-2 px-4 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Heart className="h-5 w-5" />
                      {t('nav.wishlist', 'Wishlist')}
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 py-2 px-4 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 4.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0 1.32 4.24 3 3 0 0 0 .34 5.58 2.5 2.5 0 0 0 2.96 3.08A2.5 2.5 0 0 0 12 21.5a2.5 2.5 0 0 0 2.32-1.56 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0 1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 12 4.5"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                        {t('nav.admin', 'Admin Dashboard')}
                      </Link>
                    )}
                  </div>
                ) : (
                  <Button asChild className="w-full">
                    <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                      <LogIn className="h-4 w-4 mr-2" />
                      {t('nav.login', 'Login')}
                    </Link>
                  </Button>
                )}
                
                <div className="flex items-center justify-center gap-4 mt-4">
                  <Button variant="outline" size="icon" onClick={toggleLanguage}>
                    <Globe className="h-5 w-5" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={toggleTheme}>
                    {resolvedTheme === 'dark' ? (
                      <Sun className="h-5 w-5" />
                    ) : (
                      <Moon className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {isSearchOpen && (
        <div className="md:hidden border-t border-border p-4 animate-fade-in">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('nav.search', 'Search products...')}
              className="pl-9 pr-4"
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;

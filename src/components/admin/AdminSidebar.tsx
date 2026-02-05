import { useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { NavLink } from '@/components/NavLink';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Tags,
  ShoppingCart,
  Users,
  Settings,
  FolderKanban,
  MessageSquareQuote,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Eye,
  Image,
  AlertTriangle,
  ImagePlay,
  ImageOff,
  CloudDownload,
  ArrowLeftRight,
  BookOpen,
  Mail,
  BarChart3,
  Ticket,
  FileText,
  Newspaper,
  FilePenLine,
  Palette,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import logo from '@/assets/logo.png';

// Navigation items for admin sidebar
const mainNavItems = [
  { title: 'dashboard', url: '/admin', icon: LayoutDashboard },
  { title: 'analytics', url: '/admin/analytics', icon: BarChart3 },
  { title: 'visitors', url: '/admin/visitors', icon: Eye },
  { title: 'products', url: '/admin/products', icon: Package },
  { title: 'categories', url: '/admin/categories', icon: FolderTree },
  { title: 'brands', url: '/admin/brands', icon: Tags },
  { title: 'tags', url: '/admin/tags', icon: Ticket },
  { title: 'orders', url: '/admin/orders', icon: ShoppingCart },
  { title: 'coupons', url: '/admin/coupons', icon: Tags },
  { title: 'users', url: '/admin/users', icon: Users },
];

const contentNavItems = [
  { title: 'blogPosts', url: '/admin/blog-posts', icon: FileText },
  { title: 'blogDrafts', url: '/admin/blog-drafts', icon: FilePenLine },
  { title: 'banners', url: '/admin/banners', icon: ImagePlay },
  { title: 'projects', url: '/admin/projects', icon: FolderKanban },
  { title: 'testimonials', url: '/admin/testimonials', icon: MessageSquareQuote },
  { title: 'messages', url: '/admin/messages', icon: Mail },
  { title: 'newsletter', url: '/admin/newsletter', icon: Newspaper },
];

const mediaNavItems = [
  { title: 'images', url: '/admin/images', icon: Image },
  { title: 'imageValidator', url: '/admin/image-validator', icon: ImageOff },
  { title: 'imageCacher', url: '/admin/image-cacher', icon: CloudDownload },
  { title: 'storageMigration', url: '/admin/storage-migration', icon: ArrowLeftRight },
  { title: 'inventory', url: '/admin/inventory', icon: AlertTriangle },
];

const systemNavItems = [
  { title: 'themeBuilder', url: '/admin/theme-builder', icon: Palette },
  { title: 'logs', url: '/admin/logs', icon: FolderKanban },
  { title: 'observability', url: '/admin/observability', icon: LayoutDashboard },
  { title: 'documentation', url: '/admin/documentation', icon: BookOpen },
  { title: 'settings', url: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const { state, toggleSidebar } = useSidebar();
  const { user, signOut } = useAuth();
  const collapsed = state === 'collapsed';
  const location = useLocation();

  // Check if route is active
  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  // Get user initials
  const getInitials = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) return user.email[0].toUpperCase();
    return 'A';
  };

  return (
    <Sidebar 
      collapsible="icon" 
      side={isRTL ? 'right' : 'left'}
      className={`${isRTL ? 'border-l' : 'border-r'} border-sidebar-border bg-sidebar`}
    >
      {/* Header with logo */}
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="h-9 w-9 rounded-lg bg-primary/10 p-1.5 flex items-center justify-center">
            <img src={logo} alt="Quality Light" className="h-full w-full object-contain" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-sidebar-foreground tracking-tight">Quality Light</span>
              <span className="text-xs text-primary font-medium">{t('admin.panel', 'Admin Panel')}</span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      {/* User Profile Section */}
      {!collapsed && (
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-sidebar-accent">
            <Avatar className="h-10 w-10 ring-2 ring-primary/20">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sidebar-foreground truncate text-sm">
                {user?.user_metadata?.full_name || 'Admin'}
              </p>
              <p className="text-xs text-primary font-medium">
                {t('admin.adminRole', 'ADMINISTRATOR')}
              </p>
            </div>
          </div>
        </div>
      )}

      <SidebarContent className="px-3 py-4">
        {/* Main Navigation */}
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              {t('admin.main', 'Main')}
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {mainNavItems.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={t(`admin.nav.${item.title}`, item.title)}
                    >
                      <NavLink
                        to={item.url}
                        end={item.url === '/admin'}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 ${
                          active 
                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                        }`}
                      >
                        <item.icon className={`h-4 w-4 shrink-0 ${active ? '' : 'text-muted-foreground'}`} />
                        {!collapsed && (
                          <span className="truncate font-medium">
                            {t(`admin.nav.${item.title}`, item.title.charAt(0).toUpperCase() + item.title.slice(1))}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Content Navigation */}
        <SidebarGroup className="mt-6">
          {!collapsed && (
            <SidebarGroupLabel className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              {t('admin.content', 'Content')}
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {contentNavItems.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={t(`admin.nav.${item.title}`, item.title)}
                    >
                      <NavLink
                        to={item.url}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 ${
                          active 
                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                        }`}
                      >
                        <item.icon className={`h-4 w-4 shrink-0 ${active ? '' : 'text-muted-foreground'}`} />
                        {!collapsed && (
                          <span className="truncate font-medium">
                            {t(`admin.nav.${item.title}`, item.title.charAt(0).toUpperCase() + item.title.slice(1))}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Media & Inventory Navigation */}
        <SidebarGroup className="mt-6">
          {!collapsed && (
            <SidebarGroupLabel className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              {t('admin.media', 'Media & Inventory')}
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {mediaNavItems.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={t(`admin.nav.${item.title}`, item.title)}
                    >
                      <NavLink
                        to={item.url}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 ${
                          active 
                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                        }`}
                      >
                        <item.icon className={`h-4 w-4 shrink-0 ${active ? '' : 'text-muted-foreground'}`} />
                        {!collapsed && (
                          <span className="truncate font-medium">
                            {t(`admin.nav.${item.title}`, item.title.charAt(0).toUpperCase() + item.title.slice(1))}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* System Navigation */}
        <SidebarGroup className="mt-6">
          {!collapsed && (
            <SidebarGroupLabel className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              {t('admin.system', 'System')}
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {systemNavItems.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={t(`admin.nav.${item.title}`, item.title)}
                    >
                      <NavLink
                        to={item.url}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 ${
                          active 
                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                        }`}
                      >
                        <item.icon className={`h-4 w-4 shrink-0 ${active ? '' : 'text-muted-foreground'}`} />
                        {!collapsed && (
                          <span className="truncate font-medium">
                            {t(`admin.nav.${item.title}`, item.title.charAt(0).toUpperCase() + item.title.slice(1))}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer with collapse button and logout */}
      <SidebarFooter className="border-t border-sidebar-border p-3 space-y-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut()}
          className={`w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 ${collapsed ? 'justify-center' : 'justify-start'}`}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">{t('admin.signOut', 'Log Out')}</span>}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="w-full justify-center text-muted-foreground hover:text-sidebar-foreground"
        >
          {collapsed ? (
            isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              {isRTL ? <ChevronRight className="h-4 w-4 ml-2" /> : <ChevronLeft className="h-4 w-4 mr-2" />}
              <span>{t('admin.collapse', 'Collapse')}</span>
            </>
          )}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

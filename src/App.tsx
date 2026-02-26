import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import { AnimatePresence } from "framer-motion";
import SplashScreen from "@/components/SplashScreen";
import PageTransition from "@/components/PageTransition";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import "@/i18n"; // Initialize i18n

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Shop from "./pages/Shop";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import ProductDetail from "./pages/ProductDetail";
import ProjectDetail from "./pages/ProjectDetail";
import Checkout from "./pages/Checkout";
import About from "./pages/About";
import Projects from "./pages/Projects";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Returns from "./pages/Returns";
import Shipping from "./pages/Shipping";
import FAQ from "./pages/FAQ";
import Blog from "./pages/Blog";
import BlogDetail from "./pages/BlogDetail";

// Account Layout & Pages
import AccountLayout from "./layouts/AccountLayout";
import AccountOverview from "./pages/account/Overview";
import AccountOrders from "./pages/account/Orders";
import AccountOrderDetail from "./pages/account/OrderDetail";
import AccountAddresses from "./pages/account/Addresses";
import AccountSettings from "./pages/account/Settings";
import AccountWishlist from "./pages/account/Wishlist";

// Admin Layout & Pages
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminAnalytics from "./pages/admin/Analytics";
import ProductsPage from "./pages/admin/Products";
import CategoriesPage from "./pages/admin/Categories";
import BrandsPage from "./pages/admin/Brands";
import OrdersPage from "./pages/admin/Orders";
import UsersPage from "./pages/admin/Users";
import AdminCoupons from "./pages/admin/Coupons";
import AdminSystemLogs from "./pages/admin/SystemLogs";
import AdminEmailInbox from "./pages/admin/EmailInbox";
import AdminObservability from "./pages/admin/Observability";
import AdminVisitors from "./pages/admin/Visitors";
import AdminImageGallery from "./pages/admin/ImageGallery";
import AdminImageValidator from "./pages/admin/ImageValidator";
import AdminImageCacher from "./pages/admin/ImageCacher";
import AdminInventoryAlerts from "./pages/admin/InventoryAlerts";
import AdminBanners from "./pages/admin/Banners";
import AdminMessages from "./pages/admin/Messages";
import AdminTags from "./pages/admin/Tags";
import AdminDocumentation from "./pages/admin/Documentation";
import SettingsPage from "./pages/admin/Settings";
import AdminProjects from "./pages/admin/AdminProjects";
import AdminTestimonials from "./pages/admin/AdminTestimonials";
import ProductFormPage from "./pages/admin/ProductForm";
import AdminBlogPosts from "./pages/admin/BlogPosts";
import AdminBlogDrafts from "./pages/admin/BlogDrafts";
import AdminNewsletterSubscribers from "./pages/admin/NewsletterSubscribers";
import AdminThemeBuilder from "./pages/admin/ThemeBuilder";
import AdminStorageMigration from "./pages/admin/StorageMigration";

const queryClient = new QueryClient();

// Animated Routes wrapper component with visitor tracking
const AnimatedRoutes = () => {
  const location = useLocation();
  
  // Track page visits for analytics
  useVisitorTracking();
  
  return (
    <AnimatePresence mode="wait">
      <PageTransition key={location.pathname}>
        <Routes location={location}>
          {/* Public routes */}
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/about" element={<About />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/project/:slug" element={<ProjectDetail />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/returns" element={<Returns />} />
          <Route path="/shipping" element={<Shipping />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogDetail />} />

          {/* Account routes */}
          <Route path="/account" element={<AccountLayout />}>
            <Route index element={<AccountOverview />} />
            <Route path="orders" element={<AccountOrders />} />
            <Route path="addresses" element={<AccountAddresses />} />
            <Route path="wishlist" element={<AccountWishlist />} />
            <Route path="settings" element={<AccountSettings />} />
          </Route>
          {/* Order detail is separate as it uses its own layout */}
          <Route path="/account/orders/:id" element={<AccountOrderDetail />} />

          {/* Admin routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="visitors" element={<AdminVisitors />} />
            <Route path="images" element={<AdminImageGallery />} />
            <Route path="image-validator" element={<AdminImageValidator />} />
            <Route path="image-cacher" element={<AdminImageCacher />} />
            <Route path="inventory" element={<AdminInventoryAlerts />} />
            <Route path="banners" element={<AdminBanners />} />
            <Route path="blog-posts" element={<AdminBlogPosts />} />
            <Route path="blog-drafts" element={<AdminBlogDrafts />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="products/new" element={<ProductFormPage />} />
            <Route path="products/:id" element={<ProductFormPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="brands" element={<BrandsPage />} />
            <Route path="tags" element={<AdminTags />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="logs" element={<AdminSystemLogs />} />
            <Route path="inbox" element={<AdminEmailInbox />} />
            <Route path="observability" element={<AdminObservability />} />
            <Route path="documentation" element={<AdminDocumentation />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="projects" element={<AdminProjects />} />
            <Route path="testimonials" element={<AdminTestimonials />} />
            <Route path="newsletter" element={<AdminNewsletterSubscribers />} />
            <Route path="theme-builder" element={<AdminThemeBuilder />} />
            <Route path="storage-migration" element={<AdminStorageMigration />} />
          </Route>

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </PageTransition>
    </AnimatePresence>
  );
};

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Fallback timeout in case animation doesn't complete
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3500);
    
    return () => clearTimeout(timer);
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <AnimatePresence mode="wait">
                  {showSplash && (
                    <SplashScreen onComplete={handleSplashComplete} />
                  )}
                </AnimatePresence>
                {!showSplash && (
                  <BrowserRouter>
                    <AnimatedRoutes />
                  </BrowserRouter>
                )}
              </TooltipProvider>
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;

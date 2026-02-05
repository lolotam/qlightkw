import Header from '@/components/storefront/Header';
import Footer from '@/components/storefront/Footer';
import AIAssistant from '@/components/AIAssistant';
import AdminToolbar from '@/components/storefront/AdminToolbar';

interface StorefrontLayoutProps {
  children: React.ReactNode;
}

const StorefrontLayout = ({ children }: StorefrontLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      {/* AI Assistant - floating chatbot */}
      <AIAssistant />
      {/* Admin Toolbar - only visible to admins */}
      <AdminToolbar />
    </div>
  );
};

export default StorefrontLayout;

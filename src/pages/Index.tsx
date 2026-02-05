import Header from '@/components/storefront/Header';
import Footer from '@/components/storefront/Footer';
import HeroSection from '@/components/storefront/HeroSection';
import FeaturedCategories from '@/components/storefront/FeaturedCategories';
import ProductsSection from '@/components/storefront/ProductsSection';
import WhyChooseUs from '@/components/storefront/WhyChooseUs';
import BrandsShowcase from '@/components/storefront/BrandsShowcase';
import TestimonialsSection from '@/components/storefront/TestimonialsSection';
import ProjectsSection from '@/components/storefront/ProjectsSection';
import CTASection from '@/components/storefront/CTASection';
import NewsletterSection from '@/components/storefront/NewsletterSection';
import BlogSection from '@/components/storefront/BlogSection';
import AIAssistant from '@/components/AIAssistant';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        <HeroSection />
        <FeaturedCategories />
        <ProductsSection />
        <WhyChooseUs />
        <ProjectsSection />
        <BrandsShowcase />
        <TestimonialsSection />
        <BlogSection />
        <NewsletterSection />
        <CTASection />
      </main>

      <Footer />
      
      {/* AI Assistant - available for all visitors */}
      <AIAssistant />
    </div>
  );
};

export default Index;

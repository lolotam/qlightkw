import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Facebook, Instagram, Mail, Phone, MapPin, Clock, ChevronUp, CreditCard, Wallet, Banknote } from 'lucide-react';
import AnimatedLogo from '@/components/AnimatedLogo';

const Footer = () => {
  const { t } = useTranslation();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-secondary text-secondary-foreground font-cairo">
      {/* Newsletter Section */}
      <div className="border-b border-border/20">
        <div className="container py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold mb-2">{t('footer.newsletter.title', 'Subscribe to Our Newsletter')}</h3>
              <p className="text-muted-foreground">{t('footer.newsletter.subtitle', 'Get the latest updates on new products and sales')}</p>
            </div>
            <div className="flex w-full md:w-auto gap-2">
              <Input
                type="email"
                placeholder={t('footer.newsletter.placeholder', 'Enter your email')}
                className="w-full md:w-64 bg-background/10 border-border/20"
              />
              <Button>{t('footer.newsletter.button', 'Subscribe')}</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <div className="mb-4">
              <AnimatedLogo className="brightness-0 invert dark:brightness-100 dark:invert-0" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {t('footer.about.description', 'Quality Light is your trusted partner for premium lighting solutions in Kuwait. We offer a wide range of indoor, outdoor, and decorative lighting products.')}
            </p>
            <div className="flex gap-3">
              <a href="https://www.facebook.com/share/1AxTFahzxq" target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" className="hover:bg-primary hover:text-primary-foreground">
                  <Facebook className="h-5 w-5" />
                </Button>
              </a>
              <a href="https://www.instagram.com/quality_light1" target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" className="hover:bg-primary hover:text-primary-foreground">
                  <Instagram className="h-5 w-5" />
                </Button>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">{t('footer.quickLinks.title', 'Quick Links')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/shop" className="hover:text-primary transition-colors">
                  {t('nav.products', 'Products')}
                </Link>
              </li>
              <li>
                <Link to="/projects" className="hover:text-primary transition-colors">
                  {t('nav.projects', 'Projects')}
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-primary transition-colors">
                  {t('nav.about', 'About Us')}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-primary transition-colors">
                  {t('nav.contact', 'Contact')}
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-primary transition-colors">
                  {t('nav.blog', 'Blog')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-semibold mb-4">{t('footer.customerService.title', 'Customer Service')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/shipping" className="hover:text-primary transition-colors">
                  {t('footer.customerService.shipping', 'Shipping Info')}
                </Link>
              </li>
              <li>
                <Link to="/returns" className="hover:text-primary transition-colors">
                  {t('footer.customerService.returns', 'Returns & Refunds')}
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-primary transition-colors">
                  {t('footer.customerService.faq', 'FAQ')}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-primary transition-colors">
                  {t('footer.customerService.terms', 'Terms & Conditions')}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-primary transition-colors">
                  {t('footer.customerService.privacy', 'Privacy Policy')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">{t('footer.contact.title', 'Contact Us')}</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 shrink-0 text-primary" />
                <span>{t('footer.contact.address', 'Hawally - Tunis St - In front of Rihab Complex')}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 shrink-0 text-primary" />
                <span dir="ltr">+965 51111725</span>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="h-5 w-5 shrink-0 text-primary" />
                <div className="flex flex-col">
                  <span>info@qlightkw.com</span>
                  <span>sales@qlightkw.com</span>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <Clock className="h-5 w-5 shrink-0 text-primary" />
                <span>{t('footer.contact.hours', 'Sat-Thu: 9AM - 9PM')}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Payment Methods & Copyright */}
      <div className="border-t border-border/20">
        <div className="container py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {t('footer.copyright', '© {{year}} Quality Light. All rights reserved.', { year: new Date().getFullYear() })}
            </p>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{t('footer.paymentMethods', 'Payment Methods:')}</span>
              <div className="flex gap-3">
                {/* K-Net */}
                <motion.div
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-br from-[#00529B] to-[#0073B1] rounded-lg px-3 py-2 flex items-center gap-2 cursor-pointer shadow-md hover:shadow-lg transition-shadow"
                >
                  <motion.div
                    animate={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <Wallet className="h-4 w-4 text-white" />
                  </motion.div>
                  <span className="text-xs font-bold text-white">K-Net</span>
                </motion.div>

                {/* Visa */}
                <motion.div
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-br from-[#1A1F71] to-[#2E3192] rounded-lg px-3 py-2 flex items-center gap-2 cursor-pointer shadow-md hover:shadow-lg transition-shadow"
                >
                  <motion.div
                    animate={{ x: [0, 2, -2, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 4 }}
                  >
                    <CreditCard className="h-4 w-4 text-white" />
                  </motion.div>
                  <span className="text-xs font-bold text-white tracking-wider">VISA</span>
                </motion.div>

                {/* Mastercard */}
                <motion.div
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-br from-[#EB001B] via-[#F79E1B] to-[#FF5F00] rounded-lg px-3 py-2 flex items-center gap-2 cursor-pointer shadow-md hover:shadow-lg transition-shadow"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <div className="flex -space-x-1">
                      <div className="w-3 h-3 rounded-full bg-red-600 opacity-90" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500 opacity-90" />
                    </div>
                  </motion.div>
                  <span className="text-xs font-bold text-white">MC</span>
                </motion.div>

                {/* Cash on Delivery */}
                <motion.div
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg px-3 py-2 flex items-center gap-2 cursor-pointer shadow-md hover:shadow-lg transition-shadow"
                >
                  <motion.div
                    animate={{ y: [0, -2, 0] }}
                    transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                  >
                    <Banknote className="h-4 w-4 text-white" />
                  </motion.div>
                  <span className="text-xs font-bold text-white">COD</span>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      <Button
        variant="default"
        size="icon"
        className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg"
        onClick={scrollToTop}
      >
        <ChevronUp className="h-5 w-5" />
      </Button>
    </footer>
  );
};

export default Footer;

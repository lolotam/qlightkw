import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import StorefrontLayout from '@/layouts/StorefrontLayout';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Search, HelpCircle, Package, Truck, CreditCard, RefreshCw, Phone, Mail } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

interface FAQ {
  id: string;
  question_en: string;
  question_ar: string | null;
  answer_en: string;
  answer_ar: string | null;
  category: string | null;
  sort_order: number | null;
}

const FAQPage = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch FAQs from Supabase
  const { data: faqs = [] } = useQuery({
    queryKey: ['faqs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as FAQ[];
    },
  });

  // Demo FAQs if none exist
  const demoFaqs: FAQ[] = [
    // Ordering
    { id: '1', category: 'ordering', sort_order: 1,
      question_en: 'How do I place an order?',
      question_ar: 'كيف أقوم بطلب منتج؟',
      answer_en: 'Simply browse our products, add items to your cart, and proceed to checkout. You can pay using K-Net, credit card, or cash on delivery.',
      answer_ar: 'قم بتصفح منتجاتنا، أضف العناصر إلى سلة التسوق، ثم انتقل إلى صفحة الدفع. يمكنك الدفع باستخدام K-Net أو بطاقة الائتمان أو الدفع عند الاستلام.' },
    { id: '2', category: 'ordering', sort_order: 2,
      question_en: 'Can I modify or cancel my order?',
      question_ar: 'هل يمكنني تعديل أو إلغاء طلبي؟',
      answer_en: 'You can modify or cancel your order within 2 hours of placing it. After that, please contact our customer service team.',
      answer_ar: 'يمكنك تعديل أو إلغاء طلبك خلال ساعتين من تقديمه. بعد ذلك، يرجى التواصل مع فريق خدمة العملاء.' },
    // Shipping
    { id: '3', category: 'shipping', sort_order: 3,
      question_en: 'What are the delivery times?',
      question_ar: 'ما هي مواعيد التوصيل؟',
      answer_en: 'Standard delivery within Kuwait takes 2-5 business days. Express delivery is available for next-day delivery in Kuwait City area.',
      answer_ar: 'التوصيل القياسي داخل الكويت يستغرق 2-5 أيام عمل. التوصيل السريع متاح للتسليم في اليوم التالي في منطقة مدينة الكويت.' },
    { id: '4', category: 'shipping', sort_order: 4,
      question_en: 'Do you offer international shipping?',
      question_ar: 'هل تقدمون الشحن الدولي؟',
      answer_en: 'Yes, we ship to GCC countries. International shipping rates and times vary by destination. Contact us for specific details.',
      answer_ar: 'نعم، نقوم بالشحن إلى دول مجلس التعاون الخليجي. تختلف أسعار ومواعيد الشحن الدولي حسب الوجهة. تواصل معنا للحصول على تفاصيل محددة.' },
    // Payment
    { id: '5', category: 'payment', sort_order: 5,
      question_en: 'What payment methods do you accept?',
      question_ar: 'ما هي طرق الدفع المقبولة؟',
      answer_en: 'We accept K-Net, Visa, Mastercard, and Cash on Delivery. All online payments are processed securely.',
      answer_ar: 'نقبل K-Net و Visa و Mastercard والدفع عند الاستلام. تتم معالجة جميع المدفوعات الإلكترونية بشكل آمن.' },
    // Returns
    { id: '6', category: 'returns', sort_order: 6,
      question_en: 'What is your return policy?',
      question_ar: 'ما هي سياسة الإرجاع لديكم؟',
      answer_en: 'You can return unused products in original condition within 14 days of purchase. Refunds are processed within 7-14 business days.',
      answer_ar: 'يمكنك إرجاع المنتجات غير المستخدمة في حالتها الأصلية خلال 14 يوماً من الشراء. تتم معالجة المبالغ المستردة خلال 7-14 يوم عمل.' },
    // Products
    { id: '7', category: 'products', sort_order: 7,
      question_en: 'Do you offer installation services?',
      question_ar: 'هل تقدمون خدمات التركيب؟',
      answer_en: 'Yes, we offer professional installation services for all our lighting products. Installation fees vary based on the complexity of the work.',
      answer_ar: 'نعم، نقدم خدمات تركيب احترافية لجميع منتجات الإضاءة لدينا. تختلف رسوم التركيب بناءً على تعقيد العمل.' },
    { id: '8', category: 'products', sort_order: 8,
      question_en: 'What warranty do your products have?',
      question_ar: 'ما هي ضمانات منتجاتكم؟',
      answer_en: 'Most of our products come with a manufacturer warranty of 1-3 years. LED products typically have longer warranties due to their durability.',
      answer_ar: 'معظم منتجاتنا تأتي مع ضمان الشركة المصنعة من 1-3 سنوات. عادةً ما تحظى منتجات LED بضمانات أطول نظراً لمتانتها.' },
  ];

  const displayFaqs = faqs.length > 0 ? faqs : demoFaqs;

  const categories = [
    { id: 'ordering', icon: Package, label: isRTL ? 'الطلبات' : 'Ordering' },
    { id: 'shipping', icon: Truck, label: isRTL ? 'الشحن' : 'Shipping' },
    { id: 'payment', icon: CreditCard, label: isRTL ? 'الدفع' : 'Payment' },
    { id: 'returns', icon: RefreshCw, label: isRTL ? 'الإرجاع' : 'Returns' },
    { id: 'products', icon: HelpCircle, label: isRTL ? 'المنتجات' : 'Products' },
  ];

  // Filter FAQs
  const filteredFaqs = displayFaqs.filter((faq) => {
    const matchesSearch = searchQuery === '' || 
      faq.question_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (faq.question_ar && faq.question_ar.includes(searchQuery)) ||
      (faq.answer_ar && faq.answer_ar.includes(searchQuery));
    
    const matchesCategory = selectedCategory === null || faq.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Group FAQs by category
  const groupedFaqs = filteredFaqs.reduce((acc, faq) => {
    const cat = faq.category || 'general';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(faq);
    return acc;
  }, {} as Record<string, FAQ[]>);

  return (
    <StorefrontLayout>
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary/10 via-background to-muted">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <HelpCircle className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {isRTL ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              {isRTL 
                ? 'ابحث عن إجابات للأسئلة الأكثر شيوعاً حول خدماتنا ومنتجاتنا'
                : 'Find answers to the most common questions about our services and products'
              }
            </p>

            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute start-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder={isRTL ? 'ابحث في الأسئلة...' : 'Search questions...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-12 h-12 text-base"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 border-b">
        <div className="container">
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(null)}
              size="sm"
            >
              {isRTL ? 'الكل' : 'All'}
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(cat.id)}
                size="sm"
                className="gap-2"
              >
                <cat.icon className="h-4 w-4" />
                {cat.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-12 md:py-16">
        <div className="container max-w-4xl">
          {Object.keys(groupedFaqs).length > 0 ? (
            Object.entries(groupedFaqs).map(([category, categoryFaqs]) => {
              const categoryInfo = categories.find(c => c.id === category);
              const CategoryIcon = categoryInfo?.icon || HelpCircle;
              
              return (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="mb-8"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <CategoryIcon className="h-5 w-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold">
                      {categoryInfo?.label || (isRTL ? 'عام' : 'General')}
                    </h2>
                  </div>
                  
                  <Accordion type="single" collapsible className="space-y-2">
                    {categoryFaqs.map((faq, index) => (
                      <AccordionItem 
                        key={faq.id} 
                        value={faq.id}
                        className="border rounded-lg px-4 bg-card"
                      >
                        <AccordionTrigger className="text-start hover:no-underline py-4">
                          <span className="font-medium">
                            {isRTL ? faq.question_ar || faq.question_en : faq.question_en}
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground pb-4">
                          {isRTL ? faq.answer_ar || faq.answer_en : faq.answer_en}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </motion.div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <HelpCircle className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {isRTL ? 'لم يتم العثور على نتائج' : 'No results found'}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="py-12 bg-muted/30">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-4">
                  {isRTL ? 'لا تزال لديك أسئلة؟' : 'Still Have Questions?'}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {isRTL 
                    ? 'فريق خدمة العملاء لدينا جاهز لمساعدتك'
                    : 'Our customer service team is ready to help you'
                  }
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild>
                    <Link to="/contact" className="gap-2">
                      <Mail className="h-4 w-4" />
                      {isRTL ? 'تواصل معنا' : 'Contact Us'}
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="tel:+96522223333" className="gap-2">
                      <Phone className="h-4 w-4" />
                      +965 2222 3333
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </StorefrontLayout>
  );
};

export default FAQPage;

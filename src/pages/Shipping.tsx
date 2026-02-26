import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import StorefrontLayout from '@/layouts/StorefrontLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Truck, Clock, MapPin, Package, Shield, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

const Shipping = () => {
  const { i18n, t } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const deliveryOptions = isRTL ? [
    { icon: Truck, title: 'التوصيل القياسي', time: '3-5 أيام عمل', price: '2.000 د.ك', description: 'توصيل لجميع مناطق الكويت' },
    { icon: Clock, title: 'التوصيل السريع', time: '1-2 يوم عمل', price: '5.000 د.ك', description: 'توصيل سريع لمنطقة العاصمة' },
    { icon: Package, title: 'توصيل مجاني', time: '3-5 أيام عمل', price: 'مجاني', description: 'للطلبات فوق 50 د.ك' },
  ] : [
    { icon: Truck, title: 'Standard Delivery', time: '3-5 business days', price: '2.000 KWD', description: 'Delivery to all areas in Kuwait' },
    { icon: Clock, title: 'Express Delivery', time: '1-2 business days', price: '5.000 KWD', description: 'Fast delivery to Capital area' },
    { icon: Package, title: 'Free Shipping', time: '3-5 business days', price: 'Free', description: 'For orders above 50 KWD' },
  ];

  const policies = isRTL ? [
    { icon: MapPin, title: 'مناطق التوصيل', items: ['جميع مناطق الكويت', 'مناطق نائية قد تستغرق وقتاً إضافياً', 'لا نوفر الشحن الدولي حالياً'] },
    { icon: Shield, title: 'ضمان التوصيل', items: ['تتبع الشحنة عبر الرسائل النصية', 'تعويض في حالة التلف أثناء الشحن', 'إعادة التوصيل مجاناً في حالة عدم التواجد'] },
    { icon: Phone, title: 'الدعم', items: ['خدمة عملاء على مدار الساعة', 'تتبع الطلب عبر الموقع', 'إشعارات بالبريد الإلكتروني'] },
  ] : [
    { icon: MapPin, title: 'Delivery Areas', items: ['All areas within Kuwait', 'Remote areas may require additional time', 'International shipping not available currently'] },
    { icon: Shield, title: 'Delivery Guarantee', items: ['Track your shipment via SMS', 'Compensation for damage during shipping', 'Free re-delivery if not available'] },
    { icon: Phone, title: 'Support', items: ['24/7 customer service', 'Order tracking via website', 'Email notifications'] },
  ];

  return (
    <StorefrontLayout>
      <div className="bg-muted/30 py-8">
        <div className="container">
          <nav className="text-sm text-muted-foreground mb-4">
            <Link to="/" className="hover:text-primary transition-colors">{t('nav.home', 'Home')}</Link>
            <span className="mx-2">/</span>
            <span>{isRTL ? 'معلومات الشحن' : 'Shipping Info'}</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold">
            {isRTL ? 'معلومات الشحن والتوصيل' : 'Shipping & Delivery'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isRTL ? 'كل ما تحتاج معرفته عن خيارات التوصيل' : 'Everything you need to know about our delivery options'}
          </p>
        </div>
      </div>

      <div className="container py-12 space-y-12">
        {/* Delivery Options */}
        <section>
          <h2 className="text-2xl font-bold mb-6">{isRTL ? 'خيارات التوصيل' : 'Delivery Options'}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {deliveryOptions.map((option, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full">
                  <CardContent className="p-6 text-center space-y-3">
                    <option.icon className="h-10 w-10 mx-auto text-primary" />
                    <h3 className="font-semibold text-lg">{option.title}</h3>
                    <p className="text-2xl font-bold text-primary">{option.price}</p>
                    <p className="text-sm text-muted-foreground">{option.time}</p>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Policies */}
        <section>
          <h2 className="text-2xl font-bold mb-6">{isRTL ? 'سياسات الشحن' : 'Shipping Policies'}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {policies.map((policy, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <policy.icon className="h-6 w-6 text-primary" />
                      <h3 className="font-semibold">{policy.title}</h3>
                    </div>
                    <ul className="space-y-2">
                      {policy.items.map((item, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </StorefrontLayout>
  );
};

export default Shipping;

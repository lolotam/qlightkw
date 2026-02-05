import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import StorefrontLayout from '@/layouts/StorefrontLayout';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, Clock, Package, RefreshCw, AlertCircle } from 'lucide-react';

const Returns = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const eligibleItems = isRTL ? [
    'المنتجات غير المستخدمة وفي حالتها الأصلية',
    'المنتجات مع جميع الملصقات والتغليف الأصلي',
    'المنتجات المشتراة خلال 14 يوماً',
    'المنتجات التي تحتوي على عيب في التصنيع',
  ] : [
    'Unused products in original condition',
    'Products with all tags and original packaging',
    'Products purchased within 14 days',
    'Products with manufacturing defects',
  ];

  const nonEligibleItems = isRTL ? [
    'المنتجات المستخدمة أو المركبة',
    'المنتجات المصنوعة حسب الطلب',
    'المصابيح والأنابيب الكهربائية',
    'المنتجات التي تم شراؤها بسعر التصفية',
    'المنتجات بدون الإيصال الأصلي',
  ] : [
    'Used or installed products',
    'Custom-made products',
    'Light bulbs and electrical tubes',
    'Products purchased at clearance prices',
    'Products without original receipt',
  ];

  const steps = isRTL ? [
    { icon: Package, title: 'تواصل معنا', description: 'اتصل بخدمة العملاء أو أرسل بريداً إلكترونياً مع تفاصيل الطلب' },
    { icon: CheckCircle, title: 'الحصول على الموافقة', description: 'سنراجع طلبك ونرسل رقم تفويض الإرجاع' },
    { icon: RefreshCw, title: 'إرجاع المنتج', description: 'أرسل المنتج إلينا أو قم بتسليمه في أقرب فرع' },
    { icon: Clock, title: 'استرداد المبلغ', description: 'سيتم استرداد المبلغ خلال 7-14 يوم عمل' },
  ] : [
    { icon: Package, title: 'Contact Us', description: 'Call customer service or email us with order details' },
    { icon: CheckCircle, title: 'Get Approval', description: 'We will review your request and send a return authorization number' },
    { icon: RefreshCw, title: 'Return Product', description: 'Ship the product to us or drop it off at the nearest branch' },
    { icon: Clock, title: 'Receive Refund', description: 'Refund will be processed within 7-14 business days' },
  ];

  return (
    <StorefrontLayout>
      <section className="py-12 md:py-20">
        <div className="container max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">
              {isRTL ? 'سياسة الإرجاع والاستبدال' : 'Returns & Refunds Policy'}
            </h1>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              {isRTL 
                ? 'رضاكم هو أولويتنا. إذا لم تكن راضياً عن مشترياتك، نحن هنا للمساعدة'
                : 'Your satisfaction is our priority. If you\'re not happy with your purchase, we\'re here to help'
              }
            </p>

            {/* Return Process Steps */}
            <div className="grid md:grid-cols-4 gap-4 mb-12">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full text-center">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <step.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        {isRTL ? `الخطوة ${index + 1}` : `Step ${index + 1}`}
                      </div>
                      <h3 className="font-semibold mb-2">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Eligible & Non-Eligible Items */}
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border-green-500/20 bg-green-500/5">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold text-green-600">
                        {isRTL ? 'منتجات يمكن إرجاعها' : 'Eligible for Return'}
                      </h3>
                    </div>
                    <ul className="space-y-2">
                      {eligibleItems.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border-red-500/20 bg-red-500/5">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <h3 className="font-semibold text-red-600">
                        {isRTL ? 'منتجات لا يمكن إرجاعها' : 'Not Eligible for Return'}
                      </h3>
                    </div>
                    <ul className="space-y-2">
                      {nonEligibleItems.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Detailed Policy */}
            <Card>
              <CardContent className="p-6 md:p-8 space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-3">
                    {isRTL ? 'فترة الإرجاع' : 'Return Period'}
                  </h2>
                  <p className="text-muted-foreground">
                    {isRTL 
                      ? 'يمكنك إرجاع المنتجات خلال 14 يوماً من تاريخ الاستلام. يجب أن تكون المنتجات في حالتها الأصلية مع جميع الملحقات والتغليف.'
                      : 'You can return products within 14 days of receipt. Products must be in original condition with all accessories and packaging.'
                    }
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-3">
                    {isRTL ? 'طريقة الاسترداد' : 'Refund Method'}
                  </h2>
                  <p className="text-muted-foreground">
                    {isRTL 
                      ? 'سيتم استرداد المبلغ بنفس طريقة الدفع الأصلية. في حالة الدفع النقدي، يمكن استرداد المبلغ نقداً أو كرصيد في حسابك.'
                      : 'Refunds will be processed using the original payment method. For cash payments, refunds can be issued in cash or as store credit.'
                    }
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-3">
                    {isRTL ? 'المنتجات التالفة' : 'Damaged Products'}
                  </h2>
                  <p className="text-muted-foreground">
                    {isRTL 
                      ? 'إذا استلمت منتجاً تالفاً، يرجى التواصل معنا خلال 48 ساعة من الاستلام مع صور توضح التلف. سنقوم باستبدال المنتج أو استرداد المبلغ كاملاً.'
                      : 'If you receive a damaged product, please contact us within 48 hours of receipt with photos showing the damage. We will replace the product or issue a full refund.'
                    }
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-3">
                    {isRTL ? 'الاستبدال' : 'Exchanges'}
                  </h2>
                  <p className="text-muted-foreground">
                    {isRTL 
                      ? 'نقدم خدمة الاستبدال مجاناً للمنتجات المؤهلة. يمكنك استبدال المنتج بآخر بنفس القيمة أو بقيمة أعلى مع دفع الفرق.'
                      : 'We offer free exchanges for eligible products. You can exchange for a product of equal or greater value by paying the difference.'
                    }
                  </p>
                </div>

                <div className="p-4 bg-muted rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium mb-1">
                      {isRTL ? 'ملاحظة مهمة' : 'Important Note'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {isRTL 
                        ? 'رسوم الشحن الأصلية غير قابلة للاسترداد. في حالة الإرجاع بسبب تغيير الرأي، يتحمل العميل تكلفة شحن الإرجاع.'
                        : 'Original shipping fees are non-refundable. For returns due to change of mind, the customer is responsible for return shipping costs.'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </StorefrontLayout>
  );
};

export default Returns;

import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import StorefrontLayout from '@/layouts/StorefrontLayout';
import { Card, CardContent } from '@/components/ui/card';

const Terms = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const sections = isRTL ? [
    {
      title: 'قبول الشروط',
      content: 'باستخدام موقع كواليتي لايت، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي من هذه الشروط، يرجى عدم استخدام موقعنا.',
    },
    {
      title: 'استخدام الموقع',
      content: `يجب استخدام موقعنا للأغراض المشروعة فقط. يُحظر:
• استخدام الموقع لأي غرض غير قانوني
• محاولة الوصول غير المصرح به إلى أنظمتنا
• نقل أي فيروسات أو برامج ضارة
• جمع معلومات المستخدمين الآخرين`,
    },
    {
      title: 'الحسابات',
      content: 'عند إنشاء حساب، أنت مسؤول عن الحفاظ على سرية معلومات تسجيل الدخول الخاصة بك وعن جميع الأنشطة التي تتم تحت حسابك.',
    },
    {
      title: 'الطلبات والمدفوعات',
      content: `• جميع الأسعار معروضة بالدينار الكويتي وتشمل ضريبة القيمة المضافة حيثما ينطبق
• نحتفظ بالحق في رفض أو إلغاء أي طلب لأي سبب
• يتم تأكيد الطلب فقط عند إتمام عملية الدفع بنجاح
• نقبل طرق الدفع المحددة على موقعنا فقط`,
    },
    {
      title: 'الشحن والتوصيل',
      content: `• نسعى لتسليم الطلبات خلال المواعيد المحددة، لكننا لا نضمن أوقات التسليم
• أنت مسؤول عن تقديم عنوان توصيل صحيح ودقيق
• رسوم الشحن غير قابلة للاسترداد
• يجب فحص الطلب عند الاستلام والإبلاغ عن أي تلف فوراً`,
    },
    {
      title: 'المنتجات والضمان',
      content: `• نسعى لعرض معلومات دقيقة عن المنتجات، لكن قد تختلف الألوان والأبعاد قليلاً
• تخضع المنتجات للضمان حسب شروط الشركة المصنعة
• لا يشمل الضمان الأضرار الناتجة عن سوء الاستخدام أو التركيب غير الصحيح`,
    },
    {
      title: 'حقوق الملكية الفكرية',
      content: 'جميع المحتويات على هذا الموقع، بما في ذلك النصوص والصور والشعارات، هي ملك لكواليتي لايت ومحمية بموجب قوانين حقوق النشر.',
    },
    {
      title: 'تحديد المسؤولية',
      content: 'لا تتحمل كواليتي لايت المسؤولية عن أي أضرار مباشرة أو غير مباشرة ناتجة عن استخدام موقعنا أو منتجاتنا بما يتجاوز قيمة المنتج المشترى.',
    },
    {
      title: 'التعديلات',
      content: 'نحتفظ بالحق في تعديل هذه الشروط في أي وقت. ستكون التعديلات سارية فور نشرها على الموقع.',
    },
    {
      title: 'القانون المعمول به',
      content: 'تخضع هذه الشروط للقوانين المعمول بها في دولة الكويت، وتختص المحاكم الكويتية بالفصل في أي نزاع ينشأ عنها.',
    },
  ] : [
    {
      title: 'Acceptance of Terms',
      content: 'By using the Quality Light website, you agree to be bound by these Terms and Conditions. If you do not agree to any of these terms, please do not use our website.',
    },
    {
      title: 'Use of Website',
      content: `Our website must be used for lawful purposes only. It is prohibited to:
• Use the website for any illegal purpose
• Attempt unauthorized access to our systems
• Transmit any viruses or malicious software
• Collect information from other users`,
    },
    {
      title: 'Accounts',
      content: 'When creating an account, you are responsible for maintaining the confidentiality of your login information and for all activities that occur under your account.',
    },
    {
      title: 'Orders and Payments',
      content: `• All prices are displayed in Kuwaiti Dinars and include VAT where applicable
• We reserve the right to refuse or cancel any order for any reason
• Orders are confirmed only upon successful payment completion
• We accept only the payment methods specified on our website`,
    },
    {
      title: 'Shipping and Delivery',
      content: `• We strive to deliver orders within the specified times, but we do not guarantee delivery times
• You are responsible for providing a correct and accurate delivery address
• Shipping fees are non-refundable
• Orders must be inspected upon receipt and any damage reported immediately`,
    },
    {
      title: 'Products and Warranty',
      content: `• We strive to display accurate product information, but colors and dimensions may vary slightly
• Products are subject to warranty according to manufacturer terms
• Warranty does not cover damage resulting from misuse or improper installation`,
    },
    {
      title: 'Intellectual Property Rights',
      content: 'All content on this website, including text, images, and logos, is the property of Quality Light and is protected by copyright laws.',
    },
    {
      title: 'Limitation of Liability',
      content: 'Quality Light shall not be liable for any direct or indirect damages resulting from the use of our website or products beyond the value of the purchased product.',
    },
    {
      title: 'Modifications',
      content: 'We reserve the right to modify these terms at any time. Modifications will be effective immediately upon posting on the website.',
    },
    {
      title: 'Governing Law',
      content: 'These terms are governed by the laws applicable in the State of Kuwait, and Kuwaiti courts have jurisdiction to settle any disputes arising therefrom.',
    },
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
              {isRTL ? 'الشروط والأحكام' : 'Terms & Conditions'}
            </h1>
            <p className="text-center text-muted-foreground mb-8">
              {isRTL ? 'آخر تحديث: يناير 2024' : 'Last updated: January 2024'}
            </p>

            <Card>
              <CardContent className="p-6 md:p-8 space-y-8">
                {sections.map((section, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <h2 className="text-xl font-semibold mb-3">{section.title}</h2>
                    <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                      {section.content}
                    </p>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </StorefrontLayout>
  );
};

export default Terms;

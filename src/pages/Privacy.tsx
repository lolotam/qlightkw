import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import StorefrontLayout from '@/layouts/StorefrontLayout';
import { Card, CardContent } from '@/components/ui/card';

const Privacy = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const sections = isRTL ? [
    {
      title: 'المقدمة',
      content: 'نحن في كواليتي لايت نلتزم بحماية خصوصيتك. توضح سياسة الخصوصية هذه كيفية جمع واستخدام وحماية معلوماتك الشخصية عند استخدام موقعنا الإلكتروني وخدماتنا.',
    },
    {
      title: 'المعلومات التي نجمعها',
      content: `نقوم بجمع المعلومات التالية:
• المعلومات الشخصية: الاسم، البريد الإلكتروني، رقم الهاتف، العنوان
• معلومات الحساب: بيانات تسجيل الدخول وتفضيلات الحساب
• معلومات الطلبات: تفاصيل المشتريات وتاريخ الطلبات
• معلومات التصفح: عنوان IP، نوع المتصفح، الصفحات التي تزورها`,
    },
    {
      title: 'كيف نستخدم معلوماتك',
      content: `نستخدم معلوماتك للأغراض التالية:
• معالجة طلباتك وإدارة حسابك
• التواصل معك بشأن طلباتك وخدماتنا
• تحسين موقعنا وتجربة التسوق
• إرسال العروض الترويجية (بموافقتك)
• الامتثال للمتطلبات القانونية`,
    },
    {
      title: 'حماية المعلومات',
      content: 'نتخذ إجراءات أمنية مناسبة لحماية معلوماتك من الوصول غير المصرح به أو التغيير أو الإفصاح أو الإتلاف. نستخدم تشفير SSL لحماية البيانات المنقولة.',
    },
    {
      title: 'مشاركة المعلومات',
      content: 'لا نبيع أو نتاجر بمعلوماتك الشخصية. قد نشارك معلوماتك مع شركات التوصيل ومعالجي الدفع الموثوقين لإتمام طلباتك.',
    },
    {
      title: 'حقوقك',
      content: `لديك الحق في:
• الوصول إلى معلوماتك الشخصية
• تصحيح المعلومات غير الدقيقة
• طلب حذف معلوماتك
• الانسحاب من الرسائل التسويقية`,
    },
    {
      title: 'ملفات تعريف الارتباط',
      content: 'نستخدم ملفات تعريف الارتباط لتحسين تجربتك على موقعنا. يمكنك التحكم في إعدادات ملفات تعريف الارتباط من خلال متصفحك.',
    },
    {
      title: 'التواصل معنا',
      content: 'إذا كانت لديك أي أسئلة حول سياسة الخصوصية، يرجى التواصل معنا عبر البريد الإلكتروني: privacy@qualitylight.kw',
    },
  ] : [
    {
      title: 'Introduction',
      content: 'At Quality Light, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and protect your personal information when you use our website and services.',
    },
    {
      title: 'Information We Collect',
      content: `We collect the following information:
• Personal Information: Name, email, phone number, address
• Account Information: Login credentials and account preferences
• Order Information: Purchase details and order history
• Browsing Information: IP address, browser type, pages you visit`,
    },
    {
      title: 'How We Use Your Information',
      content: `We use your information for the following purposes:
• Processing your orders and managing your account
• Communicating with you about your orders and our services
• Improving our website and shopping experience
• Sending promotional offers (with your consent)
• Complying with legal requirements`,
    },
    {
      title: 'Information Protection',
      content: 'We take appropriate security measures to protect your information from unauthorized access, alteration, disclosure, or destruction. We use SSL encryption to protect data in transit.',
    },
    {
      title: 'Information Sharing',
      content: 'We do not sell or trade your personal information. We may share your information with trusted delivery companies and payment processors to complete your orders.',
    },
    {
      title: 'Your Rights',
      content: `You have the right to:
• Access your personal information
• Correct inaccurate information
• Request deletion of your information
• Opt-out of marketing communications`,
    },
    {
      title: 'Cookies',
      content: 'We use cookies to enhance your experience on our website. You can control cookie settings through your browser.',
    },
    {
      title: 'Contact Us',
      content: 'If you have any questions about our Privacy Policy, please contact us at: privacy@qualitylight.kw',
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
              {isRTL ? 'سياسة الخصوصية' : 'Privacy Policy'}
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

export default Privacy;

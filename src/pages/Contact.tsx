import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import StorefrontLayout from '@/layouts/StorefrontLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Phone, Mail, Clock, Send, Building, MessageSquare } from 'lucide-react';

// Form validation schema
const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address').max(255),
  phone: z.string().min(8, 'Phone number must be at least 8 digits').max(20).optional().or(z.literal('')),
  subject: z.string().min(1, 'Please select a subject'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(1000),
});

type ContactFormData = z.infer<typeof contactSchema>;

const Contact = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const subjects = [
    { value: 'general', label: isRTL ? 'استفسار عام' : 'General Inquiry' },
    { value: 'product', label: isRTL ? 'استفسار عن المنتجات' : 'Product Inquiry' },
    { value: 'project', label: isRTL ? 'طلب مشروع' : 'Project Request' },
    { value: 'support', label: isRTL ? 'الدعم الفني' : 'Technical Support' },
    { value: 'partnership', label: isRTL ? 'شراكة تجارية' : 'Business Partnership' },
  ];

  const contactInfo = [
    {
      icon: MapPin,
      title: isRTL ? 'العنوان' : 'Address',
      details: [
        isRTL ? 'حولي - شارع تونس - مقابل مجمع الرحاب' : 'Hawally - Tunis St - In front of Rihab Complex',
        isRTL ? 'الكويت' : 'Kuwait',
      ],
    },
    {
      icon: Phone,
      title: isRTL ? 'الهاتف' : 'Phone',
      details: ['+965 51111725'],
    },
    {
      icon: Mail,
      title: isRTL ? 'البريد الإلكتروني' : 'Email',
      details: ['info@qlightkw.com', 'sales@qlightkw.com'],
    },
    {
      icon: Clock,
      title: isRTL ? 'ساعات العمل' : 'Working Hours',
      details: [
        isRTL ? 'السبت - الخميس: 9 ص - 9 م' : 'Sat - Thu: 9 AM - 9 PM',
        isRTL ? 'الجمعة: مغلق' : 'Friday: Closed',
      ],
    },
  ];

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: isRTL ? 'تم إرسال رسالتك' : 'Message Sent',
      description: isRTL 
        ? 'سنتواصل معك في أقرب وقت ممكن'
        : 'We will get back to you as soon as possible',
    });
    
    reset();
    setIsSubmitting(false);
  };

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
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {isRTL ? 'تواصل معنا' : 'Contact Us'}
            </h1>
            <p className="text-lg text-muted-foreground">
              {isRTL 
                ? 'نحن هنا لمساعدتك. تواصل معنا لأي استفسار أو طلب'
                : 'We\'re here to help. Reach out to us for any inquiries or requests'
              }
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-12 -mt-8">
        <div className="container">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {contactInfo.map((info, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <info.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{info.title}</h3>
                    {info.details.map((detail, idx) => (
                      <p key={idx} className="text-sm text-muted-foreground" dir={detail.startsWith('+') ? 'ltr' : undefined}>
                        {detail}
                      </p>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 md:py-16">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: isRTL ? 30 : -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    {isRTL ? 'أرسل لنا رسالة' : 'Send Us a Message'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">{isRTL ? 'الاسم' : 'Name'} *</Label>
                        <Input
                          id="name"
                          {...register('name')}
                          placeholder={isRTL ? 'اسمك الكامل' : 'Your full name'}
                        />
                        {errors.name && (
                          <p className="text-sm text-destructive">{errors.name.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">{isRTL ? 'البريد الإلكتروني' : 'Email'} *</Label>
                        <Input
                          id="email"
                          type="email"
                          {...register('email')}
                          placeholder={isRTL ? 'بريدك الإلكتروني' : 'Your email address'}
                        />
                        {errors.email && (
                          <p className="text-sm text-destructive">{errors.email.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">{isRTL ? 'رقم الهاتف' : 'Phone'}</Label>
                        <Input
                          id="phone"
                          type="tel"
                          {...register('phone')}
                          placeholder="+965 XXXX XXXX"
                          dir="ltr"
                        />
                        {errors.phone && (
                          <p className="text-sm text-destructive">{errors.phone.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>{isRTL ? 'الموضوع' : 'Subject'} *</Label>
                        <Select onValueChange={(value) => setValue('subject', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder={isRTL ? 'اختر الموضوع' : 'Select subject'} />
                          </SelectTrigger>
                          <SelectContent>
                            {subjects.map((subject) => (
                              <SelectItem key={subject.value} value={subject.value}>
                                {subject.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.subject && (
                          <p className="text-sm text-destructive">{errors.subject.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">{isRTL ? 'الرسالة' : 'Message'} *</Label>
                      <Textarea
                        id="message"
                        {...register('message')}
                        placeholder={isRTL ? 'اكتب رسالتك هنا...' : 'Write your message here...'}
                        rows={5}
                      />
                      {errors.message && (
                        <p className="text-sm text-destructive">{errors.message.message}</p>
                      )}
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          {isRTL ? 'جاري الإرسال...' : 'Sending...'}
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Send className="h-4 w-4" />
                          {isRTL ? 'إرسال الرسالة' : 'Send Message'}
                        </span>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            {/* Map & Additional Info */}
            <motion.div
              initial={{ opacity: 0, x: isRTL ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              {/* Google Maps Embed */}
              <Card className="overflow-hidden">
                <div className="aspect-video relative">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3477.0!2d47.9547!3d29.3375!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3fcf9d1234567890%3A0x1234567890abcdef!2sQuality%20Light!5e0!3m2!1sen!2skw!4v1706500000000!5m2!1sen!2skw&q=29.318846,47.957613"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="absolute inset-0"
                    title={isRTL ? 'موقعنا على الخريطة' : 'Our location on map'}
                  />
                </div>
              </Card>

              {/* Quick FAQ */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {isRTL ? 'أسئلة شائعة' : 'Quick FAQ'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-1">
                      {isRTL ? 'ما هي أوقات التوصيل؟' : 'What are the delivery times?'}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {isRTL 
                        ? 'التوصيل داخل الكويت خلال 2-5 أيام عمل'
                        : 'Delivery within Kuwait takes 2-5 business days'
                      }
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">
                      {isRTL ? 'هل تقدمون خدمة التركيب؟' : 'Do you offer installation services?'}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {isRTL 
                        ? 'نعم، نقدم خدمة تركيب احترافية لجميع منتجاتنا'
                        : 'Yes, we offer professional installation for all our products'
                      }
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">
                      {isRTL ? 'ما هي سياسة الإرجاع؟' : 'What is the return policy?'}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {isRTL 
                        ? 'يمكنك إرجاع المنتج خلال 14 يوم من تاريخ الشراء'
                        : 'You can return products within 14 days of purchase'
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </StorefrontLayout>
  );
};

export default Contact;

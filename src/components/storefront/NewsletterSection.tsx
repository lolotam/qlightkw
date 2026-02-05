import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, CheckCircle, Sparkles } from 'lucide-react';

const newsletterSchema = z.object({
  email: z.string().email('Please enter a valid email').max(255),
});

type NewsletterFormData = z.infer<typeof newsletterSchema>;

const NewsletterSection = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewsletterFormData>({
    resolver: zodResolver(newsletterSchema),
  });

  const onSubmit = async (data: NewsletterFormData) => {
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({
          email: data.email.toLowerCase().trim(),
          language: i18n.language,
          source: 'website',
        });

      if (error) {
        if (error.code === '23505') {
          // Duplicate email
          toast({
            title: isRTL ? 'مشترك بالفعل' : 'Already Subscribed',
            description: isRTL 
              ? 'هذا البريد الإلكتروني مسجل بالفعل في نشرتنا الإخبارية'
              : 'This email is already subscribed to our newsletter',
            variant: 'default',
          });
        } else {
          throw error;
        }
      } else {
        setIsSubscribed(true);
        toast({
          title: isRTL ? 'تم الاشتراك بنجاح!' : 'Successfully Subscribed!',
          description: isRTL 
            ? 'شكراً لاشتراكك في نشرتنا الإخبارية'
            : 'Thank you for subscribing to our newsletter',
        });
        reset();
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      toast({
        title: isRTL ? 'حدث خطأ' : 'Error',
        description: isRTL 
          ? 'حدث خطأ أثناء الاشتراك. يرجى المحاولة مرة أخرى'
          : 'An error occurred while subscribing. Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-primary/10 via-background to-secondary/10 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          className="absolute top-10 left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-10 right-20 w-80 h-80 bg-secondary/5 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
      </div>

      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6"
          >
            <Sparkles className="h-8 w-8 text-primary" />
          </motion.div>

          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {isRTL ? 'اشترك في نشرتنا الإخبارية' : 'Subscribe to Our Newsletter'}
          </h2>
          <p className="text-muted-foreground mb-8 text-lg">
            {isRTL 
              ? 'احصل على أحدث العروض والتصاميم الجديدة مباشرة في بريدك الإلكتروني'
              : 'Get the latest offers, new designs, and lighting tips delivered to your inbox'
            }
          </p>

          {isSubscribed ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center gap-3 p-6 rounded-2xl bg-green-500/10 border border-green-500/20"
            >
              <CheckCircle className="h-8 w-8 text-green-500" />
              <span className="text-lg font-medium text-green-600">
                {isRTL ? 'شكراً لاشتراكك!' : 'Thanks for subscribing!'}
              </span>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <div className="flex-1 relative">
                <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="email"
                  {...register('email')}
                  placeholder={isRTL ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
                  className="ps-10 h-12 text-base"
                  disabled={isSubmitting}
                />
              </div>
              <Button 
                type="submit" 
                size="lg" 
                className="h-12 px-8"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    {isRTL ? 'جاري...' : 'Subscribing...'}
                  </span>
                ) : (
                  isRTL ? 'اشترك' : 'Subscribe'
                )}
              </Button>
            </form>
          )}
          
          {errors.email && (
            <p className="text-sm text-destructive mt-2">{errors.email.message}</p>
          )}

          <p className="text-xs text-muted-foreground mt-4">
            {isRTL 
              ? 'نحترم خصوصيتك. يمكنك إلغاء الاشتراك في أي وقت.'
              : 'We respect your privacy. Unsubscribe at any time.'
            }
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default NewsletterSection;

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Carousel, TestimonialCard, iTestimonial } from '@/components/ui/retro-testimonial';

interface Testimonial {
  id: string;
  author_name: string;
  author_name_ar: string | null;
  author_title: string | null;
  author_title_ar: string | null;
  author_image_url: string | null;
  content_en: string;
  content_ar: string | null;
  rating: number | null;
}

const TestimonialsSection = () => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    const fetchTestimonials = async () => {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(12);

      if (!error && data) {
        setTestimonials(data);
      }
    };

    fetchTestimonials();
  }, []);

  // Demo testimonials if no data exists
  const demoTestimonials: Testimonial[] = [
    {
      id: '1',
      author_name: 'Ahmed Al-Sabah',
      author_name_ar: 'أحمد الصباح',
      author_title: 'Interior Designer',
      author_title_ar: 'مصمم داخلي',
      author_image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
      content_en: 'Quality Light has been my go-to supplier for all lighting projects. Their product range and customer service are exceptional. I have been working with them for over 5 years.',
      content_ar: 'كواليتي لايت هو المورد المفضل لجميع مشاريع الإضاءة. تشكيلة المنتجات وخدمة العملاء استثنائية.',
      rating: 5,
    },
    {
      id: '2',
      author_name: 'Sara Mohammed',
      author_name_ar: 'سارة محمد',
      author_title: 'Homeowner',
      author_title_ar: 'صاحبة منزل',
      author_image_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
      content_en: 'The chandeliers I bought transformed my living room. Fast delivery and great quality at reasonable prices. Highly recommended for anyone looking for premium lighting.',
      content_ar: 'الثريات التي اشتريتها غيرت غرفة المعيشة. توصيل سريع وجودة رائعة بأسعار معقولة.',
      rating: 5,
    },
    {
      id: '3',
      author_name: 'Khalid Al-Rashid',
      author_name_ar: 'خالد الرشيد',
      author_title: 'Business Owner',
      author_title_ar: 'صاحب أعمال',
      author_image_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
      content_en: 'Professional team that helped us choose the perfect commercial lighting for our office. They understand the importance of proper lighting in a business environment.',
      content_ar: 'فريق محترف ساعدنا في اختيار الإضاءة التجارية المثالية لمكتبنا. موصى به بشدة!',
      rating: 5,
    },
    {
      id: '4',
      author_name: 'Fatima Al-Hamad',
      author_name_ar: 'فاطمة الحمد',
      author_title: 'Architect',
      author_title_ar: 'مهندسة معمارية',
      author_image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
      content_en: 'Outstanding selection of modern lighting fixtures. The team provided excellent consultation for our villa project. Their expertise made the difference.',
      content_ar: 'مجموعة رائعة من تركيبات الإضاءة الحديثة. قدم الفريق استشارة ممتازة لمشروع فيلانا.',
      rating: 5,
    },
    {
      id: '5',
      author_name: 'Yusuf Al-Mutairi',
      author_name_ar: 'يوسف المطيري',
      author_title: 'Restaurant Owner',
      author_title_ar: 'صاحب مطعم',
      author_image_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop',
      content_en: 'The ambient lighting they installed in my restaurant created the perfect atmosphere. My customers always compliment the beautiful lighting design.',
      content_ar: 'الإضاءة المحيطة التي ركبوها في مطعمي خلقت الجو المثالي. زبائني يشيدون دائمًا بتصميم الإضاءة.',
      rating: 5,
    },
  ];

  const displayTestimonials = testimonials.length > 0 ? testimonials : demoTestimonials;

  // Convert to retro testimonial format
  const convertedTestimonials: iTestimonial[] = displayTestimonials.map((t) => ({
    name: language === 'ar' && t.author_name_ar ? t.author_name_ar : t.author_name,
    designation: language === 'ar' && t.author_title_ar ? t.author_title_ar : (t.author_title || ''),
    description: language === 'ar' && t.content_ar ? t.content_ar : t.content_en,
    profileImage: t.author_image_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
  }));

  const cards = convertedTestimonials.map((testimonial, index) => (
    <TestimonialCard
      key={displayTestimonials[index].id}
      testimonial={testimonial}
      index={index}
      onCardClose={() => {}}
      backgroundImage="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop"
    />
  ));

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/30 overflow-hidden">
      <div className="container">
        <div className="text-center mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold mb-4"
          >
            {t('home.testimonials.title', 'What Our Customers Say')}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground max-w-2xl mx-auto"
          >
            {t('home.testimonials.subtitle', 'Read testimonials from our satisfied customers across Kuwait')}
          </motion.p>
        </div>

        {/* Retro Testimonial Carousel */}
        <div className="w-full">
          <Carousel items={cards} initialScroll={0} />
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;

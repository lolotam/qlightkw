import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { resolveImageUrl } from '@/lib/image-resolver';

interface HeroSlide {
  id: string;
  title_en: string | null;
  title_ar: string | null;
  subtitle_en: string | null;
  subtitle_ar: string | null;
  button_text_en: string | null;
  button_text_ar: string | null;
  link_url: string | null;
  media_url: string;
  media_type: string;
  media_url_mobile: string | null;
  media_type_mobile: string | null;
  is_active: boolean;
  display_order: number;
}

const SLIDE_DURATION = 8000; // 8 seconds per slide

const HeroSection = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const isMobile = useIsMobile();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch slides from database
  useEffect(() => {
    const fetchSlides = async () => {
      const { data, error } = await supabase
        .from('hero_slides')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (!error && data && data.length > 0) {
        setSlides(data);
      } else {
        // Fallback slides if database is empty
        setSlides([
          {
            id: '1',
            title_en: 'Illuminate Your World',
            title_ar: 'أضئ عالمك',
            subtitle_en: 'Discover premium lighting solutions for every space',
            subtitle_ar: 'اكتشف حلول الإضاءة المتميزة لكل مساحة',
            button_text_en: 'Shop Now',
            button_text_ar: 'تسوق الآن',
            link_url: '/shop',
            media_url: '/placeholder.svg',
            media_type: 'image',
            media_url_mobile: null,
            media_type_mobile: null,
            is_active: true,
            display_order: 1,
          },
        ]);
      }
      setLoading(false);
    };

    fetchSlides();
  }, []);

  const totalSlides = slides.length;

  // Auto-advance slides infinitely
  useEffect(() => {
    if (isPaused || totalSlides <= 1) return;
    
    timerRef.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % totalSlides);
    }, SLIDE_DURATION);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPaused, totalSlides]);

  const goToSlide = useCallback((slideIndex: number) => {
    setCurrentSlide(slideIndex);
  }, []);
  
  const nextSlide = useCallback(() => {
    setCurrentSlide(prev => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlide(prev => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  if (loading || slides.length === 0) {
    return (
      <section className="relative h-screen bg-muted flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </section>
    );
  }

  const currentContent = slides[currentSlide];
  const title = isRTL ? currentContent.title_ar : currentContent.title_en;
  const subtitle = isRTL ? currentContent.subtitle_ar : currentContent.subtitle_en;
  const buttonText = isRTL ? currentContent.button_text_ar : currentContent.button_text_en;

  return (
    <section 
      className="relative h-screen overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background media with dramatic transitions */}
      <div className="absolute inset-0">
        {slides.map((slide, index) => {
          const isActive = index === currentSlide;
          const isPrev = index === (currentSlide - 1 + totalSlides) % totalSlides;
          
          // Different animation effects for each slide
          const getSlideAnimation = () => {
            const baseTransition = { duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] };
            
            switch (index % 4) {
              case 0: // Zoom & fade
                return {
                  animate: {
                    opacity: isActive ? 1 : 0,
                    scale: isActive ? 1 : 1.2,
                    filter: isActive ? 'blur(0px)' : 'blur(8px)',
                  },
                  transition: baseTransition,
                };
              case 1: // Slide from right with rotation
                return {
                  animate: {
                    opacity: isActive ? 1 : 0,
                    x: isActive ? 0 : isPrev ? -100 : 100,
                    rotateY: isActive ? 0 : isPrev ? -15 : 15,
                    scale: isActive ? 1 : 0.9,
                  },
                  transition: { ...baseTransition, duration: 1 },
                };
              case 2: // Ken Burns effect
                return {
                  animate: {
                    opacity: isActive ? 1 : 0,
                    scale: isActive ? [1, 1.05] : 1.1,
                    y: isActive ? 0 : -50,
                  },
                  transition: isActive 
                    ? { opacity: { duration: 0.8 }, scale: { duration: 8, ease: 'linear' as const } }
                    : baseTransition,
                };
              case 3: // Cinematic wipe
                return {
                  animate: {
                    opacity: isActive ? 1 : 0,
                    clipPath: isActive 
                      ? 'inset(0% 0% 0% 0%)' 
                      : isPrev ? 'inset(0% 100% 0% 0%)' : 'inset(0% 0% 0% 100%)',
                    scale: isActive ? 1 : 1.1,
                  },
                  transition: { ...baseTransition, duration: 1.5 },
                };
              default:
                return {
                  animate: { opacity: isActive ? 1 : 0, scale: isActive ? 1 : 1.1 },
                  transition: baseTransition,
                };
            }
          };

          const slideAnim = getSlideAnimation();

          // Determine which media to use based on device and normalize URLs
          const rawMediaUrl = isMobile && slide.media_url_mobile ? slide.media_url_mobile : slide.media_url;
          const mediaUrl = resolveImageUrl(rawMediaUrl, 'hero', slide.id);
          const mediaType = isMobile && slide.media_url_mobile ? (slide.media_type_mobile || 'image') : slide.media_type;

          return (
            <motion.div 
              key={slide.id}
              className="absolute inset-0"
              style={{ perspective: 1000 }}
              initial={false}
              animate={slideAnim.animate}
              transition={slideAnim.transition}
            >
              {mediaType === 'video' ? (
                <video
                  src={mediaUrl}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : (
                <img
                  src={mediaUrl}
                  alt={slide.title_en || `Slide ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              )}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background"
                animate={{ opacity: isActive ? 1 : 0 }}
                transition={{ duration: 0.5 }}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Animated Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
        <motion.div 
          className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"
          animate={{ 
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"
          animate={{ 
            x: [0, -40, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-20 h-full flex items-center md:items-end justify-center">
        <div className="container text-center py-20 md:pb-32">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {title && (
              <motion.h1 
                className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
              >
                <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                  {title}
                </span>
              </motion.h1>
            )}
            {subtitle && (
              <motion.p 
                className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
              >
                {subtitle}
              </motion.p>
            )}
            {/* CTA Buttons - On mobile: small, horizontal, positioned at bottom */}
            <motion.div 
              className="flex flex-row gap-2 sm:gap-4 justify-center md:static md:mt-0 absolute bottom-24 left-1/2 -translate-x-1/2 md:translate-x-0 md:relative md:bottom-auto md:left-auto z-40"
            >
              {buttonText && (
                <>
                  <Button size="sm" className="md:hidden bg-primary hover:bg-primary/90 text-primary-foreground text-xs px-3" asChild>
                    <Link to={currentContent.link_url || '/shop'}>{buttonText}</Link>
                  </Button>
                  <Button size="lg" className="hidden md:inline-flex bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
                    <Link to={currentContent.link_url || '/shop'}>{buttonText}</Link>
                  </Button>
                </>
              )}
              <Button size="sm" variant="outline" className="md:hidden backdrop-blur-sm text-xs px-3" asChild>
                <Link to="/projects">{isRTL ? 'عرض المشاريع' : 'View Projects'}</Link>
              </Button>
              <Button size="lg" variant="outline" className="hidden md:inline-flex backdrop-blur-sm" asChild>
                <Link to="/projects">{isRTL ? 'عرض المشاريع' : 'View Projects'}</Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* Slide Navigation - On mobile: positioned at bottom of image */}
          {totalSlides > 1 && (
            <div className="flex items-center justify-center gap-2 md:gap-4 mt-12 md:static md:mt-12 absolute bottom-12 left-1/2 -translate-x-1/2 md:translate-x-0 md:relative md:bottom-auto md:left-auto z-40">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={prevSlide} 
                className="rounded-full backdrop-blur-sm bg-background/20 hover:bg-background/40 h-8 w-8 md:h-10 md:w-10"
              >
                <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
              
              <div className="flex gap-1.5 md:gap-2">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`h-1.5 md:h-2 rounded-full transition-all duration-300 ${
                      index === currentSlide 
                        ? 'bg-primary w-6 md:w-8' 
                        : 'bg-muted-foreground/30 hover:bg-muted-foreground/50 w-1.5 md:w-2'
                    }`}
                  />
                ))}
              </div>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={nextSlide} 
                className="rounded-full backdrop-blur-sm bg-background/20 hover:bg-background/40 h-8 w-8 md:h-10 md:w-10"
              >
                <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </div>
          )}

          {/* Progress Bar - On mobile: positioned above CTA buttons */}
          {totalSlides > 1 && (
            <div className="mt-4 flex flex-col items-center gap-1 md:gap-2 md:static md:mt-4 absolute bottom-36 left-1/2 -translate-x-1/2 md:translate-x-0 md:relative md:bottom-auto md:left-auto z-40">
              <div className="w-32 md:w-48 h-0.5 md:h-1 bg-muted-foreground/20 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-primary rounded-full"
                  key={currentSlide}
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: SLIDE_DURATION / 1000, ease: "linear" }}
                />
              </div>
              <span className="text-[10px] md:text-xs text-muted-foreground">
                {currentSlide + 1} / {totalSlides}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-30" />
    </section>
  );
};

export default HeroSection;

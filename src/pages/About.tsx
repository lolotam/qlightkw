import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import StorefrontLayout from '@/layouts/StorefrontLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Building, Users, Award, Target, Lightbulb, Shield, Clock, Globe } from 'lucide-react';

const About = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // Company values
  const values = [
    {
      icon: Lightbulb,
      title: isRTL ? 'الابتكار' : 'Innovation',
      description: isRTL 
        ? 'نسعى دائماً لتقديم أحدث حلول الإضاءة المبتكرة'
        : 'We constantly strive to bring the latest innovative lighting solutions',
    },
    {
      icon: Shield,
      title: isRTL ? 'الجودة' : 'Quality',
      description: isRTL
        ? 'نلتزم بأعلى معايير الجودة في جميع منتجاتنا'
        : 'We commit to the highest quality standards in all our products',
    },
    {
      icon: Users,
      title: isRTL ? 'خدمة العملاء' : 'Customer Service',
      description: isRTL
        ? 'رضا العملاء هو أولويتنا القصوى'
        : 'Customer satisfaction is our top priority',
    },
    {
      icon: Globe,
      title: isRTL ? 'الاستدامة' : 'Sustainability',
      description: isRTL
        ? 'نهتم بالبيئة ونقدم حلول إضاءة موفرة للطاقة'
        : 'We care about the environment and offer energy-efficient lighting solutions',
    },
  ];

  // Timeline milestones
  const milestones = [
    { year: '2008', title: isRTL ? 'تأسيس الشركة' : 'Company Founded', description: isRTL ? 'بدأت رحلتنا في الكويت' : 'Our journey began in Kuwait' },
    { year: '2012', title: isRTL ? 'التوسع الإقليمي' : 'Regional Expansion', description: isRTL ? 'افتتاح فروع جديدة' : 'Opening new branches' },
    { year: '2016', title: isRTL ? 'شراكات دولية' : 'International Partnerships', description: isRTL ? 'شراكات مع علامات عالمية' : 'Partnerships with global brands' },
    { year: '2020', title: isRTL ? 'المتجر الإلكتروني' : 'E-commerce Launch', description: isRTL ? 'إطلاق منصة التسوق الإلكتروني' : 'Launching our online shopping platform' },
    { year: '2024', title: isRTL ? 'الريادة في السوق' : 'Market Leadership', description: isRTL ? 'الرائدون في حلول الإضاءة بالكويت' : 'Leading lighting solutions in Kuwait' },
  ];

  // Team members (demo data)
  const team = [
    { name: isRTL ? 'أحمد الكويتي' : 'Ahmed Al-Kuwaiti', role: isRTL ? 'المدير التنفيذي' : 'CEO', image: '/placeholder.svg' },
    { name: isRTL ? 'سارة المطيري' : 'Sara Al-Mutairi', role: isRTL ? 'مدير المبيعات' : 'Sales Director', image: '/placeholder.svg' },
    { name: isRTL ? 'محمد العنزي' : 'Mohammed Al-Anzi', role: isRTL ? 'مدير التصميم' : 'Design Manager', image: '/placeholder.svg' },
    { name: isRTL ? 'فاطمة الصباح' : 'Fatima Al-Sabah', role: isRTL ? 'مدير العمليات' : 'Operations Manager', image: '/placeholder.svg' },
  ];

  // Stats
  const stats = [
    { value: '15+', label: isRTL ? 'سنوات من الخبرة' : 'Years Experience' },
    { value: '10,000+', label: isRTL ? 'عملاء سعداء' : 'Happy Customers' },
    { value: '500+', label: isRTL ? 'مشروع منجز' : 'Completed Projects' },
    { value: '50+', label: isRTL ? 'علامة تجارية' : 'Partner Brands' },
  ];

  return (
    <StorefrontLayout>
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary" />
        <div className="absolute inset-0 bg-[url('/placeholder.svg')] bg-cover bg-center opacity-10" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="container relative z-10 text-center"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            {isRTL ? 'من نحن' : 'About Us'}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            {isRTL 
              ? 'نحن شركة كواليتي لايت، الرائدة في توفير حلول الإضاءة المتميزة في الكويت منذ عام 2008'
              : 'Quality Light - Leading provider of premium lighting solutions in Kuwait since 2008'
            }
          </p>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-primary text-primary-foreground">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-sm opacity-90">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: isRTL ? 50 : -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                {isRTL ? 'قصتنا' : 'Our Story'}
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  {isRTL 
                    ? 'بدأت رحلة كواليتي لايت في عام 2008 برؤية واضحة: تقديم أفضل حلول الإضاءة للمنازل والمشاريع التجارية في الكويت. منذ ذلك الحين، نمت شركتنا لتصبح واحدة من أبرز الشركات في مجال الإضاءة في المنطقة.'
                    : 'Quality Light\'s journey began in 2008 with a clear vision: to provide the best lighting solutions for homes and commercial projects in Kuwait. Since then, our company has grown to become one of the leading lighting companies in the region.'
                  }
                </p>
                <p>
                  {isRTL
                    ? 'نفخر بشراكاتنا مع أفضل العلامات التجارية العالمية في مجال الإضاءة، ونسعى دائماً لتقديم أحدث التقنيات والتصاميم لعملائنا الكرام.'
                    : 'We are proud of our partnerships with the best global lighting brands, and we always strive to offer the latest technologies and designs to our valued customers.'
                  }
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: isRTL ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative aspect-video rounded-2xl overflow-hidden bg-muted"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <Building className="h-24 w-24 text-muted-foreground/30" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-center mb-12"
          >
            {isRTL ? 'مسيرتنا' : 'Our Journey'}
          </motion.h2>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-primary/20 hidden md:block" />
            
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex flex-col md:flex-row items-center gap-4 ${
                    index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  <div className={`flex-1 ${index % 2 === 0 ? 'md:text-end' : 'md:text-start'}`}>
                    <Card className="inline-block">
                      <CardContent className="p-6">
                        <div className="text-2xl font-bold text-primary mb-2">{milestone.year}</div>
                        <div className="font-semibold mb-1">{milestone.title}</div>
                        <div className="text-sm text-muted-foreground">{milestone.description}</div>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="w-4 h-4 rounded-full bg-primary shrink-0 hidden md:block" />
                  <div className="flex-1" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 md:py-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {isRTL ? 'قيمنا' : 'Our Values'}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {isRTL 
                ? 'نؤمن بمجموعة من القيم الأساسية التي توجه عملنا'
                : 'We believe in a set of core values that guide our work'
              }
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <value.icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {isRTL ? 'فريقنا' : 'Our Team'}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {isRTL 
                ? 'تعرف على الفريق المتميز الذي يقف وراء نجاحنا'
                : 'Meet the exceptional team behind our success'
              }
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square bg-muted relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Users className="h-16 w-16 text-muted-foreground/30" />
                    </div>
                  </div>
                  <CardContent className="p-4 text-center">
                    <h3 className="font-semibold">{member.name}</h3>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="h-full bg-primary text-primary-foreground">
                <CardContent className="p-8">
                  <div className="w-16 h-16 rounded-full bg-primary-foreground/10 flex items-center justify-center mb-6">
                    <Target className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">
                    {isRTL ? 'مهمتنا' : 'Our Mission'}
                  </h3>
                  <p className="opacity-90">
                    {isRTL
                      ? 'توفير حلول إضاءة مبتكرة وعالية الجودة تحول المساحات وتحسن حياة الناس، مع الالتزام بالاستدامة وخدمة العملاء المتميزة.'
                      : 'To provide innovative, high-quality lighting solutions that transform spaces and improve lives, while maintaining a commitment to sustainability and exceptional customer service.'
                    }
                  </p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="h-full bg-secondary text-secondary-foreground">
                <CardContent className="p-8">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <Award className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">
                    {isRTL ? 'رؤيتنا' : 'Our Vision'}
                  </h3>
                  <p className="text-muted-foreground">
                    {isRTL
                      ? 'أن نكون الخيار الأول والأفضل للإضاءة في الكويت والمنطقة، معروفين بالتميز والابتكار والموثوقية.'
                      : 'To be the first and best choice for lighting in Kuwait and the region, known for excellence, innovation, and reliability.'
                    }
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </StorefrontLayout>
  );
};

export default About;

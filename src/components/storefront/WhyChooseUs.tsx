import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Truck, ShieldCheck, Headphones, RotateCcw } from 'lucide-react';

const WhyChooseUs = () => {
  const { t } = useTranslation();

  const features = [
    {
      key: 'fastDelivery',
      icon: <Truck className="h-8 w-8" />,
      title: t('home.whyChooseUs.fastDelivery.title', 'Fast Delivery'),
      description: t('home.whyChooseUs.fastDelivery.description', 'Quick delivery across Kuwait'),
    },
    {
      key: 'qualityGuaranteed',
      icon: <ShieldCheck className="h-8 w-8" />,
      title: t('home.whyChooseUs.qualityGuaranteed.title', 'Quality Guaranteed'),
      description: t('home.whyChooseUs.qualityGuaranteed.description', 'Premium products with warranty'),
    },
    {
      key: 'expertSupport',
      icon: <Headphones className="h-8 w-8" />,
      title: t('home.whyChooseUs.expertSupport.title', 'Expert Support'),
      description: t('home.whyChooseUs.expertSupport.description', '24/7 customer assistance'),
    },
    {
      key: 'easyReturns',
      icon: <RotateCcw className="h-8 w-8" />,
      title: t('home.whyChooseUs.easyReturns.title', 'Easy Returns'),
      description: t('home.whyChooseUs.easyReturns.description', 'Hassle-free return policy'),
    },
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('home.whyChooseUs.title', 'Why Choose Us')}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('home.whyChooseUs.subtitle', 'We are committed to providing the best lighting solutions')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-card rounded-xl p-6 text-center border border-border hover:border-primary hover:shadow-lg transition-all duration-300 group"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;

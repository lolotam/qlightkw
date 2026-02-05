import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import logo from '@/assets/logo.png';
import { cn } from '@/lib/utils';

interface AnimatedLogoProps {
  className?: string;
  isLoading?: boolean;
}

const AnimatedLogo = forwardRef<HTMLDivElement, AnimatedLogoProps>(
  ({ className, isLoading = false }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn('relative', className)}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <motion.img
          src={logo}
          alt="Quality Light"
          className="h-10 w-auto"
          animate={
            isLoading
              ? {
                  filter: [
                    'brightness(1)',
                    'brightness(1.3)',
                    'brightness(1)',
                  ],
                  scale: [1, 1.05, 1],
                }
              : {}
          }
          transition={
            isLoading
              ? {
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }
              : {}
          }
          whileHover={{
            scale: 1.05,
            filter: 'brightness(1.1)',
            transition: { duration: 0.2 },
          }}
        />
        
        {/* Loading indicator ring */}
        {isLoading && (
          <motion.div
            className="absolute -inset-2 rounded-full border-2 border-primary/30"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        )}
      </motion.div>
    );
  }
);

AnimatedLogo.displayName = 'AnimatedLogo';

export default AnimatedLogo;

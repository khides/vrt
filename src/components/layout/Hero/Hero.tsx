import { motion } from 'framer-motion';
import { cn } from '../../../lib/utils';

export interface HeroProps {
  title: string;
  subtitle?: string;
  description?: string;
  primaryCta?: {
    label: string;
    href: string;
  };
  secondaryCta?: {
    label: string;
    href: string;
  };
  backgroundImage?: string;
  variant?: 'light' | 'dark';
  size?: 'default' | 'large';
}

export function Hero({
  title,
  subtitle,
  description,
  primaryCta,
  secondaryCta,
  backgroundImage,
  variant = 'light',
  size = 'default',
}: HeroProps) {
  const isDark = variant === 'dark';

  return (
    <section
      className={cn(
        'relative flex flex-col items-center justify-center text-center overflow-hidden',
        size === 'large' ? 'min-h-screen' : 'min-h-[80vh]',
        isDark ? 'bg-black text-white' : 'bg-[--color-background-secondary] text-[--color-foreground]'
      )}
    >
      {/* Background Image */}
      {backgroundImage && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        >
          <div
            className={cn(
              'absolute inset-0',
              isDark ? 'bg-black/40' : 'bg-white/60'
            )}
          />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-24">
        {/* Subtitle */}
        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className={cn(
              'text-lg md:text-xl font-medium mb-2',
              isDark ? 'text-white/70' : 'text-[--color-foreground-secondary]'
            )}
          >
            {subtitle}
          </motion.p>
        )}

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
          className={cn(
            'font-semibold tracking-tight text-balance',
            size === 'large'
              ? 'text-5xl md:text-7xl lg:text-8xl'
              : 'text-4xl md:text-5xl lg:text-6xl'
          )}
        >
          {title}
        </motion.h1>

        {/* Description */}
        {description && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className={cn(
              'mt-6 text-lg md:text-xl max-w-2xl mx-auto',
              isDark ? 'text-white/80' : 'text-[--color-foreground-secondary]'
            )}
          >
            {description}
          </motion.p>
        )}

        {/* CTAs */}
        {(primaryCta || secondaryCta) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            {primaryCta && (
              <a
                href={primaryCta.href}
                className={cn(
                  'inline-flex items-center justify-center font-medium transition-all',
                  'text-lg px-8 py-3 rounded-full',
                  'bg-[--color-accent] text-white hover:bg-[--color-accent-hover]'
                )}
              >
                {primaryCta.label}
              </a>
            )}
            {secondaryCta && (
              <a
                href={secondaryCta.href}
                className="text-lg text-[--color-accent] hover:underline underline-offset-4"
              >
                {secondaryCta.label} →
              </a>
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
}

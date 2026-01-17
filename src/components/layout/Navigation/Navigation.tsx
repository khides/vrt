import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';

export interface NavigationProps {
  transparent?: boolean;
}

const navItems = [
  { label: 'Store', href: '#' },
  { label: 'Mac', href: '#' },
  { label: 'iPad', href: '#' },
  { label: 'iPhone', href: '#' },
  { label: 'Watch', href: '#' },
  { label: 'Support', href: '#' },
];

export function Navigation({ transparent = true }: NavigationProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const showSolidBg = !transparent || isScrolled;

  return (
    <>
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-50 h-[--spacing-nav-height]',
          'transition-all duration-300',
          showSolidBg
            ? 'bg-[--color-background]/80 backdrop-blur-xl border-b border-black/5'
            : 'bg-transparent'
        )}
      >
        <div className="max-w-[980px] mx-auto h-full px-4 flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="text-[--color-foreground]">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-label="Apple Logo"
            >
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
          </a>

          {/* Desktop Nav */}
          <ul className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  className={cn(
                    'text-xs font-normal transition-colors',
                    showSolidBg
                      ? 'text-[--color-foreground] hover:text-[--color-foreground-secondary]'
                      : 'text-white/90 hover:text-white'
                  )}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <div className="w-5 h-4 flex flex-col justify-between">
              <span
                className={cn(
                  'w-full h-0.5 transition-all origin-center',
                  showSolidBg ? 'bg-[--color-foreground]' : 'bg-white',
                  isMobileMenuOpen && 'rotate-45 translate-y-1.5'
                )}
              />
              <span
                className={cn(
                  'w-full h-0.5 transition-all',
                  showSolidBg ? 'bg-[--color-foreground]' : 'bg-white',
                  isMobileMenuOpen && 'opacity-0'
                )}
              />
              <span
                className={cn(
                  'w-full h-0.5 transition-all origin-center',
                  showSolidBg ? 'bg-[--color-foreground]' : 'bg-white',
                  isMobileMenuOpen && '-rotate-45 -translate-y-1.5'
                )}
              />
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-0 z-40 bg-[--color-background] pt-[--spacing-nav-height] md:hidden"
          >
            <ul className="flex flex-col p-6">
              {navItems.map((item, index) => (
                <motion.li
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-black/10"
                >
                  <a
                    href={item.href}
                    className="block py-4 text-lg font-medium text-[--color-foreground]"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

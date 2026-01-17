import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../../lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center font-medium transition-all',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          // Variants
          {
            // Primary - Apple blue button
            primary: [
              'bg-[--color-accent] text-white rounded-full',
              'hover:bg-[--color-accent-hover]',
              'focus-visible:ring-[--color-accent]',
            ],
            // Secondary - Outlined
            secondary: [
              'bg-transparent text-[--color-accent] border border-[--color-accent] rounded-full',
              'hover:bg-[--color-accent] hover:text-white',
              'focus-visible:ring-[--color-accent]',
            ],
            // Ghost - No background
            ghost: [
              'bg-transparent text-[--color-foreground]',
              'hover:bg-black/5',
              'rounded-[--radius-md]',
            ],
            // Link - Text only
            link: [
              'bg-transparent text-[--color-accent] underline-offset-4',
              'hover:underline',
              'p-0 h-auto',
            ],
          }[variant],
          // Sizes
          {
            sm: 'text-sm px-4 py-1.5',
            md: 'text-base px-5 py-2',
            lg: 'text-lg px-8 py-3',
          }[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };

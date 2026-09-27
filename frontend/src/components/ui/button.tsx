import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'glow';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variantStyles = {
      default:
        'bg-zinc-100 text-zinc-900 shadow hover:bg-white active:scale-[0.98]',
      destructive:
        'bg-rose-600 text-white shadow-sm hover:bg-rose-500 active:scale-[0.98]',
      outline:
        'border border-zinc-700/80 bg-zinc-900/50 text-zinc-200 shadow-sm hover:bg-zinc-800 hover:text-white active:scale-[0.98]',
      secondary:
        'bg-zinc-800 text-zinc-100 shadow-sm hover:bg-zinc-700 active:scale-[0.98]',
      ghost:
        'text-zinc-300 hover:bg-zinc-800/80 hover:text-white',
      link:
        'text-sky-400 underline-offset-4 hover:underline',
      glow:
        'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 hover:brightness-110 active:scale-[0.98]',
    };

    const sizeStyles = {
      default: 'h-9 px-4 py-2 text-xs font-medium',
      sm: 'h-7 rounded-lg px-2.5 text-[11px] font-medium',
      lg: 'h-10 rounded-xl px-5 text-sm font-medium',
      icon: 'h-8 w-8 rounded-lg p-0 flex items-center justify-center',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

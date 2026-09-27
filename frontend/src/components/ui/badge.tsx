import * as React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variantStyles = {
    default: 'bg-zinc-800 text-zinc-100 border-zinc-700/60 hover:bg-zinc-700/80',
    secondary: 'bg-zinc-800/60 text-zinc-300 border-zinc-700/40 hover:bg-zinc-800',
    destructive: 'bg-rose-950/60 text-rose-300 border-rose-800/50 hover:bg-rose-900/60',
    outline: 'border-zinc-700 text-zinc-300 bg-transparent hover:bg-zinc-800/40',
    success: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50 hover:bg-emerald-900/60',
    warning: 'bg-amber-950/60 text-amber-300 border-amber-800/50 hover:bg-amber-900/60',
    info: 'bg-sky-950/60 text-sky-300 border-sky-800/50 hover:bg-sky-900/60',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  indicatorClassName?: string;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, indicatorClassName, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('relative h-1.5 w-full overflow-hidden rounded-full bg-zinc-800', className)}
      {...props}
    >
      <div
        className={cn('h-full w-full flex-1 bg-sky-500 transition-all duration-300', indicatorClassName)}
        style={{ transform: `translateX(-${100 - Math.min(100, Math.max(0, value))}%)` }}
      />
    </div>
  )
);
Progress.displayName = 'Progress';

import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'accent';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-track text-fg-secondary',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  accent: 'bg-accent-soft text-accent',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

/** Quiet status pill: tint fill, no border, no saturated colour. */
export function Badge({ tone = 'neutral', className, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex h-5 items-center whitespace-nowrap rounded-full px-2 text-caption font-medium',
        TONES[tone],
        className,
      )}
      {...rest}
    />
  );
}

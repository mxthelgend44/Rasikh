import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'accent';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-track text-fg',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  accent: 'bg-accent-soft text-accent',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  /** Rounded rectangle on dashboards, full pill in the newcomer app. */
  shape?: 'rect' | 'pill';
}

/** Quiet status label: tint fill, dark same-hue text, no border. */
export function Badge({ tone = 'neutral', shape = 'rect', className, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex h-5 items-center whitespace-nowrap px-1.5 text-caption font-medium',
        shape === 'pill' ? 'rounded-full px-2' : 'rounded',
        TONES[tone],
        className,
      )}
      {...rest}
    />
  );
}

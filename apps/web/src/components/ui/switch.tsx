'use client';

import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface SwitchProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onChange' | 'role' | 'aria-checked'
> {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Required: a switch has no visible text of its own. */
  'aria-label': string;
}

/** 40x24 track, near-black when on. The knob moves along the inline axis, so it mirrors in RTL. */
export function Switch({ checked, onChange, className, ...rest }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-10 shrink-0 rounded-full transition-colors',
        'disabled:pointer-events-none disabled:opacity-40',
        checked ? 'bg-solid' : 'bg-line-strong',
        className,
      )}
      {...rest}
    >
      <span
        aria-hidden
        className={cn(
          'absolute top-0.5 size-5 rounded-full shadow-sm transition-all',
          checked ? 'start-[1.125rem] bg-solid-fg' : 'start-0.5 bg-surface',
        )}
      />
    </button>
  );
}

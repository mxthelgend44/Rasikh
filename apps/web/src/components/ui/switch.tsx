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

export function Switch({ checked, onChange, className, ...rest }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'rasikh-switch inline-flex h-6 w-10 shrink-0 items-center justify-center rounded-full',
        'disabled:pointer-events-none disabled:opacity-40',
        className,
      )}
      {...rest}
    >
      <span
        aria-hidden
        className={cn(
          'relative block h-6 w-10 shrink-0 rounded-full transition-colors',
          checked ? 'bg-solid' : 'bg-fg-tertiary',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 size-5 rounded-full bg-solid-fg shadow-sm transition-all',
            checked ? 'start-[1.125rem]' : 'start-0.5',
          )}
        />
      </span>
    </button>
  );
}

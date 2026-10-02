import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Square icon-only button. Requires `aria-label`. */
  iconOnly?: boolean;
  icon?: ReactNode;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-solid text-solid-fg hover:bg-solid/85',
  secondary: 'border border-line-strong bg-surface text-fg hover:bg-hover',
  ghost: 'text-fg hover:bg-hover',
  destructive: 'bg-danger text-surface hover:bg-danger/90',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-7 gap-1.5 px-2.5 text-label',
  md: 'h-8 gap-2 px-3 text-body',
  lg: 'h-10 gap-2 px-4 text-body',
};

const ICON_ONLY_SIZES: Record<ButtonSize, string> = {
  sm: 'size-7 px-0',
  md: 'size-8 px-0',
  lg: 'size-10 px-0',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', iconOnly = false, icon, className, children, type, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors',
        'disabled:pointer-events-none disabled:opacity-40',
        VARIANTS[variant],
        iconOnly ? ICON_ONLY_SIZES[size] : SIZES[size],
        className,
      )}
      {...rest}
    >
      {icon ? <span aria-hidden className="flex size-4 items-center justify-center">{icon}</span> : null}
      {iconOnly ? null : children}
    </button>
  );
});

'use client';

import {
  createContext,
  forwardRef,
  useContext,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/lib/cn';

interface FieldValue {
  id: string;
  hintId?: string;
  errorId?: string;
  invalid: boolean;
  required: boolean;
}

const FieldContext = createContext<FieldValue | null>(null);

export interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required = false,
  children,
  className,
}: FieldProps) {
  const generatedId = useId();
  const id = htmlFor ?? generatedId;
  const value: FieldValue = {
    id,
    hintId: hint ? `${id}-hint` : undefined,
    errorId: error ? `${id}-error` : undefined,
    invalid: Boolean(error),
    required,
  };

  return (
    <FieldContext.Provider value={value}>
      <div className={cn('flex min-w-0 flex-col gap-1.5 text-start', className)}>
        <label htmlFor={id} className="text-body font-medium text-fg">
          {label}
          {required ? (
            <span aria-hidden className="ms-1 text-danger">
              *
            </span>
          ) : null}
        </label>
        {children}
        {hint ? (
          <div id={value.hintId} className="text-label text-fg-tertiary">
            {hint}
          </div>
        ) : null}
        {error ? (
          <div id={value.errorId} role="alert" className="text-label text-danger">
            {error}
          </div>
        ) : null}
      </div>
    </FieldContext.Provider>
  );
}

function useFieldControl(describedBy?: string) {
  const field = useContext(FieldContext);
  return {
    id: field?.id,
    required: field?.required || undefined,
    'aria-invalid': field?.invalid || undefined,
    'aria-describedby':
      [describedBy, field?.hintId, field?.errorId].filter(Boolean).join(' ') || undefined,
  };
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, 'aria-describedby': describedBy, ...rest }, ref) {
    const field = useFieldControl(describedBy);
    return (
      <input
        ref={ref}
        {...field}
        {...rest}
        aria-describedby={field['aria-describedby']}
        className={cn('rasikh-control py-2', className)}
      />
    );
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, 'aria-describedby': describedBy, ...rest }, ref) {
    const field = useFieldControl(describedBy);
    return (
      <select
        ref={ref}
        {...field}
        {...rest}
        aria-describedby={field['aria-describedby']}
        className={cn('rasikh-control py-2', className)}
      />
    );
  },
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, 'aria-describedby': describedBy, rows = 4, ...rest }, ref) {
  const field = useFieldControl(describedBy);
  return (
    <textarea
      ref={ref}
      rows={rows}
      {...field}
      {...rest}
      aria-describedby={field['aria-describedby']}
      className={cn('rasikh-control resize-y py-2', className)}
    />
  );
});

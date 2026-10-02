'use client';

import { cn } from '@/lib/cn';
import { useRovingTabs } from '@/lib/use-roving-tabs';

export interface SegmentedOption<V extends string> {
  value: V;
  label: string;
}

export interface SegmentedProps<V extends string> {
  /** Accessible name of the group. */
  label: string;
  value: V;
  onChange: (value: V) => void;
  options: SegmentedOption<V>[];
  className?: string;
}

export function Segmented<V extends string>({
  label,
  value,
  onChange,
  options,
  className,
}: SegmentedProps<V>) {
  const selected = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const itemProps = useRovingTabs(options.length, selected, (index) => {
    const next = options[index];
    if (next) onChange(next.value);
  });

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn('inline-flex h-8 items-center gap-0.5 rounded-md bg-track p-0.5', className)}
    >
      {options.map((option, index) => {
        const isSelected = index === selected;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(option.value)}
            className={cn(
              'h-full rounded-[0.375rem] border px-3 text-body font-medium transition-colors',
              isSelected
                ? 'border-line bg-surface text-fg shadow-sm'
                : 'border-transparent text-fg-secondary hover:text-fg',
            )}
            {...itemProps(index)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

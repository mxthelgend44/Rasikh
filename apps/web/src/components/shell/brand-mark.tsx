import { cn } from '@/lib/cn';

/** Rasikh mark: a doorway arch on a solid tile. Inverts with the theme through `solid` tokens. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn('size-6 shrink-0', className)}>
      <rect width="24" height="24" rx="6" className="fill-solid" />
      <path
        d="M7.5 18v-6.25a4.5 4.5 0 0 1 9 0V18"
        fill="none"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-solid-fg"
      />
    </svg>
  );
}

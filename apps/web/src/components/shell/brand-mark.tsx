import { cn } from '@/lib/cn';

/**
 * Rasikh mark: a doorway arch with a figure standing under it, on a solid tile.
 * Inverts with the theme through the `solid` tokens.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn('size-6 shrink-0', className)}>
      <rect width="24" height="24" rx="6" className="fill-solid" />
      <path
        d="M6.25 18V11.25a5.75 5.75 0 0 1 11.5 0V18"
        fill="none"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-solid-fg"
      />
      <circle cx="12" cy="14.25" r="1.75" className="fill-solid-fg" />
    </svg>
  );
}

import { cn } from '@/lib/cn';

/** Neutral loading placeholder with a slow sweep. Decorative, hidden from assistive tech. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'relative overflow-hidden rounded-md bg-track',
        'before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer',
        'before:bg-gradient-to-r before:from-transparent before:via-surface/60 before:to-transparent',
        'rtl:before:translate-x-full rtl:before:[animation-direction:reverse]',
        className,
      )}
    />
  );
}

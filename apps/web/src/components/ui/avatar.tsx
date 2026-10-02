import { cn } from '@/lib/cn';

export interface AvatarProps {
  name: string;
  size?: 'sm' | 'md';
  className?: string;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  return (
    <span
      role="img"
      aria-label={name}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full bg-solid font-medium text-solid-fg',
        size === 'md' ? 'size-7 text-label' : 'size-5 text-caption',
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

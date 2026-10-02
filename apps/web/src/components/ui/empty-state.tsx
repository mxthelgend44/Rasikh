import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** At most one primary action. */
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-16 text-center', className)}>
      <span className="flex size-10 items-center justify-center rounded-lg bg-track text-fg-secondary">
        <Icon aria-hidden className="size-5" />
      </span>
      <h2 className="mt-4 text-title font-medium text-fg">{title}</h2>
      {description ? (
        <p className="mt-1 max-w-sm text-body text-fg-tertiary">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

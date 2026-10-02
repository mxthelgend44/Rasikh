import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  illustration?: ReactNode;
  /** Sits next to the title, e.g. a segmented control. */
  tabs?: ReactNode;
  /** Right-aligned actions. */
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  illustration,
  tabs,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex min-h-14 shrink-0 flex-wrap items-center gap-x-4 gap-y-3 border-b border-line px-4 py-3 sm:px-6',
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h1 className="break-words text-heading font-medium text-fg">{title}</h1>
          {description ? (
            <div className="mt-1 max-w-2xl text-body text-fg-tertiary">{description}</div>
          ) : null}
        </div>
        {tabs ? <div className="max-w-full overflow-x-auto">{tabs}</div> : null}
      </div>
      {illustration ? <div className="w-24 shrink-0 max-sm:hidden">{illustration}</div> : null}
      {actions ? (
        <div className="flex max-w-full flex-wrap items-center gap-2 max-sm:basis-full">
          {actions}
        </div>
      ) : null}
    </header>
  );
}

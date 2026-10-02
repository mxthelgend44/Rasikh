import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface PageHeaderProps {
  title: string;
  description?: string;
  /** Sits next to the title, e.g. a segmented control. */
  tabs?: ReactNode;
  /** Right-aligned actions. */
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, tabs, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('flex items-center gap-4 px-6 pb-3 pt-4', className)}>
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-heading font-medium text-fg">{title}</h1>
          {description ? <p className="mt-0.5 text-body text-fg-tertiary">{description}</p> : null}
        </div>
        {tabs}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}

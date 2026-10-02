import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface PageHeaderProps {
  title: string;
  /** Sits next to the title, e.g. a segmented control. */
  tabs?: ReactNode;
  /** Right-aligned actions. */
  actions?: ReactNode;
  className?: string;
}

/** 56px title row with a full-bleed divider, as in the reference dashboards. */
export function PageHeader({ title, tabs, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cn('flex h-14 shrink-0 items-center gap-4 border-b border-line px-6', className)}
    >
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <h1 className="truncate text-heading font-medium text-fg">{title}</h1>
        {tabs}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}

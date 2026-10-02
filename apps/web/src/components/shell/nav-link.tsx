'use client';

import Link from 'next/link';
import { LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { NavItem } from '@/config/surfaces';
import { useI18n } from '@/lib/i18n/provider';
import { navLabel } from './nav-labels';
import { SHELL_COPY } from './shell-copy';

export interface NavLinkProps {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
  /** The sidebar draws the active plate itself, so the row only changes its text and icon. */
  indicator?: boolean;
}

const ROW = 'rasikh-nav-link flex h-[1.875rem] items-center rounded-md text-body transition-colors';

export function NavLink({ item, active, collapsed, onNavigate, indicator = false }: NavLinkProps) {
  const Icon = item.icon;
  const { t } = useI18n();
  const label = navLabel(item.label, t);
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? label : undefined}
      onClick={onNavigate}
      className={cn(
        ROW,
        collapsed ? 'justify-center' : 'gap-2 px-2.5',
        active
          ? cn('font-medium text-fg', !indicator && 'bg-selected')
          : 'text-fg-secondary hover:bg-hover hover:text-fg',
      )}
    >
      <Icon
        aria-hidden
        className={cn(
          'size-5 shrink-0 transition-colors',
          active ? 'text-accent' : 'text-fg-tertiary',
        )}
      />
      <span className={cn('truncate', collapsed && 'sr-only')}>{label}</span>
    </Link>
  );
}

/** Quiet way back to the presentation hub, shown in the sidebar footer. */
export function HubLink({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const { locale } = useI18n();
  const copy = SHELL_COPY[locale];
  return (
    <Link
      href="/"
      title={collapsed ? copy.hub : undefined}
      onClick={onNavigate}
      className={cn(
        ROW,
        'text-fg-tertiary hover:bg-hover hover:text-fg',
        collapsed ? 'justify-center' : 'gap-2 px-2.5',
      )}
    >
      <LayoutGrid aria-hidden className="size-5 shrink-0" />
      <span className={cn('truncate', collapsed && 'sr-only')}>{copy.hub}</span>
    </Link>
  );
}

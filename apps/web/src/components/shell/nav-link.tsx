import Link from 'next/link';
import { cn } from '@/lib/cn';
import type { NavItem } from '@/config/surfaces';

export interface NavLinkProps {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}

export function NavLink({ item, active, collapsed, onNavigate }: NavLinkProps) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? item.label : undefined}
      onClick={onNavigate}
      className={cn(
        'flex h-[1.875rem] items-center rounded-md text-body text-fg transition-colors',
        collapsed ? 'justify-center' : 'gap-2.5 px-2.5',
        active ? 'bg-selected' : 'hover:bg-hover',
      )}
    >
      <Icon aria-hidden className="size-4 shrink-0" />
      <span className={cn('truncate', collapsed && 'sr-only')}>{item.label}</span>
    </Link>
  );
}

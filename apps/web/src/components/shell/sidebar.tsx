'use client';

import { usePathname } from 'next/navigation';
import { PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NavLink } from '@/components/shell/nav-link';
import type { NavGroup, NavItem } from '@/config/surfaces';
import { cn } from '@/lib/cn';

function isActive(pathname: string, item: NavItem): boolean {
  if (item.match === 'exact') return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export interface SidebarProps {
  groups: NavGroup[];
  collapsed: boolean;
  onToggleCollapsed: () => void;
  /** Called after a link is followed, so a mobile drawer can close itself. */
  onNavigate?: () => void;
}

export function Sidebar({ groups, collapsed, onToggleCollapsed, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  // A group's sibling can be a longer match; only the most specific item is current.
  const items = groups.flatMap((group) => group.items);
  const current = items
    .filter((item) => isActive(pathname, item))
    .sort((a, b) => b.href.length - a.href.length)[0];

  return (
    <div className="flex h-full flex-col">
      <nav aria-label="Primary" className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 pt-3">
        {groups.map((group) => (
          <section key={group.label} className="mt-5 first:mt-0">
            <h2
              className={cn(
                'mb-2 px-3 text-label text-fg-tertiary',
                collapsed && 'sr-only',
              )}
            >
              {group.label}
            </h2>
            <ul className="flex flex-col gap-1.5">
              {group.items.map((item) => (
                <li key={item.href}>
                  <NavLink
                    item={item}
                    active={item === current}
                    collapsed={collapsed}
                    onNavigate={onNavigate}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </nav>
      <div className={cn('p-3', collapsed && 'flex justify-center')}>
        <Button
          variant="ghost"
          iconOnly
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          icon={<PanelLeft className="rtl:-scale-x-100" />}
          onClick={onToggleCollapsed}
          className="max-md:hidden"
        />
      </div>
    </div>
  );
}

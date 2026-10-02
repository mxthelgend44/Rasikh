'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { HubLink, NavLink } from '@/components/shell/nav-link';
import { navLabel } from '@/components/shell/nav-labels';
import type { NavGroup, NavItem } from '@/config/surfaces';
import { cn } from '@/lib/cn';
import { useI18n } from '@/lib/i18n/provider';

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

function isActive(pathname: string, item: NavItem): boolean {
  if (item.match === 'exact') return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export interface SidebarProps {
  groups: NavGroup[];
  collapsed: boolean;
  /** Called after a link is followed, so a mobile drawer can close itself. */
  onNavigate?: () => void;
}

interface Plate {
  top: number;
  height: number;
}

export function Sidebar({ groups, collapsed, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useI18n();
  // A group's sibling can be a longer match; only the most specific item is current.
  const items = groups.flatMap((group) => group.items);
  const current = items
    .filter((item) => isActive(pathname, item))
    .sort((a, b) => b.href.length - a.href.length)[0];

  const list = useRef<HTMLDivElement>(null);
  const rows = useRef(new Map<string, HTMLLIElement>());
  const [plate, setPlate] = useState<Plate | null>(null);
  // The first placement must not animate from nowhere; later moves slide.
  const [settled, setSettled] = useState(false);
  const currentHref = current?.href;

  useIsomorphicLayoutEffect(() => {
    const measure = () => {
      const row = currentHref ? rows.current.get(currentHref) : undefined;
      setPlate((previous) => {
        if (!row) return null;
        const next = { top: row.offsetTop, height: row.offsetHeight };
        return previous && previous.top === next.top && previous.height === next.height
          ? previous
          : next;
      });
    };
    measure();
    const node = list.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [currentHref, collapsed, groups]);

  useEffect(() => {
    if (!plate || settled) return;
    const frame = requestAnimationFrame(() => setSettled(true));
    return () => cancelAnimationFrame(frame);
  }, [plate, settled]);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <nav
        aria-label={t('shell.primary')}
        className="relative min-h-0 flex-1 overflow-y-auto px-3 pb-3 pt-3"
      >
        <div ref={list} className="relative">
          <span
            aria-hidden
            data-ready={settled || undefined}
            className={cn(
              'pointer-events-none absolute end-0 start-0 top-0 rounded-md bg-selected opacity-0',
              'data-[ready=true]:motion-safe:transition-[transform,height,opacity] data-[ready=true]:motion-safe:duration-300 data-[ready=true]:motion-safe:ease-[cubic-bezier(0.2,0.8,0.2,1)]',
              plate && 'opacity-100',
            )}
            style={
              plate
                ? {
                    height: plate.height,
                    transform: `translateY(${plate.top}px)`,
                  }
                : undefined
            }
          >
            <span className="absolute inset-y-1.5 start-0 w-0.5 rounded-full bg-accent" />
          </span>
          {groups.map((group, index) => (
            <section
              key={group.label}
              className={cn(
                index > 0 && 'mt-5',
                collapsed && index > 0 && 'border-t border-line pt-3',
              )}
            >
              <h2
                className={cn(
                  'mb-2 px-3 text-label font-medium text-fg-tertiary',
                  collapsed && 'sr-only',
                )}
              >
                {navLabel(group.label, t)}
              </h2>
              <ul className="flex flex-col gap-1.5">
                {group.items.map((item) => (
                  <li
                    key={item.href}
                    ref={(node) => {
                      if (node) rows.current.set(item.href, node);
                      else rows.current.delete(item.href);
                    }}
                    className="relative"
                  >
                    <NavLink
                      item={item}
                      active={item === current}
                      collapsed={collapsed}
                      indicator={plate !== null}
                      onNavigate={onNavigate}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </nav>
      <div className="shrink-0 border-t border-line px-3 py-3">
        <HubLink collapsed={collapsed} onNavigate={onNavigate} />
      </div>
    </div>
  );
}

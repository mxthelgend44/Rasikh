'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/shell/sidebar';
import { TopBar } from '@/components/shell/top-bar';
import { SURFACES, type SurfaceId } from '@/config/surfaces';
import { cn } from '@/lib/cn';
import { useMediaQuery } from '@/lib/use-media-query';
import { useSidebarCollapsed } from '@/lib/use-sidebar-collapsed';

export interface AppShellProps {
  surface: SurfaceId;
  children: ReactNode;
}

export function AppShell({ surface, children }: AppShellProps) {
  const config = SURFACES[surface];
  const [org, setOrg] = useState(config.orgs[0] ?? '');
  const [collapsed, toggleCollapsed] = useSidebarCollapsed();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const narrow = useMediaQuery('(max-width: 767px)');
  const pathname = usePathname();

  useEffect(() => setDrawerOpen(false), [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setDrawerOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  const railCollapsed = collapsed && !narrow;
  const hidden = narrow && !drawerOpen;

  return (
    <div className="flex h-dvh flex-col bg-canvas text-fg">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-solid focus:px-3 focus:py-2 focus:text-solid-fg"
      >
        Skip to content
      </a>
      <TopBar
        surface={surface}
        orgs={config.orgs}
        org={org}
        onOrgChange={setOrg}
        onOpenNav={() => setDrawerOpen(true)}
        navOpen={drawerOpen}
        user={config.user}
      />
      <div className="flex min-h-0 flex-1">
        {drawerOpen ? (
          <button
            type="button"
            aria-label="Close navigation"
            tabIndex={-1}
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
          />
        ) : null}
        <aside
          inert={hidden}
          className={cn(
            'shrink-0 transition-[width,transform] duration-200',
            railCollapsed ? 'w-sidebar-rail' : 'w-sidebar',
            'max-md:fixed max-md:inset-y-0 max-md:start-0 max-md:z-40 max-md:w-sidebar max-md:bg-canvas max-md:pt-topbar max-md:shadow-pop',
            hidden && 'max-md:-translate-x-full rtl:max-md:translate-x-full',
          )}
        >
          <Sidebar
            groups={config.nav}
            collapsed={railCollapsed}
            onToggleCollapsed={toggleCollapsed}
            onNavigate={() => setDrawerOpen(false)}
          />
        </aside>
        <div className="min-w-0 flex-1 pb-[var(--sheet-inset)] pe-[var(--sheet-inset)] max-md:ps-[var(--sheet-inset)]">
          <main
            id="main"
            tabIndex={-1}
            className="h-full overflow-y-auto rounded-[var(--sheet-radius)] border border-edge bg-surface focus:outline-none"
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/shell/sidebar';
import { TopBar } from '@/components/shell/top-bar';
import { Drawer } from '@/components/ui/drawer';
import { SURFACES, type SurfaceId } from '@/config/surfaces';
import type { Locale } from '@/domain/types';
import { cn } from '@/lib/cn';
import { LOCALE_COOKIE, parseLocale } from '@/lib/i18n';
import { I18nProvider, useI18n } from '@/lib/i18n/provider';
import { useMediaQuery } from '@/lib/use-media-query';
import { useSidebarCollapsed } from '@/lib/use-sidebar-collapsed';

export interface AppShellProps {
  surface: SurfaceId;
  children: ReactNode;
  initialLocale?: Locale;
  organizationLabel?: string;
}

export function AppShell({
  surface,
  children,
  initialLocale = 'en',
  organizationLabel,
}: AppShellProps) {
  return (
    <I18nProvider initial={initialLocale}>
      <ShellContent surface={surface} organizationLabel={organizationLabel}>
        {children}
      </ShellContent>
    </I18nProvider>
  );
}

function ShellContent({ surface, children, organizationLabel }: AppShellProps) {
  const config = SURFACES[surface];
  const { t, locale, setLocale } = useI18n();
  const org =
    organizationLabel ??
    (surface === 'design'
      ? (config.orgs[0] ?? '')
      : t(
          surface === 'employer'
            ? 'shell.employerWorkspace'
            : surface === 'landlord'
              ? 'shell.landlordWorkspace'
              : 'shell.bankWorkspace',
        ));
  const [collapsed, toggleCollapsed] = useSidebarCollapsed();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const narrow = useMediaQuery('(max-width: 767px)');
  const pathname = usePathname();

  useEffect(() => setDrawerOpen(false), [pathname]);

  useEffect(() => {
    const saved = document.cookie
      .split('; ')
      .find((entry) => entry.startsWith(`${LOCALE_COOKIE}=`))
      ?.split('=')[1];
    const next = parseLocale(saved);
    if (saved && next !== locale) setLocale(next);
  }, [locale, setLocale]);

  const railCollapsed = collapsed && !narrow;

  return (
    <div className="flex h-dvh flex-col bg-canvas text-fg">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-solid focus:px-3 focus:py-2 focus:text-solid-fg"
      >
        {t('shell.skip')}
      </a>
      <TopBar
        surface={surface}
        orgs={config.orgs}
        org={org}
        onOpenNav={() => setDrawerOpen(true)}
        navOpen={drawerOpen}
        user={config.user}
        sidebarCollapsed={railCollapsed}
        onToggleSidebar={toggleCollapsed}
      />
      <div className="flex min-h-0 flex-1">
        <aside
          className={cn(
            'hidden shrink-0 md:block motion-safe:transition-[width] motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.2,0.8,0.2,1)]',
            railCollapsed ? 'w-sidebar-rail' : 'w-sidebar',
          )}
        >
          <Sidebar
            groups={config.nav}
            collapsed={railCollapsed}
            onNavigate={() => setDrawerOpen(false)}
          />
        </aside>
        <Drawer
          open={drawerOpen && narrow}
          onClose={() => setDrawerOpen(false)}
          title={t('shell.primary')}
          description={org}
          closeLabel={t('shell.closeNav')}
          size="sm"
          side="start"
          className="w-72 [&>div]:min-h-full [&>div>div]:flex [&>div>div]:flex-col [&>div>div]:p-0"
        >
          <Sidebar groups={config.nav} collapsed={false} onNavigate={() => setDrawerOpen(false)} />
        </Drawer>
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

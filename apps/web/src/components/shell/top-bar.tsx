'use client';

import Link from 'next/link';
import {
  ChevronRight,
  LayoutGrid,
  Menu as MenuIcon,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { BrandMark } from '@/components/shell/brand-mark';
import { OrgSwitcher } from '@/components/shell/org-switcher';
import { SHELL_COPY } from '@/components/shell/shell-copy';
import { ThemeToggle } from '@/components/shell/theme-toggle';
import type { SurfaceId } from '@/config/surfaces';
import { useI18n } from '@/lib/i18n/provider';

export interface TopBarProps {
  surface: SurfaceId;
  orgs: string[];
  org: string;
  onOrgChange?: (org: string) => void;
  onOpenNav: () => void;
  navOpen: boolean;
  user: string;
  /** Desktop rail state. When `onToggleSidebar` is set a collapse control joins the bar. */
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export function TopBar({
  surface,
  orgs,
  org,
  onOrgChange,
  onOpenNav,
  navOpen,
  user,
  sidebarCollapsed = false,
  onToggleSidebar,
}: TopBarProps) {
  const { t, locale, setLocale } = useI18n();
  const copy = SHELL_COPY[locale];
  const nextLocale = locale === 'ar' ? 'en' : 'ar';
  // Phones have room for the surface name only; wider screens show the full workspace label.
  const shortName =
    surface === 'employer'
      ? t('shell.employer')
      : surface === 'landlord'
        ? t('shell.landlord')
        : surface === 'bank'
          ? t('shell.bank')
          : org;
  return (
    <header className="flex h-topbar shrink-0 items-center gap-1 px-4 max-sm:px-3">
      <Button
        variant="ghost"
        iconOnly
        aria-label={t('shell.openNav')}
        aria-expanded={navOpen}
        icon={<MenuIcon />}
        onClick={onOpenNav}
        className="me-1 md:hidden"
      />
      {onToggleSidebar ? (
        <Button
          variant="ghost"
          iconOnly
          aria-label={t(sidebarCollapsed ? 'shell.expandNav' : 'shell.collapseNav')}
          aria-expanded={!sidebarCollapsed}
          icon={
            sidebarCollapsed ? (
              <PanelLeftOpen className="rtl:-scale-x-100" />
            ) : (
              <PanelLeftClose className="rtl:-scale-x-100" />
            )
          }
          onClick={onToggleSidebar}
          className="me-1 text-fg-secondary max-md:hidden"
        />
      ) : null}
      <Link
        href="/"
        className="flex shrink-0 items-center gap-2 rounded-md py-1 pe-2 ps-1 text-body font-medium text-fg"
      >
        <BrandMark />
        <span className="max-sm:sr-only">{t('app.name')}</span>
      </Link>
      <ChevronRight
        aria-hidden
        className="size-3.5 shrink-0 text-fg-placeholder rtl:-scale-x-100"
      />
      <div className="min-w-0 max-sm:hidden">
        <OrgSwitcher
          orgs={orgs}
          value={org}
          onChange={onOrgChange}
          interactive={Boolean(onOrgChange)}
        />
      </div>
      <span className="min-w-0 truncate px-1.5 text-body font-medium text-fg-secondary sm:hidden">
        {shortName}
      </span>
      <div className="min-w-0 flex-1" />
      <Link
        href="/"
        aria-label={copy.hubHint}
        title={copy.hubHint}
        className="rasikh-button inline-flex h-8 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-body font-medium text-fg-secondary transition-colors hover:bg-hover hover:text-fg max-md:w-8 max-md:px-0"
      >
        <LayoutGrid aria-hidden className="size-4" />
        <span className="max-md:sr-only">{copy.hub}</span>
      </Link>
      <Button
        variant="ghost"
        aria-label={t('common.language')}
        lang={nextLocale}
        onClick={() => setLocale(nextLocale)}
      >
        {nextLocale === 'ar' ? 'العربية' : 'English'}
      </Button>
      <ThemeToggle
        label={(next) => t(next === 'dark' ? 'common.theme.toDark' : 'common.theme.toLight')}
      />
      <Avatar name={user} className="ms-1 max-sm:hidden" />
    </header>
  );
}

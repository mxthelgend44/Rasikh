'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, ListChecks, ShieldCheck, Sparkles, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { MessageKey } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/provider';

interface Tab {
  href: string;
  label: MessageKey;
  icon: LucideIcon;
  exact?: boolean;
}

const TABS: Tab[] = [
  { href: '/newcomer', label: 'nav.roadmap', icon: ListChecks, exact: true },
  { href: '/newcomer/documents', label: 'nav.documents', icon: FileText },
  { href: '/newcomer/agent', label: 'nav.agent', icon: Sparkles },
  { href: '/newcomer/passport', label: 'nav.passport', icon: ShieldCheck },
];

function useActive() {
  const pathname = usePathname();
  return (tab: Tab) => (tab.exact ? pathname === tab.href : pathname.startsWith(tab.href));
}

/** Bottom bar on phones. Solid surface, a hairline above it, and room for the home indicator. */
export function BottomTabs() {
  const { t } = useI18n();
  const isActive = useActive();
  return (
    <nav
      aria-label={t('nav.label')}
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-4">
        {TABS.map((tab) => {
          const active = isActive(tab);
          const Icon = tab.icon;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className="flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 py-1.5"
              >
                <span
                  className={cn(
                    'flex h-7 w-12 items-center justify-center rounded-full transition-colors',
                    active ? 'bg-selected text-fg' : 'text-fg-tertiary',
                  )}
                >
                  <Icon aria-hidden className="size-5" />
                </span>
                <span
                  className={cn(
                    'text-caption',
                    active ? 'font-medium text-fg' : 'text-fg-tertiary',
                  )}
                >
                  {t(tab.label)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Tabs under the header on larger screens, where a bottom bar would float far from the content. */
export function TopTabs() {
  const { t } = useI18n();
  const isActive = useActive();
  return (
    <nav aria-label={t('nav.label')} className="hidden px-4 md:block">
      <ul className="mx-auto flex max-w-xl gap-1">
        {TABS.map((tab) => {
          const active = isActive(tab);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'inline-flex h-8 items-center rounded-md px-3 text-body transition-colors',
                  active ? 'bg-selected font-medium text-fg' : 'text-fg-secondary hover:bg-hover',
                )}
              >
                {t(tab.label)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

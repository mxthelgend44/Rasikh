'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Landmark } from 'lucide-react';
import type { ReactNode } from 'react';
import { useI18n } from '@/lib/i18n/provider';
import { useConnection } from '@/store/provider';
import { cn } from '@/lib/cn';
import { bankText } from './bank-data';

export function BankHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  const { locale } = useI18n();
  const connection = useConnection();
  const pathname = usePathname();
  const text = (en: string, ar: string) => bankText(locale, en, ar);
  const links = [
    {
      href: '/bank',
      label: text('Overview', 'نظرة عامة'),
      active: pathname === '/bank',
    },
    {
      href: '/bank/applications',
      label: text('Applications', 'الطلبات'),
      active: pathname.startsWith('/bank/applications'),
    },
    {
      href: '/bank/partners',
      label: text('Employer partners', 'جهات العمل'),
      active: pathname === '/bank/partners',
    },
  ];
  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4 border-line px-5 py-5 sm:px-7 md:border-b md:pb-6">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2 text-caption text-fg-tertiary">
            <Landmark aria-hidden className="size-3.5 text-accent" />
            <span>{text('Saadiyat Commercial Bank', 'بنك السعديات التجاري')}</span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1.5">
              <span
                aria-hidden
                className={cn(
                  'size-1.5 rounded-full',
                  connection === 'live' ? 'bg-success' : 'bg-warning',
                )}
              />
              {connection === 'live'
                ? text('Live workspace', 'مساحة عمل مباشرة')
                : connection === 'offline'
                  ? text('Reconnecting', 'إعادة الاتصال')
                  : text('Connecting', 'جارٍ الاتصال')}
            </span>
          </div>
          <h1 className="text-display font-medium tracking-tight">{title}</h1>
          {description ? <p className="mt-1 text-body text-fg-secondary">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </header>
      <nav
        aria-label={text('Bank workspace', 'مساحة عمل البنك')}
        className="flex gap-6 overflow-x-auto border-b border-line px-5 sm:px-7 md:hidden"
      >
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={link.active ? 'page' : undefined}
            className={cn(
              'shrink-0 border-b-2 py-3 text-body transition-colors',
              link.active
                ? 'border-accent font-medium text-accent'
                : 'border-transparent text-fg-secondary hover:text-fg',
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </>
  );
}

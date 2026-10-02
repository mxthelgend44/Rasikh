'use client';

import Link from 'next/link';
import { BrandMark } from '@/components/shell/brand-mark';
import { ThemeToggle } from '@/components/shell/theme-toggle';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n/provider';
import { useNewcomer } from '@/store/person';

/** Who this phone belongs to. Fixed per link: a person is opened with /newcomer?as=<name>. */
function PersonBadge() {
  const { t } = useI18n();
  const { hire } = useNewcomer();
  if (!hire) return null;
  return (
    <span
      title={`${t('common.viewingAs')} ${hire.fullName}`}
      aria-label={`${t('common.viewingAs')} ${hire.fullName}`}
      role="img"
      className="ms-1 flex h-9 items-center"
    >
      <Avatar name={hire.fullName} />
    </span>
  );
}

function LocaleToggle() {
  const { locale, setLocale, t } = useI18n();
  const next = locale === 'ar' ? 'en' : 'ar';
  return (
    <Button
      variant="ghost"
      size="md"
      aria-label={t('common.language')}
      lang={next}
      onClick={() => setLocale(next)}
    >
      {next === 'ar' ? 'العربية' : 'English'}
    </Button>
  );
}

export function NewcomerHeader() {
  const { t } = useI18n();
  return (
    <header className="sticky top-0 z-20 flex h-[3.25rem] items-center gap-1 bg-surface px-4">
      <Link
        href="/"
        className="flex items-center gap-2 rounded-md py-1 pe-2 text-title font-medium text-fg"
      >
        <BrandMark />
        {t('app.name')}
      </Link>
      <div className="flex-1" />
      <LocaleToggle />
      <ThemeToggle
        label={(next) => t(next === 'dark' ? 'common.theme.toDark' : 'common.theme.toLight')}
      />
      <PersonBadge />
    </header>
  );
}

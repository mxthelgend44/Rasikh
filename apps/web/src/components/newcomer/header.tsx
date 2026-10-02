'use client';

import { ChevronDown } from 'lucide-react';
import { BrandMark } from '@/components/shell/brand-mark';
import { ThemeToggle } from '@/components/shell/theme-toggle';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Menu } from '@/components/ui/menu';
import { useI18n } from '@/lib/i18n/provider';
import { useNewcomer } from '@/store/person';

function PersonMenu() {
  const { t } = useI18n();
  const { hire, hires, choose } = useNewcomer();
  if (!hire) return null;
  return (
    <Menu
      label={t('common.viewingAs')}
      align="end"
      items={hires.map((person) => ({
        id: person.id,
        label: person.fullName,
        selected: person.id === hire.id,
        onSelect: () => choose(person.id),
      }))}
      trigger={({ 'data-open': open, ...props }) => (
        <button
          type="button"
          data-open={open}
          aria-label={`${t('common.viewingAs')} ${hire.fullName}`}
          className="flex h-9 items-center gap-1 rounded-full ps-1 pe-2 transition-colors hover:bg-hover data-[open=true]:bg-hover"
          {...props}
        >
          <Avatar name={hire.fullName} />
          <ChevronDown aria-hidden className="size-3.5 text-fg-tertiary" />
        </button>
      )}
    />
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
      <span className="flex items-center gap-2 text-title font-medium text-fg">
        <BrandMark />
        {t('app.name')}
      </span>
      <div className="flex-1" />
      <LocaleToggle />
      <ThemeToggle
        label={(next) => t(next === 'dark' ? 'common.theme.toDark' : 'common.theme.toLight')}
      />
      <PersonMenu />
    </header>
  );
}

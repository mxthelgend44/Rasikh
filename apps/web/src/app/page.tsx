import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { DemoHub } from '@/components/demo/hub';
import { LOCALE_COOKIE, parseLocale } from '@/lib/i18n';
import { I18nProvider } from '@/lib/i18n/provider';

export const metadata: Metadata = { title: 'Demo hub' };

export default async function Home() {
  const locale = parseLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  return (
    <I18nProvider initial={locale}>
      <DemoHub />
    </I18nProvider>
  );
}

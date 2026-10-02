import { AppShell } from '@/components/shell/app-shell';
import { cookies } from 'next/headers';
import { LOCALE_COOKIE, parseLocale } from '@/lib/i18n';

export default async function BankLayout({ children }: { children: React.ReactNode }) {
  const initialLocale = parseLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  return (
    <AppShell surface="bank" initialLocale={initialLocale}>
      {children}
    </AppShell>
  );
}

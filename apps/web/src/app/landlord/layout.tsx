import { AppShell } from '@/components/shell/app-shell';
import { cookies } from 'next/headers';
import { LOCALE_COOKIE, parseLocale } from '@/lib/i18n';
import { LandlordFrame } from '@/components/landlord/shared';

export default async function LandlordLayout({ children }: { children: React.ReactNode }) {
  const locale = parseLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  return (
    <AppShell surface="landlord" initialLocale={locale}>
      <LandlordFrame>{children}</LandlordFrame>
    </AppShell>
  );
}

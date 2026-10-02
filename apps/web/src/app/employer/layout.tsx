import { AppShell } from '@/components/shell/app-shell';
import { EmployerScopeProvider } from '@/components/employer/scope';
import { cookies } from 'next/headers';
import { LOCALE_COOKIE, parseLocale } from '@/lib/i18n';

export default async function EmployerLayout({ children }: { children: React.ReactNode }) {
  const initialLocale = parseLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  return (
    <EmployerScopeProvider>
      <AppShell surface="employer" initialLocale={initialLocale}>
        {children}
      </AppShell>
    </EmployerScopeProvider>
  );
}

import type { Metadata } from "next";
import { cookies } from "next/headers";
import { NewcomerShell } from "@/components/newcomer/newcomer-shell";
import { PersonLink } from "@/components/newcomer/person-link";
import { LOCALE_COOKIE, parseLocale } from "@/lib/i18n";
import { I18nProvider } from "@/lib/i18n/provider";

export const metadata: Metadata = { title: "Your relocation" };

export default async function NewcomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = parseLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  return (
    <I18nProvider initial={locale}>
      <PersonLink />
      <NewcomerShell>{children}</NewcomerShell>
    </I18nProvider>
  );
}

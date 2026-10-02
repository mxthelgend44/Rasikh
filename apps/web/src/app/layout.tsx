import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "@fontsource-variable/noto-sans-arabic";
import "./globals.css";
import "./motion.css";
import { THEME_BOOT } from "@/lib/theme-boot";
import { directionOf, LOCALE_COOKIE, parseLocale } from "@/lib/i18n";
import { DemoGuide } from "@/components/tour/demo-guide";
import { LiveToasts } from "@/components/live/live-toasts";
import { getStore } from "@/server/store";
import { StoreProvider } from "@/store/provider";

/** The shared state is live, so no page may be prerendered or cached. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Rasikh", template: "%s · Rasikh" },
  description: "The landing OS for Abu Dhabi.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
  themeColor: "#f3f3f3",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = parseLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  return (
    <html lang={locale} dir={directionOf(locale)} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body>
        <StoreProvider initial={getStore().snapshot()}>
          {children}
          <LiveToasts />
          <DemoGuide />
        </StoreProvider>
      </body>
    </html>
  );
}

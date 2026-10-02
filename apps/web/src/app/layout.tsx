import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import './globals.css';
import { THEME_BOOT } from '@/lib/theme-boot';
import { getStore } from '@/server/store';
import { StoreProvider } from '@/store/provider';

/** The shared state is live, so no page may be prerendered or cached. */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { default: 'Rasikh', template: '%s · Rasikh' },
  description: 'The landing OS for Abu Dhabi.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light dark',
  themeColor: '#f3f3f3',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body>
        <StoreProvider initial={getStore().snapshot()}>{children}</StoreProvider>
      </body>
    </html>
  );
}

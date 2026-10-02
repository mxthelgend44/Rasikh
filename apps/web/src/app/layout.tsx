import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/inter';
import './globals.css';
import { THEME_BOOT } from '@/lib/theme-boot';

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
      <body>{children}</body>
    </html>
  );
}

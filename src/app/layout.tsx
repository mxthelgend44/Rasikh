import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '@fontsource-variable/inter';
import './globals.css';
import './dashboard.css';
import { FirebaseAnalytics } from '@/components/firebase-analytics';

export const metadata: Metadata = {
  title: 'Rasikh | Your Abu Dhabi move',
  description:
    'Keep your Abu Dhabi move in one place with steps, document tracking and places to explore.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <FirebaseAnalytics />
        {children}
      </body>
    </html>
  );
}

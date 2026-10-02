import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '@fontsource-variable/inter';
import './globals.css';
import { FirebaseAnalytics } from '@/components/firebase-analytics';

export const metadata: Metadata = {
  title: 'Rasikh | A clearer way to make Abu Dhabi home',
  description:
    'Explore a clearer, more human journey for moving to Abu Dhabi with work, home and family in one view.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <FirebaseAnalytics />
        {children}
      </body>
    </html>
  );
}

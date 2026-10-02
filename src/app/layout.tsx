import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { FirebaseAnalytics } from '@/components/firebase-analytics';

export const metadata: Metadata = {
  title: 'Rasikh',
  description: 'Relocation and company landing in Abu Dhabi.',
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

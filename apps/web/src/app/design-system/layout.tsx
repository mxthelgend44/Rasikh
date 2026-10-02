import type { Metadata } from 'next';
import { AppShell } from '@/components/shell/app-shell';

export const metadata: Metadata = {
  title: { default: 'Design system', template: '%s · Design system' },
  robots: { index: false },
};

export default function DesignSystemLayout({ children }: { children: React.ReactNode }) {
  return <AppShell surface="design">{children}</AppShell>;
}

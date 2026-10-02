import { AppShell } from '@/components/shell/app-shell';

export default function LandlordLayout({ children }: { children: React.ReactNode }) {
  return <AppShell surface="landlord">{children}</AppShell>;
}

import { AppShell } from '@/components/shell/app-shell';

export default function BankLayout({ children }: { children: React.ReactNode }) {
  return <AppShell surface="bank">{children}</AppShell>;
}

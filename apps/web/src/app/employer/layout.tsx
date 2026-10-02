import { AppShell } from '@/components/shell/app-shell';

export default function EmployerLayout({ children }: { children: React.ReactNode }) {
  return <AppShell surface="employer">{children}</AppShell>;
}

import Link from 'next/link';
import { Menu as MenuIcon } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { BrandMark } from '@/components/shell/brand-mark';
import { OrgSwitcher } from '@/components/shell/org-switcher';
import { SurfaceLinks } from '@/components/shell/surface-links';
import { ThemeToggle } from '@/components/shell/theme-toggle';
import type { SurfaceId } from '@/config/surfaces';

export interface TopBarProps {
  surface: SurfaceId;
  orgs: string[];
  org: string;
  onOrgChange: (org: string) => void;
  onOpenNav: () => void;
  navOpen: boolean;
  user: string;
}

export function TopBar({ surface, orgs, org, onOrgChange, onOpenNav, navOpen, user }: TopBarProps) {
  return (
    <header className="flex h-topbar shrink-0 items-center gap-1 px-4 max-sm:px-3">
      <Button
        variant="ghost"
        iconOnly
        aria-label="Open navigation"
        aria-expanded={navOpen}
        icon={<MenuIcon />}
        onClick={onOpenNav}
        className="me-1 md:hidden"
      />
      <Link
        href="/"
        className="flex items-center gap-2 rounded-md py-1 pe-2 ps-1 text-body font-medium text-fg"
      >
        <BrandMark />
        <span className="max-sm:sr-only">Rasikh</span>
      </Link>
      <span aria-hidden className="px-0.5 text-body text-fg-placeholder max-sm:hidden">
        /
      </span>
      <OrgSwitcher orgs={orgs} value={org} onChange={onOrgChange} />
      <div className="min-w-0 flex-1" />
      <SurfaceLinks active={surface} />
      <ThemeToggle />
      <Avatar name={user} className="ms-1" />
    </header>
  );
}

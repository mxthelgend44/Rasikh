'use client';

import { ChevronsUpDown } from 'lucide-react';
import { Menu } from '@/components/ui/menu';

export interface OrgSwitcherProps {
  orgs: string[];
  value: string;
  onChange: (org: string) => void;
}

export function OrgSwitcher({ orgs, value, onChange }: OrgSwitcherProps) {
  return (
    <Menu
      label="Switch organisation"
      items={orgs.map((org) => ({
        id: org,
        label: org,
        selected: org === value,
        onSelect: () => onChange(org),
      }))}
      trigger={({ 'data-open': open, ...props }) => (
        <button
          type="button"
          data-open={open}
          className="flex h-8 max-w-[11rem] items-center gap-1.5 rounded-md px-2 text-body font-medium text-fg transition-colors hover:bg-hover data-[open=true]:bg-hover sm:max-w-none"
          {...props}
        >
          <span className="truncate">{value}</span>
          <ChevronsUpDown aria-hidden className="size-3.5 text-fg-tertiary" />
        </button>
      )}
    />
  );
}

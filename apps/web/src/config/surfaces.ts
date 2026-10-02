import {
  Activity,
  Building2,
  FileCheck,
  FileText,
  CalendarDays,
  Gauge,
  LayoutGrid,
  Palette,
  Handshake,
  Landmark,
  Route,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';

export type SurfaceId = 'employer' | 'landlord' | 'bank' | 'design';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** `exact` matches only the href itself; `prefix` also matches sub-routes. */
  match: 'exact' | 'prefix';
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export interface Surface {
  id: SurfaceId;
  label: string;
  href: string;
  /** Organisations the signed-in user can act for. The first is the default. */
  orgs: string[];
  /** Signed-in persona shown in the top bar. */
  user: string;
  nav: NavGroup[];
}

export const SURFACES: Record<SurfaceId, Surface> = {
  employer: {
    id: 'employer',
    label: 'Employer',
    href: '/employer',
    orgs: ['Gulf Meridian Technologies', 'Northwind Analytics'],
    user: 'Layla Haddad',
    nav: [
      {
        label: 'Relocation',
        items: [
          { label: 'Overview', href: '/employer', icon: Gauge, match: 'exact' },
          { label: 'Hires', href: '/employer/hires', icon: Users, match: 'prefix' },
        ],
      },
      {
        label: 'Expansion',
        items: [
          { label: 'Setup roadmap', href: '/employer/expansion', icon: Building2, match: 'exact' },
          { label: 'Team move', href: '/employer/expansion/team', icon: Route, match: 'prefix' },
        ],
      },
      {
        label: 'Safety',
        items: [
          { label: 'Guard log', href: '/employer/guard', icon: ShieldCheck, match: 'prefix' },
        ],
      },
    ],
  },
  landlord: {
    id: 'landlord',
    label: 'Landlord',
    href: '/landlord',
    orgs: ['Al Reem Residences'],
    user: 'Omar Al Mansoori',
    nav: [
      {
        label: 'Leasing',
        items: [
          { label: 'Overview', href: '/landlord', icon: Gauge, match: 'exact' },
          {
            label: 'Applications',
            href: '/landlord/applications',
            icon: FileCheck,
            match: 'prefix',
          },
          { label: 'Properties', href: '/landlord/properties', icon: Building2, match: 'prefix' },
          { label: 'Leases', href: '/landlord/leases', icon: FileText, match: 'prefix' },
          { label: 'Viewings', href: '/landlord/viewings', icon: CalendarDays, match: 'prefix' },
        ],
      },
    ],
  },
  bank: {
    id: 'bank',
    label: 'Bank',
    href: '/bank',
    orgs: ['Saadiyat Commercial Bank'],
    user: 'Priya Nair',
    nav: [
      {
        label: 'Onboarding',
        items: [
          { label: 'Overview', href: '/bank', icon: Gauge, match: 'exact' },
          { label: 'Applications', href: '/bank/applications', icon: Landmark, match: 'prefix' },
          { label: 'Employer partners', href: '/bank/partners', icon: Handshake, match: 'prefix' },
        ],
      },
    ],
  },
  design: {
    id: 'design',
    label: 'Design system',
    href: '/design-system',
    orgs: ['Rasikh design system'],
    user: 'Design',
    nav: [
      {
        label: 'Foundations',
        items: [{ label: 'Tokens', href: '/design-system', icon: Palette, match: 'exact' }],
      },
      {
        label: 'Library',
        items: [
          {
            label: 'Components',
            href: '/design-system/components',
            icon: LayoutGrid,
            match: 'prefix',
          },
        ],
      },
      {
        label: 'Tools',
        items: [
          { label: 'Live state', href: '/design-system/state', icon: Activity, match: 'prefix' },
        ],
      },
    ],
  },
};

/** Surfaces shown in the top-bar switcher, in order. */
export const SURFACE_ORDER: SurfaceId[] = ['employer', 'landlord', 'bank'];

import type { MessageKey, Translate } from '@/lib/i18n';

const LABEL_KEYS: Record<string, MessageKey> = {
  Employer: 'shell.employer',
  Landlord: 'shell.landlord',
  Bank: 'shell.bank',
  Newcomer: 'shell.newcomer',
  Relocation: 'shell.relocation',
  Expansion: 'shell.expansion',
  Safety: 'shell.safety',
  Leasing: 'shell.leasing',
  Onboarding: 'shell.onboarding',
  Foundations: 'shell.foundations',
  Library: 'shell.library',
  Tools: 'shell.tools',
  Overview: 'shell.overview',
  Hires: 'shell.hires',
  'Setup roadmap': 'shell.setup',
  'Team move': 'shell.team',
  'Guard log': 'shell.guard',
  Applications: 'shell.applications',
  Properties: 'shell.properties',
  Leases: 'shell.leases',
  Viewings: 'shell.viewings',
  'Employer partners': 'shell.partners',
  Tokens: 'shell.tokens',
  Components: 'shell.components',
  'Live state': 'shell.state',
};

export function navLabel(label: string, translate: Translate): string {
  const key = LABEL_KEYS[label];
  return key ? translate(key) : label;
}

import { buildSetupSteps } from '../expansion';
import { nextId } from '../ids';
import { unlockSteps } from '../roadmap';
import type { AgentAction, Company, TeamMember, Viewing } from '../types';
import { ago } from './time';

export function seedExpansion(counters: Record<string, number>) {
  const company: Company = {
    id: 'company_seed_gulf_meridian',
    employerId: 'emp_gulf_meridian',
    name: 'Gulf Meridian Abu Dhabi branch',
    homeCountry: 'United Kingdom',
    industry: 'Technology',
    activities: ['Enterprise software', 'Data analytics'],
    teamSize: 3,
    timeline: 'First team moving this quarter',
    createdAt: ago(8),
    recommendation: {
      generatedBy: 'demo',
      recommended: 'adgm',
      disclaimer:
        'Illustrative demo guidance. Confirm the setup route and requirements with the relevant authority.',
      options: [
        {
          kind: 'adgm',
          label: 'ADGM',
          fit: 'strong',
          reasons: ['The demo company plans an office on Al Maryah Island.'],
          tradeoffs: ['Confirm that the planned activities are eligible before choosing a route.'],
        },
        {
          kind: 'mainland',
          label: 'Abu Dhabi mainland',
          fit: 'possible',
          reasons: ['The demo company plans to serve clients across Abu Dhabi.'],
          tradeoffs: ['Office and licence requirements depend on the selected activities.'],
        },
      ],
    },
  };
  const setupSteps = buildSetupSteps(company.id, 'adgm', (key) => `setup_${company.id}_${key}`);
  const tradeName = setupSteps.find((step) => step.key === 'trade_name')!;
  tradeName.status = 'done';
  tradeName.completedAt = ago(5);
  const unlocked = unlockSteps(setupSteps);
  unlocked.find((step) => step.key === 'license')!.status = 'in_progress';
  const teamMembers: TeamMember[] = [
    {
      id: nextId(counters, 'team'),
      companyId: company.id,
      fullName: 'Eleanor Brooks',
      nationality: 'British',
      role: 'Engineering manager',
      originCity: 'London',
      originCountry: 'United Kingdom',
      family: { spouse: true, children: 1 },
      estMonthlySalaryAed: 34_000,
    },
    {
      id: nextId(counters, 'team'),
      companyId: company.id,
      fullName: 'Arjun Nair',
      nationality: 'Indian',
      role: 'Data engineer',
      originCity: 'Bengaluru',
      originCountry: 'India',
      family: { spouse: false, children: 0 },
      estMonthlySalaryAed: 26_000,
    },
    {
      id: nextId(counters, 'team'),
      companyId: company.id,
      fullName: 'Hana Farouk',
      nationality: 'Egyptian',
      role: 'Client services lead',
      originCity: 'Cairo',
      originCountry: 'Egypt',
      family: { spouse: false, children: 0 },
      estMonthlySalaryAed: 23_000,
    },
  ];
  const agentAction: AgentAction = {
    id: nextId(counters, 'act'),
    caseId: company.id,
    caseType: 'company',
    at: ago(5),
    kind: 'roadmap_generated',
    summary: 'Prepared a demo setup roadmap for the Abu Dhabi branch',
    reasoning:
      'The demo trade-name step is complete and licence preparation is underway. No authority application has been sent.',
    status: 'done',
  };
  return { companies: [company], setupSteps: unlocked, teamMembers, agentActions: [agentAction] };
}

export function seedViewings(counters: Record<string, number>): Viewing[] {
  return [
    {
      id: nextId(counters, 'view'),
      landlordId: 'landlord_al_reem',
      propertyId: 'prop_maryah_1706',
      applicationId: 'app_seed_05',
      startsAt: '2026-10-12T11:00:00+04:00',
      durationMinutes: 30,
      note: 'Demo viewing recorded locally; no invitation has been sent.',
      status: 'planned',
      createdAt: ago(1),
    },
  ];
}

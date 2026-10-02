import { describe, expect, it } from 'vitest';
import { demoNow } from '../clock';
import { employerMetrics, hireStage, hireStatus, stepsOf } from '../selectors';
import { createSeed } from './index';

const state = createSeed(1_700_000_000_000);
const hires = Object.values(state.hires);

describe('seed integrity', () => {
  it('has nine hires with unique ids', () => {
    expect(hires).toHaveLength(9);
    expect(new Set(hires.map((hire) => hire.id)).size).toBe(9);
  });

  it('does not seed the demo fixtures that the demo creates live', () => {
    expect(state.hires['hire_demo_001']).toBeUndefined();
    expect(state.companies['company_demo_001']).toBeUndefined();
  });

  it('points every record at something that exists', () => {
    for (const step of Object.values(state.steps)) expect(state.hires[step.hireId]).toBeDefined();
    for (const doc of Object.values(state.documents)) expect(state.hires[doc.hireId]).toBeDefined();
    for (const action of Object.values(state.agentActions))
      expect(
        action.caseType === 'hire' ? state.hires[action.caseId] : state.companies[action.caseId],
      ).toBeDefined();
    for (const grant of Object.values(state.grants))
      expect(state.hires[grant.hireId]).toBeDefined();
    for (const approval of Object.values(state.approvals)) {
      expect(state.steps[approval.stepId]).toBeDefined();
      if (approval.applicationId) expect(state.applications[approval.applicationId]).toBeDefined();
    }
    for (const decision of Object.values(state.decisions)) {
      expect(state.applications[decision.applicationId]).toBeDefined();
    }
    for (const application of Object.values(state.applications)) {
      expect(state.hires[application.hireId]).toBeDefined();
      const party = state.landlords[application.partyId] ?? state.banks[application.partyId];
      expect(party).toBeDefined();
      if (application.propertyId) expect(state.properties[application.propertyId]).toBeDefined();
    }
    for (const property of Object.values(state.properties)) {
      expect(state.landlords[property.landlordId]).toBeDefined();
    }
  });

  it('gives every agent action and risk point a reason', () => {
    for (const action of Object.values(state.agentActions))
      expect(action.reasoning.length).toBeGreaterThan(15);
    for (const application of Object.values(state.applications)) {
      for (const point of application.risk?.points ?? [])
        expect(point.reason.length).toBeGreaterThan(15);
    }
  });

  it('keeps step dependencies consistent: nothing is open before its dependencies', () => {
    for (const hire of hires) {
      const steps = stepsOf(state, hire.id);
      const byKey = new Map(steps.map((step) => [step.key, step]));
      for (const step of steps) {
        if (step.status === 'locked') continue;
        for (const key of step.dependsOn) {
          const dependency = byKey.get(key);
          const ok =
            step.unlockAfter === 'applied'
              ? dependency?.status === 'waiting' || dependency?.status === 'done'
              : dependency?.status === 'done';
          expect(
            ok,
            `${hire.id}: ${step.key} is ${step.status} but ${key} is ${dependency?.status}`,
          ).toBe(true);
        }
      }
    }
  });

  it('uses Abu Dhabi areas and AED-style estimates', () => {
    for (const hire of hires) expect(hire.estMonthlySalaryAed).toBeGreaterThan(5_000);
    for (const property of Object.values(state.properties)) {
      expect(['Al Reem Island', 'Al Maryah Island', 'Khalifa City', 'Yas Island']).toContain(
        property.area,
      );
    }
  });

  it('only approves applications whose hire has the matching step done', () => {
    for (const application of Object.values(state.applications)) {
      if (application.state !== 'approved') continue;
      const key = application.kind === 'rental' ? 'housing' : 'bank_account';
      const step = stepsOf(state, application.hireId).find((s) => s.key === key);
      expect(step?.status, `${application.id}`).toBe('done');
    }
  });

  it('keeps approved rental units unique and payment schedules accepted by the property', () => {
    const approved = Object.values(state.applications).filter(
      (application) => application.kind === 'rental' && application.state === 'approved',
    );
    expect(new Set(approved.map((application) => application.propertyId)).size).toBe(
      approved.length,
    );
    for (const decision of Object.values(state.decisions)) {
      const application = state.applications[decision.applicationId];
      if (application.kind !== 'rental' || decision.terms?.cheques === undefined) continue;
      expect(state.properties[application.propertyId!].chequeOptions).toContain(
        decision.terms.cheques,
      );
    }
  });

  it('populates expansion and viewing records under their existing organisations', () => {
    const company = state.companies.company_seed_gulf_meridian;
    expect(company.employerId).toBe('emp_gulf_meridian');
    expect(
      Object.values(state.teamMembers).filter((member) => member.companyId === company.id),
    ).toHaveLength(company.teamSize);
    for (const step of Object.values(state.setupSteps))
      expect(state.companies[step.companyId]).toBeDefined();
    for (const viewing of Object.values(state.viewings)) {
      expect(state.properties[viewing.propertyId].landlordId).toBe(viewing.landlordId);
      if (viewing.applicationId)
        expect(state.applications[viewing.applicationId].propertyId).toBe(viewing.propertyId);
    }
  });

  it('creates isolated snapshots so editing one seed does not alter the next reset', () => {
    const first = createSeed(0);
    first.properties.prop_reem_2207.name = 'Changed';
    first.applications.app_seed_05.disclosed.push({ label: 'health', derived: false });
    const second = createSeed(0);
    expect(second.properties.prop_reem_2207.name).not.toBe('Changed');
    expect(second.applications.app_seed_05.disclosed.some((item) => item.label === 'health')).toBe(
      false,
    );
  });
});

describe('seed shows a realistic employer', () => {
  const now = demoNow(state, 1_700_000_000_000);
  const stages = Object.fromEntries(
    hires.map((hire) => [hire.id, hireStage(stepsOf(state, hire.id))]),
  );
  const statuses = Object.fromEntries(
    hires.map((hire) => [hire.id, hireStatus(stepsOf(state, hire.id))]),
  );

  it('spreads hires across stages and statuses', () => {
    expect(new Set(Object.values(stages)).size).toBeGreaterThanOrEqual(5);
    expect(Object.values(statuses)).toContain('blocked');
    expect(Object.values(statuses)).toContain('settled');
    expect(Object.values(statuses)).toContain('waiting');
  });

  it('computes employer metrics', () => {
    const metrics = employerMetrics(state, 'emp_gulf_meridian', now);
    expect(metrics.hires).toBe(9);
    expect(metrics.settled).toBe(2);
    expect(metrics.blocked).toBe(1);
    expect(metrics.onTrack).toBe(6);
    expect(metrics.averageDaysToSettled).toBeGreaterThan(25);
    expect(metrics.averageDaysToSettled).toBeLessThan(45);
  });

  it('has no hires for the expansion employer yet', () => {
    expect(employerMetrics(state, 'emp_northwind', now)).toMatchObject({
      hires: 0,
      averageDaysToSettled: null,
    });
  });
});

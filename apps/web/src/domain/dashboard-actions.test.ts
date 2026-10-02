import { describe, expect, it } from 'vitest';
import { applyAction, DomainError, type Action, type NewTeamMember } from './actions';
import { documentLabelsForKind } from './documents';
import { createSeed } from './seed';
import { stepsOf } from './selectors';
import type { AppState } from './types';

const NOW = 1_700_000_000_000;
const seed = () => createSeed(NOW);
const run = (state: AppState, action: Action) => applyAction(state, action, NOW + 1000);
const companyId = 'company_seed_gulf_meridian';
const employerId = 'emp_gulf_meridian';
const landlordId = 'landlord_al_reem';
const member: NewTeamMember = {
  fullName: 'Mina Saleh',
  nationality: 'Egyptian',
  role: 'Engineer',
  originCity: 'Cairo',
  originCountry: 'Egypt',
  family: { spouse: false, children: 1 },
  estMonthlySalaryAed: 29_000,
};
const decide = (applicationId: string, outcome: 'approved' | 'info_requested'): Action => ({
  type: 'application.decide',
  applicationId,
  outcome,
  note: 'Recorded demo decision.',
  decidedBy: 'Reviewer',
});

function pendingApproval(state: AppState) {
  return Object.values(state.approvals).find(
    (approval) => approval.hireId === 'hire_seed_04' && approval.status === 'pending',
  )!;
}

function rejectUnchanged(state: AppState, action: unknown) {
  const before = JSON.stringify(state);
  expect(() => run(state, action as Action)).toThrow(DomainError);
  expect(JSON.stringify(state)).toBe(before);
}

describe('runtime action validation', () => {
  it.each([
    { type: 'hire.create' },
    { type: 'hire.back', hireId: 'hire_seed_01', backed: 'false', by: 'HR' },
    { type: 'step.set_status', stepId: 'step_hire_seed_01_documents', status: 'approved' },
    {
      type: 'application.decide',
      applicationId: 'app_seed_05',
      outcome: 'approved',
      note: '',
      decidedBy: 'HR',
    },
    {
      type: 'grant.set',
      hireId: 'hire_seed_01',
      label: 'not_a_label',
      destination: 'landlord',
      granted: true,
    },
    {
      type: 'document.review',
      hireId: 'hire_seed_01',
      documentId: 'doc_degree_hire_seed_01',
      accept: true,
      fields: [{ key: 'name', label: 'Name', value: 'Example', confidence: 1.2 }],
    },
    {
      type: 'property.update',
      landlordId,
      propertyId: 'prop_reem_2207',
      patch: { landlordId: 'landlord_yas' },
    },
    { type: 'property.update', landlordId, propertyId: 'prop_reem_2207', patch: {} },
    { type: 'drop.table' },
    { type: 'hire.back', hireId: 'constructor', backed: true, by: 'HR' },
    {
      type: 'document.add',
      hireId: 'hire_seed_01',
      kind: 'passport',
      fileName: 'passport.pdf',
      labels: ['employment'],
      fields: [],
      reasoning: 'Invalid classification.',
    },
  ])('rejects malformed actions atomically: $type', (action) => rejectUnchanged(seed(), action));

  it('skips generated ids already used even if the counter is stale', () => {
    let state = seed();
    state.counters.team = 0;
    const before = Object.values(state.teamMembers);
    state = run(state, { type: 'team.add', companyId, employerId, member });
    expect(Object.values(state.teamMembers)).toHaveLength(before.length + 1);
    for (const existing of before) expect(state.teamMembers[existing.id]).toEqual(existing);
    expect(state.teamMembers.team_0004?.fullName).toBe(member.fullName);
  });
});

describe('application decisions and local consent', () => {
  it('checks current consent at approval time and preserves pending state on denial', () => {
    let state = seed();
    const approval = pendingApproval(state);
    state = run(state, {
      type: 'grant.set',
      hireId: approval.hireId,
      label: 'passport',
      destination: 'landlord',
      granted: false,
    });
    rejectUnchanged(state, {
      type: 'approval.decide',
      approvalId: approval.id,
      hireId: approval.hireId,
      approve: true,
    });
    expect(state.applications.app_seed_06?.state).toBe('awaiting_approval');
    expect(state.approvals[approval.id]?.status).toBe('pending');
    expect(state.guardChecks).toEqual(seed().guardChecks);
  });

  it('blocks raw salary disclosure even when passport consent exists', () => {
    const state = seed();
    state.applications.app_seed_06.disclosed.push({ label: 'salary', derived: false });
    rejectUnchanged(state, {
      type: 'approval.decide',
      approvalId: pendingApproval(state).id,
      approve: true,
    });
  });

  it('rejects another hire deciding a pending approval', () => {
    const state = seed();
    rejectUnchanged(state, {
      type: 'approval.decide',
      approvalId: pendingApproval(state).id,
      hireId: 'hire_seed_01',
      approve: true,
    });
  });

  it('rejects a decision from another organisation', () => {
    rejectUnchanged(seed(), { ...decide('app_seed_05', 'approved'), partyId: 'landlord_yas' });
  });

  it('request information then approval clears the old blocked and waiting reasons', () => {
    const requested = run(seed(), decide('app_seed_07', 'info_requested'));
    expect(
      stepsOf(requested, 'hire_seed_02').find((step) => step.key === 'bank_account')?.blockedReason,
    ).toBeDefined();
    const approved = run(requested, decide('app_seed_07', 'approved'));
    expect(
      stepsOf(approved, 'hire_seed_02').find((step) => step.key === 'bank_account'),
    ).toMatchObject({
      status: 'done',
      blockedReason: undefined,
      waitingOn: undefined,
    });
    expect(
      Object.values(approved.decisions).filter(
        (decision) => decision.applicationId === 'app_seed_07',
      ),
    ).toHaveLength(2);
    expect(approved.applications.app_seed_07.risk).toEqual(requested.applications.app_seed_07.risk);
  });

  it('starts review after information is requested without sharing new data', () => {
    const requested = run(seed(), decide('app_seed_07', 'info_requested'));
    const reviewing = run(requested, {
      type: 'application.start_review',
      applicationId: 'app_seed_07',
      partyId: 'bank_saadiyat',
    });
    expect(reviewing.applications.app_seed_07.state).toBe('under_review');
    expect(
      stepsOf(reviewing, 'hire_seed_02').find((step) => step.key === 'bank_account'),
    ).toMatchObject({ status: 'waiting', blockedReason: undefined });
    expect(reviewing.guardChecks).toEqual(requested.guardChecks);
    rejectUnchanged(reviewing, {
      type: 'application.start_review',
      applicationId: 'app_seed_07',
      partyId: 'bank_saadiyat',
    });
  });

  it('keeps terms pending until the correct newcomer accepts the existing offer', () => {
    const offered = run(seed(), {
      type: 'application.decide',
      applicationId: 'app_seed_05',
      partyId: landlordId,
      outcome: 'terms_offered',
      terms: { cheques: 4 },
      note: 'Four cheques offered.',
      decidedBy: 'Reviewer',
    });
    expect(offered.applications.app_seed_05.state).toBe('terms_offered');
    rejectUnchanged(offered, {
      type: 'application.accept_terms',
      applicationId: 'app_seed_05',
      hireId: 'hire_seed_02',
    });
    const accepted = run(offered, {
      type: 'application.accept_terms',
      applicationId: 'app_seed_05',
      hireId: 'hire_seed_05',
    });
    expect(accepted.applications.app_seed_05.state).toBe('approved');
    expect(
      Object.values(accepted.decisions)
        .filter((decision) => decision.applicationId === 'app_seed_05')
        .map((decision) => decision.outcome),
    ).toEqual(['terms_offered', 'approved']);
    expect(
      Object.values(accepted.approvals).find((approval) => approval.kind === 'terms')?.status,
    ).toBe('approved');
    expect(accepted.guardChecks).toEqual(offered.guardChecks);
    rejectUnchanged(accepted, {
      type: 'application.accept_terms',
      applicationId: 'app_seed_05',
      hireId: 'hire_seed_05',
    });
  });

  it('terms approval uses the same accepted terms and retains the offer', () => {
    const offered = run(seed(), {
      type: 'application.decide',
      applicationId: 'app_seed_05',
      outcome: 'terms_offered',
      terms: { cheques: 2 },
      note: 'Two cheques.',
      decidedBy: 'Reviewer',
    });
    const approval = Object.values(offered.approvals).find(
      (candidate) => candidate.kind === 'terms',
    )!;
    const accepted = run(offered, {
      type: 'approval.decide',
      approvalId: approval.id,
      hireId: 'hire_seed_05',
      approve: true,
    });
    expect(accepted.applications.app_seed_05.state).toBe('approved');
    expect(
      Object.values(accepted.decisions)
        .filter((decision) => decision.applicationId === 'app_seed_05')
        .at(-1)?.terms,
    ).toEqual({ cheques: 2 });
  });

  it('prevents two approved rentals for one unit, including deferred terms acceptance', () => {
    let state = seed();
    const approval = pendingApproval(state);
    state = run(state, { type: 'approval.decide', approvalId: approval.id, approve: true });
    state = run(state, {
      type: 'application.decide',
      applicationId: 'app_seed_06',
      outcome: 'terms_offered',
      terms: { cheques: 2 },
      note: 'Two cheques offered.',
      decidedBy: 'Reviewer',
    });
    state = run(state, decide('app_seed_05', 'approved'));
    rejectUnchanged(state, {
      type: 'application.accept_terms',
      applicationId: 'app_seed_06',
      hireId: 'hire_seed_04',
    });
    const offeredApproval = Object.values(state.approvals).find(
      (candidate) => candidate.kind === 'terms',
    )!;
    rejectUnchanged(state, {
      type: 'approval.decide',
      approvalId: offeredApproval.id,
      approve: true,
    });
    expect(state.applications.app_seed_06.state).toBe('terms_offered');
    expect(
      run(state, { type: 'approval.decide', approvalId: offeredApproval.id, approve: false })
        .applications.app_seed_06.state,
    ).toBe('declined');
  });

  it('keeps information requests available when another rental already occupies the unit', () => {
    let state = seed();
    state = run(state, {
      type: 'approval.decide',
      approvalId: pendingApproval(state).id,
      approve: true,
    });
    state = run(state, decide('app_seed_05', 'approved'));
    rejectUnchanged(state, decide('app_seed_06', 'approved'));
    expect(run(state, decide('app_seed_06', 'info_requested')).applications.app_seed_06.state).toBe(
      'needs_info',
    );
  });

  it('rejects unsupported payment schedules and bank cheque terms', () => {
    rejectUnchanged(seed(), { ...decide('app_seed_05', 'approved'), terms: { cheques: 3 } });
    rejectUnchanged(seed(), { ...decide('app_seed_07', 'approved'), terms: { cheques: 4 } });
  });

  it('declining a draft leaves no orphan approval application reference', () => {
    const state = seed();
    const after = run(state, {
      type: 'approval.decide',
      approvalId: pendingApproval(state).id,
      approve: false,
    });
    for (const approval of Object.values(after.approvals)) {
      if (approval.applicationId) expect(after.applications[approval.applicationId]).toBeDefined();
    }
  });

  it('rejects applications with a mismatched property or another hire step', () => {
    const state = seed();
    const draft: Action = {
      type: 'application.create',
      application: {
        hireId: 'hire_seed_08',
        kind: 'rental',
        partyId: landlordId,
        propertyId: 'prop_yas_0304',
        disclosed: [],
        employerBacked: true,
      },
      approval: {
        title: 'Review draft',
        detail: 'Demo details',
        stepId: 'step_hire_seed_08_housing',
      },
    };
    rejectUnchanged(state, draft);
    rejectUnchanged(state, {
      ...draft,
      application: { ...draft.application, propertyId: 'prop_reem_2207' },
      approval: { ...draft.approval, stepId: 'step_hire_seed_01_housing' },
    });
  });
});

describe('property and viewing records', () => {
  const createViewing: Action = {
    type: 'viewing.create',
    landlordId,
    viewing: {
      propertyId: 'prop_reem_2207',
      startsAt: '2026-10-13T10:00:00+04:00',
      durationMinutes: 30,
      note: 'Local demo viewing',
    },
  };

  it('creates and edits a property with stable ownership', () => {
    const state = seed();
    const property = {
      name: 'Al Reem Gardens Tower',
      area: 'Al Reem Island' as const,
      unit: '3001',
      bedrooms: 2,
      leaseRef: 'lease_reem_3001',
      estAnnualRentAed: 98_000,
      chequeOptions: [1, 2, 4],
    };
    const created = run(state, {
      type: 'property.create',
      landlordId,
      id: 'prop_custom_01',
      property,
    });
    expect(created.properties.prop_custom_01.landlordId).toBe(landlordId);
    const updated = run(created, {
      type: 'property.update',
      landlordId,
      propertyId: 'prop_custom_01',
      patch: { estAnnualRentAed: 110_000 },
    });
    expect(updated.properties.prop_custom_01.estAnnualRentAed).toBe(110_000);
    rejectUnchanged(updated, {
      type: 'property.update',
      landlordId: 'landlord_yas',
      propertyId: 'prop_custom_01',
      patch: { unit: '3002' },
    });
    rejectUnchanged(updated, {
      type: 'property.create',
      landlordId,
      id: 'prop_custom_01',
      property,
    });
  });

  it('protects existing leases and agreed cheque schedules', () => {
    rejectUnchanged(seed(), {
      type: 'property.update',
      landlordId,
      propertyId: 'prop_reem_0815',
      patch: { chequeOptions: [1, 2] },
    });
    rejectUnchanged(seed(), {
      type: 'property.update',
      landlordId,
      propertyId: 'prop_reem_2207',
      patch: { leaseRef: 'lease_reem_0815' },
    });
  });

  it('records viewings, detects overlaps, and cancels without sending an invitation', () => {
    const created = run(seed(), createViewing);
    const viewing = Object.values(created.viewings).find(
      (candidate) => candidate.propertyId === 'prop_reem_2207',
    )!;
    expect(viewing.status).toBe('planned');
    rejectUnchanged(created, createViewing);
    rejectUnchanged(created, {
      type: 'viewing.update',
      landlordId: 'landlord_yas',
      viewingId: viewing.id,
      patch: { status: 'cancelled' },
    });
    const cancelled = run(created, {
      type: 'viewing.update',
      landlordId,
      viewingId: viewing.id,
      patch: { status: 'cancelled' },
    });
    expect(cancelled.viewings[viewing.id].status).toBe('cancelled');
    expect(run(cancelled, createViewing).viewings).not.toEqual(cancelled.viewings);
    expect(cancelled.guardChecks).toEqual(created.guardChecks);
  });

  it('rejects cross-property application links and past times', () => {
    rejectUnchanged(seed(), {
      ...createViewing,
      viewing: { ...createViewing.viewing, applicationId: 'app_seed_05' },
    });
    rejectUnchanged(seed(), {
      ...createViewing,
      viewing: { ...createViewing.viewing, startsAt: '2026-10-09T10:00:00+04:00' },
    });
  });
});

describe('expansion and explicit document review', () => {
  it('adds team members under the correct employer and prevents duplicates', () => {
    rejectUnchanged(seed(), { type: 'team.add', companyId, employerId: 'emp_northwind', member });
    const added = run(seed(), { type: 'team.add', companyId, employerId, member });
    expect(added.companies[companyId].teamSize).toBe(4);
    expect(
      Object.values(added.teamMembers).find((candidate) => candidate.fullName === member.fullName)
        ?.hireId,
    ).toBeUndefined();
    rejectUnchanged(added, { type: 'team.add', companyId, employerId, member });
  });

  it('moves each team member once and starts late additions after quota completion', () => {
    let state = seed();
    for (const key of ['license', 'establishment_card', 'visa_quota']) {
      const step = Object.values(state.setupSteps).find(
        (candidate) => candidate.companyId === companyId && candidate.key === key,
      )!;
      state = run(state, { type: 'setup.set_status', stepId: step.id, employerId, status: 'done' });
    }
    const hireCount = Object.keys(state.hires).length;
    const added = run(state, { type: 'team.add', companyId, employerId, member });
    const transferred = Object.values(added.teamMembers).find(
      (candidate) => candidate.fullName === member.fullName,
    )!;
    expect(Object.keys(added.hires)).toHaveLength(hireCount + 1);
    expect(added.hires[transferred.hireId!].companyId).toBe(companyId);
    expect(stepsOf(added, transferred.hireId!).map((step) => step.key)).toContain(
      'family_sponsorship',
    );
    const quota = Object.values(added.setupSteps).find(
      (candidate) => candidate.companyId === companyId && candidate.key === 'visa_quota',
    )!;
    expect(
      Object.keys(run(added, { type: 'setup.set_status', stepId: quota.id, status: 'done' }).hires),
    ).toHaveLength(hireCount + 1);
  });

  it('preserves upload time and source when confirming corrected fields', () => {
    const uploaded = run(seed(), {
      type: 'document.add',
      hireId: 'hire_seed_01',
      kind: 'degree',
      fileName: 'attested-degree.pdf',
      source: 'demo',
      labels: ['degree'],
      fields: [],
      status: 'extracted',
      reasoning: 'Demo fields await your review.',
    });
    const document = uploaded.documents.doc_degree_hire_seed_01;
    const reviewed = applyAction(
      uploaded,
      {
        type: 'document.review',
        hireId: 'hire_seed_01',
        documentId: document.id,
        accept: true,
        fields: [{ key: 'name', label: 'Name', value: 'Samuel Okoye', confidence: 1 }],
      },
      NOW + 5000,
    );
    expect(reviewed.documents[document.id]).toMatchObject({
      source: 'demo',
      status: 'verified',
      uploadedAt: document.uploadedAt,
    });
    expect(reviewed.documents[document.id].reviewedAt).not.toBe(document.uploadedAt);
    expect(stepsOf(reviewed, 'hire_seed_01').find((step) => step.key === 'documents')?.status).toBe(
      'done',
    );
    rejectUnchanged(reviewed, {
      type: 'document.review',
      hireId: 'hire_seed_02',
      documentId: document.id,
      accept: true,
    });
  });

  it('labels every optional document kind without extending the shared contract', () => {
    for (const kind of [
      'residence_visa',
      'emirates_id',
      'tenancy_contract',
      'salary_certificate',
      'bank_statement',
    ] as const) {
      expect(documentLabelsForKind(kind).length).toBeGreaterThan(0);
    }
  });

  it('keeps live extraction confidence unavailable when the provider did not report it', () => {
    const upload: Action = {
      type: 'document.add',
      hireId: 'hire_seed_01',
      kind: 'degree',
      fileName: 'degree.pdf',
      labels: ['degree'],
      fields: [{ key: 'name', label: 'Name', value: 'Samuel Okoye', confidence: null }],
      source: 'vertex',
      reasoning: 'Fields returned by live extraction; confidence was not provided.',
    };
    const uploaded = run(seed(), upload);
    const reviewed = run(uploaded, {
      type: 'document.review',
      hireId: 'hire_seed_01',
      documentId: 'doc_degree_hire_seed_01',
      accept: true,
    });
    expect(reviewed.documents.doc_degree_hire_seed_01.fields[0].confidence).toBeNull();
    expect(reviewed.documents.doc_degree_hire_seed_01.source).toBe('vertex');
    rejectUnchanged(seed(), { ...upload, source: 'demo' });
  });

  it('preserves unmeasured confidence for user corrections to demo fields', () => {
    const state = seed();
    const document = state.documents.doc_degree_hire_seed_01;
    const reviewed = run(state, {
      type: 'document.review',
      hireId: document.hireId,
      documentId: document.id,
      accept: true,
      fields: [
        {
          key: 'qualification',
          label: 'Qualification',
          value: 'Corrected degree title',
          confidence: null,
        },
      ],
    });
    expect(reviewed.documents[document.id].fields[0].confidence).toBeNull();
    expect(reviewed.documents[document.id].source).toBe('demo');
    expect(reviewed.documents[document.id].uploadedAt).toBe(document.uploadedAt);
  });

  it('rejects stale reviews even when replacement upload times are in the same second', () => {
    const upload: Action = {
      type: 'document.add',
      hireId: 'hire_seed_01',
      kind: 'degree',
      fileName: 'replacement.pdf',
      labels: ['degree'],
      fields: [{ key: 'degree', label: 'Degree', value: 'First replacement', confidence: 0.9 }],
      reasoning: 'Illustrative replacement fields await review.',
      source: 'demo',
    };
    const first = run(seed(), upload);
    const firstDocument = first.documents.doc_degree_hire_seed_01;
    const second = run(first, {
      ...upload,
      fields: [{ key: 'degree', label: 'Degree', value: 'Second replacement', confidence: 0.8 }],
    });
    const secondDocument = second.documents.doc_degree_hire_seed_01;
    expect(firstDocument.uploadedAt).toBe(secondDocument.uploadedAt);
    expect(secondDocument.version).toBe(firstDocument.version + 1);
    rejectUnchanged(second, {
      type: 'document.review',
      hireId: 'hire_seed_01',
      documentId: secondDocument.id,
      expectedVersion: firstDocument.version,
      accept: true,
      fields: firstDocument.fields,
    });
    const accepted = run(second, {
      type: 'document.review',
      hireId: 'hire_seed_01',
      documentId: secondDocument.id,
      expectedVersion: secondDocument.version,
      accept: true,
    });
    expect(accepted.documents[secondDocument.id].fields[0].value).toBe('Second replacement');
    expect(accepted.documents[secondDocument.id].status).toBe('verified');
  });
});

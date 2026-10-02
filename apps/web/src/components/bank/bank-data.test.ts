import { describe, expect, it } from 'vitest';
import { applyAction } from '@/domain/actions';
import { createSeed } from '@/domain/seed';
import type { RelocationDocument } from '@/domain/types';
import {
  bankApplications,
  consentGaps,
  documentAccess,
  labelAccess,
  latestBankCheck,
  latestDecision,
} from './bank-data';

describe('bank recipient permission boundaries', () => {
  it('revoking salary permission hides the whole mixed employment and salary document', () => {
    const before = createSeed();
    const application = before.applications.app_seed_07;
    const offer = before.documents.doc_offer_letter_hire_seed_02;
    expect(documentAccess(before, application, offer)).toBe(true);
    const after = applyAction(before, {
      type: 'grant.set',
      hireId: application.hireId,
      label: 'salary',
      destination: 'bank',
      granted: false,
    });
    expect(labelAccess(after, application, 'employment')).toBe(true);
    expect(documentAccess(after, application, offer)).toBe(false);
    expect(consentGaps(after, application).map((item) => item.label)).toContain('salary');
  });

  it('does not reveal a bank draft even when the applicant has existing grants', () => {
    const state = createSeed();
    state.applications.app_seed_07.state = 'awaiting_approval';
    expect(bankApplications(state).some((item) => item.id === 'app_seed_07')).toBe(false);
    expect(labelAccess(state, state.applications.app_seed_07, 'passport')).toBe(false);
    expect(
      documentAccess(
        state,
        state.applications.app_seed_07,
        state.documents.doc_passport_hire_seed_02,
      ),
    ).toBe(false);
  });

  it('refuses documents with missing, unknown or incomplete labels', () => {
    const state = createSeed();
    const application = state.applications.app_seed_07;
    const offer = state.documents.doc_offer_letter_hire_seed_02;
    for (const labels of [[], ['employment'], ['employment', 'salary', 'unknown']]) {
      expect(documentAccess(state, application, { ...offer, labels } as RelocationDocument)).toBe(
        false,
      );
    }
  });

  it('a derived bank salary signal still needs the current salary grant', () => {
    const state = createSeed();
    const application = state.applications.app_seed_07;
    application.disclosed = [{ label: 'salary', derived: true }];
    const revoked = applyAction(state, {
      type: 'grant.set',
      hireId: application.hireId,
      label: 'salary',
      destination: 'bank',
      granted: false,
    });
    expect(consentGaps(revoked, application).map((item) => item.label)).toEqual(['salary']);
    expect(labelAccess(state, application, 'salary')).toBe(false);
  });

  it('historical approval never substitutes for current consent and excludes other bank scopes', () => {
    const state = createSeed();
    const approved = state.applications.app_seed_08;
    state.grants = Object.fromEntries(
      Object.entries(state.grants).filter(
        ([, grant]) => !(grant.hireId === approved.hireId && grant.destination === 'bank'),
      ),
    );
    expect(approved.state).toBe('approved');
    expect(documentAccess(state, approved, state.documents.doc_passport_hire_seed_03)).toBe(false);
    expect(
      labelAccess(
        state,
        { ...state.applications.app_seed_07, partyId: 'another_bank' },
        'passport',
      ),
    ).toBe(false);
  });

  it('keeps an explicit current Guard denial closed even with an active grant', () => {
    const state = createSeed();
    const application = state.applications.app_seed_07;
    state.guardChecks.check_denied = {
      id: 'check_denied',
      caseId: application.hireId,
      at: '2026-10-10T10:00:00+04:00',
      tool: 'review_bank_application',
      destination: 'bank',
      decision: 'deny',
      reason: 'Guard unavailable; sharing stopped.',
      policyRule: 'guard.fail_closed',
      blockedLabels: [],
    };
    expect(labelAccess(state, application, 'passport')).toBe(false);
    expect(documentAccess(state, application, state.documents.doc_offer_letter_hire_seed_02)).toBe(
      false,
    );
  });

  it('uses the later Guard entry when an allow and deny arrive in the same second', () => {
    const state = createSeed();
    const application = state.applications.app_seed_07;
    const common = {
      caseId: application.hireId,
      at: '2026-10-10T10:00:00+04:00',
      tool: 'review_bank_application',
      destination: 'bank' as const,
      policyRule: 'guard.fail_closed',
      blockedLabels: [],
    };
    state.guardChecks.same_second_allow = {
      ...common,
      id: 'same_second_allow',
      decision: 'allow',
      reason: 'Allowed first.',
    };
    state.guardChecks.same_second_deny = {
      ...common,
      id: 'same_second_deny',
      decision: 'deny',
      reason: 'Denied later.',
    };
    expect(latestBankCheck(state, application.hireId)?.id).toBe('same_second_deny');
    expect(documentAccess(state, application, state.documents.doc_passport_hire_seed_02)).toBe(
      false,
    );
  });

  it('uses the later decision when a request and approval arrive in the same second', () => {
    const state = createSeed();
    const common = {
      applicationId: 'app_seed_07',
      decidedAt: '2026-10-10T10:00:00+04:00',
      decidedBy: 'Priya Nair',
    };
    state.decisions.same_second_request = {
      ...common,
      id: 'same_second_request',
      outcome: 'info_requested',
      note: 'Requested more evidence first.',
    };
    state.decisions.same_second_approval = {
      ...common,
      id: 'same_second_approval',
      outcome: 'approved',
      note: 'Approved with evidence later.',
    };
    expect(latestDecision(state, 'app_seed_07')?.id).toBe('same_second_approval');
  });
});

import { policyFor } from '@/domain/policy';
import { stepsOf } from '@/domain/selectors';
import type { AppState, StepKey } from '@/domain/types';
import { AiError, isRecord } from './errors';
import type { ExplanationInput } from './validation';

const TITLES: Record<StepKey, string> = {
  documents: 'Review relocation documents',
  residence_visa: 'Residence visa',
  emirates_id: 'Emirates ID',
  housing: 'Find a home',
  tenancy_registration: 'Tenancy registration',
  bank_account: 'Bank account',
  health_insurance: 'Insurance enrolment',
  family_sponsorship: 'Dependent sponsorship',
  school: 'School registration',
};

/** Intentionally never reads profile names, amounts, document values, free-form notes or addresses. */
export function explanationContext(state: AppState, input: ExplanationInput) {
  if (!Object.hasOwn(state.hires, input.hireId))
    throw new AiError('unknown_case', 'This newcomer case was not found.', 404);
  const steps = stepsOf(state, input.hireId);
  const current = steps.find((step) => step.status !== 'done');
  const approvals = Object.values(state.approvals).filter(
    (approval) => approval.hireId === input.hireId && approval.status === 'pending',
  );
  const application = input.applicationId ? state.applications[input.applicationId] : undefined;
  if (input.applicationId && (!application || application.hireId !== input.hireId)) {
    throw new AiError(
      'unknown_application',
      'This application was not found for this newcomer.',
      404,
    );
  }
  const disclosureNotes: string[] = [];
  const disclosures =
    application?.disclosed.map((item) => {
      const destination = application.kind === 'rental' ? ('landlord' as const) : ('bank' as const);
      const policy = policyFor(item.label, destination);
      const grant = Object.values(state.grants).some(
        (permission) =>
          permission.hireId === input.hireId &&
          permission.label === item.label &&
          permission.destination === destination,
      );
      const allowed =
        policy === 'allow' ||
        (policy === 'consent' && grant) ||
        (policy === 'derived_only' && item.derived);
      disclosureNotes.push(
        `${item.label.replaceAll('_', ' ')}: ${allowed ? 'currently permitted' : 'withheld until approved'} for ${destination}${item.derived ? ' as a derived signal' : ''}.`,
      );
      return { label: item.label, derived: item.derived, allowed };
    }) ?? [];
  const requiresApproval =
    !!current &&
    (current.status === 'needs_approval' ||
      approvals.some((approval) => approval.stepId === current.id));
  return {
    stepId: current?.id ?? null,
    requiresApproval,
    disclosureNotes,
    projection: {
      locale: input.locale,
      journey: 'illustrative_relocation',
      next_step: current
        ? {
            key: current.key,
            title: TITLES[current.key],
            status: current.status,
            owner: current.owner,
            dependencies: current.dependsOn,
            requires_approval: requiresApproval,
          }
        : null,
      completed_steps: steps.filter((step) => step.status === 'done').map((step) => step.key),
      application: application
        ? { kind: application.kind, state: application.state, disclosures }
        : null,
      execution: 'explanation_only',
    },
  };
}

export function validateExplanation(value: unknown): {
  headline: string;
  nextAction: string;
  why: string;
} {
  if (!isRecord(value) || Object.keys(value).sort().join(',') !== 'headline,nextAction,why') {
    throw new AiError('invalid_model_response', 'The AI explanation could not be verified.');
  }
  for (const [key, limit] of [
    ['headline', 160],
    ['nextAction', 500],
    ['why', 800],
  ] as const) {
    const text = value[key];
    if (
      typeof text !== 'string' ||
      !text.trim() ||
      text.length > limit ||
      /[\x00-\x1f]|https?:\/\/|\bAED\b|\b(?:passport|account|visa)\s*(?:number|no[.:])\b/i.test(
        text,
      )
    ) {
      throw new AiError('invalid_model_response', 'The AI explanation could not be verified.');
    }
  }
  return value as { headline: string; nextAction: string; why: string };
}

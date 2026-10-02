'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Ban,
  Check,
  CircleAlert,
  CircleCheck,
  Clock,
  EyeOff,
  FileText,
  KeyRound,
  MessageSquare,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { DATA_LABELS, type DataLabel, type Destination } from '@rasikh/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Illustration } from '@/components/ui/illustration';
import { Switch } from '@/components/ui/switch';
import type { Action } from '@/domain/actions';
import { DOCUMENT_NAMES } from '@/domain/documents';
import { policyFor } from '@/domain/policy';
import type {
  AgentAction,
  AppState,
  Application,
  Approval,
  Decision,
  Hire,
  Locale,
} from '@/domain/types';
import { formatAed, formatDate } from '@/lib/format';
import { intlTag, type MessageKey } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/provider';
import { useNewcomer } from '@/store/person';
import { useStore } from '@/store/provider';
import { agentText, destinationText, EVENT_COPY, knownDemoNote } from './agent-copy';
import { localizedRecord, translatedRecord } from './localized-record';
import { HousingDraftCard } from './housing-draft-card';
import { FEED_TONE } from './status';

function eventDate(at: string, locale: Locale): string {
  return new Intl.DateTimeFormat(intlTag(locale), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Dubai',
  }).format(new Date(at));
}

function recipientOf(state: AppState, application: Application): string | undefined {
  return application.kind === 'rental'
    ? state.landlords[application.partyId]?.name
    : state.banks[application.partyId]?.name;
}

function latestDecision(state: AppState, applicationId: string): Decision | undefined {
  return Object.values(state.decisions)
    .filter((decision) => decision.applicationId === applicationId)
    .sort((a, b) => b.decidedAt.localeCompare(a.decidedAt) || b.id.localeCompare(a.id))[0];
}

function hasGrant(
  state: AppState,
  hireId: string,
  label: DataLabel,
  destination: Destination,
): boolean {
  return Object.values(state.grants).some(
    (grant) =>
      grant.hireId === hireId && grant.label === label && grant.destination === destination,
  );
}

function prohibited(application: Application, destination: Destination): boolean {
  return application.disclosed.some(({ label, derived }) => {
    const policy = policyFor(label, destination);
    return (
      !['allow', 'consent', 'derived_only'].includes(policy) ||
      (policy === 'derived_only' && !derived)
    );
  });
}

function approvalTitle(
  approval: Approval,
  application: Application | undefined,
  locale: Locale,
): string {
  return agentText(
    locale,
    approval.kind === 'terms'
      ? 'termsTitle'
      : application?.kind === 'bank_account' || approval.destination === 'bank'
        ? 'bankTitle'
        : 'rentalTitle',
  );
}

function initialOf(name: string): string {
  return Array.from(name.trim())[0]?.toUpperCase() ?? '';
}

function OriginalNote({ note, label }: { note: string; label: string }) {
  if (!note.trim()) return null;
  return (
    <details className="mt-2 text-label text-fg-secondary">
      <summary className="cursor-pointer rounded py-1 text-fg-tertiary">{label}</summary>
      <p dir="auto" className="mt-1 whitespace-pre-wrap break-words rounded-lg bg-subtle p-3">
        {note}
      </p>
    </details>
  );
}

function ApplicationDetails({
  application,
  hire,
  decision,
}: {
  application: Application;
  hire: Hire;
  decision?: Decision;
}) {
  const { state } = useNewcomer();
  const { locale } = useI18n();
  const copy = (key: Parameters<typeof agentText>[1], values?: Record<string, string | number>) =>
    agentText(locale, key, values);
  const property = application.propertyId ? state.properties[application.propertyId] : undefined;
  const employer = state.employers[hire.employerId]?.name ?? hire.employerId;
  const number = (value: number) => new Intl.NumberFormat(intlTag(locale)).format(value);
  const backingChanged = application.employerBacked !== (hire.backing.status === 'backed');
  const notes = [
    ...new Set(
      [decision?.note, decision?.terms?.note].filter((note): note is string =>
        Boolean(note?.trim()),
      ),
    ),
  ];

  return (
    <div className="mt-4">
      <div className="space-y-4 text-body">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-title font-medium text-accent"
          >
            {initialOf(recipientOf(state, application) ?? application.partyId)}
          </span>
          <div className="min-w-0">
            <p className="text-label text-fg-tertiary">{copy('recipient')}</p>
            <p dir="auto" className="mt-0.5 break-words text-title font-medium">
              {recipientOf(state, application) ?? application.partyId}
            </p>
          </div>
        </div>
        {property ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg bg-subtle p-3">
            <div className="min-w-0">
              <p className="text-label text-fg-tertiary">{copy('property')}</p>
              <p className="mt-0.5 break-words font-medium">
                <bdi>{property.name}</bdi>
              </p>
              <p className="mt-0.5 text-label text-fg-secondary">
                <bdi>{localizedRecord(property.area, locale)}</bdi> ·{' '}
                {copy('unit', { unit: property.unit })} ·{' '}
                {property.bedrooms === 0
                  ? copy('studio')
                  : copy('bedrooms', { count: number(property.bedrooms) })}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-label text-fg-tertiary">{copy('rent')}</p>
              <p className="mt-0.5 font-medium">{formatAed(property.estAnnualRentAed, locale)}</p>
              <p className="mt-0.5 text-label text-fg-secondary">
                {copy('chequeOptions', {
                  count: property.chequeOptions.map(number).join(' / '),
                })}
              </p>
            </div>
          </div>
        ) : null}
        <div>
          <p className="text-label text-fg-tertiary">{copy('backing')}</p>
          <p className="mt-0.5 flex items-center gap-1.5" dir="auto">
            {application.employerBacked ? (
              <Check aria-hidden className="size-4 shrink-0 text-accent" />
            ) : null}
            {application.employerBacked ? copy('backingYes', { employer }) : copy('backingNo')}
          </p>
        </div>
      </div>
      {backingChanged ? (
        <p className="mt-3 text-label text-warning">{copy('backingChanged')}</p>
      ) : null}
      {decision?.terms?.cheques ? (
        <p className="mt-4 rounded-lg bg-selected px-3 py-2 text-body font-medium">
          {copy('offeredCheques', { count: number(decision.terms.cheques) })}
        </p>
      ) : null}
      {notes.map((note) => (
        <OriginalNote key={note} note={note} label={copy('offerNote')} />
      ))}
    </div>
  );
}

type Run = (
  action: Action,
  key: string,
  message: 'savedApproval' | 'savedConsent' | 'savedTerms',
) => Promise<void>;

function ApprovalCard({
  approval,
  hire,
  state,
  busy,
  run,
}: {
  approval: Approval;
  hire: Hire;
  state: AppState;
  busy: string | null;
  run: Run;
}) {
  const { t, locale } = useI18n();
  const copy = (key: Parameters<typeof agentText>[1], values?: Record<string, string | number>) =>
    agentText(locale, key, values);
  const application = approval.applicationId
    ? state.applications[approval.applicationId]
    : undefined;
  const decision = application ? latestDecision(state, application.id) : undefined;
  const isTerms = approval.kind === 'terms';
  const destination = application?.kind === 'bank_account' ? 'bank' : 'landlord';
  const property = application?.propertyId ? state.properties[application.propertyId] : undefined;
  const valid = Boolean(
    application &&
    application.hireId === hire.id &&
    state.steps[approval.stepId]?.hireId === hire.id &&
    recipientOf(state, application) &&
    approval.destination === destination &&
    (application.kind !== 'rental' || (property && property.landlordId === application.partyId)) &&
    (isTerms
      ? application.state === 'terms_offered' && decision?.outcome === 'terms_offered'
      : application.state === 'awaiting_approval'),
  );
  const labelsMatch = Boolean(
    application &&
    approval.labels.length === application.disclosed.length &&
    approval.labels.every((label) => application.disclosed.some((item) => item.label === label)),
  );
  const blocked =
    !isTerms && Boolean(application && (prohibited(application, destination) || !labelsMatch));
  const needsConsent =
    !isTerms &&
    Boolean(
      application?.disclosed.some(
        ({ label }) =>
          policyFor(label, destination) === 'consent' &&
          !hasGrant(state, hire.id, label, destination),
      ),
    );
  const problem = !valid
    ? copy(isTerms ? 'termsMissing' : 'draftMissing')
    : blocked
      ? copy('policyBlocked')
      : needsConsent
        ? copy('consentNeeded')
        : undefined;

  return (
    <article
      className="min-w-0 rounded-xl border border-line-strong bg-surface p-4"
      aria-labelledby={`approval-title-${approval.id}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="warning" shape="pill">
            {t('agent.status.needs_approval')}
          </Badge>
          {!isTerms && application ? (
            <Badge
              tone={!valid || blocked ? 'danger' : needsConsent ? 'neutral' : 'success'}
              shape="pill"
              className="gap-1"
            >
              {!valid || blocked ? (
                <CircleAlert aria-hidden className="size-3" />
              ) : needsConsent ? (
                <KeyRound aria-hidden className="size-3" />
              ) : (
                <Check aria-hidden className="size-3" />
              )}
              {!valid || blocked
                ? copy('needsFix')
                : needsConsent
                  ? copy('consentFirst')
                  : copy('readyToDecide')}
            </Badge>
          ) : null}
        </div>
        <time dateTime={approval.requestedAt} className="text-caption text-fg-tertiary">
          {formatDate(approval.requestedAt, locale)}
        </time>
      </div>
      <h3 id={`approval-title-${approval.id}`} className="mt-3 text-title font-medium">
        {approvalTitle(approval, application, locale)}
      </h3>
      {application && application.hireId === hire.id ? (
        <ApplicationDetails
          application={application}
          hire={hire}
          decision={isTerms ? decision : undefined}
        />
      ) : null}
      {!isTerms && application && application.hireId === hire.id ? (
        <section className="mt-4 border-t border-line pt-4" aria-label={copy('disclosures')}>
          <h4 className="text-body font-medium">
            {copy('sharedWith', {
              recipient: recipientOf(state, application) ?? '',
            })}
          </h4>
          <p className="mt-0.5 text-label text-fg-tertiary">{copy('disclosures')}</p>
          <ul className="mt-2 divide-y divide-line rounded-lg border border-line">
            {application.disclosed.map((item, index) => {
              const policy = policyFor(item.label, destination);
              const granted = hasGrant(state, hire.id, item.label, destination);
              const badDerived = policy === 'derived_only' && !item.derived;
              const label = t(`passport.label.${item.label}` as MessageKey);
              const forbidden =
                badDerived || !['allow', 'consent', 'derived_only'].includes(policy);
              const permission =
                policy === 'consent'
                  ? copy(granted ? 'consentOn' : 'consentOff')
                  : policy === 'derived_only' && item.derived
                    ? copy('derivedRule')
                    : policy === 'allow'
                      ? copy('allow')
                      : copy('forbidden');
              const Icon: LucideIcon = forbidden
                ? Ban
                : policy === 'consent'
                  ? granted
                    ? CircleCheck
                    : KeyRound
                  : policy === 'derived_only'
                    ? EyeOff
                    : Check;
              const tone = forbidden
                ? 'bg-danger-soft text-danger'
                : policy === 'consent' && !granted
                  ? 'bg-warning-soft text-warning'
                  : policy === 'derived_only'
                    ? 'bg-accent-soft text-accent'
                    : 'bg-success-soft text-success';
              return (
                <li
                  key={`${item.label}-${index}`}
                  className="flex min-w-0 items-center gap-3 px-3 py-2.5"
                >
                  <span
                    aria-hidden
                    className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${tone}`}
                  >
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1 text-label">
                    <p className="text-body font-medium text-fg">{label}</p>
                    <p className="text-fg-secondary">{copy(item.derived ? 'derived' : 'raw')}</p>
                    <p className={forbidden ? 'mt-0.5 text-danger' : 'mt-0.5 text-fg-tertiary'}>
                      {badDerived ? copy('invalidDerived') : permission}
                    </p>
                  </div>
                  {policy === 'consent' ? (
                    <Switch
                      checked={granted}
                      disabled={busy !== null || !valid}
                      aria-label={copy('consentSwitch', {
                        label,
                        destination: destinationText(locale, destination),
                      })}
                      onChange={(granted) =>
                        void run(
                          {
                            type: 'grant.set',
                            hireId: hire.id,
                            label: item.label,
                            destination,
                            granted,
                          },
                          `grant-${approval.id}-${item.label}`,
                          'savedConsent',
                        )
                      }
                    />
                  ) : null}
                </li>
              );
            })}
          </ul>
          {application.disclosed.some(
            ({ label }) => policyFor(label, destination) === 'consent',
          ) ? (
            <p className="mt-2 text-label text-fg-tertiary">
              {copy('consentScope', {
                destination: destinationText(locale, destination),
              })}
            </p>
          ) : null}
        </section>
      ) : null}
      {problem ? (
        <p
          id={`approval-problem-${approval.id}`}
          className="mt-4 flex items-start gap-2 rounded-lg bg-warning-soft p-3 text-label text-warning"
        >
          <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>{problem}</span>
        </p>
      ) : null}
      <p className="mt-4 text-label text-fg-secondary">
        {copy(isTerms ? 'termsSimulation' : 'simulation')}
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button
          size="lg"
          className="w-full sm:w-auto"
          disabled={busy !== null || Boolean(problem)}
          loading={busy === `approve-${approval.id}`}
          aria-describedby={problem ? `approval-problem-${approval.id}` : undefined}
          onClick={() =>
            void run(
              {
                type: 'approval.decide',
                approvalId: approval.id,
                hireId: hire.id,
                approve: true,
              },
              `approve-${approval.id}`,
              isTerms ? 'savedTerms' : 'savedApproval',
            )
          }
        >
          {copy(isTerms ? 'acceptTerms' : 'approveDemo')}
        </Button>
        <Button
          variant="secondary"
          size="lg"
          className="w-full sm:w-auto"
          disabled={busy !== null}
          loading={busy === `decline-${approval.id}`}
          onClick={() =>
            void run(
              {
                type: 'approval.decide',
                approvalId: approval.id,
                hireId: hire.id,
                approve: false,
              },
              `decline-${approval.id}`,
              'savedApproval',
            )
          }
        >
          {copy(isTerms ? 'declineTerms' : 'decline')}
        </Button>
      </div>
    </article>
  );
}

function TermsCard({
  application,
  hire,
  state,
  busy,
  run,
}: {
  application: Application;
  hire: Hire;
  state: AppState;
  busy: string | null;
  run: Run;
}) {
  const { locale } = useI18n();
  const decision = latestDecision(state, application.id);
  const copy = (key: Parameters<typeof agentText>[1]) => agentText(locale, key);
  return (
    <article className="rounded-xl border border-line-strong p-4">
      <h3 className="text-title font-medium">{copy('termsTitle')}</h3>
      <ApplicationDetails application={application} hire={hire} decision={decision} />
      <p className="mt-4 text-label text-fg-secondary">{copy('termsSimulation')}</p>
      <Button
        size="lg"
        className="mt-4 w-full sm:w-auto"
        disabled={busy !== null || decision?.outcome !== 'terms_offered'}
        loading={busy === `terms-${application.id}`}
        onClick={() =>
          void run(
            {
              type: 'application.accept_terms',
              applicationId: application.id,
              hireId: hire.id,
            },
            `terms-${application.id}`,
            'savedTerms',
          )
        }
      >
        {copy('acceptTerms')}
      </Button>
    </article>
  );
}

/** Old records lack source ids. Link only an explicit id, matching timestamp/name, or a unique draft. */
function eventApplication(state: AppState, action: AgentAction): Application | undefined {
  if (action.applicationId) {
    const linked = state.applications[action.applicationId];
    if (linked?.hireId === action.caseId) return linked;
  }
  if (action.approvalId) {
    const approval = state.approvals[action.approvalId];
    if (approval?.hireId === action.caseId && approval.applicationId)
      return state.applications[approval.applicationId];
  }
  const step = action.stepId ? state.steps[action.stepId] : undefined;
  const kind =
    step?.key === 'housing' ? 'rental' : step?.key === 'bank_account' ? 'bank_account' : undefined;
  if (!kind) return undefined;
  const applications = Object.values(state.applications).filter(
    (application) => application.hireId === action.caseId && application.kind === kind,
  );
  const named = applications.filter((application) => {
    const property = application.propertyId
      ? state.properties[application.propertyId]?.name
      : undefined;
    const recipient = recipientOf(state, application);
    return (
      application.submittedAt === action.at ||
      Boolean(property && action.summary.includes(property)) ||
      Boolean(recipient && action.summary.includes(recipient))
    );
  });
  return named.length === 1 ? named[0] : applications.length === 1 ? applications[0] : undefined;
}

function EventItem({ action, state }: { action: AgentAction; state: AppState }) {
  const { t, locale } = useI18n();
  const copy = (key: Parameters<typeof agentText>[1], values?: Record<string, string | number>) =>
    agentText(locale, key, values);
  const [summaryKey, reasonKey] = EVENT_COPY[action.kind];
  let summary = copy(summaryKey);
  let reason = copy(reasonKey);
  const step = action.stepId ? state.steps[action.stepId] : undefined;
  const application = eventApplication(state, action);
  const recipient = application ? recipientOf(state, application) : undefined;
  const decision = Object.values(state.decisions).find(
    (item) => item.applicationId === application?.id && item.decidedAt === action.at,
  );
  const document = action.documentId ? state.documents[action.documentId] : undefined;
  const matchingDocument = document?.hireId === action.caseId ? document : undefined;
  const documentKinds = Object.entries(DOCUMENT_NAMES)
    .filter(([kind, name]) =>
      action.summary.toLowerCase().includes((kind === 'degree' ? 'degree' : name).toLowerCase()),
    )
    .map(([kind]) => kind);
  if (action.kind === 'application_submitted' && recipient)
    summary = copy('submittedFor', { recipient });
  if (action.kind === 'approval_requested' && recipient)
    summary = copy('approvalFor', { recipient });
  if (action.kind === 'tamm_application' && step)
    summary = copy('tammFor', {
      step: t(`step.${step.key}.title` as MessageKey),
    });
  if (action.kind === 'document_extracted' && documentKinds.length) {
    summary = copy('documentFor', {
      documents: new Intl.ListFormat(intlTag(locale)).format(
        documentKinds.map((kind) => t(`documents.kind.${kind}` as MessageKey)),
      ),
    });
  }
  if (action.kind === 'document_extracted' && matchingDocument) {
    summary = copy('documentRecorded');
    reason = copy('documentRecordedReason');
    if (matchingDocument.uploadedAt === action.at) {
      // Timestamps have second precision; a replacement can share an older event's timestamp.
      const documentName = DOCUMENT_NAMES[matchingDocument.kind];
      const liveEntry =
        matchingDocument.source === 'vertex' && action.summary === `Read your ${documentName}`;
      const demoEntry =
        matchingDocument.source === 'demo' &&
        action.summary === `Prepared demo fields for your ${documentName}`;
      if (liveEntry) {
        summary = copy('liveDocument', {
          document: t(`documents.kind.${matchingDocument.kind}` as MessageKey),
        });
        reason = copy('liveDocumentReason');
      } else if (demoEntry) {
        summary = copy('documentFor', {
          documents: t(`documents.kind.${matchingDocument.kind}` as MessageKey),
        });
        reason = copy('documentReason');
      }
    }
  }
  if (
    action.kind === 'step_updated' &&
    matchingDocument &&
    /^(Confirmed|Rejected) your /.test(action.summary)
  ) {
    summary = copy(
      action.summary.startsWith('Confirmed') ? 'documentConfirmed' : 'documentRejected',
      { document: t(`documents.kind.${matchingDocument.kind}` as MessageKey) },
    );
    reason = copy('documentReviewReason');
  }
  if (action.kind === 'decision_received' && recipient && decision) {
    const outcomeKeys = {
      approved: 'outcomeApproved',
      info_requested: 'outcomeInfo',
      terms_offered: 'outcomeTerms',
      declined: 'outcomeDeclined',
    } as const;
    summary = copy('decisionFor', {
      recipient,
      outcome: copy(outcomeKeys[decision.outcome]),
    });
  }
  if (
    action.kind === 'step_updated' &&
    /^(Dropped the draft|Declined the draft|Draft application declined)/.test(action.summary)
  ) {
    summary = copy('declinedSummary');
    reason = copy('declinedReason');
  }
  if (action.kind === 'step_updated' && /accepted.*terms|terms.*accepted/i.test(action.summary)) {
    summary = copy('termsAcceptedSummary');
    reason = copy('termsAcceptedReason');
  }
  const originalReason = !knownDemoNote(action.reasoning) ? action.reasoning : undefined;
  const translatedReason =
    originalReason &&
    translatedRecord(originalReason, locale) &&
    localizedRecord(originalReason, locale) !== originalReason
      ? localizedRecord(originalReason, locale)
      : undefined;
  const generatedSummary =
    /^(Built |Read |Prepared demo fields|Confirmed your |Rejected your |Needs your approval|Approve submitting|Sent |Submitted |Recorded the demo|Demo: |Every step|Dropped |Declined |Draft application|Verified |Asked Layla|Removed employer backing|.*is now backed by|Accepted |.*accepted.*terms|.*approved the application|.*offered different terms|.*asked for more information|.*declined the application)/i.test(
      action.summary,
    );
  const Icon =
    action.kind === 'document_extracted' || action.kind === 'document_requested'
      ? FileText
      : action.status === 'waiting'
        ? Clock
        : action.kind === 'decision_received'
          ? MessageSquare
          : Check;

  return (
    <li className="flex min-w-0 gap-3">
      <div className="relative flex w-8 shrink-0 justify-center">
        <div className="absolute bottom-0 top-9 w-px bg-line" aria-hidden />
        <span className="z-10 mt-0.5 flex size-8 items-center justify-center rounded-full bg-selected text-fg-secondary">
          <Icon aria-hidden className="size-4" />
        </span>
      </div>
      <article className="min-w-0 flex-1 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge tone={FEED_TONE[action.status]} shape="pill">
            {t(`agent.status.${action.status}` as MessageKey)}
          </Badge>
          <time dateTime={action.at} className="text-caption text-fg-tertiary">
            {eventDate(action.at, locale)}
          </time>
        </div>
        <h3 className="mt-2 break-words text-body font-medium" dir="auto">
          {summary}
        </h3>
        {step ? (
          <p className="mt-1 text-label text-fg-tertiary">
            {copy('recordedFor', {
              step: t(`step.${step.key}.title` as MessageKey),
            })}
          </p>
        ) : null}
        <p className="mt-2 text-label leading-relaxed text-fg-secondary">{reason}</p>
        {translatedReason ? (
          <p className="mt-2 text-label text-fg-secondary">{translatedReason}</p>
        ) : originalReason ? (
          <OriginalNote note={originalReason} label={copy('originalNote')} />
        ) : null}
        {!generatedSummary ? (
          <OriginalNote note={action.summary} label={copy('originalSummary')} />
        ) : null}
      </article>
    </li>
  );
}

interface LiveExplanationResult {
  headline: string;
  nextAction: string;
  why: string;
  stepId: string | null;
  requiresApproval: boolean;
  disclosureNotes: string[];
  model: string;
  revision: number;
}

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function responseError(value: unknown): string | undefined {
  return object(value) && object(value.error) && typeof value.error.message === 'string'
    ? value.error.message
    : undefined;
}

/** Availability is read-only. A live provider call happens only after an explicit button press. */
function LiveExplanation({ hireId, state }: { hireId: string; state: AppState }) {
  const { t, locale } = useI18n();
  const copy = (key: Parameters<typeof agentText>[1]) => agentText(locale, key);
  const [availability, setAvailability] = useState<'checking' | 'available' | 'unavailable'>(
    'checking',
  );
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LiveExplanationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null);
  const disclosureNote = (note: string): string | undefined => {
    const match =
      /^([a-z_ ]+): (currently permitted|withheld until approved) for (landlord|bank)( as a derived signal)?\.$/.exec(
        note,
      );
    if (!match) return undefined;
    const label = match[1].replaceAll(' ', '_');
    if (!DATA_LABELS.includes(label as DataLabel)) return undefined;
    return agentText(locale, 'sharingNote', {
      label: t(`passport.label.${label}` as MessageKey),
      destination: destinationText(locale, match[3] as Destination),
      permission: copy(match[2] === 'currently permitted' ? 'sharingPermitted' : 'sharingWithheld'),
      derived: match[4] ? copy('sharingDerived') : '',
    });
  };

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch('/api/ai/status', {
          signal: controller.signal,
          cache: 'no-store',
        });
        const status: unknown = await response.json();
        if (!controller.signal.aborted)
          setAvailability(
            response.ok &&
              object(status) &&
              status.available === true &&
              status.provider === 'vertex' &&
              object(status.capabilities) &&
              status.capabilities.explain === true
              ? 'available'
              : 'unavailable',
          );
      } catch {
        if (!controller.signal.aborted) setAvailability('unavailable');
      }
    })();
    return () => controller.abort();
  }, [refresh]);

  useEffect(() => () => request.current?.abort(), []);

  async function explain() {
    if (availability !== 'available' || loading) return;
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hireId, locale }),
        signal: controller.signal,
      });
      const payload: unknown = await response.json();
      if (!response.ok)
        throw new Error(responseError(payload) ?? 'The explanation request was rejected.');
      if (
        !object(payload) ||
        !object(payload.explanation) ||
        !object(payload.provenance) ||
        payload.provenance.provider !== 'vertex' ||
        payload.provenance.live !== true ||
        typeof payload.provenance.model !== 'string'
      )
        throw new Error('The response did not verify a live Vertex AI explanation.');
      const explanation = payload.explanation;
      if (
        typeof explanation.headline !== 'string' ||
        typeof explanation.nextAction !== 'string' ||
        typeof explanation.why !== 'string' ||
        typeof explanation.requiresApproval !== 'boolean' ||
        !(explanation.stepId === null || typeof explanation.stepId === 'string') ||
        !Array.isArray(explanation.disclosureNotes) ||
        !explanation.disclosureNotes.every((note) => typeof note === 'string') ||
        (typeof explanation.stepId === 'string' &&
          state.steps[explanation.stepId]?.hireId !== hireId)
      ) {
        throw new Error('The live explanation contained an invalid or unrelated case reference.');
      }
      if (!controller.signal.aborted)
        setResult({
          headline: explanation.headline,
          nextAction: explanation.nextAction,
          why: explanation.why,
          stepId: explanation.stepId,
          requiresApproval: explanation.requiresApproval,
          disclosureNotes: explanation.disclosureNotes as string[],
          model: payload.provenance.model,
          revision: state.rev,
        });
    } catch (failure) {
      if (!controller.signal.aborted)
        setError(failure instanceof Error ? failure.message : 'The explanation request failed.');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  return (
    <section
      aria-labelledby="agent-live-title"
      className="mt-6 rounded-xl border border-line bg-subtle p-4"
    >
      <h2 id="agent-live-title" className="text-title font-medium">
        {copy('liveTitle')}
      </h2>
      <p className="mt-1 text-label text-fg-secondary">{copy('liveHint')}</p>
      <p role="status" className="mt-3 text-label text-fg-tertiary">
        {copy(
          availability === 'checking'
            ? 'liveChecking'
            : availability === 'available'
              ? 'liveAvailable'
              : 'liveUnavailable',
        )}
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Button
          size="lg"
          className="w-full sm:w-auto"
          icon={<Sparkles />}
          disabled={availability !== 'available'}
          loading={loading}
          onClick={() => void explain()}
        >
          {copy('liveAsk')}
        </Button>
        {availability === 'unavailable' ? (
          <Button
            variant="secondary"
            size="lg"
            className="w-full sm:w-auto"
            disabled={loading}
            onClick={() => {
              setAvailability('checking');
              setRefresh((value) => value + 1);
            }}
          >
            {copy('liveRefresh')}
          </Button>
        ) : null}
      </div>
      {error ? (
        <div role="alert" className="mt-4 rounded-lg bg-danger-soft p-3 text-label text-danger">
          <p>{copy('liveError')}</p>
          <OriginalNote note={error} label={copy('originalError')} />
        </div>
      ) : null}
      {result ? (
        <article className="mt-4 rounded-lg border border-line bg-surface p-4" aria-live="polite">
          <Badge shape="pill" tone="accent">
            {copy('liveResult')}
          </Badge>
          <p className="mt-2 break-words text-caption text-fg-tertiary" dir="auto">
            {result.model}
          </p>
          {result.revision !== state.rev ? (
            <p className="mt-3 rounded-lg bg-warning-soft p-3 text-label text-warning">
              {copy('liveStale')}
            </p>
          ) : null}
          <h3 dir="auto" className="mt-3 break-words text-title font-medium">
            {result.headline}
          </h3>
          {result.stepId && state.steps[result.stepId] ? (
            <p className="mt-1 text-label text-fg-tertiary">
              {agentText(locale, 'recordedFor', {
                step: t(`step.${state.steps[result.stepId].key}.title` as MessageKey),
              })}
            </p>
          ) : null}
          <dl className="mt-4 space-y-3 text-body">
            <div>
              <dt className="text-label font-medium">{copy('liveNext')}</dt>
              <dd dir="auto" className="mt-1 whitespace-pre-wrap break-words text-fg-secondary">
                {result.nextAction}
              </dd>
            </div>
            <div>
              <dt className="text-label font-medium">{copy('liveWhy')}</dt>
              <dd dir="auto" className="mt-1 whitespace-pre-wrap break-words text-fg-secondary">
                {result.why}
              </dd>
            </div>
          </dl>
          {result.requiresApproval ? (
            <p className="mt-3 text-label text-warning">{copy('liveApproval')}</p>
          ) : null}
          {result.disclosureNotes.length ? (
            <section className="mt-4" aria-label={copy('liveDisclosures')}>
              <h4 className="text-label font-medium">{copy('liveDisclosures')}</h4>
              <ul className="mt-1 list-disc space-y-1 ps-4 text-label text-fg-secondary">
                {result.disclosureNotes.map((note, index) => {
                  const localized = disclosureNote(note);
                  return (
                    <li key={index} dir="auto" className="break-words">
                      {localized ?? (
                        <>
                          <span className="text-caption text-fg-tertiary">
                            {copy('originalNote')}
                          </span>
                          <p dir="auto">{note}</p>
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
        </article>
      ) : null}
    </section>
  );
}

export function AgentView() {
  const { t, locale } = useI18n();
  const { hire, state } = useNewcomer();
  const store = useStore();
  const [busy, setBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    hireId: string;
    key: 'savedApproval' | 'savedConsent' | 'savedTerms' | 'saveError';
    error?: string;
  } | null>(null);
  const currentFeedback = feedback?.hireId === hire?.id ? feedback : null;
  const approvals = useMemo(
    () =>
      Object.values(state.approvals)
        .filter((approval) => approval.hireId === hire?.id)
        .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt) || b.id.localeCompare(a.id)),
    [state.approvals, hire?.id],
  );
  const pending = approvals.filter((approval) => approval.status === 'pending');
  const decided = approvals
    .filter((approval) => approval.status !== 'pending')
    .sort(
      (a, b) =>
        (b.decidedAt ?? b.requestedAt).localeCompare(a.decidedAt ?? a.requestedAt) ||
        b.id.localeCompare(a.id),
    );
  const offers = Object.values(state.applications).filter(
    (application) =>
      application.hireId === hire?.id &&
      application.state === 'terms_offered' &&
      !pending.some(
        (approval) => approval.applicationId === application.id && approval.kind === 'terms',
      ),
  );
  const activity = useMemo(
    () =>
      Object.values(state.agentActions)
        .filter((action) => action.caseType === 'hire' && action.caseId === hire?.id)
        .sort((a, b) => b.at.localeCompare(a.at) || b.id.localeCompare(a.id)),
    [state.agentActions, hire?.id],
  );
  const copy = (key: Parameters<typeof agentText>[1]) => agentText(locale, key);
  const run: Run = async (action, key, message) => {
    setBusy(key);
    setFeedback(null);
    try {
      await store.dispatch(action);
      setFeedback({ hireId: hire?.id ?? '', key: message });
    } catch (error) {
      setFeedback({
        hireId: hire?.id ?? '',
        key: 'saveError',
        error: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(null);
    }
  };
  if (!hire)
    return (
      <EmptyState
        illustration={<Illustration variant="empty-hires" decorative />}
        title={copy('noHire')}
        description={copy('noHireHint')}
        action={
          <Link
            href="/employer/hires"
            className="inline-flex min-h-11 items-center rounded-md bg-solid px-4 text-body font-medium text-solid-fg"
          >
            {copy('openEmployer')}
          </Link>
        }
      />
    );

  return (
    <>
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-heading font-medium">{t('agent.title')}</h1>
          <p className="mt-1 text-body text-fg-secondary">{copy('intro')}</p>
        </div>
        <Illustration
          variant="privacy-consent"
          decorative
          className="hidden max-w-[112px] shrink-0 sm:block"
        />
      </header>
      <div role={currentFeedback?.error ? 'alert' : 'status'} aria-live="polite" aria-atomic="true">
        {currentFeedback ? (
          <div
            className={`mt-4 flex items-start gap-2 rounded-lg p-3 text-body motion-safe:animate-pop-in ${currentFeedback.error ? 'bg-danger-soft text-danger' : 'bg-success-soft text-success'}`}
          >
            {currentFeedback.error ? (
              <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
            ) : (
              <CircleCheck aria-hidden className="mt-0.5 size-4 shrink-0" />
            )}
            <div className="min-w-0">
              <p>{copy(currentFeedback.key)}</p>
              {currentFeedback.error ? (
                <OriginalNote note={currentFeedback.error} label={copy('originalError')} />
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
      <HousingDraftCard />
      <section className="mt-6" aria-labelledby="agent-approvals-title">
        <h2 id="agent-approvals-title" className="text-title font-medium">
          {t('agent.approvals')}
        </h2>
        <div className="mt-3 space-y-4">
          {pending.map((approval) => (
            <ApprovalCard
              key={approval.id}
              approval={approval}
              hire={hire}
              state={state}
              busy={busy}
              run={run}
            />
          ))}
          {offers.map((application) => (
            <TermsCard
              key={application.id}
              application={application}
              hire={hire}
              state={state}
              busy={busy}
              run={run}
            />
          ))}
          {!pending.length && !offers.length ? (
            <div className="flex items-start gap-3 rounded-xl border border-line bg-subtle p-4">
              <span
                aria-hidden
                className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-success-soft text-success"
              >
                <Check className="size-5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-body font-medium">{copy('noApprovals')}</h3>
                <p className="mt-0.5 text-label text-fg-secondary">{copy('noApprovalsHint')}</p>
              </div>
            </div>
          ) : null}
        </div>
      </section>
      <LiveExplanation key={`${hire.id}-${locale}`} hireId={hire.id} state={state} />
      {decided.length ? (
        <section className="mt-7" aria-labelledby="agent-decisions-title">
          <h2 id="agent-decisions-title" className="text-title font-medium">
            {copy('approvalHistory')}
          </h2>
          <ol className="mt-2 divide-y divide-line">
            {decided.map((approval) => {
              const application = approval.applicationId
                ? state.applications[approval.applicationId]
                : undefined;
              return (
                <li key={approval.id} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0 text-body">
                    <p className="font-medium">{approvalTitle(approval, application, locale)}</p>
                    {application ? (
                      <p className="mt-0.5 break-words text-label text-fg-secondary" dir="auto">
                        {recipientOf(state, application)}
                      </p>
                    ) : null}
                    {!application ? (
                      <OriginalNote
                        note={`${approval.title}\n${approval.detail}`}
                        label={copy('originalNote')}
                      />
                    ) : null}
                    <time
                      dateTime={approval.decidedAt ?? approval.requestedAt}
                      className="mt-1 block text-caption text-fg-tertiary"
                    >
                      {eventDate(approval.decidedAt ?? approval.requestedAt, locale)}
                    </time>
                  </div>
                  <Badge tone={approval.status === 'approved' ? 'success' : 'neutral'} shape="pill">
                    {copy(approval.status === 'approved' ? 'approved' : 'declined')}
                  </Badge>
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}
      <section className="mt-7" aria-labelledby="agent-history-title">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="agent-history-title" className="text-title font-medium">
            {t('agent.history')}
          </h2>
          <p className="text-caption text-fg-tertiary">{copy('newestFirst')}</p>
        </div>
        <p className="mt-1 text-label text-fg-tertiary">{copy('historyHint')}</p>
        {activity.length ? (
          <ol className="mt-4">
            {activity.map((action) => (
              <EventItem key={action.id} action={action} state={state} />
            ))}
          </ol>
        ) : (
          <div className="mt-3 rounded-xl border border-line p-5 text-center">
            <Illustration variant="journey" decorative className="mx-auto max-w-[180px]" />
            <h3 className="mt-3 text-body font-medium">{t('agent.empty')}</h3>
            <p className="mt-1 text-label text-fg-secondary">{t('agent.emptyHint')}</p>
          </div>
        )}
      </section>
      <Link
        href="/newcomer/passport"
        className="inline-flex min-h-11 items-center gap-2 rounded-md py-2 text-body font-medium text-accent"
      >
        <Sparkles aria-hidden className="size-4" />
        {t('passport.title')}
        <ArrowUpRight aria-hidden className="size-4 rtl:-scale-x-100" />
      </Link>
    </>
  );
}

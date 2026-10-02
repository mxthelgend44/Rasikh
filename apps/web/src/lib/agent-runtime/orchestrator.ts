import { createHash, randomUUID } from 'node:crypto';
import type { DataLabel, PayloadRef } from '@rasikh/shared';
import {
  CONFIDENCE_REVIEW_THRESHOLD,
  FIELD_SPECS,
  InvalidModelOutput,
  parseModelOutput,
  toReviewFields,
} from './schema';
import {
  KIND_LABELS,
  type ActionProposal,
  type ActionToolPort,
  type AuditSink,
  type Blocked,
  type DocumentKind,
  type ExtractorPort,
  type GuardPort,
  type GuardVerdict,
  type JourneyRecord,
  type RoadmapEnginePort,
} from './types';

export const MAX_DOCUMENT_CHARS = 20000;

export interface RuntimeDeps {
  guard: GuardPort;
  extractor: ExtractorPort;
  engine: RoadmapEnginePort;
  actions: ActionToolPort;
  audit: AuditSink;
  /** Whether the live provider is configured; false makes live mode refuse rather than fall back. */
  providerConfigured: boolean;
  store?: Map<string, JourneyRecord>;
  now?: () => Date;
  newId?: () => string;
}

export interface ExtractRequest {
  case_id: string;
  document: { ref: string; kind: DocumentKind; text: string };
  /** The newcomer saw that this document is sent to the model provider (live mode only). */
  acknowledge_provider_disclosure?: boolean;
}

const verdictBlock = (guard: GuardVerdict): Blocked => ({
  code:
    guard.source === 'fail_closed'
      ? 'guard_unavailable'
      : guard.decision === 'needs_consent'
        ? 'guard_needs_consent'
        : 'guard_denied',
  guard,
});

export class AgentRuntime {
  readonly store: Map<string, JourneyRecord>;
  constructor(private readonly deps: RuntimeDeps) {
    this.store = deps.store ?? new Map();
  }
  private at = () => (this.deps.now?.() ?? new Date()).toISOString();
  private id = () => this.deps.newId?.() ?? randomUUID();

  private get prov() {
    return this.deps.extractor.provenance;
  }
  private provenanceAudit() {
    return {
      mode: this.prov.mode,
      provider: this.prov.provider,
      model: this.prov.model,
      live_model_call: this.prov.live_model_call,
    };
  }

  /** Step 1: Guard-checked extraction. Returns a review for the newcomer; nothing is acted on yet. */
  async extract(request: ExtractRequest): Promise<JourneyRecord> {
    const { document } = request;
    if (!/^[\w.-]{1,80}$/.test(request.case_id) || !/^[\w.-]{1,80}$/.test(document.ref))
      throw new TypeError('invalid_request');
    if (!(document.kind in KIND_LABELS)) throw new TypeError('invalid_request');
    if (
      typeof document.text !== 'string' ||
      !document.text.trim() ||
      document.text.length > MAX_DOCUMENT_CHARS
    )
      throw new TypeError('invalid_request');

    const labels = KIND_LABELS[document.kind];
    const docRef: PayloadRef = { ref: document.ref, labels };
    const journey: JourneyRecord = {
      id: this.id(),
      case_id: request.case_id,
      guard_session_id: '',
      status: 'blocked',
      doc_ref: docRef,
      kind: document.kind,
      fields: [],
      provenance: this.prov,
    };
    this.store.set(journey.id, journey);
    const block = (
      blocked: Blocked,
      event: 'extraction_checked' | 'extraction_rejected',
      outcome: string,
    ) => {
      journey.status = 'blocked';
      journey.blocked = blocked;
      this.deps.audit.record({
        at: this.at(),
        journey_id: journey.id,
        event,
        labels,
        outcome,
        ...this.provenanceAudit(),
        ...('guard' in blocked
          ? {
              tool: 'extract_document',
              destination: 'llm_provider' as const,
              decision: blocked.guard.decision,
              decision_source: blocked.guard.source,
              policy_rule: blocked.guard.policy_rule,
              check_id: blocked.guard.check_id,
              contract_version: blocked.guard.contract_version,
            }
          : {}),
      });
      return journey;
    };

    // Live mode never silently degrades to the demo extractor.
    if (this.prov.mode === 'live') {
      if (!this.deps.providerConfigured)
        return block(
          { code: 'provider_unavailable', message: 'The AI provider is not configured.' },
          'extraction_rejected',
          'provider_not_configured',
        );
      if (request.acknowledge_provider_disclosure !== true)
        return block(
          {
            code: 'consent_required',
            message:
              'Please confirm that this document may be sent to the AI provider for extraction.',
          },
          'extraction_rejected',
          'provider_disclosure_not_acknowledged',
        );
    }

    let verdict: GuardVerdict;
    try {
      journey.guard_session_id = await this.deps.guard.startSession(request.case_id);
      await this.deps.guard.observe(journey.guard_session_id, 'newcomer', [docRef]);
      verdict = await this.deps.guard.check({
        sessionId: journey.guard_session_id,
        tool: 'extract_document',
        destination: 'llm_provider',
        labels,
        refs: [docRef],
      });
    } catch {
      verdict = {
        decision: 'deny',
        reason: 'The safety check could not be completed, so nothing was sent.',
        policy_rule: null,
        check_id: null,
        contract_version: null,
        source: 'fail_closed',
      };
    }
    if (verdict.decision !== 'allow')
      return block(verdictBlock(verdict), 'extraction_checked', 'blocked_by_guard');
    this.deps.audit.record({
      at: this.at(),
      journey_id: journey.id,
      event: 'extraction_checked',
      tool: 'extract_document',
      destination: 'llm_provider',
      labels,
      decision: 'allow',
      decision_source: 'guard',
      policy_rule: verdict.policy_rule,
      check_id: verdict.check_id,
      contract_version: verdict.contract_version,
      outcome: 'allowed',
      ...this.provenanceAudit(),
    });

    const fields = FIELD_SPECS[document.kind];
    try {
      const raw = await this.deps.extractor.extract({
        kind: document.kind,
        text: document.text,
        fields,
      });
      journey.fields = toReviewFields(parseModelOutput(raw, fields), fields, document.text);
    } catch (error) {
      const invalid = error instanceof InvalidModelOutput;
      return block(
        {
          code: invalid ? 'invalid_model_output' : 'provider_unavailable',
          message: invalid
            ? 'The AI returned output that did not match the required format, so it was discarded.'
            : 'The AI provider could not be reached.',
        },
        'extraction_rejected',
        invalid ? 'invalid_model_output' : 'provider_error',
      );
    }
    journey.status = 'awaiting_review';
    this.deps.audit.record({
      at: this.at(),
      journey_id: journey.id,
      event: 'extraction_completed',
      labels,
      outcome: `fields=${journey.fields.length};needs_review=${journey.fields.filter((f) => f.status !== 'ok').length}`,
      ...this.provenanceAudit(),
    });
    return journey;
  }

  private get(journeyId: string, status: JourneyRecord['status']): JourneyRecord {
    const journey = this.store.get(journeyId);
    if (!journey) throw new TypeError('unknown_journey');
    if (journey.status !== status) throw new TypeError(`invalid_state:${journey.status}`);
    return journey;
  }

  /**
   * Step 2: human review. The newcomer confirms or corrects the extracted facts; only then does the
   * engine ground a recommendation. Corrections are marked as user-supplied, not model output.
   */
  confirmReview(input: {
    journey_id: string;
    confirmed_by: 'newcomer';
    corrections?: Record<string, string | number>;
  }): JourneyRecord {
    const journey = this.get(input.journey_id, 'awaiting_review');
    if (input.confirmed_by !== 'newcomer') throw new TypeError('approval_requires_newcomer');
    const corrections = input.corrections ?? {};
    const names = new Set(journey.fields.map((f) => f.name));
    if (Object.keys(corrections).some((name) => !names.has(name)))
      throw new TypeError('invalid_request');
    journey.confirmed = {};
    for (const field of journey.fields) {
      const corrected = Object.hasOwn(corrections, field.name);
      // Fields needing review or missing cannot be confirmed as-is.
      if (!corrected && field.status !== 'ok') continue;
      journey.confirmed[field.name] = corrected
        ? { value: corrections[field.name]!, source: 'user_corrected' }
        : { value: field.value, source: 'model' };
    }
    if (Object.keys(journey.confirmed).length !== journey.fields.length)
      throw new TypeError('unreviewed_fields_remain');

    const documents: PayloadRef[] = [journey.doc_ref];
    const grounding = this.deps.engine.nextAction({ caseId: journey.case_id, documents });
    this.deps.audit.record({
      at: this.at(),
      journey_id: journey.id,
      event: 'review_confirmed',
      labels: journey.doc_ref.labels,
      outcome: 'confirmed',
      ...this.provenanceAudit(),
    });
    if (!grounding) {
      journey.status = 'complete_no_action';
      return journey;
    }
    const label: DataLabel = grounding.missing_documents[0]!;
    journey.recommendation = {
      category: 'recommendation',
      summary: `Ask your employer for your ${label.replace(/_/g, ' ')} document. It is the first thing the "${grounding.step_id}" step is waiting on.`,
      grounded_in: {
        engine: 'rasikh-engine',
        step_id: grounding.step_id,
        missing_documents: grounding.missing_documents,
      },
    };
    journey.estimate = {
      category: 'estimate',
      illustrative: true,
      remaining_days: this.deps.engine.estimateRemainingDays({
        caseId: journey.case_id,
        documents,
      }),
      note: 'Illustrative planning estimate from the roadmap engine, not an official processing time.',
    };
    const base = {
      tool: 'request_document' as const,
      destination: 'employer' as const,
      requested_label: label,
      step_id: grounding.step_id,
    };
    const digest = createHash('sha256')
      .update(JSON.stringify([journey.id, base]))
      .digest('hex');
    journey.proposal = { proposal_id: this.id(), ...base, digest };
    journey.status = 'awaiting_approval';
    return journey;
  }

  /**
   * Step 3: the consequential action. Needs the newcomer's explicit approval of this exact proposal,
   * then an explicit Guard allow. Anything else stops here and the tool is never called.
   */
  async decide(input: {
    journey_id: string;
    proposal_id: string;
    digest: string;
    approved: boolean;
    approved_by: 'newcomer';
  }): Promise<JourneyRecord> {
    const journey = this.get(input.journey_id, 'awaiting_approval');
    const proposal = journey.proposal as ActionProposal;
    if (
      input.approved_by !== 'newcomer' ||
      input.proposal_id !== proposal.proposal_id ||
      input.digest !== proposal.digest
    )
      throw new TypeError('approval_does_not_match_proposal');
    const common = {
      at: this.at(),
      journey_id: journey.id,
      tool: proposal.tool,
      destination: proposal.destination,
      ...this.provenanceAudit(),
    };
    if (!input.approved) {
      journey.status = 'rejected';
      this.deps.audit.record({
        ...common,
        event: 'action_declined',
        outcome: 'declined_by_newcomer',
      });
      return journey;
    }
    // The message to the employer is app-generated and carries no document values; the passport
    // observation still flows into it per the contract, so Guard sees the whole picture.
    let verdict: GuardVerdict;
    try {
      verdict = await this.deps.guard.check({
        sessionId: journey.guard_session_id,
        tool: proposal.tool,
        destination: proposal.destination,
        labels: [],
        refs: [],
      });
    } catch {
      verdict = {
        decision: 'deny',
        reason: 'The safety check could not be completed, so nothing was sent.',
        policy_rule: null,
        check_id: null,
        contract_version: null,
        source: 'fail_closed',
      };
    }
    this.deps.audit.record({
      ...common,
      event: 'action_checked',
      labels: journey.doc_ref.labels,
      decision: verdict.decision,
      decision_source: verdict.source,
      policy_rule: verdict.policy_rule,
      check_id: verdict.check_id,
      contract_version: verdict.contract_version,
      outcome: verdict.decision === 'allow' ? 'allowed' : 'blocked_by_guard',
    });
    if (verdict.decision !== 'allow') {
      // Stays awaiting approval: consent can be granted and the same proposal retried.
      journey.blocked = verdictBlock(verdict);
      return journey;
    }
    delete journey.blocked;
    journey.action_result = await this.deps.actions.execute(proposal);
    journey.status = 'executed';
    this.deps.audit.record({
      ...common,
      event: 'action_executed',
      outcome: journey.action_result.delivered ? 'delivered' : 'not_delivered',
    });
    return journey;
  }
}

export { CONFIDENCE_REVIEW_THRESHOLD };

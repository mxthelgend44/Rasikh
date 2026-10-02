import { MemoryAuditSink } from './audit';
import { readConfig, type RuntimeConfig } from './config';
import { rasikhEngine } from './engine-adapter';
import {
  DeterministicDemoExtractor,
  OpenAiExtractor,
  UnconfiguredLiveExtractor,
} from './extractors';
import { HttpGuardClient } from './guard-client';
import { AgentRuntime } from './orchestrator';
import type { ActionToolPort } from './types';

export * from './types';
export { AgentRuntime } from './orchestrator';
export { HttpGuardClient } from './guard-client';
export { OpenAiExtractor, DeterministicDemoExtractor } from './extractors';
export { MemoryAuditSink } from './audit';
export { readConfig } from './config';

/** Records the request in memory. Labelled mock: no email or notification leaves the process. */
export class InMemoryEmployerRequests implements ActionToolPort {
  readonly sent: { reference: string; label: string }[] = [];
  async execute(proposal: Parameters<ActionToolPort['execute']>[0]) {
    const reference = `req_${proposal.proposal_id.slice(0, 8)}`;
    this.sent.push({ reference, label: proposal.requested_label });
    return { delivered: true, reference };
  }
}

const globalKey = Symbol.for('rasikh.agent-runtime');
type Holder = { runtime: AgentRuntime; audit: MemoryAuditSink; config: RuntimeConfig };

/** Process-wide runtime for the route handler. Live mode without credentials stays unavailable. */
export function getRuntime(): Holder {
  const g = globalThis as unknown as Record<symbol, Holder | undefined>;
  if (g[globalKey]) return g[globalKey]!;
  const config = readConfig();
  const configured = Boolean(config.openaiApiKey && config.openaiModel);
  const extractor =
    config.mode === 'live'
      ? configured
        ? new OpenAiExtractor({ apiKey: config.openaiApiKey!, model: config.openaiModel! })
        : new UnconfiguredLiveExtractor()
      : new DeterministicDemoExtractor();
  const audit = new MemoryAuditSink();
  const runtime = new AgentRuntime({
    guard: new HttpGuardClient({ baseUrl: config.guardUrl }),
    extractor,
    engine: rasikhEngine,
    actions: new InMemoryEmployerRequests(),
    audit,
    providerConfigured: config.mode === 'demo' || configured,
  });
  return (g[globalKey] = { runtime, audit, config });
}

/**
 * Client for the Rasikh Guard sidecar `/check` endpoint (INTEGRATION.md section 3).
 *
 * Fails closed: a network error, timeout, non-200 status or malformed body all become a
 * `deny` verdict. Nothing proceeds without an explicit `allow`.
 */
import { z } from "zod";
import { CONTRACT_VERSION, type DataLabel, GUARD_DECISIONS, type PayloadRef, dataLabelSchema } from "../contract.js";

export interface GuardCheckRequest {
  session_id: string;
  tool: string;
  destination: "tamm";
  data_labels: DataLabel[];
  payload_refs: PayloadRef[];
  /** Tags of the TAMM service involved. Proposed for contract 1.1.0; ignored by older Guards. */
  service_tags?: string[];
}

const verdictSchema = z.object({
  contract_version: z.string(),
  check_id: z.string(),
  decision: z.enum(GUARD_DECISIONS),
  reason: z.string(),
  policy_rule: z.string(),
  blocked_labels: z.array(dataLabelSchema),
  consent_request: z.object({ label: dataLabelSchema, destination: z.string() }).optional(),
});

/** Guard's answer, or a synthesised fail-closed denial (`check_id: null`). */
export type GuardVerdict = Omit<z.infer<typeof verdictSchema>, "check_id"> & { check_id: string | null };

export interface GuardClient {
  check(request: GuardCheckRequest): Promise<GuardVerdict>;
}

const DEFAULT_TIMEOUT_MS = 2000;

/** Talks to a running Guard sidecar over HTTP. */
export class HttpGuardClient implements GuardClient {
  constructor(
    private readonly baseUrl: string,
    private readonly timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ) {}

  async check(request: GuardCheckRequest): Promise<GuardVerdict> {
    try {
      const response = await fetch(new URL("/check", this.baseUrl), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      if (!response.ok) {
        return failClosed(`Guard answered HTTP ${response.status}`);
      }
      const parsed = verdictSchema.safeParse(await response.json());
      return parsed.success ? parsed.data : failClosed("Guard returned an unexpected response");
    } catch {
      return failClosed("Guard could not be reached");
    }
  }
}

/**
 * A `deny` verdict used whenever Guard did not give a usable answer. The technical detail
 * goes to stderr (never stdout, which carries the stdio MCP transport).
 */
export function failClosed(detail: string): GuardVerdict {
  console.error(`[tamm-mcp] guard check failed closed: ${detail}`);
  return {
    contract_version: CONTRACT_VERSION,
    check_id: null,
    decision: "deny",
    reason: "This step was stopped because the privacy check could not be completed. Please try again.",
    policy_rule: "guard.unreachable",
    blocked_labels: [],
  };
}

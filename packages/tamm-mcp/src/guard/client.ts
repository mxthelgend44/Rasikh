/**
 * Client for the Rasikh Guard sidecar `/check` endpoint (INTEGRATION.md section 3).
 *
 * Fails closed: a network error, timeout, non-200 status or malformed body all become
 * `unavailable`, which callers must treat as deny. Nothing proceeds without an explicit `allow`.
 */
import { z } from "zod";
import { type DataLabel, GUARD_DECISIONS, type PayloadRef, dataLabelSchema } from "../contract.js";

export interface GuardCheckRequest {
  session_id: string;
  tool: string;
  destination: "tamm";
  data_labels: DataLabel[];
  payload_refs: PayloadRef[];
  /** Tags of the TAMM service involved (contract 1.1.0), so Guard can apply "insurance services only". */
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

export type GuardVerdict = z.infer<typeof verdictSchema>;

export type GuardOutcome = { kind: "verdict"; verdict: GuardVerdict } | { kind: "unavailable"; detail: string };

export interface GuardClient {
  check(request: GuardCheckRequest): Promise<GuardOutcome>;
}

const DEFAULT_TIMEOUT_MS = 2000;

/** Talks to a running Guard sidecar over HTTP. */
export class HttpGuardClient implements GuardClient {
  constructor(
    private readonly baseUrl: string,
    private readonly timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ) {}

  async check(request: GuardCheckRequest): Promise<GuardOutcome> {
    try {
      const response = await fetch(new URL("/check", this.baseUrl), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      if (!response.ok) {
        return { kind: "unavailable", detail: `Guard answered HTTP ${response.status}` };
      }
      const parsed = verdictSchema.safeParse(await response.json());
      return parsed.success
        ? { kind: "verdict", verdict: parsed.data }
        : { kind: "unavailable", detail: "Guard returned an unexpected response" };
    } catch (error) {
      return { kind: "unavailable", detail: `Guard could not be reached: ${String(error)}` };
    }
  }
}

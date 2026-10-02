/**
 * The one path every tool call takes:
 *   1. authenticate the simulated UAE PASS session,
 *   2. resolve the target service (if any) so Guard sees its tags,
 *   3. ask Rasikh Guard about sending this call's data to TAMM,
 *   4. execute only on `allow`.
 * A tool can never skip the Guard step.
 */
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { Audience, DataLabel, PayloadRef } from "../contract.js";
import type { ServiceSummary, TammBackend } from "../backend/types.js";
import type { GuardClient } from "../guard/client.js";
import type { SimulatedUaePass, UaePassSession } from "../uaepass.js";
import { denied, failure } from "./results.js";

export interface ToolContext {
  backend: TammBackend;
  guard: GuardClient;
  uaepass: SimulatedUaePass;
}

export interface ToolCall {
  tool: string;
  uaepassSession: string;
  guardSessionId: string;
  /** Session audience the tool requires: a fixed audience, the target service's audience, or any if unset. */
  requiredAudience?: Audience | "service";
  /** Service the call targets; must exist. Its tags are passed to Guard. */
  serviceId?: string;
  payloadRefs?: PayloadRef[];
}

export interface Authorised {
  session: UaePassSession;
  guardCheckId: string;
  service: ServiceSummary | undefined;
}

/** Every label carried by the given refs, deduplicated, in first-seen order. */
export function labelsOf(refs: readonly PayloadRef[]): DataLabel[] {
  return [...new Set(refs.flatMap((ref) => ref.labels))];
}

/**
 * Runs `execute` only if the UAE PASS session is valid, the service exists, and Guard
 * answers `allow`. Otherwise returns an error result or a structured Guard denial.
 */
export async function runGuarded(
  ctx: ToolContext,
  call: ToolCall,
  execute: (authorised: Authorised) => Promise<CallToolResult>,
): Promise<CallToolResult> {
  const session = ctx.uaepass.resolve(call.uaepassSession);
  if (!session) {
    return failure("invalid_uaepass_session", "Sign in with UAE PASS (simulated) to continue.");
  }
  const service = call.serviceId === undefined ? undefined : await ctx.backend.getService(call.serviceId);
  if (call.serviceId !== undefined && !service) {
    return failure("not_found", `No service with id ${call.serviceId}.`);
  }
  const requiredAudience = call.requiredAudience === "service" ? service?.audience : call.requiredAudience;
  if (requiredAudience && session.audience !== requiredAudience) {
    return failure("audience_mismatch", `This service needs a ${requiredAudience} UAE PASS session.`);
  }
  const payloadRefs = call.payloadRefs ?? [];
  const verdict = await ctx.guard.check({
    session_id: call.guardSessionId,
    tool: call.tool,
    destination: "tamm",
    data_labels: labelsOf(payloadRefs),
    payload_refs: payloadRefs,
    ...(service ? { service_tags: service.tags } : {}),
  });
  if (verdict.decision !== "allow" || verdict.check_id === null) {
    return denied(verdict);
  }
  return execute({ session, guardCheckId: verdict.check_id, service });
}

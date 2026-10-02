/**
 * The two paths a tool call can take (INTEGRATION.md 4.2, 4.3):
 * - `withSession`: authenticate the simulated UAE PASS session, then execute.
 * - `withGuard` (data-sending tools): authenticate, resolve the target service, ask Rasikh
 *   Guard about sending the documents to TAMM, and execute only on `allow`.
 */
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { DataLabel, PayloadRef } from "../contract.js";
import type { TammBackend } from "../backend/types.js";
import type { GuardClient } from "../guard/client.js";
import type { SimulatedUaePass, UaePassSession } from "../uaepass.js";
import { denied, failure } from "./results.js";

export interface ToolContext {
  backend: TammBackend;
  guard: GuardClient;
  uaepass: SimulatedUaePass;
}

/** Every label carried by the given refs, deduplicated, in first-seen order. */
export function labelsOf(refs: readonly PayloadRef[]): DataLabel[] {
  return [...new Set(refs.flatMap((ref) => ref.labels))];
}

/** Runs `execute` only if `uaepassSession` is a live simulated UAE PASS session. */
export async function withSession(
  ctx: ToolContext,
  uaepassSession: string,
  execute: (session: UaePassSession) => Promise<CallToolResult>,
): Promise<CallToolResult> {
  const session = ctx.uaepass.resolve(uaepassSession);
  return session ? execute(session) : failure("unknown_session", "Sign in with UAE PASS (simulated) to continue.");
}

export interface GuardedCall {
  tool: string;
  uaepassSession: string;
  guardSessionId: string;
  serviceId: string;
  documents: PayloadRef[];
}

/**
 * Runs `execute` only if the session is valid, the service exists, and Guard answers
 * `allow` for sending `documents` to TAMM. Otherwise returns an error or a Guard denial,
 * and the backend is never asked to act.
 */
export async function withGuard(
  ctx: ToolContext,
  call: GuardedCall,
  execute: (session: UaePassSession) => Promise<CallToolResult>,
): Promise<CallToolResult> {
  return withSession(ctx, call.uaepassSession, async (session) => {
    const service = await ctx.backend.getService(call.serviceId);
    if (!service) {
      return failure("unknown_service", `No service with id ${call.serviceId}.`);
    }
    const outcome = await ctx.guard.check({
      session_id: call.guardSessionId,
      tool: call.tool,
      destination: "tamm",
      data_labels: labelsOf(call.documents),
      payload_refs: call.documents,
      service_tags: service.tags,
    });
    if (outcome.kind === "unavailable") {
      console.error(`[tamm-mcp] ${call.tool} stopped, failing closed: ${outcome.detail}`);
      return failure("guard_unavailable", "The privacy check could not be completed, so nothing was sent.");
    }
    return outcome.verdict.decision === "allow" ? execute(session) : denied(outcome.verdict);
  });
}

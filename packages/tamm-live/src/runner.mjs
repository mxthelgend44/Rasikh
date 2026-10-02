/**
 * Runs one scenario and emits TraceSteps through a callback.
 * Everything TAMM is a MOCK and UAE PASS is SIMULATED. Steps hold labels, refs, ids, service ids,
 * decisions and statuses only: never a raw document value, a UAE PASS session or a full Guard session id.
 */
import { GuardClient, ServiceError, TammClient } from "./guard-client.mjs";
import { HIDDEN, maskId, sanitize } from "./redact.mjs";

const LABELS = ["passport", "emirates_id", "salary", "bank_statement", "employment", "family", "address", "degree", "health"];

export const DEFAULT_HINTS = {
  guard: "cd packages/rasikh-guard && RASIKH_DEMO_MODE=1 cargo run --release -p rasikh-guard   (listens on 127.0.0.1:8787)",
  tamm: "cd packages/tamm-mcp && RASIKH_DEMO_MODE=1 npm run dev   (listens on 127.0.0.1:8790)",
};

/** A run that ended with a plain-language failure. Never carries a stack to the client. */
export class RunFailure extends Error {
  constructor(message, hint) {
    super(message);
    this.hint = hint;
  }
}

const sleep = (ms, signal) =>
  new Promise((resolve) => {
    if (!ms || ms <= 0 || signal?.aborted) return resolve();
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => (clearTimeout(t), resolve()), { once: true });
  });

const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => obj && obj[k] !== undefined).map((k) => [k, obj[k]]));

function serviceDown(service, hints) {
  if (service === "guard") {
    return new RunFailure(
      "Rasikh Guard is not reachable, so nothing was sent to TAMM. The demo fails closed: no Guard, no call.",
      `Start Guard: ${hints.guard}`,
    );
  }
  return new RunFailure("The TAMM mock server is not reachable, so there is nothing to run against.", `Start the TAMM mock: ${hints.tamm}`);
}

/** Probes both services before a run. Throws RunFailure naming every missing service. */
export async function preflight({ guard, tamm, hints = DEFAULT_HINTS }) {
  const [g, t] = await Promise.allSettled([guard.health(), tamm.health()]);
  const down = [];
  if (g.status === "rejected") down.push("guard");
  if (t.status === "rejected") down.push("tamm");
  if (down.length === 0) return;
  if (down.length === 1) throw serviceDown(down[0], hints);
  throw new RunFailure(
    "Neither Rasikh Guard nor the TAMM mock is reachable, so nothing was sent anywhere. The demo fails closed.",
    `Start Guard: ${hints.guard}   Then the TAMM mock: ${hints.tamm}`,
  );
}

/**
 * Executes `scenario.run(ctx)`; emits { event: "step" | "done" | "fail", data }.
 * deps: { guard: GuardClient, tamm: TammClient, hints?, paceMs?, signal?, now? }
 */
export async function runScenario(scenario, deps, emit) {
  const { guard, tamm, hints = DEFAULT_HINTS, paceMs = 0, signal, now = () => performance.now() } = deps;
  const startedAt = now();
  const secrets = [];
  const seenChecks = new Set();
  let n = 0;
  let guardSession = null;
  let uaepass = null;
  const elapsed = () => Math.round(now() - startedAt);

  function emitStep(partial) {
    n += 1;
    const step = sanitize(
      { n, atMs: elapsed(), ms: 0, ...partial, mock: true },
      secrets,
    );
    emit({ event: "step", data: step });
    return step;
  }

  /** Runs `fn`, measuring its duration. Network errors are mapped to a fail-closed RunFailure. */
  async function timed(service, fn) {
    await sleep(paceMs, signal);
    if (signal?.aborted) throw new RunFailure("The run was cancelled.", "Start it again.");
    const t0 = now();
    try {
      const value = await fn();
      return { value, ms: Math.max(0, Math.round(now() - t0)) };
    } catch (error) {
      if (error instanceof RunFailure) throw error;
      if (error instanceof ServiceError || error?.name === "McpError") {
        const where = error.service === "Guard" ? "guard" : service;
        if (error.kind === "unreachable" || error.kind === "timeout") throw serviceDown(where, hints);
        throw new RunFailure(
          `${where === "guard" ? "Rasikh Guard" : "The TAMM mock"} answered with an error (${error.message}). Nothing further was sent.`,
          "Press Reset demo, then run the scenario again.",
        );
      }
      throw error;
    }
  }

  const ctx = {
    get guardSession() { return guardSession; },

    async openSession({ caseId, caseType }) {
      const { value, ms } = await timed("guard", () => guard.openSession(caseId, caseType));
      guardSession = value.session_id;
      secrets.push({ value: guardSession, replacement: maskId(guardSession) });
      emitStep({
        kind: "guard.session",
        title: `Open a Guard session for ${caseId}`,
        actor: "app",
        request: { case_id: caseId, case_type: caseType },
        response: { session_id: guardSession },
        ms,
      });
    },

    async observe(refs, title) {
      const { ms } = await timed("guard", () => guard.observe(guardSession, "newcomer", refs));
      emitStep({
        kind: "guard.observe",
        title,
        actor: "agent",
        request: { session_id: guardSession, source: "newcomer", payload_refs: refs },
        response: { recorded: true },
        ms,
      });
    },

    async login(subjectRef, audience = "individual") {
      const { value, ms } = await timed("tamm", () => tamm.login(subjectRef, audience));
      uaepass = value.uaepass_session;
      secrets.push({ value: uaepass, replacement: HIDDEN });
      emitStep({
        kind: "tamm.login",
        title: "Sign in with UAE PASS (simulated)",
        actor: "app",
        request: { subject_ref: subjectRef, audience },
        response: { simulated: true, uaepass_session: HIDDEN },
        ms,
      });
    },

    /**
     * Calls a TAMM tool, then reads Guard's own log for the check TAMM made before acting.
     * Returns { denied, applicationId, status, decision }.
     */
    async tool(name, args, { title, labels, serviceTags }) {
      const callArgs = { ...args, uaepass_session: uaepass, guard_session_id: guardSession };
      const { value: res, ms } = await timed("tamm", () => tamm.callTool(name, callArgs));
      const body = res.structured ?? {};
      const errorCode = body.error?.code;
      const denied = body.denied === true;
      const applicationId = typeof body.application_id === "string" ? body.application_id : null;
      emitStep({
        kind: "tamm.tool",
        title,
        actor: "agent",
        request: { tool: name, arguments: { ...args, uaepass_session: HIDDEN, guard_session_id: guardSession } },
        response: {
          ...pick(body, ["mock", "denied", "application_id", "status"]),
          ...(body.guard ? { guard: pick(body.guard, ["decision", "reason", "policy_rule"]) } : {}),
          ...(body.error ? { error: pick(body.error, ["code", "message"]) } : {}),
        },
        ...(applicationId ? { status: body.status } : {}),
        ms,
      });
      if (errorCode === "guard_unavailable") throw serviceDown("guard", hints);
      if (res.isError || errorCode) {
        throw new RunFailure(
          `The TAMM mock returned an error (${errorCode ?? "unknown"}). Nothing was created.`,
          "Press Reset demo, then run the scenario again.",
        );
      }

      // The check happened inside TAMM, before it acted. Read what Guard recorded for it.
      let decision;
      let source = "Guard log for this session";
      let checkId;
      let ms2 = 0;
      try {
        const t0 = now();
        const log = await guard.log(guardSession);
        ms2 = Math.round(now() - t0);
        const entry = (log.entries ?? []).find((e) => !seenChecks.has(e.check_id) && e.tool === name);
        if (entry) {
          seenChecks.add(entry.check_id);
          checkId = entry.check_id;
          decision = pick(entry, ["decision", "reason", "policy_rule"]);
        }
      } catch {
        /* fall back to the tool result below */
      }
      if (!decision) {
        source = "TAMM tool result (Guard log unavailable)";
        decision = denied
          ? pick(body.guard, ["decision", "reason", "policy_rule"])
          : { decision: "allow", reason: "TAMM only acts after Guard allows the call, and it created an application." };
      }
      if (decision.decision !== "allow") {
        const label = String(decision.policy_rule ?? "").split(".")[0];
        decision.blocked_labels = LABELS.includes(label) ? [label] : (labels ?? []);
      }
      emitStep({
        kind: "guard.check",
        title: `Guard's decision on that call: ${decision.decision}`,
        actor: "guard",
        request: {
          tool: name,
          destination: "tamm",
          data_labels: labels ?? [],
          ...(serviceTags ? { service_tags: serviceTags } : {}),
          sent_by: "TAMM MCP, before it acts",
        },
        response: { ...(checkId ? { check_id: checkId } : {}), ...decision, source },
        decision,
        ms: ms2,
      });
      return { denied, applicationId, status: body.status, decision };
    },

    async advance(applicationId, title) {
      const { value, ms } = await timed("tamm", () => tamm.advance(applicationId));
      emitStep({
        kind: "tamm.advance",
        title,
        actor: "tamm",
        request: { application_id: applicationId, demo_control: "POST /dev/advance (demo mode only)" },
        response: { status: value.status },
        status: value.status,
        ms,
      });
      return value.status;
    },

    async status(applicationId, title) {
      const { value: res, ms } = await timed("tamm", () => tamm.callTool("get_application_status", { application_id: applicationId, uaepass_session: uaepass }));
      const body = res.structured ?? {};
      if (res.isError || body.error) {
        throw new RunFailure(`The TAMM mock could not read the application status (${body.error?.code ?? "error"}).`, "Press Reset demo, then run the scenario again.");
      }
      emitStep({
        kind: "tamm.status",
        title,
        actor: "agent",
        request: { tool: "get_application_status", arguments: { application_id: applicationId, uaepass_session: HIDDEN } },
        response: {
          mock: body.mock,
          application_id: body.application_id,
          status: body.status,
          history: Array.isArray(body.history) ? body.history.map((h) => ({ status: h.status })) : [],
        },
        status: body.status,
        ms,
      });
      return body.status;
    },

    note(title, response) {
      emitStep({ kind: "note", title, actor: "app", request: {}, response });
    },
  };

  try {
    await preflight({ guard, tamm, hints });
    const result = await scenario.run(ctx);
    emit({ event: "done", data: { outcome: result.outcome, ms: elapsed(), summary: result.summary } });
  } catch (error) {
    if (error instanceof RunFailure) {
      emit({ event: "fail", data: { message: error.message, hint: error.hint } });
    } else {
      console.error("[tamm-live] unexpected error while running", scenario.id, error);
      emit({
        event: "fail",
        data: {
          message: "Something unexpected happened while running this scenario. Nothing further was sent.",
          hint: "Press Reset demo and run it again. If it repeats, check that Guard and the TAMM mock are both running.",
        },
      });
    }
  }
}

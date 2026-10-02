// src/background/orchestratorClient.ts
// The only network call the extension makes: the local guide backend (default http://localhost:8796).
// The body is the structure-only page model (no field values) plus the step index. In the default
// demo mode the backend makes no further network call.
import type { TurnRequest, TurnResponse, Provider, StepInfo, AgentAction } from "../shared/types";

export const API: string = (import.meta as any).env?.VITE_API_BASE ?? "http://localhost:8796";

export interface PackSummary {
  id: string;
  name: string;
  nameAr?: string;
  status?: string;
  tasks: { id: string; title: string; titleAr?: string; steps: number }[];
}

export async function fetchPacks(): Promise<{ provider: Provider; packs: PackSummary[] }> {
  const resp = await fetch(`${API}/skills`);
  if (!resp.ok) throw new Error(`GET_${resp.status}`);
  return resp.json();
}

export async function postTurn(req: TurnRequest): Promise<TurnResponse> {
  const resp = await fetch(`${API}/agent/turn`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(req)
  });
  if (!resp.ok || !resp.body) throw new Error("TURN_FAILED");

  const reader = resp.body.getReader();
  const dec = new TextDecoder();
  let buffer = "",
    action: AgentAction | null = null,
    message = "",
    objectiveStatus = "in-progress",
    expectVerify: string | undefined,
    provider: Provider = "demo",
    step: StepInfo | undefined;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += dec.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";
    for (const ev of events) {
      const type = ev.match(/^event: (.*)$/m)?.[1];
      const data = ev.match(/^data: (.*)$/m)?.[1];
      if (!data) continue;
      const parsed = JSON.parse(data);
      if (type === "chunk") message += parsed.text;
      if (type === "action") {
        action = parsed.action;
        objectiveStatus = parsed.objectiveStatus;
        expectVerify = parsed.expectVerify;
        provider = parsed.provider ?? "demo";
        step = parsed.step;
      }
    }
  }
  if (!step || !action) throw new Error("TURN_INCOMPLETE");
  return { turnId: req.turnId, message, action, risk: action.risk ?? "safe", objectiveStatus, expectVerify, provider, step };
}

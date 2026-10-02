/** Test harness: a real MCP client connected in-memory to the TAMM server, with a fake Guard. */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { MockTammBackend } from "../src/backend/mock/mockBackend.js";
import type { Progression } from "../src/backend/mock/stateMachine.js";
import { CONTRACT_VERSION, type GuardDecision } from "../src/contract.js";
import type { GuardCheckRequest, GuardClient, GuardOutcome } from "../src/guard/client.js";
import { createTammServer } from "../src/server.js";
import { SimulatedUaePass } from "../src/uaepass.js";

/** Guard double that records every request and answers with a fixed or computed outcome. */
export class FakeGuard implements GuardClient {
  readonly requests: GuardCheckRequest[] = [];
  constructor(private readonly answer: (request: GuardCheckRequest) => GuardOutcome = () => verdict("allow")) {}

  async check(request: GuardCheckRequest): Promise<GuardOutcome> {
    this.requests.push(request);
    return this.answer(request);
  }
}

/** Builds a Guard verdict outcome for tests. */
export function verdict(decision: GuardDecision, policyRule = `test.${decision}`): GuardOutcome {
  return {
    kind: "verdict",
    verdict: {
      contract_version: CONTRACT_VERSION,
      check_id: `chk_test_${decision}`,
      decision,
      reason: decision === "allow" ? "Allowed." : "Not allowed.",
      policy_rule: policyRule,
      blocked_labels: [],
    },
  };
}

export type ToolBody = Record<string, unknown> & { error?: { code: string; message: string } };

export interface Harness {
  client: Client;
  guard: FakeGuard;
  backend: MockTammBackend;
  /** Logs in with simulated UAE PASS and returns the session token. */
  login(audience?: "individual" | "business", subjectRef?: string): string;
  /** Calls a tool and returns its structured content and error flag. */
  call(name: string, args: Record<string, unknown>): Promise<{ body: ToolBody; isError: boolean }>;
  close(): Promise<void>;
}

export interface HarnessOptions {
  guard?: FakeGuard;
  progression?: Progression;
  now?: () => number;
}

export async function createHarness(options: HarnessOptions = {}): Promise<Harness> {
  const guard = options.guard ?? new FakeGuard();
  const backend = new MockTammBackend({
    progression: options.progression ?? { mode: "demo" },
    ...(options.now ? { now: options.now } : {}),
  });
  const uaepass = new SimulatedUaePass();
  const server = createTammServer({ backend, guard, uaepass });
  const client = new Client({ name: "tamm-mcp-test", version: "0.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

  return {
    client,
    guard,
    backend,
    login: (audience = "individual", subjectRef = "hire_demo_001") => uaepass.login(subjectRef, audience).uaepass_session,
    async call(name, args) {
      const result = await client.callTool({ name, arguments: args });
      return { body: result.structuredContent as ToolBody, isError: result.isError === true };
    },
    async close() {
      await client.close();
      await server.close();
    },
  };
}

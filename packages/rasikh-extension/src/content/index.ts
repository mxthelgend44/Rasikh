// src/content/index.ts  (content script entry, request handlers)
// Inert until the worker asks. It is registered for an origin only after the person grants that
// origin (src/background/sites.ts), and the worker refuses to talk to it without a grant.
import { onRequest } from "../shared/bus";
import { perceive } from "./perception/pipeline";
import { execute } from "./actions/executor";
import { startLifecycle } from "./lifecycle";
import type { PageModel, AgentAction, ActionResult } from "../shared/types";

const FLAG = "__rasikhGuideInjected";
if (!(globalThis as any)[FLAG]) {
  // a grant can both register the script and inject it into an open tab: never install twice
  (globalThis as any)[FLAG] = true;

  onRequest<Record<string, never>, { model: PageModel }>("perceive", async () => {
    const model = await perceive();
    return { model };
  });

  onRequest<{ action: AgentAction }, { result: ActionResult }>("doAction", async ({ action }) => {
    const result = await execute(action);
    return { result };
  });

  startLifecycle();
}

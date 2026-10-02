// backend/provider.ts
// Chooses the model provider. DEFAULT IS THE OFFLINE DEMO GUIDE. The Anthropic path runs only when
// MODEL_PROVIDER is explicitly "ai" (or "anthropic") AND ANTHROPIC_KEY is set. A key that merely
// exists in the environment for other work never turns the cloud path on. Responses carry the
// provider so the panel can label "demo guide" vs "AI".
import type { Provider } from "../src/shared/types";
import * as demo from "./modelDemo";
import * as ai from "./model";

export function providerName(env: Record<string, string | undefined> = process.env): Provider {
  const choice = (env.MODEL_PROVIDER ?? "demo").toLowerCase();
  if ((choice === "ai" || choice === "anthropic") && env.ANTHROPIC_KEY) return "ai";
  return "demo";
}

export function selectProvider(env: Record<string, string | undefined> = process.env) {
  const name = providerName(env);
  return { name, callModelStreaming: name === "ai" ? ai.callModelStreaming : demo.callModelStreaming };
}

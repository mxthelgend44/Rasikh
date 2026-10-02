/** Runtime configuration from environment variables (INTEGRATION.md section 5). */
import type { Progression } from "./backend/mock/stateMachine.js";

export interface Config {
  host: string;
  port: number;
  mcpPath: string;
  guardUrl: string;
  demoMode: boolean;
  progression: Progression;
}

const DEFAULT_MCP_URL = "http://localhost:8790/mcp";
const DEFAULT_GUARD_URL = "http://localhost:8787";
const DEFAULT_STEP_SECONDS = 30;

/** Reads configuration from `env`, applying contract defaults. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const mcpUrl = new URL(env.TAMM_MCP_URL ?? DEFAULT_MCP_URL);
  const demoMode = env.RASIKH_DEMO_MODE === "1";
  const stepSeconds = Number(env.TAMM_STEP_SECONDS ?? DEFAULT_STEP_SECONDS);
  if (!Number.isFinite(stepSeconds) || stepSeconds <= 0) {
    throw new Error(`TAMM_STEP_SECONDS must be a positive number, got ${env.TAMM_STEP_SECONDS}`);
  }
  return {
    host: env.TAMM_MCP_HOST ?? "127.0.0.1",
    port: Number(mcpUrl.port || 80),
    mcpPath: mcpUrl.pathname,
    guardUrl: env.RASIKH_GUARD_URL ?? DEFAULT_GUARD_URL,
    demoMode,
    progression: demoMode ? { mode: "demo" } : { mode: "clock", stepMs: stepSeconds * 1000 },
  };
}

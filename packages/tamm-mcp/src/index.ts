#!/usr/bin/env node
/**
 * Entry point. Always serves HTTP (Streamable HTTP MCP + dev endpoints).
 * With `--stdio`, also serves MCP over stdio for local MCP clients; logs go to stderr.
 */
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { MockTammBackend } from "./backend/mock/mockBackend.js";
import { loadConfig } from "./config.js";
import { HttpGuardClient } from "./guard/client.js";
import { createHttpApp } from "./http.js";
import { createTammServer } from "./server.js";
import type { ToolContext } from "./tools/pipeline.js";
import { SimulatedUaePass } from "./uaepass.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const backend = new MockTammBackend({ progression: config.progression });
  const uaepass = new SimulatedUaePass();
  const ctx: ToolContext = { backend, guard: new HttpGuardClient(config.guardUrl), uaepass };

  const app = createHttpApp(ctx, {
    host: config.host,
    mcpPath: config.mcpPath,
    ...(config.demoMode ? { demo: backend, resetSessions: () => uaepass.reset() } : {}),
  });
  app.listen(config.port, config.host, () => {
    console.error(
      `[tamm-mcp] MOCK TAMM MCP on http://${config.host}:${config.port}${config.mcpPath} ` +
        `(guard ${config.guardUrl}, ${config.demoMode ? "demo mode" : "timed mode"})`,
    );
  });

  if (process.argv.includes("--stdio")) {
    await createTammServer(ctx).connect(new StdioServerTransport());
  }
}

main().catch((error: unknown) => {
  console.error("[tamm-mcp] failed to start", error);
  process.exit(1);
});

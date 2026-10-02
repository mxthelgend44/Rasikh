#!/usr/bin/env node
/**
 * Entry point. Always serves HTTP (Streamable HTTP MCP + dev UAE PASS login).
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
  const ctx: ToolContext = {
    backend: new MockTammBackend({ progression: config.progression }),
    guard: new HttpGuardClient(config.guardUrl),
    uaepass: new SimulatedUaePass(),
  };

  const app = createHttpApp(ctx, { host: config.host, mcpPath: config.mcpPath });
  app.listen(config.port, config.host, () => {
    console.error(
      `[tamm-mcp] MOCK TAMM MCP on http://${config.host}:${config.port}${config.mcpPath} ` +
        `(guard ${config.guardUrl}, ${config.demoMode ? "demo mode" : "clock mode"})`,
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

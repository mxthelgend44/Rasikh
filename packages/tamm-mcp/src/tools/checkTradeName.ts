import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { type ToolContext, withSession } from "./pipeline.js";
import { ok } from "./results.js";
import { uaepassSession } from "./schemas.js";

/** Registers `check_trade_name`: availability check against illustrative naming rules. */
export function registerCheckTradeName(server: McpServer, ctx: ToolContext): void {
  server.registerTool(
    "check_trade_name",
    {
      title: "Check a trade name",
      description:
        "Check whether a proposed business trade name appears available. Naming rules here are illustrative, not official.",
      inputSchema: {
        name: z.string().describe("Proposed trade name in English."),
        uaepass_session: uaepassSession,
      },
      annotations: { readOnlyHint: true },
    },
    (args) => withSession(ctx, args.uaepass_session, async () => ok(await ctx.backend.checkTradeName(args.name))),
  );
}

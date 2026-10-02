import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { LICENSING_AUTHORITIES } from "../backend/types.js";
import { type ToolContext, runGuarded } from "./pipeline.js";
import { ok } from "./results.js";
import { guardSessionId, uaepassSession } from "./schemas.js";

const NAME = "check_trade_name";

/** Registers `check_trade_name`: availability and (illustrative) naming-rule check. */
export function registerCheckTradeName(server: McpServer, ctx: ToolContext): void {
  server.registerTool(
    NAME,
    {
      title: "Check a trade name",
      description:
        "Check whether a proposed business trade name is available. Naming rules here are illustrative, not official.",
      inputSchema: {
        proposed_name: z.string().describe("Proposed trade name in English."),
        licensing_authority: z.enum(LICENSING_AUTHORITIES).default("ded"),
        uaepass_session: uaepassSession,
        guard_session_id: guardSessionId,
      },
      annotations: { readOnlyHint: true },
    },
    (args) =>
      runGuarded(
        ctx,
        {
          tool: NAME,
          uaepassSession: args.uaepass_session,
          guardSessionId: args.guard_session_id,
          requiredAudience: "business",
        },
        async () => ok({ ...(await ctx.backend.checkTradeName(args.proposed_name, args.licensing_authority)) }),
      ),
  );
}

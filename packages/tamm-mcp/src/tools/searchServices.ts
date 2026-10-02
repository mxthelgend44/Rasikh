import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { audienceSchema } from "../contract.js";
import { type ToolContext, runGuarded } from "./pipeline.js";
import { ok } from "./results.js";
import { guardSessionId, uaepassSession } from "./schemas.js";

const NAME = "search_services";

/** Registers `search_services`: free-text search of the (mock) TAMM catalogue for one audience. */
export function registerSearchServices(server: McpServer, ctx: ToolContext): void {
  server.registerTool(
    NAME,
    {
      title: "Search TAMM services",
      description: "Search Abu Dhabi government services (mock TAMM catalogue) for individuals or businesses.",
      inputSchema: {
        query: z.string().describe("What the user needs, e.g. 'tenancy contract'."),
        audience: audienceSchema,
        uaepass_session: uaepassSession,
        guard_session_id: guardSessionId,
      },
      annotations: { readOnlyHint: true },
    },
    (args) =>
      runGuarded(ctx, { tool: NAME, uaepassSession: args.uaepass_session, guardSessionId: args.guard_session_id }, async () =>
        ok({ results: await ctx.backend.searchServices(args.query, args.audience) }),
      ),
  );
}

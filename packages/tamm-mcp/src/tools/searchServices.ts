import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { audienceSchema } from "../contract.js";
import { type ToolContext, withSession } from "./pipeline.js";
import { ok } from "./results.js";
import { uaepassSession } from "./schemas.js";

/** Registers `search_services`: free-text search of the mock TAMM catalogue for one audience. */
export function registerSearchServices(server: McpServer, ctx: ToolContext): void {
  server.registerTool(
    "search_services",
    {
      title: "Search TAMM services",
      description: "Search Abu Dhabi government services (mock TAMM catalogue) for individuals or businesses.",
      inputSchema: {
        query: z.string().describe("What the user needs, e.g. 'tenancy contract'."),
        audience: audienceSchema,
        uaepass_session: uaepassSession,
      },
      annotations: { readOnlyHint: true },
    },
    (args) =>
      withSession(ctx, args.uaepass_session, async () =>
        ok({ results: await ctx.backend.searchServices(args.query, args.audience) }),
      ),
  );
}

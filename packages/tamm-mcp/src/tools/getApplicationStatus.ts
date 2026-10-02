import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { type ToolContext, withSession } from "./pipeline.js";
import { failure, ok } from "./results.js";
import { uaepassSession } from "./schemas.js";

/** Registers `get_application_status`: current status, history and any information request. */
export function registerGetApplicationStatus(server: McpServer, ctx: ToolContext): void {
  server.registerTool(
    "get_application_status",
    {
      title: "Get application status",
      description: "Get the current status and history of a TAMM application, and what is needed if it needs info.",
      inputSchema: {
        application_id: z.string().min(1).describe("Id returned by start_application or register_tenancy_tawtheeq."),
        uaepass_session: uaepassSession,
      },
      annotations: { readOnlyHint: true },
    },
    (args) =>
      withSession(ctx, args.uaepass_session, async () => {
        const application = await ctx.backend.getApplication(args.application_id);
        if (!application) {
          return failure("unknown_application", `No application with id ${args.application_id}.`);
        }
        const { application_id, status, history, needs_info } = application;
        return ok({ application_id, status, history, needs_info });
      }),
  );
}

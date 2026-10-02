import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { type ToolContext, runGuarded } from "./pipeline.js";
import { failure, ok } from "./results.js";
import { guardSessionId, uaepassSession } from "./schemas.js";

const NAME = "get_application_status";

/** Registers `get_application_status`: current status and history of the caller's application. */
export function registerGetApplicationStatus(server: McpServer, ctx: ToolContext): void {
  server.registerTool(
    NAME,
    {
      title: "Get application status",
      description: "Get the current status and history of a TAMM application started by this UAE PASS user.",
      inputSchema: {
        application_id: z.string().min(1).describe("Id returned by start_application or register_tenancy_tawtheeq."),
        uaepass_session: uaepassSession,
        guard_session_id: guardSessionId,
      },
      // Not read-only: in the mock, each read can advance the application one step.
    },
    (args) =>
      runGuarded(
        ctx,
        { tool: NAME, uaepassSession: args.uaepass_session, guardSessionId: args.guard_session_id },
        async ({ session }) => {
          const application = await ctx.backend.getApplicationStatus(args.application_id, session.subject_ref);
          return application
            ? ok({ ...application })
            : failure("not_found", `No application with id ${args.application_id} for this user.`);
        },
      ),
  );
}

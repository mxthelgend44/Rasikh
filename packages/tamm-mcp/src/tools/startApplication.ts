import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { type ToolContext, runGuarded } from "./pipeline.js";
import { ok } from "./results.js";
import { guardSessionId, payloadRefs, serviceId, uaepassSession } from "./schemas.js";

const NAME = "start_application";

/** Registers `start_application`: submits an application with documents, after a Guard check. */
export function registerStartApplication(server: McpServer, ctx: ToolContext): void {
  server.registerTool(
    NAME,
    {
      title: "Start a TAMM application",
      description:
        "Submit an application for a TAMM service with the listed documents. Rasikh Guard must allow sending them to TAMM.",
      inputSchema: {
        service_id: serviceId,
        uaepass_session: uaepassSession,
        guard_session_id: guardSessionId,
        payload_refs: payloadRefs,
      },
    },
    (args) =>
      runGuarded(
        ctx,
        {
          tool: NAME,
          uaepassSession: args.uaepass_session,
          guardSessionId: args.guard_session_id,
          serviceId: args.service_id,
          requiredAudience: "service",
          payloadRefs: args.payload_refs,
        },
        async ({ session, guardCheckId }) => {
          const application = await ctx.backend.startApplication({
            service_id: args.service_id,
            subject_ref: session.subject_ref,
            payload_refs: args.payload_refs,
          });
          return ok({
            application_id: application.application_id,
            service_id: application.service_id,
            status: application.status,
            submitted_at: application.submitted_at,
            guard_check_id: guardCheckId,
          });
        },
      ),
  );
}

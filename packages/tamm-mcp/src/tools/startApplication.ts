import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { type ToolContext, withGuard } from "./pipeline.js";
import { ok } from "./results.js";
import { applicantRef, documents, guardSessionId, serviceId, uaepassSession } from "./schemas.js";

const NAME = "start_application";

/** Registers `start_application`: submits an application with documents, only after Guard allows it. */
export function registerStartApplication(server: McpServer, ctx: ToolContext): void {
  server.registerTool(
    NAME,
    {
      title: "Start a TAMM application",
      description:
        "Submit an application for a TAMM service with the listed documents. Rasikh Guard must allow sending them to TAMM.",
      inputSchema: {
        service_id: serviceId,
        applicant_ref: applicantRef,
        documents,
        uaepass_session: uaepassSession,
        guard_session_id: guardSessionId,
      },
    },
    (args) =>
      withGuard(
        ctx,
        {
          tool: NAME,
          uaepassSession: args.uaepass_session,
          guardSessionId: args.guard_session_id,
          serviceId: args.service_id,
          documents: args.documents,
          args,
        },
        async (session) => {
          const application = await ctx.backend.startApplication({
            service_id: args.service_id,
            applicant_ref: args.applicant_ref,
            submitted_by: session.subject_ref,
            documents: args.documents,
          });
          return ok({ application_id: application.application_id, status: application.status });
        },
      ),
  );
}

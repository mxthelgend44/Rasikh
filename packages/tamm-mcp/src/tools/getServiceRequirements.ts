import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { type ToolContext, runGuarded } from "./pipeline.js";
import { failure, ok } from "./results.js";
import { guardSessionId, serviceId, uaepassSession } from "./schemas.js";

const NAME = "get_service_requirements";

/** Registers `get_service_requirements`: documents, fee and processing time (all illustrative). */
export function registerGetServiceRequirements(server: McpServer, ctx: ToolContext): void {
  server.registerTool(
    NAME,
    {
      title: "Get service requirements",
      description:
        "List the documents, fee and processing time for a TAMM service. Values are illustrative, not official.",
      inputSchema: { service_id: serviceId, uaepass_session: uaepassSession, guard_session_id: guardSessionId },
      annotations: { readOnlyHint: true },
    },
    (args) =>
      runGuarded(
        ctx,
        {
          tool: NAME,
          uaepassSession: args.uaepass_session,
          guardSessionId: args.guard_session_id,
          serviceId: args.service_id,
        },
        async () => {
          const requirements = await ctx.backend.getServiceRequirements(args.service_id);
          return requirements ? ok({ ...requirements }) : failure("not_found", `No service with id ${args.service_id}.`);
        },
      ),
  );
}

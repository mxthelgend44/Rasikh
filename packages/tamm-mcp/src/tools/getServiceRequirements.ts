import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { type ToolContext, withSession } from "./pipeline.js";
import { failure, ok } from "./results.js";
import { serviceId, uaepassSession } from "./schemas.js";

/** Registers `get_service_requirements`: documents, dependencies, fee and duration (illustrative). */
export function registerGetServiceRequirements(server: McpServer, ctx: ToolContext): void {
  server.registerTool(
    "get_service_requirements",
    {
      title: "Get service requirements",
      description:
        "List the documents, prerequisite services, estimated fee and duration for a TAMM service. Values are illustrative.",
      inputSchema: { service_id: serviceId, uaepass_session: uaepassSession },
      annotations: { readOnlyHint: true },
    },
    (args) =>
      withSession(ctx, args.uaepass_session, async () => {
        const requirements = await ctx.backend.getServiceRequirements(args.service_id);
        return requirements ? ok(requirements) : failure("unknown_service", `No service with id ${args.service_id}.`);
      }),
  );
}

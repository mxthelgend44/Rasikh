import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PrerequisiteCycleError, assessReadiness } from "../planning.js";
import { type ToolContext, withSession } from "./pipeline.js";
import { failure, ok } from "./results.js";
import { documents, serviceId, uaepassSession } from "./schemas.js";

/**
 * Registers `get_service_requirements`: documents, dependencies, fee and duration (illustrative),
 * plus the prerequisite order and what the applicant is still missing (contract 1.2.0).
 */
export function registerGetServiceRequirements(server: McpServer, ctx: ToolContext): void {
  server.registerTool(
    "get_service_requirements",
    {
      title: "Get service requirements",
      description:
        "List the documents, prerequisite services, estimated fee and duration for a TAMM service (values are illustrative). " +
        "Pass documents_on_file and completed_services to learn what is still missing and the order to do prerequisites in.",
      inputSchema: {
        service_id: serviceId,
        uaepass_session: uaepassSession,
        documents_on_file: documents.optional().describe("Documents the applicant already holds."),
        completed_services: z.array(z.string()).optional().describe("Service ids already approved."),
      },
      annotations: { readOnlyHint: true },
    },
    (args) =>
      withSession(ctx, args.uaepass_session, async () => {
        const requirements = await ctx.backend.getServiceRequirements(args.service_id);
        if (!requirements) {
          return failure("unknown_service", `No service with id ${args.service_id}.`);
        }
        try {
          const readiness = await assessReadiness(
            ctx.backend,
            requirements,
            args.documents_on_file ?? [],
            args.completed_services ?? [],
          );
          return ok({ ...requirements, ...readiness });
        } catch (error) {
          if (error instanceof PrerequisiteCycleError) {
            return failure("internal", "This service's prerequisites form a cycle in the catalogue.");
          }
          throw error;
        }
      }),
  );
}

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { PayloadRef } from "../contract.js";
import { type RequiredDocument, TAWTHEEQ_SERVICE_ID } from "../backend/types.js";
import { type ToolContext, withGuard } from "./pipeline.js";
import { failure, ok } from "./results.js";
import { applicantRef, guardSessionId, uaepassSession } from "./schemas.js";

const NAME = "register_tenancy_tawtheeq";

/**
 * The documents a Tawtheeq registration sends, by Rasikh's ref convention: the lease itself
 * for the `address` requirement, and `doc_<label>_<applicant_ref>` (for example
 * `doc_passport_hire_demo_001`, INTEGRATION.md 5) for every other required label.
 */
export function tenancyDocuments(
  required: readonly RequiredDocument[],
  leaseRef: string,
  applicant: string,
): PayloadRef[] {
  return required.map(({ label }) => ({
    ref: label === "address" ? leaseRef : `doc_${label}_${applicant}`,
    labels: [label],
  }));
}

/** Registers `register_tenancy_tawtheeq`: the demo shortcut for `start_application` on Tawtheeq. */
export function registerRegisterTenancyTawtheeq(server: McpServer, ctx: ToolContext): void {
  server.registerTool(
    NAME,
    {
      title: "Register a tenancy contract (Tawtheeq)",
      description:
        "Register a residential lease through Tawtheeq. Sends the lease and the tenant's ID documents, so Rasikh Guard must allow it.",
      inputSchema: {
        lease_ref: z.string().min(1).describe("Lease id, e.g. lease_reem_2207."),
        applicant_ref: applicantRef,
        uaepass_session: uaepassSession,
        guard_session_id: guardSessionId,
      },
    },
    async (args) => {
      const requirements = await ctx.backend.getServiceRequirements(TAWTHEEQ_SERVICE_ID);
      if (!requirements) {
        return failure("internal", "The Tawtheeq service is missing from the catalogue.");
      }
      const docs = tenancyDocuments(requirements.required_documents, args.lease_ref, args.applicant_ref);
      return withGuard(
        ctx,
        {
          tool: NAME,
          uaepassSession: args.uaepass_session,
          guardSessionId: args.guard_session_id,
          serviceId: TAWTHEEQ_SERVICE_ID,
          documents: docs,
          args,
        },
        async (session) => {
          const application = await ctx.backend.registerTenancy({
            lease_ref: args.lease_ref,
            applicant_ref: args.applicant_ref,
            submitted_by: session.subject_ref,
            documents: docs,
          });
          return ok({ application_id: application.application_id, status: application.status });
        },
      );
    },
  );
}

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TAWTHEEQ_SERVICE_ID } from "../backend/types.js";
import { type ToolContext, runGuarded } from "./pipeline.js";
import { failure, ok } from "./results.js";
import { guardSessionId, payloadRefs, uaepassSession } from "./schemas.js";

const NAME = "register_tenancy_tawtheeq";
const isoDate = z.iso.date().describe("Calendar date, YYYY-MM-DD.");

/** Registers `register_tenancy_tawtheeq`: registers a tenancy contract, after a Guard check. */
export function registerRegisterTenancyTawtheeq(server: McpServer, ctx: ToolContext): void {
  server.registerTool(
    NAME,
    {
      title: "Register a tenancy contract (Tawtheeq)",
      description:
        "Register a residential tenancy contract through Tawtheeq. Rasikh Guard must allow sending the documents to TAMM.",
      inputSchema: {
        uaepass_session: uaepassSession,
        guard_session_id: guardSessionId,
        property_ref: z.string().min(1),
        landlord_name: z.string().min(1),
        annual_rent_aed: z.number().positive(),
        start_date: isoDate,
        end_date: isoDate,
        payload_refs: payloadRefs,
      },
    },
    async (args) => {
      if (args.end_date <= args.start_date) {
        return failure("invalid_request", "end_date must be after start_date.");
      }
      return runGuarded(
        ctx,
        {
          tool: NAME,
          uaepassSession: args.uaepass_session,
          guardSessionId: args.guard_session_id,
          serviceId: TAWTHEEQ_SERVICE_ID,
          requiredAudience: "service",
          payloadRefs: args.payload_refs,
        },
        async ({ session, guardCheckId }) => {
          const { property_ref, landlord_name, annual_rent_aed, start_date, end_date } = args;
          const application = await ctx.backend.registerTenancy(
            { service_id: TAWTHEEQ_SERVICE_ID, subject_ref: session.subject_ref, payload_refs: args.payload_refs },
            { property_ref, landlord_name, annual_rent_aed, start_date, end_date },
          );
          return ok({
            application_id: application.application_id,
            service_id: application.service_id,
            status: application.status,
            submitted_at: application.submitted_at,
            guard_check_id: guardCheckId,
          });
        },
      );
    },
  );
}

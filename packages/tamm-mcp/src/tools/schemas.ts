/** Input fields shared by several tools. */
import { z } from "zod";
import { payloadRefSchema } from "../contract.js";

export const uaepassSession = z.string().min(1).describe("Simulated UAE PASS session from POST /dev/uaepass/login.");
export const guardSessionId = z.string().min(1).describe("Rasikh Guard session id for this case.");
export const serviceId = z.string().min(1).describe("Service id from search_services, e.g. svc_tawtheeq_registration.");
export const payloadRefs = z
  .array(payloadRefSchema)
  .describe("Every data item sent with this call, with all of its labels. Guard checks each one.");

/** Input fields shared by several tools (INTEGRATION.md 4.4). */
import { z } from "zod";
import { payloadRefSchema } from "../contract.js";

export const uaepassSession = z.string().min(1).describe("Simulated UAE PASS session from POST /dev/uaepass/login.");
export const guardSessionId = z.string().min(1).describe("Rasikh Guard session id for this case.");
export const serviceId = z.string().min(1).describe("Service id from search_services, e.g. svc_tawtheeq_register.");
export const applicantRef = z.string().min(1).describe("Person or company the application is for, e.g. hire_demo_001.");
export const documents = z
  .array(payloadRefSchema)
  .describe("Every document sent with this call, with all of its labels. Rasikh Guard checks each one.");

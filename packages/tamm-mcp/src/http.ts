/**
 * HTTP surface: the Streamable HTTP MCP endpoint plus dev helpers (INTEGRATION.md 4.2, 4.5):
 * `GET /health`, `POST /dev/uaepass/login` (simulated UAE PASS), and the demo-mode-only
 * `POST /dev/advance` and `POST /dev/reset`.
 */
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { Express, NextFunction, Request, Response } from "express";
import { z } from "zod";
import type { DemoControls } from "./backend/mock/mockBackend.js";
import { CONTRACT_VERSION, type ErrorBody, type ErrorCode, audienceSchema } from "./contract.js";
import { createTammServer } from "./server.js";
import type { ToolContext } from "./tools/pipeline.js";

const loginSchema = z.object({ subject_ref: z.string().min(1), audience: audienceSchema });
const advanceSchema = z.object({ application_id: z.string().min(1) });

export interface HttpAppOptions {
  host: string;
  mcpPath: string;
  /** Present only in demo mode; without it the `/dev/advance` and `/dev/reset` routes answer 404. */
  demo?: DemoControls;
  /** Clears simulated UAE PASS sessions on `/dev/reset`. */
  resetSessions?: () => void;
}

function sendError(res: Response, status: number, code: ErrorCode, message: string): void {
  const body: ErrorBody = { contract_version: CONTRACT_VERSION, error: { code, message } };
  res.status(status).json(body);
}

/**
 * Creates the Express app. MCP runs stateless: each POST gets a fresh server and transport
 * over the shared `ctx`, so application and UAE PASS state live in `ctx`, not in MCP sessions.
 */
export function createHttpApp(ctx: ToolContext, options: HttpAppOptions): Express {
  const app = createMcpExpressApp({ host: options.host });
  const { demo } = options;

  app.get("/health", (_req, res) => {
    res.json({ contract_version: CONTRACT_VERSION, status: "ok", mock: true });
  });

  app.post("/dev/uaepass/login", (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 400, "invalid_request", "Send subject_ref and audience (individual or business).");
      return;
    }
    const session = ctx.uaepass.login(parsed.data.subject_ref, parsed.data.audience);
    res.json({ contract_version: CONTRACT_VERSION, uaepass_session: session.uaepass_session, simulated: true });
  });

  app.post("/dev/advance", (req, res) => {
    if (!demo) {
      sendError(res, 404, "demo_mode_only", "Set RASIKH_DEMO_MODE=1 to use /dev/advance.");
      return;
    }
    const parsed = advanceSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 400, "invalid_request", "Send application_id.");
      return;
    }
    const application = demo.advance(parsed.data.application_id);
    if (!application) {
      sendError(res, 404, "unknown_application", `No application with id ${parsed.data.application_id}.`);
      return;
    }
    const { application_id, status, history, needs_info } = application;
    res.json({ contract_version: CONTRACT_VERSION, mock: true, application_id, status, history, needs_info });
  });

  app.post("/dev/reset", (_req, res) => {
    if (!demo) {
      sendError(res, 404, "demo_mode_only", "Set RASIKH_DEMO_MODE=1 to use /dev/reset.");
      return;
    }
    demo.reset();
    options.resetSessions?.();
    res.json({ contract_version: CONTRACT_VERSION, reset: true });
  });

  app.post(options.mcpPath, async (req, res) => {
    const server = createTammServer(ctx);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on("close", () => {
      void transport.close();
      void server.close();
    });
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("[tamm-mcp] MCP request failed", error);
      if (!res.headersSent) {
        sendError(res, 500, "internal", "The MCP request could not be handled.");
      }
    }
  });

  app.all(options.mcpPath, (_req, res) => {
    sendError(res, 405, "invalid_request", "This MCP endpoint is stateless: use POST.");
  });

  app.use((_req, res) => sendError(res, 404, "invalid_request", "No such route."));

  // Last in the chain: whatever the body parser or a route throws becomes a plain contract error.
  // Never echo err.message or err.stack: Express's default handler would print the stack trace with
  // absolute file paths on a malformed or oversized body.
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (res.headersSent) return;
    const status = (err as { status?: unknown } | null)?.status;
    if (status === 413) sendError(res, 413, "invalid_request", "The request body is too large.");
    else if (typeof status === "number" && status >= 400 && status < 500)
      sendError(res, 400, "invalid_request", "The request body could not be read as JSON.");
    else sendError(res, 500, "internal", "The request could not be handled.");
  });

  return app;
}

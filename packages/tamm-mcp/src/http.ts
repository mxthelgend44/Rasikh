/**
 * HTTP surface: the Streamable HTTP MCP endpoint plus dev-only helpers
 * (`GET /health`, `POST /dev/uaepass/login`, simulated UAE PASS).
 */
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { Express, Response } from "express";
import { z } from "zod";
import { CONTRACT_VERSION, type ErrorBody, type ErrorCode, audienceSchema } from "./contract.js";
import { createTammServer } from "./server.js";
import type { ToolContext } from "./tools/pipeline.js";

const loginSchema = z.object({ subject_ref: z.string().min(1), audience: audienceSchema });

function sendError(res: Response, status: number, code: ErrorCode, message: string): void {
  const body: ErrorBody = { contract_version: CONTRACT_VERSION, error: { code, message } };
  res.status(status).json(body);
}

/**
 * Creates the Express app. MCP runs stateless: each POST gets a fresh server and transport
 * over the shared `ctx`, so application and UAE PASS state live in `ctx`, not in MCP sessions.
 */
export function createHttpApp(ctx: ToolContext, options: { host: string; mcpPath: string }): Express {
  const app = createMcpExpressApp({ host: options.host });

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

  app.use((_req, res) => sendError(res, 404, "not_found", "No such route."));

  return app;
}

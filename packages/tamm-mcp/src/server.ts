import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolContext } from "./tools/pipeline.js";
import { registerCheckTradeName } from "./tools/checkTradeName.js";
import { registerGetApplicationStatus } from "./tools/getApplicationStatus.js";
import { registerGetServiceRequirements } from "./tools/getServiceRequirements.js";
import { registerRegisterTenancyTawtheeq } from "./tools/registerTenancyTawtheeq.js";
import { registerSearchServices } from "./tools/searchServices.js";
import { registerStartApplication } from "./tools/startApplication.js";

/** Builds an MCP server exposing exactly the six TAMM tools from INTEGRATION.md 4.4. */
export function createTammServer(ctx: ToolContext): McpServer {
  const server = new McpServer({ name: "rasikh-tamm-mcp", version: "0.1.0" });
  registerSearchServices(server, ctx);
  registerGetServiceRequirements(server, ctx);
  registerStartApplication(server, ctx);
  registerGetApplicationStatus(server, ctx);
  registerCheckTradeName(server, ctx);
  registerRegisterTenancyTawtheeq(server, ctx);
  return server;
}

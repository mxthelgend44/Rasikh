/**
 * Shapes every MCP tool result. All results carry `contract_version` and `mock: true`
 * (INTEGRATION.md 4.1, 4.4). Errors set `isError: true`; a Guard denial is a normal
 * contract output (`denied: true`), not an error.
 */
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { CONTRACT_VERSION, type ErrorCode } from "../contract.js";
import type { GuardVerdict } from "../guard/client.js";

function result(body: Record<string, unknown>, isError: boolean): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(body) }],
    structuredContent: body,
    ...(isError ? { isError: true } : {}),
  };
}

/** A successful tool result. */
export function ok(payload: object): CallToolResult {
  return result({ contract_version: CONTRACT_VERSION, mock: true, ...payload }, false);
}

/** A Guard denial (INTEGRATION.md 4.4 `start_application`): the tool did not execute. */
export function denied(verdict: GuardVerdict): CallToolResult {
  const { decision, reason, policy_rule } = verdict;
  return result(
    { contract_version: CONTRACT_VERSION, mock: true, denied: true, guard: { decision, reason, policy_rule } },
    false,
  );
}

/** An error result using the contract's `ErrorBody` shape. */
export function failure(code: ErrorCode, message: string): CallToolResult {
  return result({ contract_version: CONTRACT_VERSION, mock: true, error: { code, message } }, true);
}

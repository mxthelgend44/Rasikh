# tamm-mcp

MCP server over a mocked TAMM service catalogue, exposed to the Rasikh agent.

This package is built separately. It is intentionally empty until it lands.

The contract it must implement, including tools, the simulated UAE PASS step, the Guard check before data-sending tools, the application state machine and the demo fixtures, is defined in [INTEGRATION.md](../../INTEGRATION.md) section 4. Build against that file exactly. Shared types live in [`packages/shared`](../shared).

Every response carries `"mock": true`. Fees, durations and requirements are illustrative.

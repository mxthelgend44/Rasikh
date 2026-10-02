/**
 * Single-flight execution for data-sending tools.
 *
 * Two identical calls that arrive together (a double click, or two approvals racing) would
 * otherwise both pass Guard and both create an application. Here the first call claims the
 * key synchronously, before anything is awaited, so every identical call that arrives while it
 * runs, or within `replayMs` after it finishes, receives the same result and nothing executes
 * twice. A failed or refused call is not remembered, so a retry after a fix runs again.
 */
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

const DEFAULT_REPLAY_MS = 5_000;

/** Stable JSON: object keys sorted at every depth, so equal arguments give equal keys. */
export function stableKey(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableKey).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stableKey(item)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

interface Flight {
  result: Promise<CallToolResult>;
  settledAt: number | null;
}

export class SingleFlight {
  private readonly flights = new Map<string, Flight>();

  constructor(
    private readonly replayMs: number = DEFAULT_REPLAY_MS,
    private readonly now: () => number = Date.now,
  ) {}

  /** Runs `execute` once per `key` at a time; identical concurrent or recent calls share its result. */
  run(key: string, execute: () => Promise<CallToolResult>): Promise<CallToolResult> {
    this.evictExpired();
    const existing = this.flights.get(key);
    if (existing) {
      return existing.result;
    }
    const flight: Flight = { result: Promise.resolve().then(execute), settledAt: null };
    this.flights.set(key, flight);
    flight.result.then(
      (result) => {
        // Only a successful execution is replayed; errors and denials may be retried at once.
        const succeeded = !result.isError && !(result.structuredContent as { denied?: boolean } | undefined)?.denied;
        if (succeeded) {
          flight.settledAt = this.now();
        } else {
          this.flights.delete(key);
        }
      },
      () => this.flights.delete(key),
    );
    return flight.result;
  }

  private evictExpired(): void {
    const now = this.now();
    for (const [key, flight] of this.flights) {
      if (flight.settledAt !== null && now - flight.settledAt > this.replayMs) {
        this.flights.delete(key);
      }
    }
  }
}

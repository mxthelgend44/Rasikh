import type { AuditRecord, AuditSink } from './types';

/**
 * Audit records hold identifiers, labels, decisions and provenance only: never document text,
 * extracted values or evidence quotes. The in-memory sink is for the demo; swap in a durable sink.
 */
export class MemoryAuditSink implements AuditSink {
  readonly entries: AuditRecord[] = [];
  record(entry: AuditRecord): void {
    this.entries.push(structuredClone(entry));
  }
  forJourney(journeyId: string): AuditRecord[] {
    return this.entries.filter((e) => e.journey_id === journeyId);
  }
}

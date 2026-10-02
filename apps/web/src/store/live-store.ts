import type { Action } from '@/domain/actions';
import { isNewer, type Snapshot } from './snapshot';

export type Connection = 'connecting' | 'live' | 'offline';

/**
 * Client copy of the shared state. Changes arrive over Server-Sent Events from every tab and
 * device, and actions are sent to the server, never applied locally, so all screens agree.
 */
export class LiveStore {
  private snapshot: Snapshot;
  private connection: Connection = 'connecting';
  private source: EventSource | null = null;
  private readonly listeners = new Set<() => void>();

  constructor(initial: Snapshot) {
    this.snapshot = initial;
  }

  getSnapshot = (): Snapshot => this.snapshot;

  getConnection = (): Connection => this.connection;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  connect(): void {
    if (this.source) return;
    const source = new EventSource('/api/events');
    source.addEventListener('snapshot', (event) => {
      this.accept(JSON.parse((event as MessageEvent<string>).data) as Snapshot);
    });
    source.onopen = () => this.setConnection('live');
    source.onerror = () => this.setConnection('offline');
    this.source = source;
  }

  disconnect(): void {
    this.source?.close();
    this.source = null;
  }

  /** Sends an action. The response is applied at once, so the acting tab never waits for the stream. */
  async dispatch(action: Action): Promise<void> {
    await this.post('/api/actions', action);
  }

  async reset(): Promise<void> {
    await this.post('/api/reset');
  }

  private async post(url: string, body?: unknown): Promise<void> {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const payload = (await response.json()) as Snapshot | { error: string };
    if (!response.ok)
      throw new Error('error' in payload ? payload.error : 'The change was rejected');
    this.accept(payload as Snapshot);
  }

  private accept(incoming: Snapshot): void {
    if (!isNewer(incoming, this.snapshot)) return;
    this.snapshot = incoming;
    this.emit();
  }

  private setConnection(next: Connection): void {
    if (this.connection === next) return;
    this.connection = next;
    this.emit();
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }
}

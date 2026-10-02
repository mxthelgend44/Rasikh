import type { Id } from './types';

/** Next sequential id for a prefix, e.g. `act_0007`. Mutates `counters`, so call it on a clone. */
export function nextId(counters: Record<string, number>, prefix: string): Id {
  const value = (counters[prefix] ?? 0) + 1;
  counters[prefix] = value;
  return `${prefix}_${String(value).padStart(4, '0')}`;
}

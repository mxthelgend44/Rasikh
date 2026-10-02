import { describe, expect, it } from 'vitest';
import type { AppState } from '@/domain/types';
import { isNewer, type Snapshot } from './snapshot';

const snapshot = (epoch: string, rev: number): Snapshot => ({
  epoch,
  state: { rev } as AppState,
});

describe('isNewer', () => {
  it('accepts a higher revision in the same epoch', () => {
    expect(isNewer(snapshot('a', 5), snapshot('a', 4))).toBe(true);
  });

  it('ignores the same or an older revision, so a slow response cannot roll the screen back', () => {
    expect(isNewer(snapshot('a', 4), snapshot('a', 4))).toBe(false);
    expect(isNewer(snapshot('a', 3), snapshot('a', 4))).toBe(false);
  });

  it('accepts a new epoch even when the revision is lower, after a server restart', () => {
    expect(isNewer(snapshot('b', 1), snapshot('a', 40))).toBe(true);
  });
});

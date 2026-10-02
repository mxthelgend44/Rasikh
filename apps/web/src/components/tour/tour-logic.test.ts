import { describe, expect, it } from 'vitest';
import type { TourStep } from '@/config/tour-types';
import {
  clampIndex,
  elapsedSeconds,
  formatClock,
  indexAfterTrackSwitch,
  INITIAL_STATE,
  normalizeUrl,
  parseStoredState,
  sameUrl,
  stepDeltaForKey,
  stepsForTrack,
  stripTourParam,
  totalSeconds,
  trackFromSearch,
} from './tour-logic';

function step(id: string, tracks: TourStep['tracks'], seconds: number): TourStep {
  return {
    id,
    tracks,
    surface: 'hub',
    href: '/',
    title: id,
    summary: '',
    say: [],
    show: [],
    features: [],
    seconds,
  };
}

const STEPS = [
  step('a', ['demo', 'features'], 30),
  step('b', ['features'], 45),
  step('c', ['demo', 'features'], 60),
  step('d', ['demo'], 20),
];

describe('stepsForTrack', () => {
  it('keeps only steps that belong to the track, in order', () => {
    expect(stepsForTrack(STEPS, 'demo').map((s) => s.id)).toEqual(['a', 'c', 'd']);
    expect(stepsForTrack(STEPS, 'features').map((s) => s.id)).toEqual(['a', 'b', 'c']);
  });

  it('returns an empty list when nothing matches', () => {
    expect(stepsForTrack([], 'demo')).toEqual([]);
  });
});

describe('time totals', () => {
  it('adds up a whole track', () => {
    expect(totalSeconds(stepsForTrack(STEPS, 'demo'))).toBe(110);
    expect(totalSeconds([])).toBe(0);
  });

  it('gives the running total through the current step, inclusive', () => {
    const demo = stepsForTrack(STEPS, 'demo');
    expect(elapsedSeconds(demo, 0)).toBe(30);
    expect(elapsedSeconds(demo, 1)).toBe(90);
    expect(elapsedSeconds(demo, 2)).toBe(110);
  });

  it('clamps the index and ignores negative durations', () => {
    const demo = stepsForTrack(STEPS, 'demo');
    expect(elapsedSeconds(demo, 99)).toBe(110);
    expect(elapsedSeconds(demo, -4)).toBe(30);
    expect(elapsedSeconds([], 3)).toBe(0);
    expect(totalSeconds([step('x', ['demo'], -5), step('y', ['demo'], 10)])).toBe(10);
  });

  it('formats clock time as m:ss', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(9)).toBe('0:09');
    expect(formatClock(180)).toBe('3:00');
    expect(formatClock(185)).toBe('3:05');
    expect(formatClock(-3)).toBe('0:00');
  });
});

describe('clampIndex', () => {
  it('keeps an index inside the list', () => {
    expect(clampIndex(2, 5)).toBe(2);
    expect(clampIndex(-1, 5)).toBe(0);
    expect(clampIndex(9, 5)).toBe(4);
    expect(clampIndex(2.9, 5)).toBe(2);
  });

  it('is safe for empty lists and bad numbers', () => {
    expect(clampIndex(3, 0)).toBe(0);
    expect(clampIndex(Number.NaN, 4)).toBe(0);
    expect(clampIndex(Number.POSITIVE_INFINITY, 4)).toBe(0);
  });
});

describe('url comparison', () => {
  it('ignores the hash', () => {
    expect(sameUrl('/employer#guard', '/employer')).toBe(true);
    expect(sameUrl('/newcomer?as=anders#roadmap', '/newcomer?as=anders')).toBe(true);
  });

  it('treats a different path or query as a different page', () => {
    expect(sameUrl('/newcomer?as=anders', '/newcomer?as=maria')).toBe(false);
    expect(sameUrl('/newcomer', '/newcomer?as=anders')).toBe(false);
    expect(sameUrl('/employer', '/landlord')).toBe(false);
  });

  it('ignores the tour launcher parameter, trailing slashes and query order', () => {
    expect(sameUrl('/?tour=demo', '/')).toBe(true);
    expect(sameUrl('/employer/', '/employer')).toBe(true);
    expect(sameUrl('/x?b=2&a=1', '/x?a=1&b=2')).toBe(true);
    expect(normalizeUrl('/newcomer?as=anders&tour=features')).toBe('/newcomer?as=anders');
  });
});

describe('tour launch parameter', () => {
  it('reads a valid track only', () => {
    expect(trackFromSearch('?tour=demo')).toBe('demo');
    expect(trackFromSearch('?as=anders&tour=features')).toBe('features');
    expect(trackFromSearch('?tour=other')).toBeNull();
    expect(trackFromSearch('')).toBeNull();
  });

  it('strips the parameter and keeps the rest', () => {
    expect(stripTourParam('?tour=demo')).toBe('');
    expect(stripTourParam('?as=anders&tour=demo')).toBe('?as=anders');
  });
});

describe('stored state', () => {
  it('round-trips a saved state', () => {
    const raw = JSON.stringify({
      open: true,
      track: 'features',
      index: 3,
      collapsed: true,
    });
    expect(parseStoredState(raw)).toEqual({
      open: true,
      track: 'features',
      index: 3,
      collapsed: true,
    });
  });

  it('falls back to a closed, fresh tour for missing or malformed data', () => {
    expect(parseStoredState(null)).toEqual(INITIAL_STATE);
    expect(parseStoredState('not json')).toEqual(INITIAL_STATE);
    expect(parseStoredState('42')).toEqual(INITIAL_STATE);
    expect(parseStoredState(JSON.stringify({ open: 'yes', track: 'x', index: -4 }))).toEqual({
      ...INITIAL_STATE,
      index: 0,
    });
  });
});

describe('track switching and keys', () => {
  it('stays on the same stop when the other track has it', () => {
    const demo = stepsForTrack(STEPS, 'demo');
    const features = stepsForTrack(STEPS, 'features');
    expect(indexAfterTrackSwitch(demo, 1, features)).toBe(2);
  });

  it('starts over when the stop is not in the other track', () => {
    const demo = stepsForTrack(STEPS, 'demo');
    const features = stepsForTrack(STEPS, 'features');
    expect(indexAfterTrackSwitch(demo, 2, features)).toBe(0);
    expect(indexAfterTrackSwitch([], 0, features)).toBe(0);
  });

  it('flips the arrow keys in right-to-left layouts', () => {
    expect(stepDeltaForKey('ArrowRight', false)).toBe(1);
    expect(stepDeltaForKey('ArrowLeft', false)).toBe(-1);
    expect(stepDeltaForKey('ArrowRight', true)).toBe(-1);
    expect(stepDeltaForKey('ArrowLeft', true)).toBe(1);
    expect(stepDeltaForKey('Enter', false)).toBe(0);
  });
});

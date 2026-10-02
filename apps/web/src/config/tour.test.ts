import { describe, expect, it } from 'vitest';
import { TOUR_STEPS } from './tour';
import type { TourSurface, TourTrack } from './tour-types';

const TRACKS: TourTrack[] = ['demo', 'features'];
const SURFACES: TourSurface[] = ['hub', 'newcomer', 'employer', 'landlord', 'bank', 'design'];
const inTrack = (track: TourTrack) => TOUR_STEPS.filter((step) => step.tracks.includes(track));

describe('guided tour content', () => {
  it('has unique, non-empty ids', () => {
    const ids = TOUR_STEPS.map((step) => step.id);
    expect(ids.every((id) => id.length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('points every step at an in-app route', () => {
    for (const step of TOUR_STEPS) {
      expect(step.href.startsWith('/'), `${step.id} href`).toBe(true);
      expect(step.href.startsWith('//'), `${step.id} href is not protocol-relative`).toBe(false);
    }
  });

  it('uses only valid tracks and surfaces', () => {
    for (const step of TOUR_STEPS) {
      expect(step.tracks.length, `${step.id} tracks`).toBeGreaterThan(0);
      for (const track of step.tracks) expect(TRACKS).toContain(track);
      expect(SURFACES).toContain(step.surface);
    }
  });

  it('runs the demo track for roughly three minutes', () => {
    const seconds = inTrack('demo').reduce((sum, step) => sum + step.seconds, 0);
    expect(seconds).toBeGreaterThanOrEqual(160);
    expect(seconds).toBeLessThanOrEqual(200);
  });

  it('keeps every demo step in the features track', () => {
    for (const step of inTrack('demo')) {
      expect(step.tracks, `${step.id} is a demo step`).toContain('features');
    }
    expect(inTrack('features').length).toBeGreaterThan(inTrack('demo').length);
  });

  it('gives every step something to say and something to show', () => {
    for (const step of TOUR_STEPS) {
      expect(step.title.trim().length, `${step.id} title`).toBeGreaterThan(0);
      expect(step.summary.trim().length, `${step.id} summary`).toBeGreaterThan(0);
      expect(step.say.length, `${step.id} say`).toBeGreaterThanOrEqual(1);
      expect(step.say.length, `${step.id} say`).toBeLessThanOrEqual(4);
      expect(step.show.length, `${step.id} show`).toBeGreaterThanOrEqual(1);
      expect(step.features.length, `${step.id} features`).toBeGreaterThan(0);
      expect(step.seconds, `${step.id} seconds`).toBeGreaterThan(0);
      for (const line of [...step.say, ...step.show]) expect(line.trim().length).toBeGreaterThan(0);
    }
  });

  it('states the Guard limitation plainly on the Guard step', () => {
    const guard = TOUR_STEPS.find((step) => step.id === 'guard');
    expect(guard).toBeDefined();
    expect(guard?.href).toBe('/employer/guard');
    expect(guard?.honesty).toMatch(/not proven/i);
    expect(guard?.honesty).toMatch(/12 of 25/);
    expect(guard?.honesty).toMatch(/12 of 25/);
  });

  it('never presents the consent block as a Guard verdict', () => {
    const blocked = TOUR_STEPS.find((step) => step.id === 'blocked-action');
    expect(blocked?.honesty).toMatch(/not a Guard verdict/i);
    expect(blocked?.honesty).toMatch(/not a Guard verdict/i);
    expect(blocked?.honesty).toMatch(/not the agent end to end/i);
  });

  it('covers the required story in order', () => {
    const order = TOUR_STEPS.map((step) => step.id);
    const demoOrder = [
      'problem',
      'solution',
      'roadmap',
      'documents',
      'agent-card',
      'passport-revoke',
      'blocked-action',
      'landlord-live',
      'landlord-decision',
      'employer-live',
      'closing',
    ];
    expect(inTrack('demo').map((step) => step.id)).toEqual(demoOrder);
    for (const id of [
      'employer-overview',
      'employer-pipeline',
      'hire-journey',
      'expansion-roadmap',
      'expansion-team',
      'guard',
      'bank',
      'rtl-dark',
      'live-state',
    ]) {
      expect(order, `${id} is a feature stop`).toContain(id);
    }
  });

  it('runs the newcomer story as Anders', () => {
    for (const step of TOUR_STEPS.filter((s) => s.surface === 'newcomer')) {
      expect(step.href).toContain('as=anders');
    }
  });

  it('does not claim more than is true', () => {
    const everything = JSON.stringify(TOUR_STEPS).toLowerCase();
    for (const claim of [
      'guard blocked',
      'guard stopped the',
      'guard is safe',
      'verified guard',
      'enforces',
    ]) {
      expect(everything, claim).not.toContain(claim);
    }
  });
});

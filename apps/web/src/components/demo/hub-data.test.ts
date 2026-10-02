import { describe, expect, it } from 'vitest';
import { createSeed } from '@/domain/seed';
import { buildHub } from './hub-data';

describe('demo hub data', () => {
  const state = createSeed(Date.parse('2026-10-10T09:30:00+04:00'));

  it('lists every hire once, each with a distinct link', () => {
    const { people } = buildHub(state, 'en');
    expect(people).toHaveLength(Object.keys(state.hires).length);
    expect(new Set(people.map((person) => person.href)).size).toBe(people.length);
    for (const person of people) {
      expect(person.href).toMatch(/^\/newcomer\?as=[a-z0-9_]+$/);
    }
  });

  it('puts the person with an approval waiting first', () => {
    const { people } = buildHub(state, 'en');
    expect(people[0]?.awaiting).toBe(true);
    expect(people[0]?.href).toBe('/newcomer?as=anders');
    expect(people.filter((person) => person.awaiting)).toHaveLength(1);
  });

  it('falls back to the hire id when two people share a first name', () => {
    const twin = { ...state.hires['hire_seed_04']!, id: 'hire_live_1' };
    const { people } = buildHub({ ...state, hires: { ...state.hires, hire_live_1: twin } }, 'en');
    const links = people.filter((person) => person.name === twin.fullName);
    expect(links.map((person) => person.href).sort()).toEqual([
      '/newcomer?as=hire_live_1',
      '/newcomer?as=hire_seed_04',
    ]);
  });

  it('counts live numbers from the shared state', () => {
    const { live } = buildHub(state, 'en');
    expect(live.approvals).toBe(1);
    expect(live.inReview).toBe(2);
    expect(live.guardChecks).toBe(Object.keys(state.guardChecks).length);
  });

  it('localises the step a person is on', () => {
    const en = buildHub(state, 'en').people.find((person) => person.now);
    const ar = buildHub(state, 'ar').people.find((person) => person.id === en?.id);
    expect(en?.now).toBeTruthy();
    expect(ar?.now).toBeTruthy();
    expect(ar?.now).not.toBe(en?.now);
  });
});

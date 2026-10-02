import { DATA_LABELS, DESTINATIONS } from '@rasikh/shared';
import { describe, expect, it } from 'vitest';
import { PASSPORT_DESTINATIONS, PASSPORT_LABELS, policyFor } from './policy';

describe('default policy mirrors INTEGRATION.md section 3.4', () => {
  it('covers every label for every destination', () => {
    for (const label of DATA_LABELS) {
      for (const destination of DESTINATIONS) {
        expect(policyFor(label, destination)).toBeDefined();
      }
    }
  });

  it.each([
    ['passport', 'landlord', 'consent'],
    ['passport', 'school', 'deny'],
    ['passport', 'llm_provider', 'extraction_only'],
    ['salary', 'landlord', 'derived_only'],
    ['salary', 'bank', 'consent'],
    ['salary', 'llm_provider', 'redacted'],
    ['bank_statement', 'tamm', 'deny'],
    ['employment', 'landlord', 'allow'],
    ['employment', 'school', 'deny'],
    ['family', 'bank', 'deny'],
    ['family', 'school', 'consent'],
    ['address', 'bank', 'consent'],
    ['degree', 'landlord', 'deny'],
    ['health', 'tamm', 'insurance_only'],
    ['health', 'employer', 'deny'],
    ['health', 'newcomer', 'allow'],
  ] as const)('%s to %s is %s', (label, destination, expected) => {
    expect(policyFor(label, destination)).toBe(expected);
  });

  it('lets the newcomer see everything about themselves', () => {
    for (const label of DATA_LABELS) expect(policyFor(label, 'newcomer')).toBe('allow');
  });

  it('shows every label in the trust passport and never the model or the newcomer as a party', () => {
    expect([...PASSPORT_LABELS].sort()).toEqual([...DATA_LABELS].sort());
    expect(PASSPORT_DESTINATIONS).not.toContain('llm_provider');
    expect(PASSPORT_DESTINATIONS).not.toContain('newcomer');
  });
});

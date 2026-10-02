import { describe, expect, it } from 'vitest';
import { DomainError, isDomainError } from './actions';

describe('domain error identity across bundled modules', () => {
  it('recognises the local domain error', () => {
    expect(isDomainError(new DomainError('Unknown record'))).toBe(true);
  });

  it('recognises an independently defined branded error with the same stable contract', () => {
    class OtherBundleDomainError extends Error {
      readonly name = 'DomainError';
      readonly code = 'rasikh_domain_error';
    }
    const error = new OtherBundleDomainError('The document was replaced');
    expect(error).not.toBeInstanceOf(DomainError);
    expect(isDomainError(error)).toBe(true);
  });

  it('does not treat programming errors or plain branded objects as domain validation', () => {
    const unrelated = new TypeError('Cannot read property');
    unrelated.name = 'DomainError';
    expect(isDomainError(unrelated)).toBe(false);
    expect(
      isDomainError({ name: 'DomainError', code: 'rasikh_domain_error', message: 'Forged object' }),
    ).toBe(false);
    expect(isDomainError(new Error('Unexpected failure'))).toBe(false);
    expect(isDomainError(null)).toBe(false);
  });
});

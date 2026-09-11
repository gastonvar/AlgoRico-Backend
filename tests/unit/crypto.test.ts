import { createCsrfToken, csrfTokensMatch, generateSessionToken, hashToken } from '../../src/lib/crypto.js';
import { describe, expect, it } from 'vitest';

describe('crypto helpers', () => {
  it('hashes session tokens consistently without returning the raw value', () => {
    const token = generateSessionToken();
    expect(hashToken(token)).toHaveLength(64);
    expect(hashToken(token)).toBe(hashToken(token));
  });

  it('creates a matching CSRF token from the session token', () => {
    const sessionToken = generateSessionToken();
    const csrf = createCsrfToken(sessionToken, 'test-session-secret-value-32chars!');
    expect(csrfTokensMatch(csrf, csrf)).toBe(true);
    expect(csrfTokensMatch(csrf, `${csrf}x`)).toBe(false);
  });
});

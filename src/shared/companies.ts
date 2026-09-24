/**
 * Fixed identifiers for the two tenants currently served by this deployment.
 *
 * These ids are intentionally hardcoded (not looked up by slug at runtime)
 * so that migrations and the dev seed script can reference the same rows
 * deterministically across every environment, including production.
 */
export const ALGORICO_COMPANY_ID = '1bde41ca-2a45-440c-975a-750956a45401';
export const AROME_COMPANY_ID = '151892c0-bc42-4755-843e-29a49c292073';

export const ALGORICO_COMPANY_SLUG = 'algorico';
export const AROME_COMPANY_SLUG = 'arome';

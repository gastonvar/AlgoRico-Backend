import { describe, expect, it } from 'vitest';
import { buildAttachmentStorageKey, sanitizeFilename } from '../../src/lib/uploads.js';

describe('upload helpers', () => {
  it('never uses a raw path as a stored filename', () => {
    expect(sanitizeFilename('../../secret.png')).toBe('secret.png');
    expect(sanitizeFilename('')).toBe('upload');
  });

  it('builds unique object keys that do not include the original filename', () => {
    expect(
      buildAttachmentStorageKey({
        clientId: 'client-1',
        parentKind: 'interaction',
        parentId: 'interaction-1',
        attachmentId: 'att-1',
        mimeType: 'image/jpeg',
      }),
    ).toBe('clients/client-1/interactions/interaction-1/att-1.jpg');

    expect(
      buildAttachmentStorageKey({
        clientId: 'client-1',
        parentKind: 'payment',
        parentId: 'payment-1',
        attachmentId: 'att-2',
        mimeType: 'image/png',
      }),
    ).toBe('clients/client-1/payments/payment-1/att-2.png');
  });
});

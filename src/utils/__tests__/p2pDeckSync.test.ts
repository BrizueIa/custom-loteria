import { describe, it, expect } from 'vitest';
import {
  generateSyncCode,
  normalizeSyncCode,
  formatSyncCode,
  fnv1aChecksum,
  splitIntoChunks
} from '../p2pDeckSync';

describe('p2pDeckSync helper functions', () => {
  it('generates uppercase codes without confusing characters (no 0, O, 1, I, L)', () => {
    for (let i = 0; i < 20; i++) {
      const code = generateSyncCode(6);
      expect(code).toHaveLength(6);
      expect(code).toMatch(/^[A-Z2-9]+$/);
      expect(code).not.toMatch(/[01OIL]/);
    }
  });

  it('normalizes inputs by trimming, converting to uppercase and stripping special characters', () => {
    expect(normalizeSyncCode('k7m-49p')).toBe('K7M49P');
    expect(normalizeSyncCode('  ab-cd  ef ')).toBe('ABCDEF');
    expect(normalizeSyncCode('1234567890')).toBe('12345678'); // capped at 8
  });

  it('formats codes with a hyphen for human legibility', () => {
    expect(formatSyncCode('K7M49P')).toBe('K7M-49P');
    expect(formatSyncCode('k7m-49p')).toBe('K7M-49P');
    expect(formatSyncCode('ABC')).toBe('ABC');
  });

  it('computes deterministic FNV-1a checksum and catches modifications', () => {
    const text1 = JSON.stringify({ cards: [1, 2, 3], name: 'Lotería' });
    const text2 = JSON.stringify({ cards: [1, 2, 4], name: 'Lotería' });

    const c1 = fnv1aChecksum(text1);
    const c2 = fnv1aChecksum(text2);

    expect(c1).toHaveLength(8);
    expect(c1).toBe(fnv1aChecksum(text1));
    expect(c1).not.toBe(c2);
  });

  it('splits large payload into chunks and reassembles with 100% fidelity', () => {
    // Generate simulated 100 KB payload
    let longStr = '';
    for (let i = 0; i < 1000; i++) {
      longStr += `Card-${i}-data:image/jpeg;base64,AAAA1111XXXX;`;
    }

    const chunks = splitIntoChunks(longStr, 4096);
    expect(chunks.length).toBeGreaterThan(10);

    const reassembled = chunks.join('');
    expect(reassembled).toBe(longStr);
    expect(fnv1aChecksum(reassembled)).toBe(fnv1aChecksum(longStr));
  });
});

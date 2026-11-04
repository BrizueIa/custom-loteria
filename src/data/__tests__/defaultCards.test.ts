import { describe, it, expect } from 'vitest';
import { DEFAULT_CARDS, TRADITIONAL_LOTERIA_DECK, createCleanCardPlaceholder } from '../defaultCards';

describe('defaultCards', () => {
  it('contains exactly 54 cards', () => {
    expect(DEFAULT_CARDS).toHaveLength(54);
    expect(TRADITIONAL_LOTERIA_DECK).toHaveLength(54);
  });

  it('cards are numbered sequentially from 1 to 54 without gaps or duplicates', () => {
    const numbers = DEFAULT_CARDS.map(c => c.number);
    const expected = Array.from({ length: 54 }, (_, i) => i + 1);
    expect(numbers).toEqual(expected);
  });

  it('all cards have unique IDs, non-empty names, and valid image data URLs', () => {
    const ids = new Set<string>();
    DEFAULT_CARDS.forEach((card, idx) => {
      expect(ids.has(card.id)).toBe(false);
      ids.add(card.id);

      expect(card.name.trim().length).toBeGreaterThan(0);
      expect(card.image).toMatch(/^data:image\/svg\+xml/);
      expect(card.number).toBe(idx + 1);
    });
  });

  it('createCleanCardPlaceholder creates valid SVG with title and number', () => {
    const placeholder = createCleanCardPlaceholder('Mi Foto', 12);
    expect(placeholder).toMatch(/^data:image\/svg\+xml/);
    const decoded = decodeURIComponent(placeholder.replace('data:image/svg+xml;utf8,', ''));
    expect(decoded).toContain('MI FOTO');
    expect(decoded).toContain('#12');
    expect(decoded).toContain('Toca para agregar foto');
  });

  it('createCleanCardPlaceholder works when called with undefined values', () => {
    const placeholder = createCleanCardPlaceholder();
    const decoded = decodeURIComponent(placeholder.replace('data:image/svg+xml;utf8,', ''));
    expect(decoded).toContain('CARTA');
  });
});

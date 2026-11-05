import { describe, it, expect } from 'vitest';
import { DEFAULT_CARDS, TRADITIONAL_LOTERIA_DECK, createCleanCardPlaceholder } from '../defaultCards';

describe('defaultCards', () => {
  it('contains 1 cover card (#0) plus 54 playable cards (55 total)', () => {
    expect(DEFAULT_CARDS).toHaveLength(55);
    expect(TRADITIONAL_LOTERIA_DECK).toHaveLength(54);
    expect(DEFAULT_CARDS[0].number).toBe(0);
    expect(DEFAULT_CARDS[0].isCover).toBe(true);
  });

  it('cards are numbered sequentially from 0 (Cover) to 54 without gaps or duplicates', () => {
    const numbers = DEFAULT_CARDS.map(c => c.number);
    const expected = Array.from({ length: 55 }, (_, i) => i);
    expect(numbers).toEqual(expected);
  });

  it('all cards have unique IDs, non-empty names, and valid image data URLs', () => {
    const ids = new Set<string>();
    DEFAULT_CARDS.forEach((card, idx) => {
      expect(ids.has(card.id)).toBe(false);
      ids.add(card.id);

      expect(card.name.trim().length).toBeGreaterThan(0);
      expect(card.image).toMatch(/^data:image\/svg\+xml/);
      expect(card.number).toBe(idx);
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

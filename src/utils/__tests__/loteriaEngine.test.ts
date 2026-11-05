import { describe, it, expect } from 'vitest';
import {
  shuffleArray,
  swapCardNumbers,
  generateBoards,
  getCardColorGroup,
  arrangeCardsWithColorDispersion
} from '../loteriaEngine';
import { LoteriaCard, BoardConfig } from '../../types/loteria';

describe('loteriaEngine', () => {
  const mockDeck: LoteriaCard[] = Array.from({ length: 54 }, (_, i) => ({
    id: `card-${i + 1}`,
    number: i + 1,
    name: `Carta ${i + 1}`,
    image: `data:image/svg+xml;utf8,<svg></svg>`,
    tagline: `Verso ${i + 1}`
  }));

  describe('shuffleArray', () => {
    it('creates a new array with same length and elements', () => {
      const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const shuffled = shuffleArray(original);

      expect(shuffled).toHaveLength(original.length);
      expect(shuffled).not.toBe(original); // Different reference
      expect([...shuffled].sort((a, b) => a - b)).toEqual(original);
    });

    it('handles empty or single-element arrays', () => {
      expect(shuffleArray([])).toEqual([]);
      expect(shuffleArray([42])).toEqual([42]);
    });
  });

  describe('swapCardNumbers', () => {
    it('correctly swaps numbers between two cards and sorts ascending', () => {
      const initialCards: LoteriaCard[] = [
        { id: 'c1', number: 1, name: 'Card 1', image: '' },
        { id: 'c2', number: 2, name: 'Card 2', image: '' },
        { id: 'c3', number: 3, name: 'Card 3', image: '' },
      ];

      // Swap card c1 (num 1) to target number 3
      const result = swapCardNumbers(initialCards, 'c1', 3);

      expect(result).toHaveLength(3);
      // The cards should remain sorted by number
      expect(result[0].number).toBe(1);
      expect(result[0].id).toBe('c3'); // c3 took number 1

      expect(result[1].number).toBe(2);
      expect(result[1].id).toBe('c2'); // c2 remained number 2

      expect(result[2].number).toBe(3);
      expect(result[2].id).toBe('c1'); // c1 took number 3
    });

    it('returns original array unmodified if targetNum equals current card number', () => {
      const initialCards: LoteriaCard[] = [
        { id: 'c1', number: 1, name: 'Card 1', image: '' }
      ];
      const result = swapCardNumbers(initialCards, 'c1', 1);
      expect(result).toEqual(initialCards);
    });

    it('returns original array if cardId does not exist', () => {
      const initialCards: LoteriaCard[] = [
        { id: 'c1', number: 1, name: 'Card 1', image: '' }
      ];
      const result = swapCardNumbers(initialCards, 'non-existent', 5);
      expect(result).toEqual(initialCards);
    });
  });

  describe('generateBoards', () => {
    const standardConfig: BoardConfig = {
      rows: 4,
      cols: 4,
      allowDuplicates: false,
      quantity: 5,
      title: 'LOTERÍA TEST'
    };

    it('generates the exact quantity of boards requested', () => {
      const boards = generateBoards(mockDeck, standardConfig);
      expect(boards).toHaveLength(5);
      boards.forEach((board, idx) => {
        expect(board.index).toBe(idx + 1);
        expect(board.id).toBe(`board-${idx + 1}`);
        expect(board.cards).toHaveLength(16); // 4x4
      });
    });

    it('guarantees no repeating cards within the same board when allowDuplicates is false', () => {
      const boards = generateBoards(mockDeck, {
        ...standardConfig,
        quantity: 10
      });

      boards.forEach(board => {
        const cardIds = board.cards.map(c => c.id);
        const uniqueIds = new Set(cardIds);
        expect(uniqueIds.size).toBe(16);
      });
    });

    it('guarantees unique card combinations across generated boards', () => {
      const boards = generateBoards(mockDeck, {
        ...standardConfig,
        quantity: 15
      });

      const signatures = new Set<string>();
      boards.forEach(board => {
        const sig = board.cards.map(c => c.id).join('-');
        expect(signatures.has(sig)).toBe(false);
        signatures.add(sig);
      });
    });

    it('throws error when deck size is smaller than slots and allowDuplicates is false', () => {
      const smallDeck = mockDeck.slice(0, 10);
      expect(() => {
        generateBoards(smallDeck, {
          rows: 4,
          cols: 4,
          allowDuplicates: false,
          quantity: 2,
          title: 'TEST'
        });
      }).toThrowError(/No es posible generar una tabla de 16 casillas sin repetir con solo 10 cartas disponibles/);
    });

    it('allows duplicates within the board when allowDuplicates is true even with small deck', () => {
      const smallDeck = mockDeck.slice(0, 5);
      const boards = generateBoards(smallDeck, {
        rows: 4,
        cols: 4,
        allowDuplicates: true,
        quantity: 2,
        title: 'TEST'
      });
      expect(boards).toHaveLength(2);
      expect(boards[0].cards).toHaveLength(16);
    });

    it('generates up to 200 unique boards with balanced color quotas and zero orthogonal adjacent same-color cards', () => {
      // Simulate the 54-card deck color distribution (16 blue, 16 pink, 15 yellow, 4 purple, 2 green, 1 orange)
      const palette = [
        ...Array(16).fill('#79E1F5'), // blue
        ...Array(16).fill('#FC89A8'), // pink
        ...Array(15).fill('#FDDD04'), // yellow
        ...Array(4).fill('#CD8EE0'),  // purple
        ...Array(2).fill('#9EEAA2'),  // green
        ...Array(1).fill('#FDB083'),  // orange
      ];

      const coloredDeck: LoteriaCard[] = mockDeck.map((c, idx) => ({
        ...c,
        backgroundColor: palette[idx]
      }));

      const boards = generateBoards(coloredDeck, {
        rows: 4,
        cols: 4,
        allowDuplicates: false,
        balanceColors: true,
        quantity: 200,
        title: 'LOTERÍA 200'
      });

      expect(boards).toHaveLength(200);

      const combinations = new Set<string>();
      let orthogonalConflicts = 0;

      for (const board of boards) {
        expect(board.cards).toHaveLength(16);
        const comboKey = [...board.cards].map(c => c.id).sort().join('-');
        expect(combinations.has(comboKey)).toBe(false);
        combinations.add(comboKey);

        // Verify per-board color cap (max 5 of any single color family)
        const groupCounts: Record<string, number> = {};
        board.cards.forEach(c => {
          const g = getCardColorGroup(c.backgroundColor);
          groupCounts[g] = (groupCounts[g] || 0) + 1;
        });
        for (const count of Object.values(groupCounts)) {
          expect(count).toBeLessThanOrEqual(5);
        }

        // Verify zero orthogonal neighbors share the same color family on 4x4 grid
        for (let r = 0; r < 4; r++) {
          for (let col = 0; col < 4; col++) {
            const g = getCardColorGroup(board.cards[r * 4 + col].backgroundColor);
            if (col + 1 < 4) {
              const rightG = getCardColorGroup(board.cards[r * 4 + (col + 1)].backgroundColor);
              if (g === rightG) orthogonalConflicts++;
            }
            if (r + 1 < 4) {
              const downG = getCardColorGroup(board.cards[(r + 1) * 4 + col].backgroundColor);
              if (g === downG) orthogonalConflicts++;
            }
          }
        }
      }

      expect(orthogonalConflicts).toBe(0);
    });

    it('correctly classifies hex colors into perceptual color groups', () => {
      expect(getCardColorGroup('#FC89A8')).toBe('pink');
      expect(getCardColorGroup('#FD9393')).toBe('pink');
      expect(getCardColorGroup('#FDB083')).toBe('orange');
      expect(getCardColorGroup('#FDDD04')).toBe('yellow');
      expect(getCardColorGroup('#9EEAA2')).toBe('green');
      expect(getCardColorGroup('#79E1F5')).toBe('blue');
      expect(getCardColorGroup('#CD8EE0')).toBe('purple');
      expect(getCardColorGroup('#FFFFFF')).toBe('neutral');
      expect(getCardColorGroup(undefined)).toBe('neutral');
      expect(arrangeCardsWithColorDispersion([], 0, 0)).toEqual([]);
    });
  });
});

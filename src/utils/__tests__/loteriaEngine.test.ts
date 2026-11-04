import { describe, it, expect } from 'vitest';
import { shuffleArray, swapCardNumbers, generateBoards } from '../loteriaEngine';
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
  });
});

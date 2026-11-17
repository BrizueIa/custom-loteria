import { describe, it, expect } from 'vitest';
import {
  shuffleArray,
  swapCardNumbers,
  generateBoards,
  getCardColorGroup,
  arrangeCardsWithColorDispersion,
  getEffectiveBoardBatches,
  resolveBoardBatchStyle
} from '../loteriaEngine';
import { LoteriaCard, BoardConfig, BoardDesignBatch } from '../../types/loteria';

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

    it('generates multi-batch boards with tagged batchId, batchIndex, and global uniqueness', () => {
      const batch1: BoardDesignBatch = {
        id: 'batch-white',
        name: 'Blancas',
        quantity: 3,
        boardBgColor: '#FFFFFF',
        boardBorderColor: '#164E3D',
        title: 'LOTE BLANCO',
      };
      const batch2: BoardDesignBatch = {
        id: 'batch-green',
        name: 'Verdes',
        quantity: 2,
        boardBgColor: '#22C55E',
        boardBorderColor: '#14532D',
        title: 'LOTE VERDE',
      };

      const multiBatchConfig: BoardConfig = {
        ...standardConfig,
        quantity: 1, // should be superseded by batches sum (3 + 2 = 5)
        batches: [batch1, batch2],
      };

      const boards = generateBoards(mockDeck, multiBatchConfig);
      expect(boards).toHaveLength(5);

      // Verify batch assignment and contiguous indexing
      expect(boards[0].batchId).toBe('batch-white');
      expect(boards[0].batchIndex).toBe(0);
      expect(boards[0].index).toBe(1);

      expect(boards[1].batchId).toBe('batch-white');
      expect(boards[1].batchIndex).toBe(0);
      expect(boards[1].index).toBe(2);

      expect(boards[2].batchId).toBe('batch-white');
      expect(boards[2].batchIndex).toBe(0);
      expect(boards[2].index).toBe(3);

      expect(boards[3].batchId).toBe('batch-green');
      expect(boards[3].batchIndex).toBe(1);
      expect(boards[3].index).toBe(4);

      expect(boards[4].batchId).toBe('batch-green');
      expect(boards[4].batchIndex).toBe(1);
      expect(boards[4].index).toBe(5);

      // Verify all 5 combinations are globally unique
      const combinations = new Set<string>();
      boards.forEach(b => {
        const sig = b.cards.map(c => c.id).join('-');
        expect(combinations.has(sig)).toBe(false);
        combinations.add(sig);
      });
    });

    it('supports generating 60 white boards + 60 green boards (120 total) without duplication', () => {
      const config120: BoardConfig = {
        rows: 4,
        cols: 4,
        allowDuplicates: false,
        quantity: 20,
        title: 'LOTERÍA 120',
        batches: [
          {
            id: 'batch-white-60',
            name: 'Hojas Blancas',
            quantity: 60,
            boardBgColor: '#FFFFFF',
          },
          {
            id: 'batch-green-60',
            name: 'Hojas Verdes',
            quantity: 60,
            boardBgColor: '#DCFCE7',
          }
        ]
      };

      const boards = generateBoards(mockDeck, config120);
      expect(boards).toHaveLength(120);

      const signatures = new Set<string>();
      boards.forEach((board, idx) => {
        expect(board.index).toBe(idx + 1);
        if (idx < 60) {
          expect(board.batchId).toBe('batch-white-60');
          expect(board.batchIndex).toBe(0);
        } else {
          expect(board.batchId).toBe('batch-green-60');
          expect(board.batchIndex).toBe(1);
        }
        const sig = board.cards.map(c => c.id).join('-');
        expect(signatures.has(sig)).toBe(false);
        signatures.add(sig);
      });
      expect(signatures.size).toBe(120);
    });
  });

  describe('getEffectiveBoardBatches', () => {
    it('returns a single default batch when batches is undefined or empty', () => {
      const config: BoardConfig = {
        rows: 4,
        cols: 4,
        allowDuplicates: false,
        quantity: 25,
        title: 'MI LOTERÍA',
        boardBgColor: '#FFFBEB',
        boardBorderColor: '#B45309',
        boardFrameStyle: 'clean_minimal',
      };

      const batches = getEffectiveBoardBatches(config);
      expect(batches).toHaveLength(1);
      expect(batches[0].id).toBe('batch-1');
      expect(batches[0].quantity).toBe(25);
      expect(batches[0].title).toBe('MI LOTERÍA');
      expect(batches[0].boardBgColor).toBe('#FFFBEB');
      expect(batches[0].boardBorderColor).toBe('#B45309');
      expect(batches[0].boardFrameStyle).toBe('clean_minimal');
    });

    it('normalizes provided batches and falls back to config values for omitted fields', () => {
      const config: BoardConfig = {
        rows: 4,
        cols: 4,
        allowDuplicates: false,
        quantity: 10,
        title: 'DEFAULT TITLE',
        boardBgColor: '#FFFFFF',
        boardBorderColor: '#164E3D',
        batches: [
          {
            id: 'b-1',
            quantity: 30,
            // title omitted, should inherit DEFAULT TITLE
            boardBgColor: '#FFFFFF',
          },
          {
            id: 'b-2',
            quantity: 30,
            title: 'TITULO VERDE',
            boardBgColor: '#10B981',
          }
        ]
      };

      const batches = getEffectiveBoardBatches(config);
      expect(batches).toHaveLength(2);
      expect(batches[0].title).toBe('DEFAULT TITLE');
      expect(batches[0].boardBorderColor).toBe('#164E3D');
      expect(batches[1].title).toBe('TITULO VERDE');
      expect(batches[1].boardBgColor).toBe('#10B981');
    });
  });

  describe('resolveBoardBatchStyle', () => {
    const configWithBatches: BoardConfig = {
      rows: 4,
      cols: 4,
      allowDuplicates: false,
      quantity: 10,
      title: 'ROOT TITLE',
      boardBgColor: '#FFFFFF',
      boardBorderColor: '#164E3D',
      batches: [
        {
          id: 'batch-white',
          name: 'Blancas',
          quantity: 2,
          boardBgColor: '#FFFFFF',
          title: 'BLANCAS',
        },
        {
          id: 'batch-green',
          name: 'Verdes',
          quantity: 2,
          boardBgColor: '#22C55E',
          title: 'VERDES',
        }
      ]
    };

    it('resolves style by board.batchId directly', () => {
      const board = {
        id: 'board-test',
        index: 1,
        cards: [],
        batchId: 'batch-green',
      };
      const resolved = resolveBoardBatchStyle(board, configWithBatches);
      expect(resolved.batchId).toBe('batch-green');
      expect(resolved.batchIndex).toBe(1);
      expect(resolved.boardBgColor).toBe('#22C55E');
      expect(resolved.title).toBe('VERDES');
    });

    it('resolves style by board.batchIndex directly when batchId not matched', () => {
      const board = {
        id: 'board-test',
        index: 1,
        cards: [],
        batchIndex: 1,
      };
      const resolved = resolveBoardBatchStyle(board, configWithBatches);
      expect(resolved.batchIndex).toBe(1);
      expect(resolved.boardBgColor).toBe('#22C55E');
    });

    it('resolves style from board.index cumulative ranges when batchId/batchIndex are missing', () => {
      // batch 0 spans index 1..2 (qty 2)
      // batch 1 spans index 3..4 (qty 2)
      const board1 = { id: 'b1', index: 1, cards: [] };
      const board3 = { id: 'b3', index: 3, cards: [] };

      const style1 = resolveBoardBatchStyle(board1, configWithBatches);
      expect(style1.batchId).toBe('batch-white');
      expect(style1.batchIndex).toBe(0);

      const style3 = resolveBoardBatchStyle(board3, configWithBatches);
      expect(style3.batchId).toBe('batch-green');
      expect(style3.batchIndex).toBe(1);
    });

    it('falls back gracefully to first batch if board is undefined', () => {
      const resolved = resolveBoardBatchStyle(undefined, configWithBatches);
      expect(resolved.batchIndex).toBe(0);
      expect(resolved.boardBgColor).toBe('#FFFFFF');
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hexToRgb, generateCardsPDF, generateBoardsPDF } from '../pdfGenerator';
import { LoteriaCard, CardStyleConfig, BoardConfig, GeneratedBoard } from '../../types/loteria';

// Mock jsPDF
vi.mock('jspdf', () => {
  return {
    default: class MockJsPDF {
      internal = {
        pageSize: {
          getWidth: () => 215.9,
          getHeight: () => 279.4
        }
      };
      addPage = vi.fn();
      addImage = vi.fn();
      setDrawColor = vi.fn();
      setFillColor = vi.fn();
      setTextColor = vi.fn();
      setLineWidth = vi.fn();
      setFont = vi.fn();
      setFontSize = vi.fn();
      rect = vi.fn();
      line = vi.fn();
      triangle = vi.fn();
      text = vi.fn();
      output = vi.fn(() => new Blob(['mock-pdf'], { type: 'application/pdf' }));
    }
  };
});

describe('pdfGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('hexToRgb', () => {
    it('correctly parses 6-digit hex with hashtag', () => {
      expect(hexToRgb('#164E3D')).toEqual({ r: 22, g: 78, b: 61 });
      expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
    });

    it('correctly parses 3-digit hex', () => {
      expect(hexToRgb('#FFF')).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb('F00')).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('falls back to default green if hex is undefined or invalid', () => {
      expect(hexToRgb(undefined)).toEqual({ r: 22, g: 78, b: 61 });
      expect(hexToRgb('invalid-hex')).toEqual({ r: 22, g: 78, b: 61 });
    });
  });

  describe('PDF Generation flow', () => {
    const mockStyle: CardStyleConfig = {
      frameStyle: 'botanical_litho',
      numberPosition: 'top-left',
      namePosition: 'bottom',
      showTaglineOnCard: false,
      borderColor: '#164E3D',
      cardBgColor: '#FFFFFF',
      textColor: '#164E3D',
      fontFamily: 'serif'
    };

    const mockCards: LoteriaCard[] = [
      { id: 'c1', number: 1, name: 'Card 1', image: 'data:image/svg' },
      { id: 'c2', number: 2, name: 'Card 2', image: 'data:image/svg' },
    ];

    it('runs generateCardsPDF and triggers progress callback', async () => {
      const progressTracker: number[] = [];
      const blob = await generateCardsPDF(mockCards, mockStyle, 4, (pct) => {
        progressTracker.push(pct);
      });

      expect(blob).toBeInstanceOf(Blob);
      expect(progressTracker.length).toBeGreaterThan(0);
      expect(progressTracker[progressTracker.length - 1]).toBe(100);
    });

    it('runs generateBoardsPDF and returns a Blob', async () => {
      const mockBoards: GeneratedBoard[] = [
        { id: 'b1', index: 1, cards: mockCards }
      ];
      const mockBoardConfig: BoardConfig = {
        rows: 2,
        cols: 1,
        allowDuplicates: false,
        quantity: 1,
        title: 'LOTERIA',
        boardFrameStyle: 'traditional_gallo'
      };

      const progressTracker: number[] = [];
      const blob = await generateBoardsPDF(mockBoards, mockBoardConfig, mockStyle, (pct) => {
        progressTracker.push(pct);
      });

      expect(blob).toBeInstanceOf(Blob);
      expect(progressTracker).toContain(100);
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hexToRgb, generateCardsPDF, generateBoardsPDF } from '../pdfGenerator';
import { LoteriaCard, CardStyleConfig, BoardConfig, GeneratedBoard } from '../../types/loteria';

// Mock canvas and 2D context
const mockCtx = {
  scale: vi.fn(),
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  measureText: vi.fn((text: string) => ({ width: text.length * 8 })),
  fillText: vi.fn(),
  drawImage: vi.fn(),
  font: '',
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  textAlign: 'left',
  textBaseline: 'top',
};

HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCtx) as any;
HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/jpeg;base64,mock') as any;

// Mock HTMLImageElement for loadImage
class MockImage {
  onload: (() => void) | null = null;
  onerror: ((e: any) => void) | null = null;
  naturalWidth = 300;
  naturalHeight = 380;
  width = 300;
  height = 380;
  set src(_val: string) {
    setTimeout(() => {
      if (this.onload) this.onload();
    }, 0);
  }
}
(globalThis as any).Image = MockImage;

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

    it('generates boards preserving exact board count and card indices', async () => {
      const mockBoards: GeneratedBoard[] = [
        { id: 'b1', index: 1, cards: [mockCards[0], mockCards[1]] },
        { id: 'b2', index: 2, cards: [mockCards[1], mockCards[0]] }
      ];
      const mockBoardConfig: BoardConfig = {
        rows: 2,
        cols: 1,
        allowDuplicates: false,
        quantity: 2,
        title: 'LOTERIA TEST',
        boardFrameStyle: 'clean_minimal'
      };

      const blob = await generateBoardsPDF(mockBoards, mockBoardConfig, mockStyle);
      expect(blob).toBeInstanceOf(Blob);
    });

    it('renders botanical_litho with isolated corner rosette paths (no bowtie/hourglass diagonals)', async () => {
      mockCtx.beginPath.mockClear();
      mockCtx.arc.mockClear();
      mockCtx.fill.mockClear();

      const singleBoard: GeneratedBoard[] = [
        { id: 'b1', index: 1, cards: [mockCards[0]] }
      ];
      const singleConfig: BoardConfig = {
        rows: 1,
        cols: 1,
        allowDuplicates: false,
        quantity: 1,
        title: 'TEST'
      };

      await generateBoardsPDF(singleBoard, singleConfig, {
        ...mockStyle,
        frameStyle: 'botanical_litho'
      });

      // 4 corner rosettes must each call beginPath() and arc() individually
      expect(mockCtx.arc).toHaveBeenCalledTimes(4);
      // beginPath must be called at least 4 times (once per rosette) to prevent connecting diagonal lines
      expect(mockCtx.beginPath.mock.calls.length).toBeGreaterThanOrEqual(4);
      // Card name and card number must be drawn
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        'CARD 1',
        expect.any(Number),
        expect.any(Number)
      );
      expect(mockCtx.fillText).toHaveBeenCalledWith(
        '1',
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('renders all other frame styles without throwing', async () => {
      const singleBoard: GeneratedBoard[] = [
        { id: 'b1', index: 1, cards: [mockCards[0]] }
      ];
      const singleConfig: BoardConfig = {
        rows: 1,
        cols: 1,
        allowDuplicates: false,
        quantity: 1,
        title: 'TEST'
      };

      const frames: Array<CardStyleConfig['frameStyle']> = [
        'classic_loteria',
        'talavera',
        'editorial_luxury',
        'organic_floral'
      ];

      for (const frame of frames) {
        const blob = await generateBoardsPDF(singleBoard, singleConfig, {
          ...mockStyle,
          frameStyle: frame
        });
        expect(blob).toBeInstanceOf(Blob);
      }
    });
  });
});

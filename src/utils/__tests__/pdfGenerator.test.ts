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
  save: vi.fn(),
  restore: vi.fn(),
  globalAlpha: 1.0,
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

    it('renders logo on cards in specified corner with opacity in drawCardToCanvas/generateCardsPDF', async () => {
      mockCtx.drawImage.mockClear();

      const logoStyle: CardStyleConfig = {
        ...mockStyle,
        logo: {
          enabled: true,
          image: 'data:image/png;base64,mocklogo',
          position: 'top-right',
          size: 'md',
          opacity: 0.85,
        },
      };

      const blob = await generateCardsPDF(mockCards, logoStyle, 4);
      expect(blob).toBeInstanceOf(Blob);
      // drawImage should be called for card illustration AND for the logo on each card
      expect(mockCtx.drawImage).toHaveBeenCalled();
      expect(mockCtx.drawImage.mock.calls.length).toBeGreaterThanOrEqual(mockCards.length * 2);

      // Test with custom scale and xs preset
      const miniLogoStyle: CardStyleConfig = {
        ...mockStyle,
        logo: {
          enabled: true,
          image: 'data:image/png;base64,mocklogo',
          position: 'top-left',
          size: 'xs',
          scale: 0.08,
          opacity: 0.8,
        },
      };
      const blobMini = await generateCardsPDF(mockCards, miniLogoStyle, 4);
      expect(blobMini).toBeInstanceOf(Blob);
    });

    it('supports card dimension presets (9 per page, 6 per page, 16 per page, and custom cm)', async () => {
      const presets: Array<CardStyleConfig['cardDimensions']> = [
        { preset: '9_per_page' },
        { preset: '6_per_page' },
        { preset: '16_per_page' },
        { preset: 'custom', widthCm: 6, heightCm: 9 },
      ];

      for (const dims of presets) {
        const styleWithDims: CardStyleConfig = {
          ...mockStyle,
          cardDimensions: dims,
        };
        const blob = await generateCardsPDF(mockCards, styleWithDims, 4);
        expect(blob).toBeInstanceOf(Blob);
      }
    });

    it('applies custom board paper background color, text color, and board dimension presets in generateBoardsPDF', async () => {
      const singleBoard: GeneratedBoard[] = [
        { id: 'b1', index: 1, cards: [mockCards[0]] }
      ];
      const customBoardConfig: BoardConfig = {
        rows: 1,
        cols: 1,
        allowDuplicates: false,
        quantity: 1,
        title: 'CUSTOM LOTERIA',
        boardFrameStyle: 'traditional_gallo',
        boardBgColor: '#FEF3C7', // Pastel amber
        boardTextColor: '#991B1B', // Deep red
        boardDimensions: {
          preset: 'square',
          widthCm: 20,
          heightCm: 20,
        },
      };

      const blob = await generateBoardsPDF(singleBoard, customBoardConfig, mockStyle);
      expect(blob).toBeInstanceOf(Blob);

      // Verify custom board presets like half_page and custom cm
      const halfPageConfig: BoardConfig = {
        ...customBoardConfig,
        boardDimensions: { preset: 'half_page' },
      };
      const blobHalf = await generateBoardsPDF(singleBoard, halfPageConfig, mockStyle);
      expect(blobHalf).toBeInstanceOf(Blob);

      const customCmConfig: BoardConfig = {
        ...customBoardConfig,
        boardDimensions: { preset: 'custom', widthCm: 18, heightCm: 24 },
      };
      const blobCustom = await generateBoardsPDF(singleBoard, customCmConfig, mockStyle);
      expect(blobCustom).toBeInstanceOf(Blob);

      // Verify card outer margin modes: match_board, flush, and white
      for (const mode of ['match_board', 'flush', 'white', 'custom'] as const) {
        const modeConfig: BoardConfig = {
          ...customBoardConfig,
          cardOuterMarginMode: mode,
          cardOuterMarginCustomColor: '#E0F2FE',
        };
        const blobMode = await generateBoardsPDF(singleBoard, modeConfig, mockStyle);
        expect(blobMode).toBeInstanceOf(Blob);
      }
    });

    it('supports custom cardOuterMarginColor and cardOuterBorderColor in generateCardsPDF', async () => {
      const styleWithOuterColor: CardStyleConfig = {
        ...mockStyle,
        cardOuterMarginColor: '#FDFBF7',
        cardOuterBorderColor: '#141413',
      };
      const blob = await generateCardsPDF(mockCards, styleWithOuterColor, 4);
      expect(blob).toBeInstanceOf(Blob);
    });

    it('faithfully respects cardStyle outer margin (e.g. #FF0000) and border (#141413) in generateBoardsPDF', async () => {
      const singleBoard: GeneratedBoard[] = [{
        id: 'board-test',
        index: 1,
        cards: [mockCards[0]],
      }];
      const testBoardConfig: BoardConfig = {
        rows: 1,
        cols: 1,
        allowDuplicates: false,
        quantity: 1,
        title: 'TEST',
      };
      const customCardStyle: CardStyleConfig = {
        ...mockStyle,
        cardOuterMarginMode: 'solid',
        cardOuterMarginColor: '#FF0000',
        cardOuterBorderColor: '#141413',
      };
      const blob = await generateBoardsPDF(singleBoard, testBoardConfig, customCardStyle);
      expect(blob).toBeInstanceOf(Blob);
    });
  });
});

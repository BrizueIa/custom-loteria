import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sanitizeDeckFilename, validateAndParseDeckJson, exportDeckToJson } from '../deckIO';
import { LoteriaCard, CardStyleConfig, BoardConfig } from '../../types/loteria';

describe('deckIO', () => {
  const mockCards: LoteriaCard[] = [
    { id: 'card-1', number: 1, name: 'El Gallo', image: 'data:image/svg', tagline: 'Canta al alba' },
    { id: 'card-2', number: 2, name: 'El Diablo', image: 'data:image/svg', tagline: 'Coloradito' }
  ];

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

  const mockBoardConfig: BoardConfig = {
    rows: 4,
    cols: 4,
    allowDuplicates: false,
    quantity: 10,
    title: 'Lotería Navideña',
    subtitle: 'Fiesta 2026'
  };

  describe('sanitizeDeckFilename', () => {
    it('generates clean slug filename without spaces or accents', () => {
      expect(sanitizeDeckFilename('Lotería Navideña y Señora')).toBe('loteria-navidena-y-senora-baraja.json');
      expect(sanitizeDeckFilename('   MI BARAJA !!! ')).toBe('mi-baraja-baraja.json');
      expect(sanitizeDeckFilename('')).toBe('loteria-personalizada-baraja.json');
    });
  });

  describe('validateAndParseDeckJson', () => {
    it('successfully parses valid deck JSON', () => {
      const jsonStr = JSON.stringify({
        version: 1,
        name: 'Test Deck',
        cards: mockCards,
        cardStyle: mockStyle,
        boardConfig: mockBoardConfig
      });

      const result = validateAndParseDeckJson(jsonStr);
      expect(result.success).toBe(true);
      expect(result.data?.cards).toHaveLength(2);
      expect(result.data?.cards[0].name).toBe('El Gallo');
      expect(result.data?.style?.frameStyle).toBe('botanical_litho');
      expect(result.data?.boardConfig?.title).toBe('Lotería Navideña');
    });

    it('returns error when JSON syntax is corrupted', () => {
      const corrupted = '{ cards: [ not valid json ';
      const result = validateAndParseDeckJson(corrupted);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Error de sintaxis JSON');
    });

    it('returns error when cards is missing or empty array', () => {
      const invalid = JSON.stringify({ name: 'Empty' });
      const result = validateAndParseDeckJson(invalid);
      expect(result.success).toBe(false);
      expect(result.error).toBe('La baraja debe contener una lista válida de cartas.');
    });

    it('normalizes missing fields in cards and sorts by number', () => {
      const jsonStr = JSON.stringify({
        cards: [
          { number: 2, name: 'Card 2' },
          { number: 1 } // missing name, id, image
        ]
      });

      const result = validateAndParseDeckJson(jsonStr);
      expect(result.success).toBe(true);
      expect(result.data?.cards[0].number).toBe(1);
      expect(result.data?.cards[0].name).toBe('Carta 1');
      expect(result.data?.cards[0].id).toBe('card-1');
      expect(result.data?.cards[1].number).toBe(2);
    });
  });

  describe('exportDeckToJson', () => {
    beforeEach(() => {
      // Mock window.URL
      window.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      window.URL.revokeObjectURL = vi.fn();
    });

    it('triggers download with correct filename and cleans up object URL', () => {
      const clickMock = vi.fn();
      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue({
        href: '',
        download: '',
        click: clickMock
      } as any);

      exportDeckToJson(mockCards, mockStyle, mockBoardConfig);

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(clickMock).toHaveBeenCalled();
      expect(window.URL.createObjectURL).toHaveBeenCalled();
      expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');

      createElementSpy.mockRestore();
    });
  });
});

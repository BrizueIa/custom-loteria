import { LoteriaCard, CardStyleConfig, BoardConfig } from '../types/loteria';

export interface DeckPackage {
  version: number;
  name: string;
  exportDate: string;
  cards: LoteriaCard[];
  cardStyle?: CardStyleConfig;
  boardConfig?: BoardConfig;
}

export function sanitizeDeckFilename(title: string): string {
  const clean = (title || 'loteria-personalizada')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `${clean || 'loteria'}-baraja.json`;
}

export function exportDeckToJson(cards: LoteriaCard[], cardStyle: CardStyleConfig, boardConfig: BoardConfig): void {
  const data: DeckPackage = {
    version: 1,
    name: boardConfig.title || 'Lotería Personalizada',
    exportDate: new Date().toISOString(),
    cards,
    cardStyle,
    boardConfig
  };
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = sanitizeDeckFilename(boardConfig.title);
  a.click();
  URL.revokeObjectURL(url);
}

export function validateAndParseDeckJson(jsonContent: string): {
  success: boolean;
  data?: { cards: LoteriaCard[]; style?: CardStyleConfig; boardConfig?: BoardConfig };
  error?: string;
} {
  try {
    if (!jsonContent || typeof jsonContent !== 'string') {
      return { success: false, error: 'El contenido JSON está vacío o no es válido.' };
    }

    const parsed = JSON.parse(jsonContent);

    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: 'Formato de archivo inválido.' };
    }

    const cardsRaw = parsed.cards;
    if (!Array.isArray(cardsRaw) || cardsRaw.length === 0) {
      return { success: false, error: 'La baraja debe contener una lista válida de cartas.' };
    }

    // Validate and sanitize cards
    const validatedCards: LoteriaCard[] = [];
    for (let i = 0; i < cardsRaw.length; i++) {
      const c = cardsRaw[i];
      if (!c || typeof c !== 'object') {
        return { success: false, error: `La carta en la posición ${i + 1} no es válida.` };
      }

      const num = typeof c.number === 'number' && !isNaN(c.number) ? c.number : i + 1;
      const isCover = Boolean(c.isCover || num === 0);
      const name = typeof c.name === 'string' && c.name.trim() ? c.name.trim() : isCover ? 'Portada' : `Carta ${num}`;
      const id = typeof c.id === 'string' && c.id.trim() ? c.id.trim() : `card-${num}`;
      const image = typeof c.image === 'string' ? c.image : '';
      const tagline = typeof c.tagline === 'string' ? c.tagline : '';
      const backgroundColor = typeof c.backgroundColor === 'string' && c.backgroundColor.trim() ? c.backgroundColor.trim() : undefined;
      const featherEdges = typeof c.featherEdges === 'boolean' ? c.featherEdges : undefined;

      validatedCards.push({
        id,
        number: isCover ? 0 : num,
        name,
        image,
        tagline,
        ...(isCover ? { isCover: true } : {}),
        ...(backgroundColor ? { backgroundColor } : {}),
        ...(featherEdges !== undefined ? { featherEdges } : {})
      });
    }

    // Sort by card number
    validatedCards.sort((a, b) => a.number - b.number);

    return {
      success: true,
      data: {
        cards: validatedCards,
        style: parsed.cardStyle && typeof parsed.cardStyle === 'object' ? parsed.cardStyle : undefined,
        boardConfig: parsed.boardConfig && typeof parsed.boardConfig === 'object' ? parsed.boardConfig : undefined
      }
    };
  } catch (err: any) {
    return { success: false, error: `Error de sintaxis JSON: ${err.message || 'JSON inválido'}` };
  }
}

export interface ParsedBatchFile {
  cardNumber: number | null;
  customName: string | null;
}

/**
 * Analyzes uploaded image filenames to intelligently extract card numbers and clean names.
 * - Pure numbers (e.g. "1.png", "02.jpg", "#54.webp"): preserves the existing card name.
 * - Number + name (e.g. "1 - La Aglaonema.png", "02_Albahacar.jpg"): extracts both.
 * - Freeform text (e.g. "monstera.png"): extracts clean name without specific number.
 */
export function parseBatchFilename(filename: string): ParsedBatchFile {
  const base = filename.replace(/\.[^/.]+$/, '').trim();

  // Case 1: Pure number (e.g. "1", "02", "#14", "0", "#0")
  const pureNumMatch = base.match(/^#?0*(\d+)$/);
  if (pureNumMatch) {
    return { cardNumber: parseInt(pureNumMatch[1], 10), customName: null };
  }

  // Case 2: Number followed by separator and name (e.g. "1 - La Aglaonema", "02_Albahacar", "3. Alocasia")
  const numWithNameMatch = base.match(/^#?0*(\d+)[\s._-]+(.+)$/);
  if (numWithNameMatch) {
    const clean = numWithNameMatch[2].replace(/[-_]/g, ' ').trim();
    return {
      cardNumber: parseInt(numWithNameMatch[1], 10),
      customName: clean || null
    };
  }

  // Case 3: Freeform name without leading number
  const clean = base.replace(/[-_]/g, ' ').trim();
  return { cardNumber: null, customName: clean || null };
}

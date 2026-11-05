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
      const name = typeof c.name === 'string' && c.name.trim() ? c.name.trim() : `Carta ${num}`;
      const id = typeof c.id === 'string' && c.id.trim() ? c.id.trim() : `card-${num}`;
      const image = typeof c.image === 'string' ? c.image : '';
      const tagline = typeof c.tagline === 'string' ? c.tagline : '';
      const backgroundColor = typeof c.backgroundColor === 'string' && c.backgroundColor.trim() ? c.backgroundColor.trim() : undefined;
      const featherEdges = typeof c.featherEdges === 'boolean' ? c.featherEdges : undefined;

      validatedCards.push({
        id,
        number: num,
        name,
        image,
        tagline,
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

import { LoteriaCard, CardStyleConfig, BoardConfig } from '../types/loteria';

export function exportDeckToJson(cards: LoteriaCard[], cardStyle: CardStyleConfig, boardConfig: BoardConfig) {
  const data = {
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
  a.download = `${(boardConfig.title || 'loteria-personalizada').toLowerCase().replace(/\s+/g, '-')}-baraja.json`;
  a.click();
  URL.revokeObjectURL(url);
}

import jsPDF from 'jspdf';
import { LoteriaCard, CardStyleConfig, GeneratedBoard, BoardConfig } from '../types/loteria';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

/**
 * Draws wrapped text onto canvas if it exceeds max width, scaling font if necessary
 */
function drawAdaptiveText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  startY: number,
  maxWidth: number,
  baseFontSize: number,
  fontFamily: string,
  color: string
) {
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  let fontSize = baseFontSize;
  ctx.font = `bold ${fontSize}px ${fontFamily}`;

  // If text fits in single line
  if (ctx.measureText(text).width <= maxWidth) {
    ctx.fillText(text, centerX, startY);
    return;
  }

  // Check if splitting by words fits into 2 lines
  const words = text.split(' ');
  if (words.length > 1) {
    let line1 = '';
    let line2 = '';
    const mid = Math.ceil(words.length / 2);
    line1 = words.slice(0, mid).join(' ');
    line2 = words.slice(mid).join(' ');

    // Test with slightly smaller font
    fontSize = Math.max(10, baseFontSize - 2);
    ctx.font = `bold ${fontSize}px ${fontFamily}`;

    if (ctx.measureText(line1).width <= maxWidth && ctx.measureText(line2).width <= maxWidth) {
      const lineHeight = fontSize * 1.15;
      ctx.fillText(line1, centerX, startY - lineHeight / 2);
      ctx.fillText(line2, centerX, startY + lineHeight / 2);
      return;
    }
  }

  // Fallback: scale down font until it fits
  while (fontSize > 8 && ctx.measureText(text).width > maxWidth) {
    fontSize -= 0.5;
    ctx.font = `bold ${fontSize}px ${fontFamily}`;
  }
  ctx.fillText(text, centerX, startY);
}

/**
 * Draws a single card onto canvas context with elaborate decorative frames
 */
async function drawCardToCanvas(
  card: LoteriaCard,
  style: CardStyleConfig,
  width: number,
  height: number
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = width * 2;
  canvas.height = height * 2;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.scale(2, 2);

  // Background
  ctx.fillStyle = style.cardBgColor || '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Draw Elaborate Frame Styles
  ctx.strokeStyle = style.borderColor || '#1C1917';

  if (style.frameStyle === 'talavera') {
    // Outer border
    ctx.lineWidth = 2.5;
    ctx.strokeRect(6, 6, width - 12, height - 12);
    // Inner fine border
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = '#78716c';
    ctx.strokeRect(10, 10, width - 20, height - 20);
    // Talavera corner accents
    ctx.strokeStyle = style.borderColor || '#1C1917';
    ctx.lineWidth = 2;
    // Corners
    ctx.strokeRect(6, 6, 8, 8);
    ctx.strokeRect(width - 14, 6, 8, 8);
    ctx.strokeRect(6, height - 14, 8, 8);
    ctx.strokeRect(width - 14, height - 14, 8, 8);
  } else if (style.frameStyle === 'botanical_litho') {
    ctx.lineWidth = 1.8;
    ctx.strokeRect(6, 6, width - 12, height - 12);
    ctx.lineWidth = 0.6;
    ctx.strokeRect(9, 9, width - 18, height - 18);
    // Corner rosettes
    ctx.fillStyle = style.borderColor || '#1C1917';
    ctx.beginPath();
    ctx.arc(10, 10, 2.5, 0, Math.PI * 2);
    ctx.arc(width - 10, 10, 2.5, 0, Math.PI * 2);
    ctx.arc(10, height - 10, 2.5, 0, Math.PI * 2);
    ctx.arc(width - 10, height - 10, 2.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (style.frameStyle === 'editorial_luxury') {
    ctx.lineWidth = 0.8;
    ctx.strokeRect(8, 8, width - 16, height - 16);
    // Corner registration marks
    ctx.font = '10px monospace';
    ctx.fillStyle = '#78716c';
    ctx.fillText('+', 8, 11);
    ctx.fillText('+', width - 8, 11);
    ctx.fillText('+', 8, height - 6);
    ctx.fillText('+', width - 8, height - 6);
  } else if (style.frameStyle === 'organic_floral') {
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#065f46';
    ctx.strokeRect(6, 6, width - 12, height - 12);
    // Leaf flourishes
    ctx.fillStyle = '#065f46';
    ctx.font = '11px serif';
    ctx.fillText('❦', 11, 15);
    ctx.fillText('❦', width - 11, 15);
    ctx.fillText('❦', 11, height - 9);
    ctx.fillText('❦', width - 11, height - 9);
  } else {
    // classic_loteria
    ctx.lineWidth = 3;
    ctx.strokeRect(6, 6, width - 12, height - 12);
    // Diamonds in corners
    ctx.fillStyle = '#b45309';
    const drawDiamond = (cx: number, cy: number, sz: number) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy - sz);
      ctx.lineTo(cx + sz, cy);
      ctx.lineTo(cx, cy + sz);
      ctx.lineTo(cx - sz, cy);
      ctx.closePath();
      ctx.fill();
    };
    drawDiamond(12, 12, 4);
    drawDiamond(width - 12, 12, 4);
    drawDiamond(12, height - 12, 4);
    drawDiamond(width - 12, height - 12, 4);
  }

  // Draw Card Number
  ctx.fillStyle = style.textColor || '#1C1917';
  ctx.font = 'bold 15px "Cinzel", "Times New Roman", serif';
  ctx.textBaseline = 'top';

  let numX = 14;
  let numY = 14;
  if (style.numberPosition === 'top-right') {
    numX = width - 18;
    ctx.textAlign = 'right';
  } else if (style.numberPosition === 'bottom-left') {
    numY = height - 26;
    ctx.textAlign = 'left';
  } else if (style.numberPosition === 'bottom-right') {
    numX = width - 18;
    numY = height - 26;
    ctx.textAlign = 'right';
  } else {
    ctx.textAlign = 'left';
  }
  ctx.fillText(card.number.toString(), numX, numY);

  // Position and Heights
  let nameCenterY = height - 22;
  let imgTop = 36;
  let imgHeight = height - 68;

  if (style.namePosition === 'top') {
    nameCenterY = 26;
    imgTop = 46;
    imgHeight = height - 60;
  }

  // Draw Adaptive Name (Full, wrapping, never truncated!)
  const maxTextWidth = width - 36;
  drawAdaptiveText(
    ctx,
    card.name.toUpperCase(),
    width / 2,
    nameCenterY,
    maxTextWidth,
    13,
    '"Playfair Display", Georgia, serif',
    style.textColor || '#1C1917'
  );

  // Draw Card Image
  try {
    const img = await loadImage(card.image);
    const imgMargin = 16;
    const imgWidth = width - imgMargin * 2;
    ctx.drawImage(img, imgMargin, imgTop, imgWidth, imgHeight);
  } catch (err) {
    console.error('Error loading image for card', card.number, err);
  }

  return canvas.toDataURL('image/jpeg', 0.95);
}

/**
 * PDF 1: 54 Cards (Cartas de baraja)
 */
export async function generateCardsPDF(
  cards: LoteriaCard[],
  style: CardStyleConfig,
  cardsPerPage: 2 | 4 | 9 = 2,
  onProgress?: (pct: number) => void
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  let cols = 1;
  let rows = 2;
  if (cardsPerPage === 4) {
    cols = 2;
    rows = 2;
  } else if (cardsPerPage === 9) {
    cols = 3;
    rows = 3;
  }

  const marginX = 14;
  const marginY = 14;
  const usableWidth = pageWidth - marginX * 2;
  const usableHeight = pageHeight - marginY * 2;

  const cardWidthMm = usableWidth / cols - 6;
  const cardHeightMm = usableHeight / rows - 6;

  const totalCards = cards.length;
  let cardIndex = 0;

  while (cardIndex < totalCards) {
    if (cardIndex > 0) doc.addPage();

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (cardIndex >= totalCards) break;

        const card = cards[cardIndex];
        const x = marginX + c * (cardWidthMm + 6) + 3;
        const y = marginY + r * (cardHeightMm + 6) + 3;

        const dataUrl = await drawCardToCanvas(card, style, 300, 420);
        doc.addImage(dataUrl, 'JPEG', x, y, cardWidthMm, cardHeightMm);

        // Cutting guide
        doc.setDrawColor(210, 210, 210);
        doc.setLineWidth(0.1);
        doc.rect(x, y, cardWidthMm, cardHeightMm);

        cardIndex++;
        if (onProgress) onProgress(Math.round((cardIndex / totalCards) * 100));
      }
    }
  }

  return doc.output('blob');
}

/**
 * PDF 2: Generated Boards (Tablas de lotería)
 */
export async function generateBoardsPDF(
  boards: GeneratedBoard[],
  boardConfig: BoardConfig,
  cardStyle: CardStyleConfig,
  onProgress?: (pct: number) => void
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const totalBoards = boards.length;

  for (let bIdx = 0; bIdx < totalBoards; bIdx++) {
    if (bIdx > 0) doc.addPage();

    const board = boards[bIdx];

    // Minimalist, elegant header (no harsh colored banners)
    doc.setFont('times', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(28, 25, 23); // stone-900
    doc.text(boardConfig.title || 'LOTERÍA MEXICANA', pageWidth / 2, 14, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(120, 113, 108); // stone-500
    doc.text(`TABLA #${board.index}`, pageWidth / 2, 20, { align: 'center' });

    // Grid Dimensions
    const gridMarginX = 14;
    const gridMarginY = 25;
    const gridWidth = pageWidth - gridMarginX * 2;
    const gridHeight = pageHeight - gridMarginY - 14;

    const cellWidth = gridWidth / boardConfig.cols;
    const cellHeight = gridHeight / boardConfig.rows;

    let cardCellIdx = 0;

    for (let r = 0; r < boardConfig.rows; r++) {
      for (let c = 0; c < boardConfig.cols; c++) {
        if (cardCellIdx >= board.cards.length) break;

        const card = board.cards[cardCellIdx];
        const cellX = gridMarginX + c * cellWidth;
        const cellY = gridMarginY + r * cellHeight;

        const cardDataUrl = await drawCardToCanvas(card, cardStyle, 220, 290);
        doc.addImage(cardDataUrl, 'JPEG', cellX + 1, cellY + 1, cellWidth - 2, cellHeight - 2);

        cardCellIdx++;
      }
    }

    if (onProgress) onProgress(Math.round(((bIdx + 1) / totalBoards) * 100));
  }

  return doc.output('blob');
}

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

export function hexToRgb(hex?: string): { r: number; g: number; b: number } {
  if (!hex) return { r: 22, g: 78, b: 61 }; // Default #164E3D
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 22, g: 78, b: 61 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
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

  const hasTagline = Boolean(style.showTaglineOnCard && card.tagline && card.tagline.trim());

  // Position and Heights
  let nameCenterY = height - (hasTagline ? 28 : 22);
  let taglineCenterY = height - 14;
  let imgTop = 36;
  let imgHeight = height - (hasTagline ? 76 : 68);

  if (style.namePosition === 'top') {
    nameCenterY = 24;
    taglineCenterY = 36;
    imgTop = hasTagline ? 48 : 42;
    imgHeight = height - (hasTagline ? 66 : 60);
  }

  // Draw Adaptive Name (Full, wrapping, never truncated!)
  const maxTextWidth = width - 42;
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

  // Draw Tagline if enabled
  if (hasTagline && card.tagline) {
    ctx.font = 'italic 8px "Playfair Display", Georgia, serif';
    ctx.fillStyle = '#78716c';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(card.tagline.trim(), width / 2, taglineCenterY, maxTextWidth);
  }

  // Draw Card Image preserving true aspect ratio (object-fit: contain)
  try {
    const img = await loadImage(card.image);
    const imgMargin = 16;
    const availWidth = width - imgMargin * 2;
    const availHeight = imgHeight;

    const imgNaturalW = img.naturalWidth || img.width || 1;
    const imgNaturalH = img.naturalHeight || img.height || 1;
    const imgAspect = imgNaturalW / imgNaturalH;
    const availAspect = availWidth / availHeight;

    let drawWidth = availWidth;
    let drawHeight = availHeight;
    let drawX = imgMargin;
    let drawY = imgTop;

    if (imgAspect > availAspect) {
      // Imagen más ancha que la caja: ajustar ancho y centrar verticalmente
      drawWidth = availWidth;
      drawHeight = availWidth / imgAspect;
      drawY = imgTop + (availHeight - drawHeight) / 2;
    } else {
      // Imagen más alta que la caja: ajustar alto y centrar horizontalmente
      drawHeight = availHeight;
      drawWidth = availHeight * imgAspect;
      drawX = imgMargin + (availWidth - drawWidth) / 2;
    }

    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
  } catch (err) {
    console.error('Error loading image for card', card.number, err);
  }

  return canvas.toDataURL('image/jpeg', 0.95);
}

/**
 * PDF 1: 54 Cards (Cartas de baraja - Formato estándar 4 por hoja)
 */
export async function generateCardsPDF(
  cards: LoteriaCard[],
  style: CardStyleConfig,
  _cardsPerPage: number = 4,
  onProgress?: (pct: number) => void,
  paperSize: 'letter' | 'a4' = 'letter'
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: paperSize
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Formato óptimo fijado a 4 cartas por hoja (2x2 cuadrícula)
  const cols = 2;
  const rows = 2;

  const marginX = 14;
  const marginY = 14;
  const cellWidth = (pageWidth - marginX * 2) / cols;
  const cellHeight = (pageHeight - marginY * 2) / rows;

  // Dimensiones exactas con proporción 300:420 (~0.714) para corte perfecto
  const cardWidthMm = 84;
  const cardHeightMm = 117.6;
  const offsetX = (cellWidth - cardWidthMm) / 2;
  const offsetY = (cellHeight - cardHeightMm) / 2;

  const totalCards = cards.length;
  let cardIndex = 0;

  while (cardIndex < totalCards) {
    if (cardIndex > 0) doc.addPage();

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (cardIndex >= totalCards) break;

        const card = cards[cardIndex];
        const x = marginX + c * cellWidth + offsetX;
        const y = marginY + r * cellHeight + offsetY;

        const dataUrl = await drawCardToCanvas(card, style, 300, 420);
        doc.addImage(dataUrl, 'JPEG', x, y, cardWidthMm, cardHeightMm);

        // Guía de corte sutil
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.15);
        doc.rect(x, y, cardWidthMm, cardHeightMm);

        cardIndex++;
        if (onProgress) onProgress(Math.round((cardIndex / totalCards) * 100));
      }
    }
  }

  return doc.output('blob');
}

/**
 * PDF 2: Generated Boards (Tablas de lotería tradicionales y personalizadas)
 */
export async function generateBoardsPDF(
  boards: GeneratedBoard[],
  boardConfig: BoardConfig,
  cardStyle: CardStyleConfig,
  onProgress?: (pct: number) => void,
  paperSize: 'letter' | 'a4' = 'letter'
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: paperSize
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 215.9 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 279.4 mm

  const totalBoards = boards.length;
  const frameStyle = boardConfig.boardFrameStyle || 'traditional_gallo';
  const borderColor = boardConfig.boardBorderColor || '#164E3D';
  const rgb = hexToRgb(borderColor);

  const title = (boardConfig.title || 'LOTERÍA MEXICANA').toUpperCase().trim();
  const subtitle = (boardConfig.subtitle || '').trim();
  const showNumber = Boolean(boardConfig.showBoardNumber);

  // Proporción oficial tradicional de tablero: 22 cm / 31 cm (ratio ~0.709677)
  // Se escala centrado en la hoja carta (21.59 x 27.94 cm) con márgenes profesionales de ~2 cm,
  // dejando el tablero más pequeño y elegante con espacio para sujetar o recortar.
  const OFFICIAL_RATIO = 22 / 31;
  const maxAllowedH = pageHeight - 38; // ~19 mm margen arriba y abajo
  const maxAllowedW = pageWidth - 42; // ~21 mm margen izq y der

  let frameW = maxAllowedW;
  let frameH = frameW / OFFICIAL_RATIO;

  if (frameH > maxAllowedH) {
    frameH = maxAllowedH;
    frameW = frameH * OFFICIAL_RATIO;
  }

  const frameX = (pageWidth - frameW) / 2;
  const frameY = (pageHeight - frameH) / 2;

  const hasSub = subtitle.length > 0;
  const headerHeight = hasSub ? 20 : showNumber ? 17 : 14;

  // Helper para dibujar rombos de imprenta tradicional
  const drawDiamond = (cx: number, cy: number, sz: number) => {
    doc.setFillColor(rgb.r, rgb.g, rgb.b);
    doc.triangle(cx, cy - sz, cx + sz, cy, cx - sz, cy, 'F');
    doc.triangle(cx, cy + sz, cx + sz, cy, cx - sz, cy, 'F');
  };

  for (let bIdx = 0; bIdx < totalBoards; bIdx++) {
    if (bIdx > 0) doc.addPage();

    const board = boards[bIdx];

    // 0. Guías de corte discretas en las 4 esquinas del tablero (estilo imprenta)
    doc.setDrawColor(200, 196, 192);
    doc.setLineWidth(0.18);
    const cmLen = 3.5;
    const cmOffset = 2;

    // Top-Left
    doc.line(frameX - cmOffset, frameY, frameX - cmOffset - cmLen, frameY);
    doc.line(frameX, frameY - cmOffset, frameX, frameY - cmOffset - cmLen);

    // Top-Right
    doc.line(frameX + frameW + cmOffset, frameY, frameX + frameW + cmOffset + cmLen, frameY);
    doc.line(frameX + frameW, frameY - cmOffset, frameX + frameW, frameY - cmOffset - cmLen);

    // Bottom-Left
    doc.line(frameX - cmOffset, frameY + frameH, frameX - cmOffset - cmLen, frameY + frameH);
    doc.line(frameX, frameY + frameH + cmOffset, frameX, frameY + frameH + cmOffset + cmLen);

    // Bottom-Right
    doc.line(frameX + frameW + cmOffset, frameY + frameH, frameX + frameW + cmOffset + cmLen, frameY + frameH);
    doc.line(frameX + frameW, frameY + frameH + cmOffset, frameX + frameW, frameY + frameH + cmOffset + cmLen);

    // 1. Dibujar Marco según el estilo elegido
    if (frameStyle === 'traditional_gallo') {
      // Marco exterior grueso
      doc.setDrawColor(rgb.r, rgb.g, rgb.b);
      doc.setLineWidth(1.2);
      doc.rect(frameX, frameY, frameW, frameH, 'S');

      // Filete interior fino
      doc.setLineWidth(0.4);
      doc.rect(frameX + 2, frameY + 2, frameW - 4, frameH - 4, 'S');

      // Rombos en las 4 esquinas exteriores
      drawDiamond(frameX + 5, frameY + 5, 2.2);
      drawDiamond(frameX + frameW - 5, frameY + 5, 2.2);
      drawDiamond(frameX + 5, frameY + frameH - 5, 2.2);
      drawDiamond(frameX + frameW - 5, frameY + frameH - 5, 2.2);

      // Separador doble de cabecera
      const divY = frameY + headerHeight;
      doc.setLineWidth(0.8);
      doc.line(frameX + 2, divY, frameX + frameW - 2, divY);
      doc.setLineWidth(0.3);
      doc.line(frameX + 2, divY + 1.2, frameX + frameW - 2, divY + 1.2);
    } else if (frameStyle === 'festive_banner') {
      // Borde exterior
      doc.setDrawColor(rgb.r, rgb.g, rgb.b);
      doc.setLineWidth(0.9);
      doc.rect(frameX, frameY, frameW, frameH, 'S');

      // Bloque sólido de color para el encabezado
      doc.setFillColor(rgb.r, rgb.g, rgb.b);
      doc.rect(frameX, frameY, frameW, headerHeight, 'F');
    } else if (frameStyle === 'talavera_frame') {
      // Borde exterior
      doc.setDrawColor(rgb.r, rgb.g, rgb.b);
      doc.setLineWidth(1.0);
      doc.rect(frameX, frameY, frameW, frameH, 'S');

      // Marco interior
      doc.setLineWidth(0.4);
      doc.rect(frameX + 2.5, frameY + 2.5, frameW - 5, frameH - 5, 'S');

      // Cuadrantes esquineros Talavera
      const cSz = 4.5;
      doc.setLineWidth(0.6);
      doc.rect(frameX, frameY, cSz, cSz, 'S');
      doc.rect(frameX + frameW - cSz, frameY, cSz, cSz, 'S');
      doc.rect(frameX, frameY + frameH - cSz, cSz, cSz, 'S');
      doc.rect(frameX + frameW - cSz, frameY + frameH - cSz, cSz, cSz, 'S');

      drawDiamond(frameX + cSz / 2, frameY + cSz / 2, 1.2);
      drawDiamond(frameX + frameW - cSz / 2, frameY + cSz / 2, 1.2);
      drawDiamond(frameX + cSz / 2, frameY + frameH - cSz / 2, 1.2);
      drawDiamond(frameX + frameW - cSz / 2, frameY + frameH - cSz / 2, 1.2);

      // Separador
      const divY = frameY + headerHeight;
      doc.setLineWidth(0.6);
      doc.line(frameX + 2.5, divY, frameX + frameW - 2.5, divY);
    } else if (frameStyle === 'clean_minimal') {
      // Línea fina minimalista
      doc.setDrawColor(rgb.r, rgb.g, rgb.b);
      doc.setLineWidth(0.7);
      doc.rect(frameX, frameY, frameW, frameH, 'S');

      // Separador simple
      const divY = frameY + headerHeight;
      doc.setLineWidth(0.4);
      doc.line(frameX, divY, frameX + frameW, divY);
    } else {
      // 'none': Sin marco exterior
      const divY = frameY + headerHeight;
      doc.setDrawColor(214, 211, 209); // stone-300
      doc.setLineWidth(0.4);
      doc.line(frameX + 12, divY, frameX + frameW - 12, divY);
    }

    // 2. Encabezado de la tabla (Título, Subtítulo opcional, Número de tabla condicional)
    const isBanner = frameStyle === 'festive_banner';

    if (hasSub && showNumber) {
      doc.setFont('times', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(isBanner ? 255 : rgb.r, isBanner ? 255 : rgb.g, isBanner ? 255 : rgb.b);
      doc.text(title, pageWidth / 2, frameY + 7.5, { align: 'center' });

      doc.setFont('times', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(isBanner ? 254 : 110, isBanner ? 243 : 105, isBanner ? 199 : 100);
      doc.text(subtitle, pageWidth / 2, frameY + 13, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(isBanner ? 240 : 120, isBanner ? 240 : 113, isBanner ? 240 : 108);
      doc.text(`TABLA #${board.index}`, pageWidth / 2, frameY + 18, { align: 'center' });
    } else if (hasSub) {
      doc.setFont('times', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(isBanner ? 255 : rgb.r, isBanner ? 255 : rgb.g, isBanner ? 255 : rgb.b);
      doc.text(title, pageWidth / 2, frameY + 9, { align: 'center' });

      doc.setFont('times', 'italic');
      doc.setFontSize(9.5);
      doc.setTextColor(isBanner ? 254 : 110, isBanner ? 243 : 105, isBanner ? 199 : 100);
      doc.text(subtitle, pageWidth / 2, frameY + 16, { align: 'center' });
    } else if (showNumber) {
      doc.setFont('times', 'bold');
      doc.setFontSize(19);
      doc.setTextColor(isBanner ? 255 : rgb.r, isBanner ? 255 : rgb.g, isBanner ? 255 : rgb.b);
      doc.text(title, pageWidth / 2, frameY + 9.5, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(isBanner ? 240 : 120, isBanner ? 240 : 113, isBanner ? 240 : 108);
      doc.text(`TABLA #${board.index}`, pageWidth / 2, frameY + 15.5, { align: 'center' });
    } else {
      // Solo título centrado
      doc.setFont('times', 'bold');
      doc.setFontSize(21);
      doc.setTextColor(isBanner ? 255 : rgb.r, isBanner ? 255 : rgb.g, isBanner ? 255 : rgb.b);
      doc.text(title, pageWidth / 2, frameY + headerHeight / 2 + 2.5, { align: 'center' });
    }

    // 3. Grid de Casillas (Proporción auténtica de tablero de lotería)
    const gridInsetX = frameStyle === 'none' ? 2 : frameStyle === 'traditional_gallo' ? 4.5 : 3.5;
    const gridInsetY = frameStyle === 'none' ? 3 : frameStyle === 'traditional_gallo' ? 4 : 3;
    const gridBottomPad = frameStyle === 'none' ? 4 : frameStyle === 'traditional_gallo' ? 6 : 4.5;

    const gridX = frameX + gridInsetX;
    const gridY = frameY + headerHeight + gridInsetY;
    const gridW = frameW - gridInsetX * 2;
    const gridH = frameH - headerHeight - gridInsetY - gridBottomPad;

    const cellWidth = gridW / boardConfig.cols;
    const cellHeight = gridH / boardConfig.rows;

    let cardCellIdx = 0;
    const pad = 0.8;
    const cardRenderW = cellWidth - pad * 2;
    const cardRenderH = cellHeight - pad * 2;
    const canvasPxW = 240;
    const canvasPxH = Math.round(canvasPxW * (cardRenderH / cardRenderW));

    for (let r = 0; r < boardConfig.rows; r++) {
      for (let c = 0; c < boardConfig.cols; c++) {
        if (cardCellIdx >= board.cards.length) break;

        const card = board.cards[cardCellIdx];
        const cellX = gridX + c * cellWidth + pad;
        const cellY = gridY + r * cellHeight + pad;

        const cardDataUrl = await drawCardToCanvas(card, cardStyle, canvasPxW, canvasPxH);
        doc.addImage(cardDataUrl, 'JPEG', cellX, cellY, cardRenderW, cardRenderH);

        // Guía de separación limpia
        doc.setDrawColor(214, 211, 209);
        doc.setLineWidth(0.15);
        doc.rect(cellX, cellY, cardRenderW, cardRenderH, 'S');

        cardCellIdx++;
      }
    }

    if (onProgress) onProgress(Math.round(((bIdx + 1) / totalBoards) * 100));
  }

  return doc.output('blob');
}

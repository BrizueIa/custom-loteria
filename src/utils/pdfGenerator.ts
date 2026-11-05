import jsPDF from 'jspdf';
import { LoteriaCard, CardStyleConfig, GeneratedBoard, BoardConfig } from '../types/loteria';
import { getContrastingTextColor, isSvgDataUrl } from './imageOptimizer';

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
 * Draws a single card onto canvas context with classic Mexican Loteria layout:
 * - White outer margin around all 4 sides
 * - Crisp black inner frame filled with card's unified background color
 * - 3 non-overlapping internal zones (number clearance, central image with feathered edges, name inside frame)
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

  // 1. White Outer Margin (Paspartú blanco en los 4 costados)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // 2. Inner Framed Area filled with the absorbed card background color
  const inset = Math.max(8, Math.round(width * 0.042));
  const innerX = inset;
  const innerY = inset;
  const innerW = width - inset * 2;
  const innerH = height - inset * 2;

  const innerBgColor = card.backgroundColor || style.cardBgColor || '#FFFFFF';
  const effectiveTextColor = getContrastingTextColor(innerBgColor, style.textColor);
  const shouldFeather = card.featherEdges !== false && !isSvgDataUrl(card.image);

  ctx.fillStyle = innerBgColor;
  ctx.fillRect(innerX, innerY, innerW, innerH);

  const hasTagline = Boolean(style.showTaglineOnCard && card.tagline && card.tagline.trim());

  // 3. Layout Dimensions & 3 Non-Overlapping Internal Zones inside the black frame
  const isTopNumber =
    style.numberPosition === 'top-left' || style.numberPosition === 'top-right';
  const isBottomNumber =
    style.numberPosition === 'bottom-left' || style.numberPosition === 'bottom-right';

  let nameCenterY = innerY + innerH - (hasTagline ? 24 : 18);
  let taglineCenterY = innerY + innerH - 11;
  let imgTop = innerY + (isTopNumber ? 26 : 10);
  let imgBottom = innerY + innerH - (hasTagline ? 42 : 34);

  if (style.namePosition === 'top') {
    nameCenterY = innerY + 18;
    taglineCenterY = innerY + 30;
    imgTop = innerY + (hasTagline ? 40 : 32);
    imgBottom = innerY + innerH - (isBottomNumber ? 26 : 10);
  }

  const imgHeight = Math.max(40, imgBottom - imgTop);

  // 4. Draw Card Image in dedicated central zone (never overlapped by number or name)
  try {
    const img = await loadImage(card.image);
    const imgSidePad = Math.max(6, Math.round(innerW * 0.035));
    const availWidth = innerW - imgSidePad * 2;
    const availHeight = imgHeight;

    const imgNaturalW = img.naturalWidth || img.width || 1;
    const imgNaturalH = img.naturalHeight || img.height || 1;
    const imgAspect = imgNaturalW / imgNaturalH;
    const availAspect = availWidth / availHeight;

    let drawWidth = availWidth;
    let drawHeight = availHeight;
    let drawX = innerX + imgSidePad;
    let drawY = imgTop;

    if (imgAspect > availAspect) {
      drawWidth = availWidth;
      drawHeight = availWidth / imgAspect;
      drawY = imgTop + (availHeight - drawHeight) / 2;
    } else {
      drawHeight = availHeight;
      drawWidth = availHeight * imgAspect;
      drawX = innerX + imgSidePad + (availWidth - drawWidth) / 2;
    }

    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

    // Subtle edge feathering into innerBgColor so no rectangular image cut is visible
    if (shouldFeather && typeof ctx.createLinearGradient === 'function') {
      const rgb = hexToRgb(innerBgColor);
      const solidColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`;
      const transColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`;
      const featherPx = Math.max(4, Math.min(10, Math.round(Math.min(drawWidth, drawHeight) * 0.04)));

      // Top edge fade
      const gTop = ctx.createLinearGradient(0, drawY - 1, 0, drawY + featherPx);
      gTop.addColorStop(0, solidColor);
      gTop.addColorStop(1, transColor);
      ctx.fillStyle = gTop;
      ctx.fillRect(drawX - 1, drawY - 1, drawWidth + 2, featherPx + 1);

      // Bottom edge fade
      const gBot = ctx.createLinearGradient(0, drawY + drawHeight + 1, 0, drawY + drawHeight - featherPx);
      gBot.addColorStop(0, solidColor);
      gBot.addColorStop(1, transColor);
      ctx.fillStyle = gBot;
      ctx.fillRect(drawX - 1, drawY + drawHeight - featherPx, drawWidth + 2, featherPx + 1);

      // Left edge fade
      const gLeft = ctx.createLinearGradient(drawX - 1, 0, drawX + featherPx, 0);
      gLeft.addColorStop(0, solidColor);
      gLeft.addColorStop(1, transColor);
      ctx.fillStyle = gLeft;
      ctx.fillRect(drawX - 1, drawY - 1, featherPx + 1, drawHeight + 2);

      // Right edge fade
      const gRight = ctx.createLinearGradient(drawX + drawWidth + 1, 0, drawX + drawWidth - featherPx, 0);
      gRight.addColorStop(0, solidColor);
      gRight.addColorStop(1, transColor);
      ctx.fillStyle = gRight;
      ctx.fillRect(drawX + drawWidth - featherPx, drawY - 1, featherPx + 1, drawHeight + 2);
    }
  } catch (err) {
    console.error('Error loading image for card', card.number, err);
  }

  // 5. Draw Inner Frame Border (Línea negra continua estilo Lotería Mexicana clásica)
  if (style.frameStyle === 'talavera') {
    ctx.strokeStyle = '#141413';
    ctx.lineWidth = 2.2;
    ctx.strokeRect(innerX, innerY, innerW, innerH);
    ctx.lineWidth = 0.7;
    ctx.strokeStyle = 'rgba(20, 20, 19, 0.35)';
    ctx.strokeRect(innerX + 3.5, innerY + 3.5, innerW - 7, innerH - 7);
  } else if (style.frameStyle === 'botanical_litho') {
    ctx.lineWidth = 2.0;
    ctx.strokeStyle = '#141413';
    ctx.strokeRect(innerX, innerY, innerW, innerH);
    ctx.lineWidth = 0.6;
    ctx.strokeStyle = 'rgba(20, 20, 19, 0.3)';
    ctx.strokeRect(innerX + 3, innerY + 3, innerW - 6, innerH - 6);
    ctx.fillStyle = '#141413';
    const drawRosette = (cx: number, cy: number) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 2.0, 0, Math.PI * 2);
      ctx.fill();
    };
    drawRosette(innerX + 4, innerY + 4);
    drawRosette(innerX + innerW - 4, innerY + 4);
    drawRosette(innerX + 4, innerY + innerH - 4);
    drawRosette(innerX + innerW - 4, innerY + innerH - 4);
  } else if (style.frameStyle === 'editorial_luxury') {
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = '#57534e';
    ctx.strokeRect(innerX, innerY, innerW, innerH);
  } else if (style.frameStyle === 'organic_floral') {
    ctx.lineWidth = 2.0;
    ctx.strokeStyle = '#064e3b';
    ctx.strokeRect(innerX, innerY, innerW, innerH);
  } else {
    // classic_loteria: Pure crisp black line frame (like "LA DAMA")
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = '#141413';
    ctx.strokeRect(innerX, innerY, innerW, innerH);
  }

  // 6. Draw Card Number inside the black frame (directly on background color, no white patch)
  const numFontSize = width >= 280 ? 17 : 14;
  ctx.font = `bold ${numFontSize}px "Cinzel", "Times New Roman", serif`;
  ctx.textBaseline = 'top';

  const numText = card.number.toString();
  let numX = innerX + 9;
  let numY = innerY + 7;
  if (style.numberPosition === 'top-right') {
    numX = innerX + innerW - 9;
    ctx.textAlign = 'right';
  } else if (style.numberPosition === 'bottom-left') {
    numY = innerY + innerH - numFontSize - 7;
    ctx.textAlign = 'left';
  } else if (style.numberPosition === 'bottom-right') {
    numX = innerX + innerW - 9;
    numY = innerY + innerH - numFontSize - 7;
    ctx.textAlign = 'right';
  } else {
    ctx.textAlign = 'left';
  }

  ctx.fillStyle = effectiveTextColor;
  ctx.fillText(numText, numX, numY);

  // 7. Draw Adaptive Name & Tagline inside the black frame
  const baseFontSize = width >= 280 ? 16 : 13.5;
  const maxTextWidth = innerW - 24;
  drawAdaptiveText(
    ctx,
    card.name.toUpperCase(),
    width / 2,
    nameCenterY,
    maxTextWidth,
    baseFontSize,
    '"Fraunces", "Playfair Display", Georgia, serif',
    effectiveTextColor
  );

  if (hasTagline && card.tagline) {
    ctx.font = 'italic 8px "Playfair Display", Georgia, serif';
    ctx.fillStyle = effectiveTextColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(card.tagline.trim(), width / 2, taglineCenterY, maxTextWidth);
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

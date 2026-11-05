import React from 'react';
import { LoteriaCard, CardStyleConfig } from '../types/loteria';
import { getContrastingTextColor, isSvgDataUrl, samplePixelColor } from '../utils/imageOptimizer';

export type CardPreviewVariant = 'board' | 'grid' | 'full';

interface CardPreviewProps {
  card: LoteriaCard;
  style: CardStyleConfig;
  className?: string;
  onClick?: () => void;
  isCompactTable?: boolean; // Kept for backwards compatibility
  variant?: CardPreviewVariant;
  isEyedropperActive?: boolean;
  onPickColor?: (hexColor: string) => void;
}

export const CardPreview: React.FC<CardPreviewProps> = ({
  card,
  style,
  className = '',
  onClick,
  isCompactTable = false,
  variant,
  isEyedropperActive = false,
  onPickColor,
}) => {
  // Determine effective variant
  const effectiveVariant: CardPreviewVariant = variant || (isCompactTable ? 'board' : 'full');
  const isBoard = effectiveVariant === 'board';
  const isGrid = effectiveVariant === 'grid';

  // Per-card unified background color inside the black frame
  const innerBgColor = card.backgroundColor || style.cardBgColor || '#FFFFFF';
  const effectiveTextColor = getContrastingTextColor(innerBgColor, style.textColor);
  const shouldFeather = card.featherEdges !== false && !isSvgDataUrl(card.image);
  const isCoverCard = card.number === 0 || Boolean(card.isCover);

  const getNumberClass = () => {
    switch (style.numberPosition) {
      case 'top-right':
        return isBoard ? 'top-0.5 right-1' : isGrid ? 'top-1 right-1.5' : 'top-1.5 right-2.5';
      case 'bottom-left':
        return isBoard ? 'bottom-0.5 left-1' : isGrid ? 'bottom-1 left-1.5' : 'bottom-1.5 left-2.5';
      case 'bottom-right':
        return isBoard ? 'bottom-0.5 right-1' : isGrid ? 'bottom-1 right-1.5' : 'bottom-1.5 right-2.5';
      case 'top-left':
      default:
        return isBoard ? 'top-0.5 left-1' : isGrid ? 'top-1 left-1.5' : 'top-1.5 left-2.5';
    }
  };

  const getNumberFontSize = () => {
    if (isBoard) {
      return 'text-[7.5px] font-black leading-none';
    }
    if (isGrid) {
      return 'text-xs sm:text-sm font-black leading-none';
    }
    return 'text-base sm:text-lg font-black leading-none';
  };

  // Dynamic font size so names adapt cleanly without awkward linebreaks
  const getNameFontSize = () => {
    const len = card.name.length;
    if (isBoard) {
      if (len > 22) return 'text-[5px] leading-[1.05] tracking-tight';
      if (len > 16) return 'text-[5.5px] leading-[1.1] tracking-tight';
      if (len > 11) return 'text-[6px] leading-[1.1] tracking-tight';
      return 'text-[7px] leading-tight';
    } else if (isGrid) {
      if (len > 22) return 'text-[9px] sm:text-[11px] leading-tight tracking-tight';
      if (len > 15) return 'text-[10px] sm:text-xs leading-tight tracking-tight';
      return 'text-xs sm:text-sm leading-snug font-extrabold tracking-wide';
    } else {
      if (len > 24) return 'text-xs leading-tight tracking-wide';
      if (len > 18) return 'text-sm leading-tight tracking-wide';
      return 'text-base sm:text-lg leading-snug tracking-wider';
    }
  };

  // Inner frame border class according to selected style
  const getInnerFrameClass = () => {
    switch (style.frameStyle) {
      case 'editorial_luxury':
        return isBoard ? 'border border-stone-400' : 'border border-stone-400';
      case 'organic_floral':
        return isBoard
          ? 'border border-emerald-950 rounded-[1px]'
          : 'border-[1.5px] sm:border-2 border-emerald-950 rounded-xs';
      case 'talavera':
      case 'botanical_litho':
      case 'classic_loteria':
      default:
        return isBoard
          ? 'border-[1px] border-stone-950'
          : isGrid
          ? 'border-[1.5px] border-stone-950'
          : 'border-2 border-stone-950';
    }
  };

  // Optional subtle inner corner accents for non-classic frames
  const renderOptionalInnerAccents = () => {
    switch (style.frameStyle) {
      case 'talavera':
        if (isBoard) return null;
        return (
          <>
            <div className="absolute inset-1 border border-stone-900/25 pointer-events-none" />
            <div className="absolute top-0.5 left-0.5 w-2 h-2 border-t-2 border-l-2 border-amber-800 pointer-events-none" />
            <div className="absolute top-0.5 right-0.5 w-2 h-2 border-t-2 border-r-2 border-amber-800 pointer-events-none" />
            <div className="absolute bottom-0.5 left-0.5 w-2 h-2 border-b-2 border-l-2 border-amber-800 pointer-events-none" />
            <div className="absolute bottom-0.5 right-0.5 w-2 h-2 border-b-2 border-r-2 border-amber-800 pointer-events-none" />
          </>
        );
      case 'botanical_litho':
        if (isBoard) return null;
        return (
          <div className="absolute inset-0.5 border border-stone-900/20 pointer-events-none" />
        );
      case 'editorial_luxury':
        if (isBoard) return null;
        return (
          <>
            <span className="absolute top-0.5 left-0.5 text-[7px] font-mono text-stone-500 pointer-events-none leading-none">+</span>
            <span className="absolute top-0.5 right-0.5 text-[7px] font-mono text-stone-500 pointer-events-none leading-none">+</span>
            <span className="absolute bottom-0.5 left-0.5 text-[7px] font-mono text-stone-500 pointer-events-none leading-none">+</span>
            <span className="absolute bottom-0.5 right-0.5 text-[7px] font-mono text-stone-500 pointer-events-none leading-none">+</span>
          </>
        );
      case 'organic_floral':
        if (isBoard) return null;
        return (
          <>
            <div className="absolute top-0.5 left-0.5 text-[8px] text-emerald-900/70 pointer-events-none leading-none">❦</div>
            <div className="absolute top-0.5 right-0.5 text-[8px] text-emerald-900/70 pointer-events-none scale-x-[-1] leading-none">❦</div>
            <div className="absolute bottom-0.5 left-0.5 text-[8px] text-emerald-900/70 pointer-events-none scale-y-[-1] leading-none">❦</div>
            <div className="absolute bottom-0.5 right-0.5 text-[8px] text-emerald-900/70 pointer-events-none scale-[-1] leading-none">❦</div>
          </>
        );
      case 'classic_loteria':
      default:
        // Pure classic Mexican Loteria black line frame (like "LA DAMA")
        return null;
    }
  };

  const handleImageInteraction = async (e: React.MouseEvent<HTMLImageElement>) => {
    if (!isEyedropperActive || !onPickColor) return;
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const relX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const relY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    const picked = await samplePixelColor(card.image, relX, relY);
    if (picked) {
      onPickColor(picked);
    }
  };

  const topNumberClearance =
    !isCoverCard &&
    style.namePosition === 'bottom' &&
    (style.numberPosition === 'top-left' || style.numberPosition === 'top-right')
      ? isBoard
        ? 'pt-2'
        : isGrid
        ? 'pt-4 sm:pt-5'
        : 'pt-6 sm:pt-7'
      : isBoard
      ? 'pt-0.5'
      : 'pt-1.5';

  const bottomNumberClearance =
    !isCoverCard &&
    style.namePosition === 'top' &&
    (style.numberPosition === 'bottom-left' || style.numberPosition === 'bottom-right')
      ? isBoard
        ? 'pb-2'
        : isGrid
        ? 'pb-4 sm:pb-5'
        : 'pb-6 sm:pb-7'
      : isBoard
      ? 'pb-0.5'
      : 'pb-1';

  const featherStyle: React.CSSProperties | undefined = shouldFeather
    ? {
        WebkitMaskImage:
          'linear-gradient(to right, transparent 0%, black 3.5%, black 96.5%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 3.5%, black 96.5%, transparent 100%)',
        WebkitMaskComposite: 'source-in',
        maskImage:
          'linear-gradient(to right, transparent 0%, black 3.5%, black 96.5%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 3.5%, black 96.5%, transparent 100%)',
        maskComposite: 'intersect',
      }
    : undefined;

  return (
    <div
      onClick={() => {
        if (!isEyedropperActive && onClick) onClick();
      }}
      className={`relative bg-white select-none transition-transform duration-150 overflow-hidden ${
        isBoard
          ? 'p-[2.5px] border-[0.5px] border-stone-300 rounded-[2px] shadow-none'
          : isGrid
          ? 'p-1.5 sm:p-2 rounded-lg border border-stone-300 shadow-2xs hover:shadow-xs'
          : 'p-2.5 sm:p-3.5 rounded-xl border border-stone-300 shadow-xs'
      } aspect-[3/4] ${isEyedropperActive ? 'cursor-crosshair ring-2 ring-amber-500' : ''} ${className}`}
    >
      {/* Inner Black-Bordered Frame filled with the absorbed card background color */}
      <div
        style={{ backgroundColor: innerBgColor }}
        className={`relative w-full h-full flex flex-col items-center justify-between overflow-hidden ${getInnerFrameClass()}`}
      >
        {renderOptionalInnerAccents()}

        {/* Card Number inside the black frame (hidden on Cover / Portada card #0) */}
        {!isCoverCard && (
          <span
            style={{ color: effectiveTextColor }}
            className={`absolute ${getNumberClass()} font-loteria-title z-20 pointer-events-none ${getNumberFontSize()}`}
          >
            {card.number}
          </span>
        )}

        {/* Zone 1 (Optional Name at Top inside the black frame) */}
        {style.namePosition === 'top' && (
          <div
            className={`w-full text-center z-10 shrink-0 ${
              isBoard
                ? 'pt-0.5 pb-0 px-1'
                : isGrid
                ? 'pt-1 sm:pt-1.5 pb-0.5 px-2'
                : 'pt-2 sm:pt-2.5 pb-0.5 px-4'
            }`}
          >
            <h4
              style={{ color: effectiveTextColor }}
              className={`font-loteria-card font-bold uppercase break-normal whitespace-normal ${getNameFontSize()}`}
            >
              {card.name}
            </h4>
            {style.showTaglineOnCard && !isBoard && card.tagline && (
              <p
                style={{ color: effectiveTextColor }}
                className="text-[9px] sm:text-[10px] opacity-75 italic line-clamp-1 mt-0.5 font-serif"
              >
                {card.tagline}
              </p>
            )}
          </div>
        )}

        {/* Zone 2: Dedicated Central Illustration Area (never overlapped by number or name) */}
        <div
          className={`flex-1 w-full min-h-0 relative flex items-center justify-center overflow-hidden z-10 ${topNumberClearance} ${bottomNumberClearance} ${
            isBoard ? 'px-0.5' : isGrid ? 'px-1.5' : 'px-2.5'
          }`}
        >
          <img
            src={card.image}
            alt={card.name}
            onClick={handleImageInteraction}
            style={featherStyle}
            className={`max-w-full max-h-full w-auto h-auto object-contain select-none ${
              isEyedropperActive ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'
            }`}
            loading="lazy"
          />
        </div>

        {/* Zone 3: Dedicated Bottom Name Area inside the black frame over the unified background */}
        {style.namePosition === 'bottom' && (
          <div
            className={`w-full text-center z-10 shrink-0 ${
              isBoard
                ? 'pt-0 pb-0.5 px-0.5'
                : isGrid
                ? 'pt-0.5 pb-1 sm:pb-1.5 px-2'
                : 'pt-0.5 pb-2 sm:pb-2.5 px-4'
            }`}
          >
            <h4
              style={{ color: effectiveTextColor }}
              className={`font-loteria-card font-bold uppercase break-normal whitespace-normal ${getNameFontSize()}`}
            >
              {card.name}
            </h4>
            {style.showTaglineOnCard && !isBoard && card.tagline && (
              <p
                style={{ color: effectiveTextColor }}
                className="text-[9px] sm:text-[10px] opacity-75 italic line-clamp-1 mt-0.5 font-serif"
              >
                {card.tagline}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

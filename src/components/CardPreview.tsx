import React from 'react';
import { LoteriaCard, CardStyleConfig } from '../types/loteria';

export type CardPreviewVariant = 'board' | 'grid' | 'full';

interface CardPreviewProps {
  card: LoteriaCard;
  style: CardStyleConfig;
  className?: string;
  onClick?: () => void;
  isCompactTable?: boolean; // Kept for backwards compatibility
  variant?: CardPreviewVariant;
}

export const CardPreview: React.FC<CardPreviewProps> = ({
  card,
  style,
  className = '',
  onClick,
  isCompactTable = false,
  variant
}) => {
  // Determine effective variant
  const effectiveVariant: CardPreviewVariant = variant || (isCompactTable ? 'board' : 'full');
  const isBoard = effectiveVariant === 'board';
  const isGrid = effectiveVariant === 'grid';

  const getNumberClass = () => {
    switch (style.numberPosition) {
      case 'top-right':
        return isBoard ? 'top-0.5 right-1' : isGrid ? 'top-1.5 right-1.5' : 'top-2 right-2.5';
      case 'bottom-left':
        return isBoard ? 'bottom-0.5 left-1' : isGrid ? 'bottom-1.5 left-1.5' : 'bottom-2 left-2.5';
      case 'bottom-right':
        return isBoard ? 'bottom-0.5 right-1' : isGrid ? 'bottom-1.5 right-1.5' : 'bottom-2 right-2.5';
      case 'top-left':
      default:
        return isBoard ? 'top-0.5 left-1' : isGrid ? 'top-1.5 left-1.5' : 'top-2 left-2.5';
    }
  };

  const getNumberFontSize = () => {
    if (isBoard) {
      return 'text-[7px] font-bold leading-none bg-white/85 px-0.5 py-0.5 rounded-[2px]';
    }
    if (isGrid) {
      return 'text-xs sm:text-sm font-black bg-white/95 px-1.5 py-0.5 rounded shadow-2xs border border-stone-200/60 leading-none';
    }
    return 'text-sm sm:text-base font-black bg-white/90 px-1.5 py-0.5 rounded shadow-2xs border border-stone-200/60 leading-tight';
  };

  // Dynamic font size so names adapt cleanly without awkward linebreaks
  const getNameFontSize = () => {
    const len = card.name.length;
    if (isBoard) {
      if (len > 22) return 'text-[5.5px] leading-[1.05] tracking-tight';
      if (len > 16) return 'text-[6px] leading-[1.1] tracking-tight';
      if (len > 11) return 'text-[6.5px] leading-[1.15] tracking-tight';
      return 'text-[7.5px] leading-tight';
    } else if (isGrid) {
      if (len > 22) return 'text-[10px] sm:text-xs leading-tight tracking-tight';
      if (len > 15) return 'text-[11px] sm:text-xs md:text-sm leading-tight tracking-tight';
      return 'text-xs sm:text-sm md:text-base leading-snug font-bold';
    } else {
      if (len > 24) return 'text-xs leading-tight';
      if (len > 18) return 'text-sm leading-tight';
      return 'text-sm sm:text-base leading-snug';
    }
  };

  // Render Elaborate Decorative Frames
  const renderFrameDecorations = () => {
    switch (style.frameStyle) {
      case 'talavera':
        if (isBoard) {
          return (
            <>
              <div className="absolute inset-0.5 border border-stone-800/60 pointer-events-none rounded-[2px]" />
              <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 border-t border-l border-amber-800 pointer-events-none" />
              <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 border-t border-r border-amber-800 pointer-events-none" />
              <div className="absolute bottom-0.5 left-0.5 w-1.5 h-1.5 border-b border-l border-amber-800 pointer-events-none" />
              <div className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 border-b border-r border-amber-800 pointer-events-none" />
            </>
          );
        }
        return (
          <>
            {/* Double border */}
            <div className="absolute inset-1 border border-stone-800/80 pointer-events-none rounded" />
            <div className="absolute inset-2 border border-stone-800/30 pointer-events-none" />
            {/* Talavera corner flourishes */}
            <div className="absolute top-1 left-1 w-2.5 sm:w-3 h-2.5 sm:h-3 border-t-2 border-l-2 border-amber-800 pointer-events-none" />
            <div className="absolute top-1 right-1 w-2.5 sm:w-3 h-2.5 sm:h-3 border-t-2 border-r-2 border-amber-800 pointer-events-none" />
            <div className="absolute bottom-1 left-1 w-2.5 sm:w-3 h-2.5 sm:h-3 border-b-2 border-l-2 border-amber-800 pointer-events-none" />
            <div className="absolute bottom-1 right-1 w-2.5 sm:w-3 h-2.5 sm:h-3 border-b-2 border-r-2 border-amber-800 pointer-events-none" />
          </>
        );

      case 'botanical_litho':
        if (isBoard) {
          return (
            <>
              <div className="absolute inset-0.5 border border-stone-800/60 pointer-events-none" />
              <span className="absolute top-0.5 left-0.5 text-[5px] text-stone-700 pointer-events-none leading-none">✤</span>
              <span className="absolute top-0.5 right-0.5 text-[5px] text-stone-700 pointer-events-none leading-none">✤</span>
              <span className="absolute bottom-0.5 left-0.5 text-[5px] text-stone-700 pointer-events-none leading-none">✤</span>
              <span className="absolute bottom-0.5 right-0.5 text-[5px] text-stone-700 pointer-events-none leading-none">✤</span>
            </>
          );
        }
        return (
          <>
            <div className="absolute inset-1 sm:inset-1.5 border border-stone-900/70 pointer-events-none" />
            <div className="absolute inset-2 sm:inset-2.5 border border-stone-500/30 pointer-events-none" />
            {/* Corner rosettes */}
            <span className="absolute top-1 sm:top-1.5 left-1 sm:left-1.5 text-[7px] sm:text-[9px] text-stone-700 pointer-events-none leading-none">✤</span>
            <span className="absolute top-1 sm:top-1.5 right-1 sm:right-1.5 text-[7px] sm:text-[9px] text-stone-700 pointer-events-none leading-none">✤</span>
            <span className="absolute bottom-1 sm:bottom-1.5 left-1 sm:left-1.5 text-[7px] sm:text-[9px] text-stone-700 pointer-events-none leading-none">✤</span>
            <span className="absolute bottom-1 sm:bottom-1.5 right-1 sm:right-1.5 text-[7px] sm:text-[9px] text-stone-700 pointer-events-none leading-none">✤</span>
          </>
        );

      case 'editorial_luxury':
        if (isBoard) {
          return (
            <>
              <div className="absolute inset-0.5 border border-stone-300 pointer-events-none" />
              <span className="absolute top-0.5 left-0.5 text-[6px] font-mono text-stone-400 pointer-events-none leading-none">+</span>
              <span className="absolute top-0.5 right-0.5 text-[6px] font-mono text-stone-400 pointer-events-none leading-none">+</span>
              <span className="absolute bottom-0.5 left-0.5 text-[6px] font-mono text-stone-400 pointer-events-none leading-none">+</span>
              <span className="absolute bottom-0.5 right-0.5 text-[6px] font-mono text-stone-400 pointer-events-none leading-none">+</span>
            </>
          );
        }
        return (
          <>
            <div className="absolute inset-1 border border-stone-300 pointer-events-none" />
            {/* Corner registration crosshairs */}
            <span className="absolute top-1 left-1 text-[8px] sm:text-[10px] font-mono text-stone-400 pointer-events-none leading-none">+</span>
            <span className="absolute top-1 right-1 text-[8px] sm:text-[10px] font-mono text-stone-400 pointer-events-none leading-none">+</span>
            <span className="absolute bottom-1 left-1 text-[8px] sm:text-[10px] font-mono text-stone-400 pointer-events-none leading-none">+</span>
            <span className="absolute bottom-1 right-1 text-[8px] sm:text-[10px] font-mono text-stone-400 pointer-events-none leading-none">+</span>
          </>
        );

      case 'organic_floral':
        if (isBoard) {
          return (
            <>
              <div className="absolute inset-0.5 border border-emerald-900/50 rounded-[2px] pointer-events-none" />
              <div className="absolute top-0.5 left-0.5 text-[6px] text-emerald-800 pointer-events-none leading-none">❦</div>
              <div className="absolute top-0.5 right-0.5 text-[6px] text-emerald-800 pointer-events-none scale-x-[-1] leading-none">❦</div>
              <div className="absolute bottom-0.5 left-0.5 text-[6px] text-emerald-800 pointer-events-none scale-y-[-1] leading-none">❦</div>
              <div className="absolute bottom-0.5 right-0.5 text-[6px] text-emerald-800 pointer-events-none scale-[-1] leading-none">❦</div>
            </>
          );
        }
        return (
          <>
            <div className="absolute inset-1 sm:inset-1.5 border border-emerald-900/60 rounded-md pointer-events-none" />
            <div className="absolute top-1 left-1 text-[9px] sm:text-[11px] text-emerald-800 pointer-events-none leading-none">❦</div>
            <div className="absolute top-1 right-1 text-[9px] sm:text-[11px] text-emerald-800 pointer-events-none scale-x-[-1] leading-none">❦</div>
            <div className="absolute bottom-1 left-1 text-[9px] sm:text-[11px] text-emerald-800 pointer-events-none scale-y-[-1] leading-none">❦</div>
            <div className="absolute bottom-1 right-1 text-[9px] sm:text-[11px] text-emerald-800 pointer-events-none scale-[-1] leading-none">❦</div>
          </>
        );

      case 'classic_loteria':
      default:
        if (isBoard) {
          return (
            <>
              <div className="absolute inset-0.5 border border-stone-900 pointer-events-none" />
              <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-amber-700 rotate-45 pointer-events-none" />
              <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-amber-700 rotate-45 pointer-events-none" />
              <div className="absolute bottom-0.5 left-0.5 w-1 h-1 bg-amber-700 rotate-45 pointer-events-none" />
              <div className="absolute bottom-0.5 right-0.5 w-1 h-1 bg-amber-700 rotate-45 pointer-events-none" />
            </>
          );
        }
        return (
          <>
            <div className="absolute inset-1 sm:inset-1.5 border-2 border-stone-900 pointer-events-none" />
            {/* Diamond Corner Accents */}
            <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 w-1.5 h-1.5 bg-amber-700 rotate-45 pointer-events-none" />
            <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 w-1.5 h-1.5 bg-amber-700 rotate-45 pointer-events-none" />
            <div className="absolute bottom-1.5 sm:bottom-2 left-1.5 sm:left-2 w-1.5 h-1.5 bg-amber-700 rotate-45 pointer-events-none" />
            <div className="absolute bottom-1.5 sm:bottom-2 right-1.5 sm:right-2 w-1.5 h-1.5 bg-amber-700 rotate-45 pointer-events-none" />
          </>
        );
    }
  };

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: style.cardBgColor,
        borderColor: style.borderColor
      }}
      className={`relative flex flex-col items-center justify-between select-none transition-transform duration-150 overflow-hidden ${
        isBoard
          ? 'p-0.5 border-[0.75px] rounded-xs shadow-none'
          : isGrid
          ? 'p-1.5 sm:p-2 rounded-xl border-[1.5px] shadow-2xs hover:shadow-xs'
          : 'p-2.5 sm:p-3 rounded-2xl border-2 shadow-xs'
      } aspect-[3/4] ${className}`}
    >
      {/* Decorative Frame Elements */}
      {renderFrameDecorations()}

      {/* Card Number */}
      <span
        style={{ color: style.textColor }}
        className={`absolute ${getNumberClass()} font-loteria-title z-20 ${getNumberFontSize()}`}
      >
        {card.number}
      </span>

      {/* Name Top (if selected) */}
      {style.namePosition === 'top' && (
        <div
          className={`w-full text-center z-10 ${
            isBoard
              ? `pt-0.5 pb-0 ${style.numberPosition === 'top-right' ? 'pr-2.5 pl-0.5' : style.numberPosition === 'top-left' ? 'pl-2.5 pr-0.5' : 'px-0.5'}`
              : isGrid
              ? `pt-1 sm:pt-1.5 pb-0.5 ${style.numberPosition === 'top-right' ? 'pr-7 pl-1.5' : style.numberPosition === 'top-left' ? 'pl-7 pr-1.5' : 'px-2'}`
              : `pt-2 sm:pt-2.5 pb-1 ${style.numberPosition === 'top-right' ? 'pr-9 pl-3' : style.numberPosition === 'top-left' ? 'pl-9 pr-3' : 'px-4'}`
          }`}
        >
          <h4
            style={{ color: style.textColor }}
            className={`font-loteria-card font-bold tracking-tight uppercase break-normal whitespace-normal ${getNameFontSize()}`}
          >
            {card.name}
          </h4>
          {/* Optional Tagline when name is on top */}
          {style.showTaglineOnCard && !isBoard && card.tagline && (
            <p className="text-[9px] sm:text-[10px] text-stone-500 italic line-clamp-1 mt-0.5 font-serif">
              {card.tagline}
            </p>
          )}
        </div>
      )}

      {/* Card Image */}
      <div className={`flex-1 w-full min-h-0 relative flex items-center justify-center overflow-hidden z-10 ${
        isBoard ? 'p-0.5 my-0' : isGrid ? 'p-1 sm:p-1.5 my-0.5' : 'p-1 sm:p-2 my-0.5'
      }`}>
        <img
          src={card.image}
          alt={card.name}
          className="w-full h-full object-contain rounded drop-shadow-xs pointer-events-none"
          loading="lazy"
        />
      </div>

      {/* Name Bottom (if selected) - Multi-line adaptable, never sliced mid-word */}
      {style.namePosition === 'bottom' && (
        <div
          className={`w-full text-center z-10 ${
            isBoard
              ? `pt-0 pb-0.5 ${style.numberPosition === 'bottom-right' ? 'pr-2.5 pl-0.5' : style.numberPosition === 'bottom-left' ? 'pl-2.5 pr-0.5' : 'px-0.5'}`
              : isGrid
              ? `pt-0.5 pb-1 sm:pb-1.5 ${style.numberPosition === 'bottom-right' ? 'pr-7 pl-1.5' : style.numberPosition === 'bottom-left' ? 'pl-7 pr-1.5' : 'px-2'}`
              : `pt-0.5 pb-2 sm:pb-2.5 ${style.numberPosition === 'bottom-right' ? 'pr-9 pl-3' : style.numberPosition === 'bottom-left' ? 'pl-9 pr-3' : 'px-4'}`
          }`}
        >
          <h4
            style={{ color: style.textColor }}
            className={`font-loteria-card font-bold tracking-tight uppercase break-normal whitespace-normal ${getNameFontSize()}`}
          >
            {card.name}
          </h4>
          {/* Optional Tagline */}
          {style.showTaglineOnCard && !isBoard && card.tagline && (
            <p className="text-[9px] sm:text-[10px] text-stone-500 italic line-clamp-1 mt-0.5 font-serif">
              {card.tagline}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

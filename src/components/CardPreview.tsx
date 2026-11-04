import React from 'react';
import { LoteriaCard, CardStyleConfig } from '../types/loteria';

interface CardPreviewProps {
  card: LoteriaCard;
  style: CardStyleConfig;
  className?: string;
  onClick?: () => void;
  isCompactTable?: boolean; // When rendered inside a board grid
}

export const CardPreview: React.FC<CardPreviewProps> = ({
  card,
  style,
  className = '',
  onClick,
  isCompactTable = false
}) => {
  const getNumberClass = () => {
    switch (style.numberPosition) {
      case 'top-right':
        return isCompactTable ? 'top-1 right-1.5' : 'top-2 right-2.5';
      case 'bottom-left':
        return isCompactTable ? 'bottom-1 left-1.5' : 'bottom-2 left-2.5';
      case 'bottom-right':
        return isCompactTable ? 'bottom-1 right-1.5' : 'bottom-2 right-2.5';
      case 'top-left':
      default:
        return isCompactTable ? 'top-1 left-1.5' : 'top-2 left-2.5';
    }
  };

  // Dynamic font size so names NEVER get truncated and always adapt
  const getNameFontSize = () => {
    const len = card.name.length;
    if (isCompactTable) {
      if (len > 22) return 'text-[8px] leading-tight';
      if (len > 16) return 'text-[9px] leading-tight';
      return 'text-[10px] leading-tight';
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
        return (
          <>
            {/* Double border */}
            <div className="absolute inset-1 border border-stone-800/80 pointer-events-none rounded" />
            <div className="absolute inset-2 border border-stone-800/30 pointer-events-none" />
            {/* Talavera corner flourishes */}
            <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-amber-800 pointer-events-none" />
            <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-amber-800 pointer-events-none" />
            <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-amber-800 pointer-events-none" />
            <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-amber-800 pointer-events-none" />
          </>
        );

      case 'botanical_litho':
        return (
          <>
            <div className="absolute inset-1.5 border border-stone-900/70 pointer-events-none" />
            <div className="absolute inset-2.5 border border-stone-500/30 pointer-events-none" />
            {/* Corner rosettes */}
            <span className="absolute top-1.5 left-1.5 text-[8px] text-stone-700 pointer-events-none">✤</span>
            <span className="absolute top-1.5 right-1.5 text-[8px] text-stone-700 pointer-events-none">✤</span>
            <span className="absolute bottom-1.5 left-1.5 text-[8px] text-stone-700 pointer-events-none">✤</span>
            <span className="absolute bottom-1.5 right-1.5 text-[8px] text-stone-700 pointer-events-none">✤</span>
          </>
        );

      case 'editorial_luxury':
        return (
          <>
            <div className="absolute inset-1 border border-stone-300 pointer-events-none" />
            {/* Corner registration crosshairs */}
            <span className="absolute top-1 left-1 text-[9px] font-mono text-stone-400 pointer-events-none leading-none">+</span>
            <span className="absolute top-1 right-1 text-[9px] font-mono text-stone-400 pointer-events-none leading-none">+</span>
            <span className="absolute bottom-1 left-1 text-[9px] font-mono text-stone-400 pointer-events-none leading-none">+</span>
            <span className="absolute bottom-1 right-1 text-[9px] font-mono text-stone-400 pointer-events-none leading-none">+</span>
          </>
        );

      case 'organic_floral':
        return (
          <>
            <div className="absolute inset-1.5 border border-emerald-900/60 rounded-md pointer-events-none" />
            <div className="absolute top-1 left-1 text-[10px] text-emerald-800 pointer-events-none">❦</div>
            <div className="absolute top-1 right-1 text-[10px] text-emerald-800 pointer-events-none scale-x-[-1]">❦</div>
            <div className="absolute bottom-1 left-1 text-[10px] text-emerald-800 pointer-events-none scale-y-[-1]">❦</div>
            <div className="absolute bottom-1 right-1 text-[10px] text-emerald-800 pointer-events-none scale-[-1]">❦</div>
          </>
        );

      case 'classic_loteria':
      default:
        return (
          <>
            <div className="absolute inset-1.5 border-2 border-stone-900 pointer-events-none" />
            {/* Diamond Corner Accents */}
            <div className="absolute top-2 left-2 w-1.5 h-1.5 bg-amber-700 rotate-45 pointer-events-none" />
            <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-amber-700 rotate-45 pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-1.5 h-1.5 bg-amber-700 rotate-45 pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-1.5 h-1.5 bg-amber-700 rotate-45 pointer-events-none" />
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
      className={`relative flex flex-col items-center justify-between p-2.5 rounded-lg aspect-[3/4] select-none transition-transform duration-150 border-2 shadow-xs overflow-hidden ${className}`}
    >
      {/* Decorative Frame Elements */}
      {renderFrameDecorations()}

      {/* Card Number */}
      <span
        style={{ color: style.textColor }}
        className={`absolute ${getNumberClass()} font-loteria-title ${
          isCompactTable ? 'text-xs font-black' : 'text-sm sm:text-base font-black'
        } z-20 bg-white/90 px-1 py-0.2 rounded shadow-2xs border border-stone-200/60`}
      >
        {card.number}
      </span>

      {/* Name Top (if selected) */}
      {style.namePosition === 'top' && (
        <div className={`w-full text-center px-4 z-10 ${isCompactTable ? 'pt-0.5 pb-0' : 'pt-1 pb-1'}`}>
          <h4
            style={{ color: style.textColor }}
            className={`font-loteria-card font-bold tracking-tight uppercase break-words ${getNameFontSize()}`}
          >
            {card.name}
          </h4>
        </div>
      )}

      {/* Card Image */}
      <div className="flex-1 w-full min-h-0 relative flex items-center justify-center p-1 my-0.5 overflow-hidden z-10">
        <img
          src={card.image}
          alt={card.name}
          className="w-full h-full object-contain rounded drop-shadow-xs pointer-events-none"
          loading="lazy"
        />
      </div>

      {/* Name Bottom (if selected) - Multi-line adaptable, never truncated */}
      {style.namePosition === 'bottom' && (
        <div className={`w-full text-center px-2 z-10 ${isCompactTable ? 'pt-0 pb-0.5' : 'pt-0.5 pb-1'}`}>
          <h4
            style={{ color: style.textColor }}
            className={`font-loteria-card font-bold tracking-tight uppercase break-words ${getNameFontSize()}`}
          >
            {card.name}
          </h4>
          {/* Optional Tagline */}
          {style.showTaglineOnCard && !isCompactTable && card.tagline && (
            <p className="text-[10px] text-stone-500 italic line-clamp-1 mt-0.5">{card.tagline}</p>
          )}
        </div>
      )}
    </div>
  );
};

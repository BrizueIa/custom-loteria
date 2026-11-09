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
  outerMarginColor?: string;
  isFlush?: boolean;
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
  outerMarginColor,
  isFlush = false,
}) => {
  // Determine effective variant
  const effectiveVariant: CardPreviewVariant = variant || (isCompactTable ? 'board' : 'full');
  const isBoard = effectiveVariant === 'board';
  const isGrid = effectiveVariant === 'grid';

  const marginMode = style.cardOuterMarginMode || 'solid';
  const effectiveFlush = isFlush || marginMode === 'flush';

  const outerBg =
    marginMode === 'match_board'
      ? (isBoard ? (outerMarginColor || style.cardOuterMarginColor || '#FFFFFF') : (style.cardOuterMarginColor || '#FFFFFF'))
      : (style.cardOuterMarginColor || outerMarginColor || '#FFFFFF');

  // Outer perimeter border that delimits the card (default is subtle gray #D6D3D1)
  const borderChoice = style.cardOuterBorderColor ?? '#D6D3D1';
  const hasOuterBorder = borderChoice !== 'none';
  const effectiveOuterBorderColor = hasOuterBorder ? borderChoice : 'transparent';

  // Corner radius calculation (concentric outer and inner radii)
  const cornerRadius = style.cardCornerRadius || 'none';

  const getOuterRadiusClass = () => {
    if (cornerRadius === 'none') return 'rounded-none';
    if (isBoard) {
      if (cornerRadius === 'sm') return 'rounded-[2px]';
      if (cornerRadius === 'md') return 'rounded-[4px]';
      return 'rounded-[6px]';
    }
    if (isGrid) {
      if (cornerRadius === 'sm') return 'rounded-sm';
      if (cornerRadius === 'md') return 'rounded-md';
      return 'rounded-xl';
    }
    // full preview
    if (cornerRadius === 'sm') return 'rounded-lg';
    if (cornerRadius === 'md') return 'rounded-2xl';
    return 'rounded-3xl';
  };

  const getInnerRadiusClass = () => {
    if (cornerRadius === 'none') return 'rounded-none';
    if (isBoard) {
      if (cornerRadius === 'sm') return 'rounded-[1px]';
      if (cornerRadius === 'md') return 'rounded-[2px]';
      return 'rounded-[4px]';
    }
    if (isGrid) {
      if (cornerRadius === 'sm') return 'rounded-[2px]';
      if (cornerRadius === 'md') return 'rounded-sm';
      return 'rounded-lg';
    }
    // full preview
    if (cornerRadius === 'sm') return 'rounded-md';
    if (cornerRadius === 'md') return 'rounded-xl';
    return 'rounded-2xl';
  };

  // Per-card unified background color inside the black frame
  const innerBgColor = card.backgroundColor || style.cardBgColor || '#FFFFFF';
  const effectiveTextColor = getContrastingTextColor(innerBgColor, style.textColor);
  const shouldFeather = card.featherEdges !== false && !isSvgDataUrl(card.image);
  const isCoverCard = card.number === 0 || Boolean(card.isCover);

  const getNumberClass = () => {
    switch (style.numberPosition) {
      case 'top-right':
        return isBoard ? 'top-0.5 right-1' : isGrid ? 'top-1 right-1' : 'top-1.5 right-2.5';
      case 'bottom-left':
        return isBoard ? 'bottom-0.5 left-1' : isGrid ? 'bottom-1 left-1' : 'bottom-1.5 left-2.5';
      case 'bottom-right':
        return isBoard ? 'bottom-0.5 right-1' : isGrid ? 'bottom-1 right-1' : 'bottom-1.5 right-2.5';
      case 'top-left':
      default:
        return isBoard ? 'top-0.5 left-1' : isGrid ? 'top-1 left-1' : 'top-1.5 left-2.5';
    }
  };

  const getNumberFontSize = () => {
    if (isBoard) {
      return 'text-[7.5px] font-black leading-none';
    }
    if (isGrid) {
      return 'text-[8.5px] sm:text-[10px] font-black leading-none';
    }
    return 'text-base sm:text-lg font-black leading-none';
  };

  const getLogoPositionClass = () => {
    const pos = style.logo?.position || 'top-right';
    switch (pos) {
      case 'top-left':
        return isBoard ? 'top-0.5 left-0.5' : isGrid ? 'top-1 left-1' : 'top-1.5 left-1.5';
      case 'top-right':
        return isBoard ? 'top-0.5 right-0.5' : isGrid ? 'top-1 right-1' : 'top-1.5 right-1.5';
      case 'bottom-left':
        return isBoard ? 'bottom-0.5 left-0.5' : isGrid ? 'bottom-1 left-1' : 'bottom-1.5 left-1.5';
      case 'bottom-right':
        return isBoard ? 'bottom-0.5 right-0.5' : isGrid ? 'bottom-1 right-1' : 'bottom-1.5 right-1.5';
    }
  };

  const getLogoScale = () => {
    if (style.logo?.scale !== undefined && style.logo.scale > 0) {
      return style.logo.scale;
    }
    const sz = style.logo?.size || 'sm';
    switch (sz) {
      case 'xs':
        return 0.08;
      case 'sm':
        return 0.11;
      case 'lg':
        return 0.20;
      case 'md':
      default:
        return 0.15;
    }
  };

  const getLogoSizeClass = () => {
    const sz = style.logo?.size || 'sm';
    if (isBoard) {
      if (sz === 'xs') return 'w-2 h-2';
      if (sz === 'sm') return 'w-2.5 h-2.5';
      if (sz === 'lg') return 'w-4 h-4';
      return 'w-3 h-3';
    }
    if (isGrid) {
      if (sz === 'xs') return 'w-3 h-3';
      if (sz === 'sm') return 'w-4 h-4';
      if (sz === 'lg') return 'w-6 h-6';
      return 'w-5 h-5';
    }
    if (sz === 'xs') return 'w-5 h-5 sm:w-6 sm:h-6';
    if (sz === 'sm') return 'w-7 h-7 sm:w-8 sm:h-8';
    if (sz === 'lg') return 'w-12 h-12 sm:w-13 sm:h-13';
    return 'w-9 h-9 sm:w-10 sm:h-10';
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
      if (len > 22) return 'text-[6.5px] sm:text-[7.5px] leading-[1.1] tracking-tight';
      if (len > 15) return 'text-[7.5px] sm:text-[8.5px] leading-[1.1] tracking-tight';
      if (len > 10) return 'text-[8.5px] sm:text-[9.5px] leading-tight tracking-normal font-bold';
      return 'text-[9.5px] sm:text-[10.5px] leading-tight font-extrabold tracking-normal';
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
        ? 'pt-2.5 sm:pt-3'
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
        ? 'pb-2.5 sm:pb-3'
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
      style={{
        backgroundColor: outerBg,
        borderColor: hasOuterBorder ? effectiveOuterBorderColor : undefined,
        padding: isBoard ? (effectiveFlush ? '0px' : '4.5%') : undefined,
      }}
      className={`relative ${outerBg === '#FFFFFF' ? 'bg-white' : ''} select-none transition-transform duration-150 overflow-hidden ${
        isBoard
          ? effectiveFlush
            ? `p-0 ${hasOuterBorder ? 'border' : 'border-0'} ${getOuterRadiusClass()} shadow-none`
            : `${hasOuterBorder ? 'border' : 'border-0'} ${getOuterRadiusClass()} shadow-none`
          : isGrid
          ? effectiveFlush
            ? `p-0 ${getOuterRadiusClass()} ${hasOuterBorder ? 'border' : 'border-0'} shadow-2xs hover:shadow-xs`
            : `p-1.5 sm:p-2 ${getOuterRadiusClass()} ${hasOuterBorder ? 'border' : 'border-0'} shadow-2xs hover:shadow-xs`
          : effectiveFlush
          ? `p-0 ${getOuterRadiusClass()} ${hasOuterBorder ? 'border' : 'border-0'} ${hasOuterBorder ? 'shadow-xs' : 'shadow-2xs'}`
          : `p-2.5 sm:p-3.5 ${getOuterRadiusClass()} ${hasOuterBorder ? 'border' : 'border-0'} ${hasOuterBorder ? 'shadow-xs' : 'shadow-2xs'}`
      } aspect-[3/4] ${isEyedropperActive ? 'cursor-crosshair ring-2 ring-amber-500' : ''} ${className}`}
    >
      {/* Inner Black-Bordered Frame filled with the absorbed card background color */}
      <div
        style={{
          backgroundColor: innerBgColor,
          borderColor: style.borderColor || undefined,
        }}
        className={`relative w-full h-full flex flex-col items-center justify-between overflow-hidden ${getInnerRadiusClass()} ${getInnerFrameClass()}`}
      >
        {renderOptionalInnerAccents()}

        {/* Optional Logo in selected corner */}
        {style.logo?.enabled && style.logo.image && (
          <div
            style={{
              opacity: style.logo.opacity ?? 1,
              width: `${getLogoScale() * 100}%`,
              maxWidth: `${getLogoScale() * 100}%`,
            }}
            className={`absolute ${getLogoPositionClass()} ${getLogoSizeClass()} z-25 pointer-events-none flex items-center justify-center p-0.5`}
          >
            <img
              src={style.logo.image}
              alt="Logo"
              className="w-full h-auto max-h-full object-contain"
            />
          </div>
        )}

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
                ? 'pt-0.5 sm:pt-1 pb-0.5 px-1'
                : 'pt-2 sm:pt-2.5 pb-0.5 px-4'
            }`}
          >
            <h4
              style={{ color: effectiveTextColor }}
              className={`font-loteria-card font-bold uppercase break-words line-clamp-2 max-w-full text-center ${getNameFontSize()}`}
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
            isBoard ? 'px-0.5' : isGrid ? 'px-0.5' : 'px-2.5'
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
                ? 'pt-0 pb-0.5 sm:pb-1 px-1'
                : 'pt-0.5 pb-2 sm:pb-2.5 px-4'
            }`}
          >
            <h4
              style={{ color: effectiveTextColor }}
              className={`font-loteria-card font-bold uppercase break-words line-clamp-2 max-w-full text-center ${getNameFontSize()}`}
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

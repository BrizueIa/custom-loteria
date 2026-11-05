import React, { useState } from 'react';
import { BoardConfig, LoteriaCard, CardStyleConfig, GeneratedBoard, BoardFrameStyle } from '../types/loteria';
import { generateBoards } from '../utils/loteriaEngine';
import { CardPreview } from './CardPreview';
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Check,
  LayoutTemplate,
  Palette,
  Info,
  Type,
  Grid,
  Layers,
  RefreshCw,
  Play
} from 'lucide-react';
import { useLanguage, TranslationKey } from '../i18n/LanguageContext';

interface BoardGeneratorSettingsProps {
  cards: LoteriaCard[];
  cardStyle: CardStyleConfig;
  config: BoardConfig;
  boards?: GeneratedBoard[];
  onUpdateBoards?: (boards: GeneratedBoard[]) => void;
  onRegenerateBoards?: () => void;
  onChangeConfig: (newConfig: BoardConfig) => void;
  onBack: () => void;
  onNext: () => void;
  onGoToGame: () => void;
  initialTourDone?: boolean;
  onCompleteInitialTour?: () => void;
}

const BOARD_COLOR_PALETTES = [
  { hex: '#164E3D', label: 'Verde Tradicional' },
  { hex: '#991B1B', label: 'Rojo Patrio' },
  { hex: '#1E3A8A', label: 'Azul Talavera' },
  { hex: '#B45309', label: 'Ocre Dorado' },
  { hex: '#7C2D12', label: 'Barro Cocido' },
  { hex: '#1C1917', label: 'Negro Carbón' },
];

export const BoardGeneratorSettings: React.FC<BoardGeneratorSettingsProps> = ({
  cards,
  cardStyle,
  config,
  boards,
  onUpdateBoards,
  onRegenerateBoards,
  onChangeConfig,
  onBack,
  onNext,
  onGoToGame,
  initialTourDone = false,
  onCompleteInitialTour,
}) => {
  const { t, language } = useLanguage();
  const [localBoards, setLocalBoards] = useState<GeneratedBoard[]>(() => {
    return generateBoards(cards, config);
  });
  const generatedBoards = boards && boards.length > 0 ? boards : localBoards;

  const updateBoards = (newBoards: GeneratedBoard[]) => {
    if (onUpdateBoards) {
      onUpdateBoards(newBoards);
    } else {
      setLocalBoards(newBoards);
    }
  };

  const [previewBoardIndex, setPreviewBoardIndex] = useState<number>(0);

  // Top header collapsible state
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);

  // Auto-collapsing accordion section state - Starts with 'header' open for guided wizard on first time
  const [autoGuidedStep, setAutoGuidedStep] = useState<'header' | 'frame' | 'color' | 'grid' | null>(
    initialTourDone ? null : 'header'
  );
  const [openSection, setOpenSection] = useState<'header' | 'frame' | 'color' | 'grid' | null>(
    initialTourDone ? null : 'header'
  );

  const toggleSection = (s: 'header' | 'frame' | 'color' | 'grid') => {
    if (openSection === s) {
      setOpenSection(null);
    } else {
      setOpenSection(s);
    }
    // Any manual click on a section header disables auto-advancing (enters exploration mode)
    setAutoGuidedStep(null);
  };

  const handleNextHeader = () => {
    if (autoGuidedStep === 'header') {
      setOpenSection('frame');
      setAutoGuidedStep('frame');
    } else {
      setOpenSection(null);
    }
  };

  const handleSelectBoardFrame = (frameId: BoardFrameStyle) => {
    onChangeConfig({ ...config, boardFrameStyle: frameId });
    if (autoGuidedStep === 'frame') {
      setOpenSection('color');
      setAutoGuidedStep('color');
    }
    // In exploration mode, section remains open for live preview
  };

  const handleSelectBoardColor = (hex: string) => {
    onChangeConfig({ ...config, boardBorderColor: hex });
    if (autoGuidedStep === 'color') {
      setOpenSection('grid');
      setAutoGuidedStep('grid');
    }
    // In exploration mode, section remains open for live preview
  };

  const handleSelectGridPreset = (p: { rows: number; cols: number }) => {
    const updated = { ...config, rows: p.rows, cols: p.cols };
    onChangeConfig(updated);
    try {
      updateBoards(generateBoards(cards, updated));
    } catch (err: any) {
      alert(err.message);
    }
    if (autoGuidedStep === 'grid') {
      setOpenSection(null);
      setAutoGuidedStep(null);
      onCompleteInitialTour?.();
    }
    // In exploration mode, section remains open for live preview
  };

  const presets = [
    { label: `3 × 3 (9 ${t('cards').toLowerCase()})`, rows: 3, cols: 3 },
    { label: `4 × 4 (16 ${t('cards').toLowerCase()} - ${language === 'en' ? 'Standard' : 'Estándar'})`, rows: 4, cols: 4 },
    { label: `4 × 5 (20 ${t('cards').toLowerCase()})`, rows: 4, cols: 5 },
    { label: `5 × 5 (25 ${t('cards').toLowerCase()})`, rows: 5, cols: 5 },
  ];

  const frameOptions: {
    id: BoardFrameStyle;
    nameKey: TranslationKey;
    descKey: TranslationKey;
  }[] = [
    {
      id: 'traditional_gallo',
      nameKey: 'frame_traditional_gallo',
      descKey: 'frame_traditional_gallo_desc',
    },
    {
      id: 'festive_banner',
      nameKey: 'frame_festive_banner',
      descKey: 'frame_festive_banner_desc',
    },
    {
      id: 'talavera_frame',
      nameKey: 'frame_talavera_board',
      descKey: 'frame_talavera_board_desc',
    },
    {
      id: 'clean_minimal',
      nameKey: 'frame_clean_minimal',
      descKey: 'frame_clean_minimal_desc',
    },
    {
      id: 'none',
      nameKey: 'frame_none_board',
      descKey: 'frame_none_board_desc',
    },
  ];

  const handleRegenerate = () => {
    if (onRegenerateBoards) {
      onRegenerateBoards();
      setPreviewBoardIndex(0);
    } else {
      try {
        const b = generateBoards(cards, config);
        updateBoards(b);
        setPreviewBoardIndex(0);
      } catch (e: any) {
        alert(e.message || 'Error');
      }
    }
  };

  const currentPreviewBoard = generatedBoards[previewBoardIndex] || generatedBoards[0];
  const activeFrameStyle = config.boardFrameStyle || 'traditional_gallo';
  const activeBorderColor = config.boardBorderColor || '#164E3D';

  const activePalette =
    BOARD_COLOR_PALETTES.find((p) => p.hex.toLowerCase() === activeBorderColor.toLowerCase()) || {
      hex: activeBorderColor,
      label: language === 'en' ? 'Custom' : 'Personalizado',
    };
  const activeFrame = frameOptions.find((f) => f.id === activeFrameStyle) || frameOptions[0];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-3 pb-24 px-1 sm:px-2">
      {/* 1. Header Collapsible Strip */}
      {!isHeaderCollapsed ? (
        <div className="bg-white border border-stone-200/90 rounded-2xl p-3 sm:p-4 shadow-2xs flex items-center justify-between gap-2 transition-all">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs sm:text-sm font-bold text-stone-900 leading-tight">
                3. {language === 'en' ? 'Boards Configuration' : 'Configuración de Tablas'}
              </h3>
              <button
                type="button"
                onClick={() => setIsHeaderCollapsed(true)}
                className="text-stone-400 hover:text-stone-700 p-0.5 rounded hover:bg-stone-100 transition-colors cursor-pointer"
                title="Ocultar cabecera"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-stone-500 mt-0.5 leading-tight truncate">
              {language === 'en' ? 'Customize board title, frame and grid' : 'Personaliza título, marco y cuadrícula'}
            </p>
          </div>

          <button
            onClick={onGoToGame}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-stone-900 hover:bg-black text-white rounded-xl font-bold text-[11px] shadow-2xs transition-colors cursor-pointer shrink-0"
          >
            <Play className="w-3 h-3 fill-white" />
            <span>{t('play')}</span>
          </button>
        </div>
      ) : (
        <div className="bg-white border border-stone-200/80 rounded-xl px-3 py-1.5 shadow-2xs flex items-center justify-between transition-all">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-stone-800">
              3. {language === 'en' ? 'Boards' : 'Tablas'}
            </span>
            <button
              type="button"
              onClick={() => setIsHeaderCollapsed(false)}
              className="text-stone-500 hover:text-stone-900 p-0.5 rounded hover:bg-stone-100 transition-colors cursor-pointer"
              title="Mostrar cabecera"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            onClick={onGoToGame}
            className="flex items-center gap-1 px-2.5 py-1 bg-stone-900 hover:bg-black text-white rounded-lg font-bold text-[11px] shadow-2xs transition-colors cursor-pointer"
          >
            <Play className="w-3 h-3 fill-white" />
            <span>{t('play')}</span>
          </button>
        </div>
      )}

      {/* Two Column Grid on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start">
        {/* Left Column: Board Preview (Sticky on desktop) */}
        <div className="lg:col-span-6 xl:col-span-7 lg:sticky lg:top-4 flex flex-col items-center">
          <div className="w-full bg-white rounded-2xl border border-stone-200/90 p-3 shadow-2xs flex flex-col items-center">
            {/* Navigation Bar for Boards */}
        <div className="w-full flex items-center justify-between mb-2 px-1 text-xs">
          <span className="font-mono text-stone-500 uppercase tracking-widest text-[10px] font-semibold">
            {t('board_preview')}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              disabled={previewBoardIndex <= 0}
              onClick={() => setPreviewBoardIndex(previewBoardIndex - 1)}
              className="p-1 text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-md disabled:opacity-30 cursor-pointer transition-colors"
              title="Tabla anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-semibold text-stone-800 text-[11px] px-1">
              {t('board_index_of', { current: previewBoardIndex + 1, total: generatedBoards.length })}
            </span>
            <button
              disabled={previewBoardIndex >= generatedBoards.length - 1}
              onClick={() => setPreviewBoardIndex(previewBoardIndex + 1)}
              className="p-1 text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-md disabled:opacity-30 cursor-pointer transition-colors"
              title="Siguiente tabla"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Paper Sheet Preview Container (Ratio 22:31) */}
        {currentPreviewBoard && (
          <div className="w-full bg-stone-100/90 p-2.5 sm:p-3 rounded-xl border border-stone-200/80 shadow-inner flex flex-col items-center justify-center">
            <div
              className="w-full bg-white shadow-md transition-all relative overflow-hidden rounded-xs"
              style={{
                aspectRatio: '22 / 31',
                borderColor: activeFrameStyle !== 'none' ? activeBorderColor : '#E5E7EB',
                borderWidth: activeFrameStyle === 'none' ? '1px' : activeFrameStyle === 'traditional_gallo' ? '3px' : '2px',
                borderStyle: activeFrameStyle === 'none' ? 'dashed' : 'solid',
                padding: activeFrameStyle === 'traditional_gallo' ? '3px' : activeFrameStyle === 'festive_banner' ? '0px' : '5px',
              }}
            >
              {/* Inner wrapper for traditional gallo / talavera */}
              <div
                className={`relative h-full flex flex-col ${
                  activeFrameStyle === 'traditional_gallo'
                    ? 'p-1.5 border'
                    : activeFrameStyle === 'festive_banner'
                    ? ''
                    : activeFrameStyle === 'talavera_frame'
                    ? 'p-1.5 border'
                    : activeFrameStyle === 'clean_minimal'
                    ? 'p-1'
                    : 'p-1'
                }`}
                style={{
                  borderColor:
                    activeFrameStyle === 'traditional_gallo' || activeFrameStyle === 'talavera_frame'
                      ? activeBorderColor
                      : 'transparent',
                }}
              >
                {/* Traditional corner diamond ornaments */}
                {activeFrameStyle === 'traditional_gallo' && (
                  <>
                    <span className="absolute -top-1 -left-1 w-2 h-2 rotate-45" style={{ backgroundColor: activeBorderColor }} />
                    <span className="absolute -top-1 -right-1 w-2 h-2 rotate-45" style={{ backgroundColor: activeBorderColor }} />
                    <span className="absolute -bottom-1 -left-1 w-2 h-2 rotate-45" style={{ backgroundColor: activeBorderColor }} />
                    <span className="absolute -bottom-1 -right-1 w-2 h-2 rotate-45" style={{ backgroundColor: activeBorderColor }} />
                  </>
                )}

                {/* Talavera corner bracket squares */}
                {activeFrameStyle === 'talavera_frame' && (
                  <>
                    <span className="absolute top-0 left-0 w-2 h-2 border-r border-b" style={{ borderColor: activeBorderColor }} />
                    <span className="absolute top-0 right-0 w-2 h-2 border-l border-b" style={{ borderColor: activeBorderColor }} />
                    <span className="absolute bottom-0 left-0 w-2 h-2 border-r border-t" style={{ borderColor: activeBorderColor }} />
                    <span className="absolute bottom-0 right-0 w-2 h-2 border-l border-t" style={{ borderColor: activeBorderColor }} />
                  </>
                )}

                {/* Header Layout */}
                {activeFrameStyle === 'festive_banner' ? (
                  <div
                    className="text-center py-1.5 px-2 mb-1 transition-colors shrink-0"
                    style={{ backgroundColor: activeBorderColor }}
                  >
                    <h2 className="font-loteria-title text-xs font-black uppercase tracking-wider text-white">
                      {config.title || t('board_title_placeholder')}
                    </h2>
                    {config.subtitle && (
                      <p className="text-[9px] italic text-amber-100 font-medium leading-none mt-0.5">
                        {config.subtitle}
                      </p>
                    )}
                    {config.showBoardNumber && (
                      <span className="inline-block mt-0.5 font-mono text-[7px] text-white/90 uppercase tracking-widest bg-black/20 px-1 py-0.2 rounded-full leading-none">
                        {t('board_prefix')} #{currentPreviewBoard.index}
                      </span>
                    )}
                  </div>
                ) : (
                  <div
                    className={`text-center pb-1 mb-1 shrink-0 ${
                      activeFrameStyle === 'none' ? 'border-b border-stone-200' : 'border-b'
                    }`}
                    style={{
                      borderColor: activeFrameStyle !== 'none' ? activeBorderColor : undefined,
                    }}
                  >
                    <h2
                      className="font-loteria-title text-xs font-black uppercase tracking-wider transition-colors"
                      style={{
                        color: activeFrameStyle !== 'none' ? activeBorderColor : '#1C1917',
                      }}
                    >
                      {config.title || t('board_title_placeholder')}
                    </h2>
                    {config.subtitle && (
                      <p className="text-[9px] italic text-stone-600 font-medium leading-none mt-0.5">
                        {config.subtitle}
                      </p>
                    )}
                    {config.showBoardNumber && (
                      <span className="inline-block mt-0.5 font-mono text-[8px] text-stone-500 uppercase tracking-widest leading-none">
                        {t('board_prefix')} #{currentPreviewBoard.index}
                      </span>
                    )}
                  </div>
                )}

                {/* Grid Layout inside preview */}
                <div
                  className={`grid gap-0.5 flex-1 ${activeFrameStyle === 'festive_banner' ? 'p-1' : ''}`}
                  style={{
                    gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`
                  }}
                >
                  {currentPreviewBoard.cards.map((card, cIdx) => (
                    <div key={`${currentPreviewBoard.id}-${cIdx}`} className="aspect-[3/4]">
                      <CardPreview
                        card={card}
                        style={cardStyle}
                        isCompactTable={true}
                        className="w-full h-full"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-2 text-center text-[10px] text-stone-500 flex items-center justify-center gap-1">
          <Info className="w-3 h-3 text-stone-400" />
          <span>22×31 cm (proporción tradicional) • Baraja 5.2×7.8 cm</span>
        </div>
      </div>
    </div>

    {/* Right Column: Controls and Options */}
    <div className="lg:col-span-6 xl:col-span-5 space-y-3">
      {/* 3. Section 1: Encabezado (Colapsable con botón listo o clic en barra) */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => toggleSection('header')}
          className="w-full p-3 flex items-center justify-between text-left cursor-pointer hover:bg-stone-50/80 transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Type className="w-4 h-4 text-stone-600 shrink-0" />
            <span className="text-xs font-bold text-stone-900">
              1. {t('board_title_label')}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-md truncate max-w-[140px]">
              {config.title || t('board_title_placeholder')}
            </span>
            {openSection === 'header' ? (
              <ChevronUp className="w-4 h-4 text-stone-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-stone-400" />
            )}
          </div>
        </button>

        {openSection === 'header' && (
          <div className="p-3 pt-1 border-t border-stone-100 space-y-2.5 bg-stone-50/40">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                {t('board_title_label')}
              </label>
              <input
                type="text"
                value={config.title}
                onChange={(e) => onChangeConfig({ ...config, title: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl border border-stone-300 font-loteria-title text-sm font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 bg-white"
                placeholder={t('board_title_placeholder')}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                {t('board_subtitle_label')}
              </label>
              <input
                type="text"
                value={config.subtitle || ''}
                onChange={(e) => onChangeConfig({ ...config, subtitle: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl border border-stone-300 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-900 bg-white"
                placeholder={t('board_subtitle_placeholder')}
              />
            </div>

            <div className="p-2 rounded-xl border border-stone-200 bg-white flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-stone-900">
                  {t('show_board_number_label')}
                </p>
                <p className="text-[10px] text-stone-500 mt-0.5 leading-snug">
                  {t('show_board_number_hint')}
                </p>
              </div>
              <input
                type="checkbox"
                checked={config.showBoardNumber ?? false}
                onChange={(e) => onChangeConfig({ ...config, showBoardNumber: e.target.checked })}
                className="mt-0.5 w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-2 mt-1 border-t border-stone-200/60">
              <span className="text-[10px] text-stone-500 italic">
                {autoGuidedStep === 'header'
                  ? (language === 'en' ? 'Set titles and continue' : 'Configura títulos y continúa')
                  : (language === 'en' ? 'Titles update live' : 'Títulos en vivo')}
              </span>
              <button
                type="button"
                onClick={handleNextHeader}
                className="flex items-center gap-1 px-3 py-1 bg-stone-900 hover:bg-black text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
              >
                {autoGuidedStep === 'header' ? (
                  <>
                    <span>{language === 'en' ? 'Next: Frame' : 'Siguiente: Marco'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{t('done')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Section 2: Marco del Tablero (Auto-colapsa al seleccionar en paso guiado y prueba libre al reabrir) */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => toggleSection('frame')}
          className="w-full p-3 flex items-center justify-between text-left cursor-pointer hover:bg-stone-50/80 transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <LayoutTemplate className="w-4 h-4 text-stone-600 shrink-0" />
            <span className="text-xs font-bold text-stone-900">
              2. {t('board_frame_style')}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-md">
              {t(activeFrame.nameKey)}
            </span>
            {openSection === 'frame' ? (
              <ChevronUp className="w-4 h-4 text-stone-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-stone-400" />
            )}
          </div>
        </button>

        {openSection === 'frame' && (
          <div className="p-3 pt-1 border-t border-stone-100 space-y-1.5 bg-stone-50/40">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {frameOptions.map((f) => {
                const isSelected = activeFrameStyle === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handleSelectBoardFrame(f.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'border-stone-900 bg-stone-900 text-white shadow-xs font-bold'
                        : 'border-stone-200 text-stone-700 hover:border-stone-300 bg-white'
                    }`}
                  >
                    <div>
                      <p className="text-xs leading-tight">{t(f.nameKey)}</p>
                      <p className={`text-[10px] mt-0.5 line-clamp-1 ${isSelected ? 'text-stone-300' : 'text-stone-400'}`}>
                        {t(f.descKey)}
                      </p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-white shrink-0 ml-1.5" />}
                  </button>
                );
              })}
            </div>

            {/* Sub-footer for open frame section */}
            <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-stone-200/60">
              <span className="text-[10px] text-stone-500 italic">
                {autoGuidedStep === 'frame'
                  ? (language === 'en' ? 'Choose board frame to continue' : 'Elige marco para avanzar')
                  : (language === 'en' ? 'Tap frames to test in preview' : 'Toca marcos para probar en vivo')}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (autoGuidedStep === 'frame') {
                    setOpenSection('color');
                    setAutoGuidedStep('color');
                  } else {
                    setOpenSection(null);
                  }
                }}
                className="flex items-center gap-1 px-3 py-1 bg-stone-900 hover:bg-black text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{autoGuidedStep === 'frame' ? (language === 'en' ? 'Next' : 'Siguiente') : t('done')}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Section 3: Color del Marco (Auto-colapsa al seleccionar en paso guiado y prueba libre al reabrir) */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => toggleSection('color')}
          className="w-full p-3 flex items-center justify-between text-left cursor-pointer hover:bg-stone-50/80 transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Palette className="w-4 h-4 text-stone-600 shrink-0" />
            <span className="text-xs font-bold text-stone-900">
              3. {t('board_color_theme')}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="w-3.5 h-3.5 rounded-full border border-stone-300 shadow-2xs shrink-0"
              style={{ backgroundColor: activeBorderColor }}
            />
            <span className="text-[11px] font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-md">
              {activePalette.label}
            </span>
            {openSection === 'color' ? (
              <ChevronUp className="w-4 h-4 text-stone-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-stone-400" />
            )}
          </div>
        </button>

        {openSection === 'color' && (
          <div className="p-3 pt-1 border-t border-stone-100 bg-stone-50/40">
            <div className="flex items-center gap-2.5 flex-wrap py-1">
              {BOARD_COLOR_PALETTES.map((palette) => {
                const isSelected = activeBorderColor.toLowerCase() === palette.hex.toLowerCase();
                return (
                  <button
                    key={palette.hex}
                    type="button"
                    title={palette.label}
                    onClick={() => handleSelectBoardColor(palette.hex)}
                    className={`w-9 h-9 rounded-full border-2 transition-transform flex items-center justify-center cursor-pointer ${
                      isSelected ? 'scale-110 border-stone-900 shadow-sm' : 'border-white hover:scale-105'
                    }`}
                    style={{ backgroundColor: palette.hex }}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white drop-shadow-sm" />}
                  </button>
                );
              })}
            </div>

            {/* Sub-footer for open color section */}
            <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-stone-200/60">
              <span className="text-[10px] text-stone-500 italic">
                {autoGuidedStep === 'color'
                  ? (language === 'en' ? 'Choose color to continue' : 'Elige color para avanzar')
                  : (language === 'en' ? 'Tap colors to test in preview' : 'Toca colores para probar en vivo')}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (autoGuidedStep === 'color') {
                    setOpenSection('grid');
                    setAutoGuidedStep('grid');
                  } else {
                    setOpenSection(null);
                  }
                }}
                className="flex items-center gap-1 px-3 py-1 bg-stone-900 hover:bg-black text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{autoGuidedStep === 'color' ? (language === 'en' ? 'Next' : 'Siguiente') : t('done')}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6. Section 4: Tamaño de Cuadrícula (Auto-colapsa al elegir preset en paso guiado y prueba libre al reabrir) */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => toggleSection('grid')}
          className="w-full p-3 flex items-center justify-between text-left cursor-pointer hover:bg-stone-50/80 transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Grid className="w-4 h-4 text-stone-600 shrink-0" />
            <span className="text-xs font-bold text-stone-900">
              4. {t('board_dimensions')}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-md">
              {config.rows} × {config.cols} ({config.rows * config.cols} {t('cards').toLowerCase()})
            </span>
            {openSection === 'grid' ? (
              <ChevronUp className="w-4 h-4 text-stone-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-stone-400" />
            )}
          </div>
        </button>

        {openSection === 'grid' && (
          <div className="p-3 pt-1 border-t border-stone-100 space-y-2.5 bg-stone-50/40">
            <div className="grid grid-cols-2 gap-2">
              {presets.map((p) => {
                const isSelected = config.rows === p.rows && config.cols === p.cols;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handleSelectGridPreset(p)}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-stone-900 bg-stone-900 text-white'
                        : 'border-stone-200 text-stone-700 hover:border-stone-300 bg-white'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Duplicates Rule */}
            <div className="p-2.5 rounded-xl border border-stone-200 bg-white flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-stone-900">
                  {t('allow_duplicates')}
                </p>
                <p className="text-[10px] text-stone-500 mt-0.5">
                  {config.allowDuplicates ? t('duplicates_allowed') : t('duplicates_not_allowed')}
                </p>
              </div>
              <input
                type="checkbox"
                checked={config.allowDuplicates}
                onChange={(e) => {
                  const updated = { ...config, allowDuplicates: e.target.checked };
                  onChangeConfig(updated);
                  try {
                    updateBoards(generateBoards(cards, updated));
                  } catch (err: any) {
                    alert(err.message);
                  }
                }}
                className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900 cursor-pointer"
              />
            </div>

            {/* Color Balance & Dispersion Rule */}
            <div className="p-2.5 rounded-xl border border-stone-200 bg-white flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-stone-900">
                  {language === 'en' ? 'Balance & alternate colors' : 'Equilibrar y alternar colores'}
                </p>
                <p className="text-[10px] text-stone-500 mt-0.5">
                  {language === 'en'
                    ? 'Prevents adjacent same-colored cards & balances color variety'
                    : 'Evita colores iguales juntos y equilibra la variedad en cada tabla'}
                </p>
              </div>
              <input
                type="checkbox"
                checked={config.balanceColors !== false}
                onChange={(e) => {
                  const updated = { ...config, balanceColors: e.target.checked };
                  onChangeConfig(updated);
                  try {
                    updateBoards(generateBoards(cards, updated));
                  } catch (err: any) {
                    alert(err.message);
                  }
                }}
                className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900 cursor-pointer"
              />
            </div>

            {/* Sub-footer for open grid section */}
            <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-stone-200/60">
              <span className="text-[10px] text-stone-500 italic">
                {autoGuidedStep === 'grid'
                  ? (language === 'en' ? 'Select dimensions to finish' : 'Elige tamaño para finalizar')
                  : (language === 'en' ? 'Tap preset to test in preview' : 'Toca opción para probar en vivo')}
              </span>
              <button
                type="button"
                onClick={() => {
                  setOpenSection(null);
                  setAutoGuidedStep(null);
                  onCompleteInitialTour?.();
                }}
                className="flex items-center gap-1 px-3 py-1 bg-stone-900 hover:bg-black text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{t('done')}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 7. Section 5: Cantidad de Tablas (Siempre visible) */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-3.5 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-stone-600 shrink-0" />
            <span className="text-xs font-bold text-stone-900">
              5. {t('board_quantity')}
            </span>
          </div>
          <span className="font-mono font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded text-xs">
            {config.quantity} {t('boards_count')}
          </span>
        </div>

        <div className="space-y-1">
          <input
            type="range"
            min={1}
            max={200}
            value={config.quantity}
            onChange={(e) => onChangeConfig({ ...config, quantity: parseInt(e.target.value, 10) })}
            className="w-full accent-stone-800 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-stone-400 font-mono">
            <span>1</span>
            <span>50</span>
            <span>100</span>
            <span>150</span>
            <span>200 tablas</span>
          </div>
        </div>

        {/* Always-visible Color Balance & Dispersion toggle */}
        <div className="p-2.5 rounded-xl border border-stone-200/80 bg-stone-50/70 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-bold text-stone-900">
              {language === 'en' ? '🎨 Balance & disperse colors' : '🎨 Equilibrio y dispersión de colores'}
            </p>
            <p className="text-[10px] text-stone-500 mt-0.5">
              {language === 'en'
                ? 'Varied palette without repeating adjacent colors'
                : 'Mayor variedad sin repetir colores contiguos'}
            </p>
          </div>
          <input
            type="checkbox"
            checked={config.balanceColors !== false}
            onChange={(e) => {
              const updated = { ...config, balanceColors: e.target.checked };
              onChangeConfig(updated);
              try {
                updateBoards(generateBoards(cards, updated));
              } catch (err: any) {
                alert(err.message);
              }
            }}
            className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900 cursor-pointer shrink-0"
          />
        </div>

        <button
          type="button"
          onClick={handleRegenerate}
          className="w-full flex items-center justify-center gap-1.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-bold text-xs transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {t('regenerate_boards')}
        </button>
      </div>

      {/* Desktop Inline Actions */}
      <div className="hidden lg:flex items-center justify-between gap-3 pt-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('back')}
        </button>
        <button
          onClick={onNext}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-sm transition-transform active:scale-95 cursor-pointer"
        >
          <span>{language === 'en' ? 'Continue to Download' : 'Continuar a Descarga'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>

  {/* Mobile Sticky Bottom Navigation Bar */}
  <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-stone-200 z-20 flex justify-center">
    <div className="w-full max-w-md flex items-center justify-between gap-3">
      <button
        onClick={onBack}
        className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 rounded-xl cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        {t('back')}
      </button>
      <button
        onClick={onNext}
        className="flex-1 max-w-xs flex items-center justify-center gap-1.5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-sm transition-transform active:scale-95 cursor-pointer"
      >
        <span>{language === 'en' ? 'Continue to Download' : 'Continuar a Descarga'}</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  </div>
</div>
  );
};

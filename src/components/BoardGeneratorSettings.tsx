import React, { useState } from 'react';
import {
  BoardConfig,
  LoteriaCard,
  CardStyleConfig,
  GeneratedBoard,
  BoardFrameStyle,
  BoardDimensionPreset,
} from '../types/loteria';
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
  Play,
  FileText,
  Maximize2,
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

const BOARD_FRAME_COLOR_PALETTES = [
  { hex: '#164E3D', label: 'Verde Tradicional' },
  { hex: '#991B1B', label: 'Rojo Patrio' },
  { hex: '#1E3A8A', label: 'Azul Talavera' },
  { hex: '#B45309', label: 'Ocre Dorado' },
  { hex: '#7C2D12', label: 'Barro Cocido' },
  { hex: '#1C1917', label: 'Negro Carbón' },
  { hex: '#BE185D', label: 'Rosa Mexicano' },
  { hex: '#6D28D9', label: 'Morado Festivo' },
  { hex: '#0F766E', label: 'Esmeralda' },
  { hex: '#C2410C', label: 'Terracota' },
  { hex: '#4338CA', label: 'Índigo Profundo' },
  { hex: '#475569', label: 'Gris Pizarra' },
];

const BOARD_PAPER_PALETTES = [
  { hex: '#FFFFFF', label: 'Blanco Puro' },
  { hex: '#FDFBF7', label: 'Blanco Hueso' },
  { hex: '#FEF9E7', label: 'Crema Vintage' },
  { hex: '#F3EDE2', label: 'Cartoncillo Kraft' },
  { hex: '#FEF08A', label: 'Amarillo Lotería' },
  { hex: '#FCE7F3', label: 'Rosa Pastel' },
  { hex: '#E0F2FE', label: 'Azul Cielo' },
  { hex: '#DCFCE7', label: 'Menta Suave' },
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

  type BoardSectionKey = 'header' | 'frame' | 'color' | 'paper' | 'grid' | 'sizing';

  // Auto-collapsing accordion section state - Starts with 'header' open for guided wizard on first time
  const [autoGuidedStep, setAutoGuidedStep] = useState<BoardSectionKey | null>(
    initialTourDone ? null : 'header'
  );
  const [openSection, setOpenSection] = useState<BoardSectionKey | null>(
    initialTourDone ? null : 'header'
  );

  const [customGridMode, setCustomGridMode] = useState<boolean>(false);
  const [customFrameColor, setCustomFrameColor] = useState<string>(config.boardBorderColor || '#164E3D');
  const [customTextColor, setCustomTextColor] = useState<string>(config.boardTextColor || config.boardBorderColor || '#164E3D');
  const [customPaperColor, setCustomPaperColor] = useState<string>(config.boardBgColor || '#FFFFFF');
  const [isCustomTextColor, setIsCustomTextColor] = useState<boolean>(Boolean(config.boardTextColor && config.boardTextColor !== config.boardBorderColor));

  const toggleSection = (s: BoardSectionKey) => {
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
    setCustomFrameColor(hex);
    const updated: BoardConfig = { ...config, boardBorderColor: hex };
    if (!isCustomTextColor) {
      updated.boardTextColor = hex;
    }
    onChangeConfig(updated);
    if (autoGuidedStep === 'color') {
      setOpenSection('paper');
      setAutoGuidedStep('paper');
    }
    // In exploration mode, section remains open for live preview
  };

  const handleSelectBoardPaperColor = (hex: string) => {
    setCustomPaperColor(hex);
    onChangeConfig({ ...config, boardBgColor: hex });
    if (autoGuidedStep === 'paper') {
      setOpenSection('grid');
      setAutoGuidedStep('grid');
    }
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

  const handleCustomGridChange = (rows: number, cols: number) => {
    const updated = { ...config, rows, cols };
    onChangeConfig(updated);
    try {
      updateBoards(generateBoards(cards, updated));
    } catch (err: any) {
      alert(err.message);
    }
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
  const activePaperBgColor = config.boardBgColor || '#FFFFFF';
  const activeFrameStyle = config.boardFrameStyle || 'traditional_gallo';
  const activeBorderColor = config.boardBorderColor || '#164E3D';
  const activeTextColor = config.boardTextColor || activeBorderColor;

  const activePalette =
    BOARD_FRAME_COLOR_PALETTES.find((p) => p.hex.toLowerCase() === activeBorderColor.toLowerCase()) || {
      hex: activeBorderColor,
      label: language === 'en' ? 'Custom' : 'Personalizado',
    };

  const activePaperPalette =
    BOARD_PAPER_PALETTES.find((p) => p.hex.toLowerCase() === activePaperBgColor.toLowerCase()) || {
      hex: activePaperBgColor,
      label: language === 'en' ? 'Custom' : 'Personalizado',
    };

  const getBoardDimensionsRatio = () => {
    const preset = config.boardDimensions?.preset || 'traditional';
    switch (preset) {
      case 'full_page':
        return 19.5 / 25.5; // ~0.765
      case 'half_page':
        return 13.5 / 19.5; // ~0.692
      case 'square':
        return 1;
      case 'custom': {
        const w = config.boardDimensions?.widthCm || 22;
        const h = config.boardDimensions?.heightCm || 31;
        return w > 0 && h > 0 ? w / h : 22 / 31;
      }
      case 'traditional':
      default:
        return 22 / 31;
    }
  };

  const boardSizingPresets: Array<{ id: BoardDimensionPreset; label: string; desc: string }> = [
    { id: 'traditional', label: t('board_size_traditional'), desc: '22 × 31 cm (Estándar oficial)' },
    { id: 'full_page', label: t('board_size_full_page'), desc: 'Carta / A4 completa (~19.5 × 25.5 cm)' },
    { id: 'half_page', label: t('board_size_half_page'), desc: 'Media hoja (~13.5 × 19.5 cm)' },
    { id: 'square', label: t('board_size_square'), desc: '20 × 20 cm (Cuadrada)' },
    { id: 'custom', label: t('board_size_custom'), desc: 'Medidas personalizadas en cm' },
  ];

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

        {/* Paper Sheet Preview Container */}
        {currentPreviewBoard && (
          <div className="w-full bg-stone-100/90 p-2.5 sm:p-3 rounded-xl border border-stone-200/80 shadow-inner flex flex-col items-center justify-center">
            <div
              className="w-full shadow-md transition-all relative overflow-hidden rounded-xs"
              style={{
                backgroundColor: activePaperBgColor,
                aspectRatio: `${getBoardDimensionsRatio()}`,
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
                    <h2
                      className="font-loteria-title text-xs font-black uppercase tracking-wider text-white"
                      style={{ color: isCustomTextColor ? activeTextColor : '#FFFFFF' }}
                    >
                      {config.title || t('board_title_placeholder')}
                    </h2>
                    {config.subtitle && (
                      <p
                        className="text-[9px] italic font-medium leading-none mt-0.5"
                        style={{ color: isCustomTextColor ? activeTextColor : '#FEF3C7', opacity: 0.9 }}
                      >
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
                        color: activeFrameStyle !== 'none' ? activeTextColor : '#1C1917',
                      }}
                    >
                      {config.title || t('board_title_placeholder')}
                    </h2>
                    {config.subtitle && (
                      <p
                        className="text-[9px] italic font-medium leading-none mt-0.5"
                        style={{ color: activeTextColor, opacity: 0.85 }}
                      >
                        {config.subtitle}
                      </p>
                    )}
                    {config.showBoardNumber && (
                      <span
                        className="inline-block mt-0.5 font-mono text-[8px] uppercase tracking-widest leading-none"
                        style={{ color: activeTextColor, opacity: 0.75 }}
                      >
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
                        outerMarginColor={
                          config.cardOuterMarginMode === 'white'
                            ? '#FFFFFF'
                            : config.cardOuterMarginMode === 'custom'
                            ? config.cardOuterMarginCustomColor || activePaperBgColor
                            : activePaperBgColor
                        }
                        isFlush={config.cardOuterMarginMode === 'flush'}
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
          <span>
            {config.boardDimensions?.preset === 'full_page'
              ? 'Hoja Completa Carta/A4'
              : config.boardDimensions?.preset === 'half_page'
              ? 'Media Hoja (2 tablas por hoja)'
              : config.boardDimensions?.preset === 'square'
              ? 'Cuadrada 20×20 cm'
              : config.boardDimensions?.preset === 'custom'
              ? `${config.boardDimensions.widthCm || 22}×${config.boardDimensions.heightCm || 31} cm (Personalizado)`
              : '22×31 cm (proporción tradicional)'}
            {' • '}
            Baraja {cardStyle.cardDimensions?.preset === '9_per_page' ? '6.3×8.8 cm' : cardStyle.cardDimensions?.preset === '6_per_page' ? '7×9.8 cm' : cardStyle.cardDimensions?.preset === '16_per_page' ? '4.5×6.3 cm' : '5.2×7.8 cm'}
          </span>
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

      {/* 5. Section 3: Colores del Tablero (Marco y Textos) */}
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
              title="Color de marco"
            />
            <span
              className="w-3.5 h-3.5 rounded-full border border-stone-300 shadow-2xs shrink-0 font-bold text-[9px] flex items-center justify-center bg-stone-100"
              style={{ color: activeTextColor }}
              title="Color de texto"
            >
              A
            </span>
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
          <div className="p-3 pt-1 border-t border-stone-100 bg-stone-50/40 space-y-3">
            {/* Color del marco */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                {t('board_color_theme')}
              </label>
              <div className="flex items-center gap-2 flex-wrap py-1">
                {BOARD_FRAME_COLOR_PALETTES.map((palette) => {
                  const isSelected = activeBorderColor.toLowerCase() === palette.hex.toLowerCase();
                  return (
                    <button
                      key={palette.hex}
                      type="button"
                      title={palette.label}
                      onClick={() => handleSelectBoardColor(palette.hex)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform flex items-center justify-center cursor-pointer ${
                        isSelected ? 'scale-110 border-stone-900 shadow-xs' : 'border-white hover:scale-105'
                      }`}
                      style={{ backgroundColor: palette.hex }}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white drop-shadow-sm" />}
                    </button>
                  );
                })}
                {/* Native frame color picker */}
                <div className="flex items-center gap-1.5 ml-1">
                  <input
                    type="color"
                    value={customFrameColor}
                    onChange={(e) => {
                      setCustomFrameColor(e.target.value);
                      handleSelectBoardColor(e.target.value);
                    }}
                    className="w-7 h-7 rounded-full border border-stone-300 cursor-pointer overflow-hidden p-0"
                    title={t('custom_color')}
                  />
                  <span className="text-[10px] font-mono text-stone-500">{activeBorderColor}</span>
                </div>
              </div>
            </div>

            {/* Color de Textos */}
            <div className="pt-2 border-t border-stone-200/60">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-600">
                  {t('board_text_color_label')}
                </label>
                <div className="flex items-center gap-1 bg-stone-200/70 p-0.5 rounded-lg text-[10px]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomTextColor(false);
                      onChangeConfig({ ...config, boardTextColor: undefined });
                    }}
                    className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer ${
                      !isCustomTextColor ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-600'
                    }`}
                  >
                    {t('same_as_frame')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomTextColor(true);
                      onChangeConfig({ ...config, boardTextColor: customTextColor });
                    }}
                    className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer ${
                      isCustomTextColor ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-600'
                    }`}
                  >
                    {t('custom_color_choice')}
                  </button>
                </div>
              </div>

              {isCustomTextColor && (
                <div className="flex items-center gap-2 flex-wrap py-1">
                  {BOARD_FRAME_COLOR_PALETTES.map((palette) => {
                    const isSelected = activeTextColor.toLowerCase() === palette.hex.toLowerCase();
                    return (
                      <button
                        key={`text-${palette.hex}`}
                        type="button"
                        title={palette.label}
                        onClick={() => {
                          setCustomTextColor(palette.hex);
                          onChangeConfig({ ...config, boardTextColor: palette.hex });
                        }}
                        className={`w-7 h-7 rounded-full border-2 transition-transform flex items-center justify-center cursor-pointer ${
                          isSelected ? 'scale-110 border-stone-900 shadow-xs' : 'border-white hover:scale-105'
                        }`}
                        style={{ backgroundColor: palette.hex }}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white drop-shadow-sm" />}
                      </button>
                    );
                  })}
                  {/* Native text color picker */}
                  <div className="flex items-center gap-1.5 ml-1">
                    <input
                      type="color"
                      value={customTextColor}
                      onChange={(e) => {
                        setCustomTextColor(e.target.value);
                        onChangeConfig({ ...config, boardTextColor: e.target.value });
                      }}
                      className="w-7 h-7 rounded-full border border-stone-300 cursor-pointer overflow-hidden p-0"
                      title={t('custom_color')}
                    />
                    <span className="text-[10px] font-mono text-stone-500">{activeTextColor}</span>
                  </div>
                </div>
              )}
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
                    setOpenSection('paper');
                    setAutoGuidedStep('paper');
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

      {/* 6. Section 4: Color de la Hoja / Fondo del Tablero */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => toggleSection('paper')}
          className="w-full p-3 flex items-center justify-between text-left cursor-pointer hover:bg-stone-50/80 transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-4 h-4 text-stone-600 shrink-0" />
            <span className="text-xs font-bold text-stone-900">
              4. {t('board_paper_color')}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="w-3.5 h-3.5 rounded-full border border-stone-300 shadow-2xs shrink-0"
              style={{ backgroundColor: activePaperBgColor }}
            />
            <span className="text-[11px] font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-md">
              {activePaperPalette.label}
            </span>
            {openSection === 'paper' ? (
              <ChevronUp className="w-4 h-4 text-stone-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-stone-400" />
            )}
          </div>
        </button>

        {openSection === 'paper' && (
          <div className="p-3 pt-1 border-t border-stone-100 bg-stone-50/40 space-y-2.5">
            <p className="text-[11px] text-stone-500 leading-snug">
              {t('board_paper_color_desc')}
            </p>
            <div className="flex items-center gap-2 flex-wrap py-1">
              {BOARD_PAPER_PALETTES.map((palette) => {
                const isSelected = activePaperBgColor.toLowerCase() === palette.hex.toLowerCase();
                return (
                  <button
                    key={palette.hex}
                    type="button"
                    title={palette.label}
                    onClick={() => handleSelectBoardPaperColor(palette.hex)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform flex items-center justify-center cursor-pointer shadow-2xs ${
                      isSelected ? 'scale-110 border-stone-900 ring-1 ring-stone-900' : 'border-stone-300 hover:scale-105'
                    }`}
                    style={{ backgroundColor: palette.hex }}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-stone-800 drop-shadow-sm" />}
                  </button>
                );
              })}
              {/* Native paper color picker */}
              <div className="flex items-center gap-1.5 ml-1">
                <input
                  type="color"
                  value={customPaperColor}
                  onChange={(e) => {
                    setCustomPaperColor(e.target.value);
                    handleSelectBoardPaperColor(e.target.value);
                  }}
                  className="w-8 h-8 rounded-full border border-stone-300 cursor-pointer overflow-hidden p-0"
                  title={t('custom_color')}
                />
                <span className="text-[10px] font-mono text-stone-500">{activePaperBgColor}</span>
              </div>
            </div>

            {/* Margen exterior de las cartas en la tabla */}
            <div className="pt-2.5 mt-2 border-t border-stone-200/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-600">
                  {t('board_card_margin_mode')}
                </label>
                <span className="text-[10px] font-bold text-emerald-800">
                  {(config.cardOuterMarginMode || 'match_board') === 'match_board'
                    ? (language === 'en' ? 'Match board' : 'Fusionado con hoja')
                    : (config.cardOuterMarginMode === 'flush'
                    ? (language === 'en' ? 'Flush' : 'Al ras')
                    : (config.cardOuterMarginMode === 'white'
                    ? (language === 'en' ? 'White' : 'Blanco')
                    : (language === 'en' ? 'Custom' : 'Personalizado')))}
                </span>
              </div>
              <p className="text-[10px] text-stone-500 leading-tight">
                {t('margin_match_hint')}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => onChangeConfig({ ...config, cardOuterMarginMode: 'match_board' })}
                  className={`p-1.5 rounded-lg border text-[11px] font-semibold text-center transition-all cursor-pointer ${
                    (config.cardOuterMarginMode || 'match_board') === 'match_board'
                      ? 'border-emerald-800 bg-emerald-800 text-white shadow-2xs'
                      : 'border-stone-200 text-stone-700 bg-white hover:border-stone-300'
                  }`}
                >
                  {t('margin_mode_match_board')}
                </button>
                <button
                  type="button"
                  onClick={() => onChangeConfig({ ...config, cardOuterMarginMode: 'flush' })}
                  className={`p-1.5 rounded-lg border text-[11px] font-semibold text-center transition-all cursor-pointer ${
                    config.cardOuterMarginMode === 'flush'
                      ? 'border-emerald-800 bg-emerald-800 text-white shadow-2xs'
                      : 'border-stone-200 text-stone-700 bg-white hover:border-stone-300'
                  }`}
                >
                  {t('margin_mode_flush')}
                </button>
                <button
                  type="button"
                  onClick={() => onChangeConfig({ ...config, cardOuterMarginMode: 'white' })}
                  className={`p-1.5 rounded-lg border text-[11px] font-semibold text-center transition-all cursor-pointer ${
                    config.cardOuterMarginMode === 'white'
                      ? 'border-emerald-800 bg-emerald-800 text-white shadow-2xs'
                      : 'border-stone-200 text-stone-700 bg-white hover:border-stone-300'
                  }`}
                >
                  {t('margin_mode_white')}
                </button>
                <button
                  type="button"
                  onClick={() => onChangeConfig({ ...config, cardOuterMarginMode: 'custom' })}
                  className={`p-1.5 rounded-lg border text-[11px] font-semibold text-center transition-all cursor-pointer ${
                    config.cardOuterMarginMode === 'custom'
                      ? 'border-emerald-800 bg-emerald-800 text-white shadow-2xs'
                      : 'border-stone-200 text-stone-700 bg-white hover:border-stone-300'
                  }`}
                >
                  {t('margin_mode_custom')}
                </button>
              </div>

              {config.cardOuterMarginMode === 'custom' && (
                <div className="flex items-center gap-2 pt-1.5">
                  <input
                    type="color"
                    value={config.cardOuterMarginCustomColor || '#FFFFFF'}
                    onChange={(e) => onChangeConfig({ ...config, cardOuterMarginCustomColor: e.target.value })}
                    className="w-7 h-7 rounded-full border border-stone-300 cursor-pointer overflow-hidden p-0"
                  />
                  <span className="text-[10px] font-mono text-stone-600">
                    {config.cardOuterMarginCustomColor || '#FFFFFF'}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-stone-200/60">
              <span className="text-[10px] text-stone-500 italic">
                {autoGuidedStep === 'paper'
                  ? (language === 'en' ? 'Select paper color to continue' : 'Elige color de papel para continuar')
                  : (language === 'en' ? 'Paper color updates preview live' : 'Fondo de hoja en vivo')}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (autoGuidedStep === 'paper') {
                    setOpenSection('grid');
                    setAutoGuidedStep('grid');
                  } else {
                    setOpenSection(null);
                  }
                }}
                className="flex items-center gap-1 px-3 py-1 bg-stone-900 hover:bg-black text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{autoGuidedStep === 'paper' ? (language === 'en' ? 'Next' : 'Siguiente') : t('done')}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 7. Section 5: Tamaño de Cuadrícula (Presets y Personalizado) */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => toggleSection('grid')}
          className="w-full p-3 flex items-center justify-between text-left cursor-pointer hover:bg-stone-50/80 transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Grid className="w-4 h-4 text-stone-600 shrink-0" />
            <span className="text-xs font-bold text-stone-900">
              5. {t('board_dimensions')}
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
            {/* Mode switch: Presets vs Custom */}
            <div className="flex items-center justify-between bg-stone-200/70 p-0.5 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setCustomGridMode(false)}
                className={`flex-1 py-1 rounded-lg text-center cursor-pointer transition-all ${
                  !customGridMode ? 'bg-white text-stone-900 font-bold shadow-2xs' : 'text-stone-600'
                }`}
              >
                {language === 'en' ? 'Presets' : 'Opciones Rápidas'}
              </button>
              <button
                type="button"
                onClick={() => setCustomGridMode(true)}
                className={`flex-1 py-1 rounded-lg text-center cursor-pointer transition-all ${
                  customGridMode ? 'bg-white text-stone-900 font-bold shadow-2xs' : 'text-stone-600'
                }`}
              >
                {t('custom_grid_label')}
              </button>
            </div>

            {!customGridMode ? (
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
            ) : (
              /* Custom Rows & Columns Steppers */
              <div className="p-3 bg-white border border-stone-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800">
                    {t('rows_label')} ({config.rows})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={config.rows <= 2}
                      onClick={() => handleCustomGridChange(Math.max(2, config.rows - 1), config.cols)}
                      className="w-7 h-7 rounded-lg border border-stone-300 text-stone-700 font-bold hover:bg-stone-100 disabled:opacity-30 cursor-pointer flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="font-mono font-bold text-xs w-5 text-center">{config.rows}</span>
                    <button
                      type="button"
                      disabled={config.rows >= 6}
                      onClick={() => handleCustomGridChange(Math.min(6, config.rows + 1), config.cols)}
                      className="w-7 h-7 rounded-lg border border-stone-300 text-stone-700 font-bold hover:bg-stone-100 disabled:opacity-30 cursor-pointer flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800">
                    {t('cols_label')} ({config.cols})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={config.cols <= 2}
                      onClick={() => handleCustomGridChange(config.rows, Math.max(2, config.cols - 1))}
                      className="w-7 h-7 rounded-lg border border-stone-300 text-stone-700 font-bold hover:bg-stone-100 disabled:opacity-30 cursor-pointer flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="font-mono font-bold text-xs w-5 text-center">{config.cols}</span>
                    <button
                      type="button"
                      disabled={config.cols >= 6}
                      onClick={() => handleCustomGridChange(config.rows, Math.min(6, config.cols + 1))}
                      className="w-7 h-7 rounded-lg border border-stone-300 text-stone-700 font-bold hover:bg-stone-100 disabled:opacity-30 cursor-pointer flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-stone-50 text-[11px] text-stone-600 flex items-center justify-between">
                  <span>{language === 'en' ? 'Total cards per board:' : 'Total de cartas por tabla:'}</span>
                  <span className="font-bold text-stone-900">{config.rows * config.cols}</span>
                </div>
              </div>
            )}

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

      {/* 8. Section 6: Medidas Físicas y Formato de Tabla */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => toggleSection('sizing')}
          className="w-full p-3 flex items-center justify-between text-left cursor-pointer hover:bg-stone-50/80 transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Maximize2 className="w-4 h-4 text-stone-600 shrink-0" />
            <span className="text-xs font-bold text-stone-900">
              6. {t('board_size_title')}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-md">
              {config.boardDimensions?.preset === 'full_page'
                ? 'Hoja Completa'
                : config.boardDimensions?.preset === 'half_page'
                ? 'Media Hoja'
                : config.boardDimensions?.preset === 'square'
                ? 'Cuadrada'
                : config.boardDimensions?.preset === 'custom'
                ? 'Personalizado'
                : 'Tradicional'}
            </span>
            {openSection === 'sizing' ? (
              <ChevronUp className="w-4 h-4 text-stone-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-stone-400" />
            )}
          </div>
        </button>

        {openSection === 'sizing' && (
          <div className="p-3 pt-1 border-t border-stone-100 space-y-2.5 bg-stone-50/40">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {boardSizingPresets.map((p) => {
                const activePreset = config.boardDimensions?.preset || 'traditional';
                const isSelected = activePreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() =>
                      onChangeConfig({
                        ...config,
                        boardDimensions: {
                          preset: p.id,
                          widthCm: config.boardDimensions?.widthCm || 22,
                          heightCm: config.boardDimensions?.heightCm || 31,
                        },
                      })
                    }
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-stone-900 bg-stone-900 text-white font-bold shadow-xs'
                        : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                    }`}
                  >
                    <p className="text-xs leading-tight">{p.label}</p>
                    <p
                      className={`text-[10px] mt-0.5 line-clamp-1 ${
                        isSelected ? 'text-stone-300' : 'text-stone-400'
                      }`}
                    >
                      {p.desc}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Custom dimensions inputs if 'custom' is selected */}
            {config.boardDimensions?.preset === 'custom' && (
              <div className="p-2.5 bg-white border border-stone-200 rounded-xl space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600 block">
                  {language === 'en' ? 'Custom Board Dimensions (cm)' : 'Medidas Exactas de la Tabla (cm)'}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-stone-500 mb-0.5">{t('width_cm_label')}</label>
                    <input
                      type="number"
                      step="0.5"
                      min="10"
                      max="30"
                      value={config.boardDimensions?.widthCm || 22}
                      onChange={(e) =>
                        onChangeConfig({
                          ...config,
                          boardDimensions: {
                            preset: 'custom',
                            widthCm: parseFloat(e.target.value) || 22,
                            heightCm: config.boardDimensions?.heightCm || 31,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1 text-xs border border-stone-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-stone-500 mb-0.5">{t('height_cm_label')}</label>
                    <input
                      type="number"
                      step="0.5"
                      min="10"
                      max="40"
                      value={config.boardDimensions?.heightCm || 31}
                      onChange={(e) =>
                        onChangeConfig({
                          ...config,
                          boardDimensions: {
                            preset: 'custom',
                            widthCm: config.boardDimensions?.widthCm || 22,
                            heightCm: parseFloat(e.target.value) || 31,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1 text-xs border border-stone-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end pt-2 border-t border-stone-200/60">
              <button
                type="button"
                onClick={() => setOpenSection(null)}
                className="flex items-center gap-1 px-3 py-1 bg-stone-900 hover:bg-black text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{t('done')}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 9. Section 7: Cantidad de Tablas (Siempre visible) */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-3.5 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-stone-600 shrink-0" />
            <span className="text-xs font-bold text-stone-900">
              7. {t('board_quantity')}
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

import React, { useState } from 'react';
import { BoardConfig, LoteriaCard, CardStyleConfig, GeneratedBoard, BoardFrameStyle } from '../types/loteria';
import { generateBoards } from '../utils/loteriaEngine';
import { generateCardsPDF, generateBoardsPDF } from '../utils/pdfGenerator';
import { CardPreview } from './CardPreview';
import {
  FileDown,
  Play,
  RefreshCw,
  ArrowLeft,
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
  Sparkles
} from 'lucide-react';
import { useLanguage, TranslationKey } from '../i18n/LanguageContext';

interface BoardGeneratorSettingsProps {
  cards: LoteriaCard[];
  cardStyle: CardStyleConfig;
  config: BoardConfig;
  onChangeConfig: (newConfig: BoardConfig) => void;
  onBack: () => void;
  onGoToGame: () => void;
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
  onChangeConfig,
  onBack,
  onGoToGame,
}) => {
  const { t, language } = useLanguage();
  const [generatedBoards, setGeneratedBoards] = useState<GeneratedBoard[]>(() => {
    return generateBoards(cards, config);
  });
  const [previewBoardIndex, setPreviewBoardIndex] = useState<number>(0);
  const cardsPerPage = 4;
  const [isGeneratingCardsPDF, setIsGeneratingCardsPDF] = useState(false);
  const [isGeneratingBoardsPDF, setIsGeneratingBoardsPDF] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);

  // Top header collapsible state: can be collapsed to focus purely on the board
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);

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
    try {
      const boards = generateBoards(cards, config);
      setGeneratedBoards(boards);
      setPreviewBoardIndex(0);
    } catch (e: any) {
      alert(e.message || 'Error');
    }
  };

  const handleDownloadCardsPDF = async () => {
    try {
      setIsGeneratingCardsPDF(true);
      setPdfProgress(0);
      const blob = await generateCardsPDF(cards, cardStyle, cardsPerPage, (pct) => setPdfProgress(pct));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `deck-54-cards-${cardsPerPage}-per-sheet.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Error generating cards PDF.');
    } finally {
      setIsGeneratingCardsPDF(false);
    }
  };

  const handleDownloadBoardsPDF = async () => {
    try {
      setIsGeneratingBoardsPDF(true);
      setPdfProgress(0);
      const blob = await generateBoardsPDF(generatedBoards, config, cardStyle, (pct) => setPdfProgress(pct));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `loteria-boards-${generatedBoards.length}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Error generating boards PDF.');
    } finally {
      setIsGeneratingBoardsPDF(false);
    }
  };

  const currentPreviewBoard = generatedBoards[previewBoardIndex] || generatedBoards[0];
  const activeFrameStyle = config.boardFrameStyle || 'traditional_gallo';
  const activeBorderColor = config.boardBorderColor || '#164E3D';

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 pb-20">
      {/* 1. Top Header Banner (Collapsible to maximize space) */}
      {!isHeaderCollapsed ? (
        <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-stone-900 leading-tight">
                {t('board_format_and_pdf')}
              </h3>
              <button
                type="button"
                onClick={() => setIsHeaderCollapsed(true)}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-md hover:bg-stone-100 transition-colors cursor-pointer"
                title={language === 'en' ? 'Collapse header' : 'Ocultar información'}
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
              {t('board_format_desc')}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onBack}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {t('back')}
            </button>
            <button
              onClick={onGoToGame}
              className="flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-black text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              {t('go_to_game')}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-stone-200/80 rounded-xl px-4 py-2 shadow-2xs flex items-center justify-between transition-all">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-800">
              {t('board_format_and_pdf')}
            </span>
            <button
              type="button"
              onClick={() => setIsHeaderCollapsed(false)}
              className="text-stone-500 hover:text-stone-900 p-1 rounded-md hover:bg-stone-100 transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
              title={language === 'en' ? 'Expand header' : 'Mostrar información'}
            >
              <ChevronDown className="w-3.5 h-3.5" />
              <span className="text-[11px] text-stone-500">{language === 'en' ? 'Show info' : 'Mostrar info'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onBack}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" />
              {t('back')}
            </button>
            <button
              onClick={onGoToGame}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-black text-white rounded-lg font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Play className="w-3 h-3 fill-white" />
              {t('go_to_game')}
            </button>
          </div>
        </div>
      )}

      {/* 2. Board Preview at TOP (Identical flow to Step 2 for Cards) */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-2xs flex flex-col items-center">
        {/* Navigation Bar for Boards */}
        <div className="w-full max-w-md flex items-center justify-between mb-3 px-1 text-xs">
          <span className="font-mono text-stone-500 uppercase tracking-widest text-[11px] font-semibold">
            {t('board_preview')}
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={previewBoardIndex <= 0}
              onClick={() => setPreviewBoardIndex(previewBoardIndex - 1)}
              className="p-1.5 text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg disabled:opacity-30 cursor-pointer transition-colors"
              title="Tabla anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-stone-800 text-xs px-1">
              {t('board_index_of', { current: previewBoardIndex + 1, total: generatedBoards.length })}
            </span>
            <button
              disabled={previewBoardIndex >= generatedBoards.length - 1}
              onClick={() => setPreviewBoardIndex(previewBoardIndex + 1)}
              className="p-1.5 text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg disabled:opacity-30 cursor-pointer transition-colors"
              title="Siguiente tabla"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Paper Sheet Preview Container (Ratio 22:31) */}
        {currentPreviewBoard && (
          <div className="w-full max-w-md bg-stone-100/90 p-3 sm:p-5 rounded-2xl border border-stone-200/80 shadow-inner flex flex-col items-center justify-center">
            <div
              className="w-full bg-white shadow-md transition-all relative overflow-hidden rounded-xs"
              style={{
                aspectRatio: '22 / 31',
                borderColor: activeFrameStyle !== 'none' ? activeBorderColor : '#E5E7EB',
                borderWidth: activeFrameStyle === 'none' ? '1px' : activeFrameStyle === 'traditional_gallo' ? '3px' : '2px',
                borderStyle: activeFrameStyle === 'none' ? 'dashed' : 'solid',
                padding: activeFrameStyle === 'traditional_gallo' ? '4px' : activeFrameStyle === 'festive_banner' ? '0px' : '6px',
              }}
            >
              {/* Inner wrapper for traditional gallo / talavera */}
              <div
                className={`relative h-full flex flex-col ${
                  activeFrameStyle === 'traditional_gallo'
                    ? 'p-2 border'
                    : activeFrameStyle === 'festive_banner'
                    ? ''
                    : activeFrameStyle === 'talavera_frame'
                    ? 'p-2 border'
                    : activeFrameStyle === 'clean_minimal'
                    ? 'p-1.5'
                    : 'p-1.5'
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
                    <span className="absolute -top-1 -left-1 w-2.5 h-2.5 rotate-45" style={{ backgroundColor: activeBorderColor }} />
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rotate-45" style={{ backgroundColor: activeBorderColor }} />
                    <span className="absolute -bottom-1 -left-1 w-2.5 h-2.5 rotate-45" style={{ backgroundColor: activeBorderColor }} />
                    <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rotate-45" style={{ backgroundColor: activeBorderColor }} />
                  </>
                )}

                {/* Talavera corner bracket squares */}
                {activeFrameStyle === 'talavera_frame' && (
                  <>
                    <span className="absolute top-0 left-0 w-2.5 h-2.5 border-r border-b" style={{ borderColor: activeBorderColor }} />
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 border-l border-b" style={{ borderColor: activeBorderColor }} />
                    <span className="absolute bottom-0 left-0 w-2.5 h-2.5 border-r border-t" style={{ borderColor: activeBorderColor }} />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 border-l border-t" style={{ borderColor: activeBorderColor }} />
                  </>
                )}

                {/* Header Layout */}
                {activeFrameStyle === 'festive_banner' ? (
                  <div
                    className="text-center py-2 px-3 mb-1.5 transition-colors shrink-0"
                    style={{ backgroundColor: activeBorderColor }}
                  >
                    <h2 className="font-loteria-title text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                      {config.title || t('board_title_placeholder')}
                    </h2>
                    {config.subtitle && (
                      <p className="text-[10px] italic text-amber-100 font-medium mt-0.5">
                        {config.subtitle}
                      </p>
                    )}
                    {config.showBoardNumber && (
                      <span className="inline-block mt-0.5 font-mono text-[8px] text-white/90 uppercase tracking-widest bg-black/20 px-1.5 py-0.2 rounded-full">
                        {t('board_prefix')} #{currentPreviewBoard.index}
                      </span>
                    )}
                  </div>
                ) : (
                  <div
                    className={`text-center pb-1.5 mb-1.5 shrink-0 ${
                      activeFrameStyle === 'none' ? 'border-b border-stone-200' : 'border-b'
                    }`}
                    style={{
                      borderColor: activeFrameStyle !== 'none' ? activeBorderColor : undefined,
                    }}
                  >
                    <h2
                      className="font-loteria-title text-xs sm:text-sm font-black uppercase tracking-wider transition-colors"
                      style={{
                        color: activeFrameStyle !== 'none' ? activeBorderColor : '#1C1917',
                      }}
                    >
                      {config.title || t('board_title_placeholder')}
                    </h2>
                    {config.subtitle && (
                      <p className="text-[10px] italic text-stone-600 font-medium mt-0.5">
                        {config.subtitle}
                      </p>
                    )}
                    {config.showBoardNumber && (
                      <span className="inline-block mt-0.5 font-mono text-[9px] text-stone-500 uppercase tracking-widest">
                        {t('board_prefix')} #{currentPreviewBoard.index}
                      </span>
                    )}
                  </div>
                )}

                {/* Grid Layout inside preview */}
                <div
                  className={`grid gap-1 flex-1 ${activeFrameStyle === 'festive_banner' ? 'p-1.5' : ''}`}
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

        {/* Compact Official Dimensions Note */}
        <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-stone-500">
          <Info className="w-3.5 h-3.5 text-stone-400" />
          <span>{t('official_dimensions_note')}</span>
        </div>
      </div>

      {/* 3. Configuration Options (Below Preview for seamless visual feedback) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card A: Títulos y Encabezado */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-2xs space-y-3.5">
          <div className="flex items-center gap-2 pb-1 border-b border-stone-100">
            <Type className="w-4 h-4 text-stone-700" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">
              1. {t('board_title_label')}
            </h4>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
              {t('board_title_label')}
            </label>
            <input
              type="text"
              value={config.title}
              onChange={(e) => onChangeConfig({ ...config, title: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 font-loteria-title text-sm font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900 bg-white"
              placeholder={t('board_title_placeholder')}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-1">
              {t('board_subtitle_label')}
            </label>
            <input
              type="text"
              value={config.subtitle || ''}
              onChange={(e) => onChangeConfig({ ...config, subtitle: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-900 bg-white"
              placeholder={t('board_subtitle_placeholder')}
            />
          </div>

          <div className="p-2.5 rounded-xl border border-stone-200 bg-stone-50/70 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-stone-900">
                {t('show_board_number_label')}
              </p>
              <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">
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
        </div>

        {/* Card B: Marco y Color del Tablero */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-2xs space-y-3.5">
          <div className="flex items-center gap-2 pb-1 border-b border-stone-100">
            <LayoutTemplate className="w-4 h-4 text-stone-700" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">
              2. {t('board_frame_style')}
            </h4>
          </div>

          {/* Frame Style Grid */}
          <div className="grid grid-cols-2 gap-1.5">
            {frameOptions.map((f) => {
              const isSelected = activeFrameStyle === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onChangeConfig({ ...config, boardFrameStyle: f.id })}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-stone-900 bg-stone-900 text-white shadow-xs font-bold'
                      : 'border-stone-200 text-stone-700 hover:border-stone-300 bg-white'
                  }`}
                >
                  <p className="text-xs leading-tight">{t(f.nameKey)}</p>
                  <p className={`text-[10px] mt-0.5 line-clamp-1 ${isSelected ? 'text-stone-300' : 'text-stone-400'}`}>
                    {t(f.descKey)}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Color Palette Swatches */}
          <div className="pt-2 border-t border-stone-100">
            <div className="flex items-center gap-1.5 mb-2">
              <Palette className="w-3.5 h-3.5 text-stone-600" />
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600">
                {t('board_color_theme')}
              </label>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {BOARD_COLOR_PALETTES.map((palette) => {
                const isSelected = activeBorderColor.toLowerCase() === palette.hex.toLowerCase();
                return (
                  <button
                    key={palette.hex}
                    type="button"
                    title={palette.label}
                    onClick={() => onChangeConfig({ ...config, boardBorderColor: palette.hex })}
                    className={`w-8 h-8 rounded-full border-2 transition-transform flex items-center justify-center cursor-pointer ${
                      isSelected ? 'scale-110 border-stone-900 shadow-sm' : 'border-white hover:scale-105'
                    }`}
                    style={{ backgroundColor: palette.hex }}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white drop-shadow-sm" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Card C: Tamaño de Cuadrícula */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-2xs space-y-3.5">
          <div className="flex items-center gap-2 pb-1 border-b border-stone-100">
            <Grid className="w-4 h-4 text-stone-700" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">
              3. {t('board_dimensions')}
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {presets.map((p) => {
              const isSelected = config.rows === p.rows && config.cols === p.cols;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    const updated = { ...config, rows: p.rows, cols: p.cols };
                    onChangeConfig(updated);
                    try {
                      setGeneratedBoards(generateBoards(cards, updated));
                    } catch (err: any) {
                      alert(err.message);
                    }
                  }}
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
          <div className="p-3 rounded-xl border border-stone-200 bg-stone-50/60 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-stone-900">
                {t('allow_duplicates')}
              </p>
              <p className="text-[11px] text-stone-500 mt-0.5">
                {config.allowDuplicates ? t('duplicates_allowed') : t('duplicates_not_allowed')}
              </p>
            </div>
            <input
              type="checkbox"
              checked={config.allowDuplicates}
              onChange={(e) => {
                const updated = { ...config, allowDuplicates: e.target.checked };
                onChangeConfig(updated);
                setGeneratedBoards(generateBoards(cards, updated));
              }}
              className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900 cursor-pointer"
            />
          </div>
        </div>

        {/* Card D: Cantidad de Tablas (Siempre expandido y disponible) */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between pb-1 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-stone-700" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                4. {t('board_quantity')}
              </h4>
            </div>
            <span className="font-mono font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded text-xs">
              {config.quantity} {t('boards_count')}
            </span>
          </div>

          <div className="space-y-1.5 pt-1">
            <input
              type="range"
              min={1}
              max={60}
              value={config.quantity}
              onChange={(e) => onChangeConfig({ ...config, quantity: parseInt(e.target.value, 10) })}
              className="w-full accent-stone-800 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-stone-400 font-mono">
              <span>1</span>
              <span>15</span>
              <span>30</span>
              <span>60 tablas</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRegenerate}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-bold text-xs transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {t('regenerate_boards')}
          </button>
        </div>
      </div>

      {/* 4. PASO FINAL: Exportar e Imprimir tus PDFs */}
      <div className="bg-gradient-to-br from-stone-900 to-stone-950 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-stone-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
              {language === 'en' ? 'Final Step: Print & Export PDFs' : 'Paso Final: Descargar Archivos de Impresión'}
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2.5 py-0.5 rounded-full">
            {language === 'en' ? 'Ready to Print' : 'Listos para Imprimir'}
          </span>
        </div>

        <p className="text-xs text-stone-400 max-w-xl">
          {language === 'en'
            ? 'Your 54 deck cards and custom boards are ready. Download the high-resolution vector PDFs below to cut and play:'
            : 'Tu baraja de 54 cartas y tus tablas personalizadas están listas. Descarga los PDFs vectoriales en alta resolución para recortar y jugar:'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          {/* PDF 1: Baraja de 54 Cartas */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 flex flex-col justify-between hover:border-white/20 transition-all">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-white text-sm">{t('pdf_deck_title')}</span>
                <span className="bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-md border border-emerald-500/30 text-[10px]">
                  {t('cards_4_per_sheet')}
                </span>
              </div>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                {t('cards_per_page_hint')}
              </p>
            </div>
            <button
              disabled={isGeneratingCardsPDF}
              onClick={handleDownloadCardsPDF}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-white hover:bg-stone-100 text-stone-900 rounded-xl text-xs font-bold disabled:opacity-50 transition-colors cursor-pointer shadow-sm"
            >
              <FileDown className="w-4 h-4 text-stone-900" />
              {isGeneratingCardsPDF ? t('generating_pdf', { progress: pdfProgress }) : t('download_deck_pdf')}
            </button>
          </div>

          {/* PDF 2: Tablas de Lotería */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 flex flex-col justify-between hover:border-white/20 transition-all">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-white text-sm">
                  {t('pdf_boards_title', { count: generatedBoards.length })}
                </span>
                <span className="text-[10px] text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-md font-bold">
                  22 × 31 cm
                </span>
              </div>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                {language === 'en'
                  ? 'Individual boards centered with authentic proportions and cutting crop guides.'
                  : 'Tablas individuales centradas con proporciones auténticas y guías de recorte.'}
              </p>
            </div>
            <button
              disabled={isGeneratingBoardsPDF}
              onClick={handleDownloadBoardsPDF}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-white hover:bg-stone-100 text-stone-900 rounded-xl text-xs font-bold disabled:opacity-50 transition-colors cursor-pointer shadow-sm"
            >
              <FileDown className="w-4 h-4 text-stone-900" />
              {isGeneratingBoardsPDF ? t('generating_pdf', { progress: pdfProgress }) : t('download_boards_pdf', { count: generatedBoards.length })}
            </button>
          </div>
        </div>

        {/* Direct transition to play game */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10">
          <span className="text-xs text-stone-400">
            {language === 'en'
              ? 'Ready to host the game? Start calling the cards online:'
              : '¿Listo para jugar la partida? Comienza a cantar las cartas en vivo:'}
          </span>
          <button
            onClick={onGoToGame}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            {t('go_to_game')}
          </button>
        </div>
      </div>
    </div>
  );
};

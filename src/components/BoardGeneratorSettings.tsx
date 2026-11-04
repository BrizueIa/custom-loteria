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
  Layers
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

  // Dynamic collapsible accordion state: initially closed so menu is compact and short
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (sectionId: string) => {
    setOpenSection((current) => (current === sectionId ? null : sectionId));
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

  const activePalette =
    BOARD_COLOR_PALETTES.find((p) => p.hex.toLowerCase() === activeBorderColor.toLowerCase()) || {
      hex: activeBorderColor,
      label: language === 'en' ? 'Custom' : 'Personalizado',
    };
  const activeFrame = frameOptions.find((f) => f.id === activeFrameStyle) || frameOptions[0];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-stone-900">
            {t('board_format_and_pdf')}
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            {t('board_format_desc')}
          </p>
        </div>

        <div className="flex items-center gap-2">
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Settings Column - Dynamic Collapsible Accordion */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200/80 p-4 space-y-3 shadow-2xs">
          {/* Compact Info Callout for Official Dimensions */}
          <div className="p-2.5 bg-stone-50 border border-stone-200/70 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-stone-700">
              <Info className="w-4 h-4 text-stone-500 shrink-0" />
              <span className="text-[11px] font-medium leading-tight">
                <strong className="text-stone-900">22×31 cm</strong> • Baraja 5.2×7.8 cm (proporción oficial)
              </span>
            </div>
            <span className="text-[10px] bg-stone-200/60 font-mono font-semibold px-2 py-0.5 rounded text-stone-600">
              Carta / A4
            </span>
          </div>

          {/* Section 1: Título y Subtítulo */}
          <div className="border border-stone-200/90 rounded-xl overflow-hidden bg-white transition-all">
            <button
              type="button"
              onClick={() => toggleSection('header')}
              className="w-full p-3 flex items-center justify-between text-left cursor-pointer hover:bg-stone-50/80 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Type className="w-4 h-4 text-stone-600 shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-stone-900 block leading-tight">
                    {t('board_title_label')}
                  </span>
                  <span className="text-[11px] text-stone-500 truncate block mt-0.5 font-medium">
                    {config.title || t('board_title_placeholder')}
                    {config.subtitle ? ` • "${config.subtitle}"` : ''}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                {openSection === 'header' ? (
                  <ChevronUp className="w-4 h-4 text-stone-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-stone-400" />
                )}
              </div>
            </button>

            {openSection === 'header' && (
              <div className="p-3 pt-1 border-t border-stone-100 space-y-3 bg-stone-50/40">
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

                <div className="p-2.5 rounded-xl border border-stone-200 bg-white flex items-start justify-between gap-3">
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

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setOpenSection(null)}
                    className="px-3 py-1 bg-stone-900 hover:bg-black text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                  >
                    {language === 'en' ? 'Done' : 'Listo'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Marco del Tablero (Auto-minimiza al elegir) */}
          <div className="border border-stone-200/90 rounded-xl overflow-hidden bg-white transition-all">
            <button
              type="button"
              onClick={() => toggleSection('frame')}
              className="w-full p-3 flex items-center justify-between text-left cursor-pointer hover:bg-stone-50/80 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <LayoutTemplate className="w-4 h-4 text-stone-600 shrink-0" />
                <span className="text-xs font-bold text-stone-900">
                  {t('board_frame_style')}
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
              <div className="p-3 pt-1 border-t border-stone-100 space-y-2 bg-stone-50/40">
                <p className="text-[11px] text-stone-500 mb-1">
                  {language === 'en'
                    ? 'Click any frame style below. It will update the board and minimize automatically:'
                    : 'Selecciona cualquier estilo. Se actualizará la vista previa y se minimizará automáticamente:'}
                </p>
                <div className="grid grid-cols-1 gap-1.5">
                  {frameOptions.map((f) => {
                    const isSelected = activeFrameStyle === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          onChangeConfig({ ...config, boardFrameStyle: f.id });
                          setOpenSection(null); // Auto-minimizar al seleccionar
                        }}
                        className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                            : 'border-stone-200 text-stone-700 hover:border-stone-300 bg-white'
                        }`}
                      >
                        <div>
                          <p className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-stone-900'}`}>
                            {t(f.nameKey)}
                          </p>
                          <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                            {t(f.descKey)}
                          </p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-white shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Color del Marco (Auto-minimiza al elegir) */}
          <div className="border border-stone-200/90 rounded-xl overflow-hidden bg-white transition-all">
            <button
              type="button"
              onClick={() => toggleSection('color')}
              className="w-full p-3 flex items-center justify-between text-left cursor-pointer hover:bg-stone-50/80 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Palette className="w-4 h-4 text-stone-600 shrink-0" />
                <span className="text-xs font-bold text-stone-900">
                  {t('board_color_theme')}
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
              <div className="p-3 pt-1 border-t border-stone-100 space-y-2 bg-stone-50/40">
                <p className="text-[11px] text-stone-500 mb-1">
                  {language === 'en'
                    ? 'Pick a color swatch to apply it and minimize:'
                    : 'Toca un color para aplicarlo al marco y minimizar:'}
                </p>
                <div className="flex items-center gap-2.5 flex-wrap py-1">
                  {BOARD_COLOR_PALETTES.map((palette) => {
                    const isSelected = activeBorderColor.toLowerCase() === palette.hex.toLowerCase();
                    return (
                      <button
                        key={palette.hex}
                        type="button"
                        title={palette.label}
                        onClick={() => {
                          onChangeConfig({ ...config, boardBorderColor: palette.hex });
                          setOpenSection(null); // Auto-minimizar al seleccionar
                        }}
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
              </div>
            )}
          </div>

          {/* Section 4: Tamaño de Cuadrícula (Auto-minimiza al elegir preset) */}
          <div className="border border-stone-200/90 rounded-xl overflow-hidden bg-white transition-all">
            <button
              type="button"
              onClick={() => toggleSection('grid')}
              className="w-full p-3 flex items-center justify-between text-left cursor-pointer hover:bg-stone-50/80 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Grid className="w-4 h-4 text-stone-600 shrink-0" />
                <span className="text-xs font-bold text-stone-900">
                  {t('board_dimensions')}
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
              <div className="p-3 pt-1 border-t border-stone-100 space-y-3 bg-stone-50/40">
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
                          setOpenSection(null); // Auto-minimizar al seleccionar
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
                <div className="p-3 rounded-xl border border-stone-200 bg-white flex items-center justify-between">
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
            )}
          </div>

          {/* Section 5: Cantidad de Tablas y Regenerar */}
          <div className="border border-stone-200/90 rounded-xl overflow-hidden bg-white transition-all">
            <button
              type="button"
              onClick={() => toggleSection('quantity')}
              className="w-full p-3 flex items-center justify-between text-left cursor-pointer hover:bg-stone-50/80 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Layers className="w-4 h-4 text-stone-600 shrink-0" />
                <span className="text-xs font-bold text-stone-900">
                  {t('board_quantity')}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-mono font-bold text-stone-800 bg-stone-100 px-2 py-0.5 rounded-md">
                  {config.quantity} {t('boards_count')}
                </span>
                {openSection === 'quantity' ? (
                  <ChevronUp className="w-4 h-4 text-stone-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-stone-400" />
                )}
              </div>
            </button>

            {openSection === 'quantity' && (
              <div className="p-3 pt-1 border-t border-stone-100 space-y-3 bg-stone-50/40">
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-600 uppercase tracking-wider">{t('board_quantity')}</span>
                    <span className="font-mono font-bold text-stone-900 bg-white px-2 py-0.5 rounded border border-stone-200">
                      {config.quantity} {t('boards_count')}
                    </span>
                  </div>
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
                    <span>60</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRegenerate}
                  className="w-full flex items-center justify-center gap-1.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {t('regenerate_boards')}
                </button>
              </div>
            )}
          </div>

          {/* Section 6: Descargas PDF */}
          <div className="border border-stone-200/90 rounded-xl overflow-hidden bg-white transition-all">
            <button
              type="button"
              onClick={() => toggleSection('pdf')}
              className="w-full p-3 flex items-center justify-between text-left cursor-pointer hover:bg-stone-50/80 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <FileDown className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="text-xs font-bold text-stone-900">
                  {t('print_pdf_section')}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                  PDF
                </span>
                {openSection === 'pdf' ? (
                  <ChevronUp className="w-4 h-4 text-stone-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-stone-400" />
                )}
              </div>
            </button>

            {openSection === 'pdf' && (
              <div className="p-3 pt-1 border-t border-stone-100 space-y-2.5 bg-stone-50/40">
                {/* PDF 1: Baraja de 54 Cartas */}
                <div className="p-3 rounded-xl border border-stone-200 bg-white space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-900">{t('pdf_deck_title')}</span>
                    <span className="bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">
                      {t('cards_4_per_sheet')}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    {t('cards_per_page_hint')}
                  </p>
                  <button
                    disabled={isGeneratingCardsPDF}
                    onClick={handleDownloadCardsPDF}
                    className="w-full flex items-center justify-center gap-1.5 py-2 bg-stone-900 hover:bg-black text-white rounded-lg text-xs font-bold disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    {isGeneratingCardsPDF ? t('generating_pdf', { progress: pdfProgress }) : t('download_deck_pdf')}
                  </button>
                </div>

                {/* PDF 2: Tablas de Lotería */}
                <div className="p-3 rounded-xl border border-stone-200 bg-white space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-900">{t('pdf_boards_title', { count: generatedBoards.length })}</span>
                    <span className="text-[11px] text-stone-500">{t('one_board_per_sheet')}</span>
                  </div>
                  <button
                    disabled={isGeneratingBoardsPDF}
                    onClick={handleDownloadBoardsPDF}
                    className="w-full flex items-center justify-center gap-1.5 py-2 bg-stone-900 hover:bg-black text-white rounded-lg text-xs font-bold disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    {isGeneratingBoardsPDF ? t('generating_pdf', { progress: pdfProgress }) : t('download_boards_pdf', { count: generatedBoards.length })}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Board Preview Column */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-3 px-1 text-xs">
            <span className="font-mono text-stone-500 uppercase tracking-widest">
              {t('board_preview')}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={previewBoardIndex <= 0}
                onClick={() => setPreviewBoardIndex(previewBoardIndex - 1)}
                className="p-1 text-stone-600 hover:text-stone-900 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-stone-700">
                {t('board_index_of', { current: previewBoardIndex + 1, total: generatedBoards.length })}
              </span>
              <button
                disabled={previewBoardIndex >= generatedBoards.length - 1}
                onClick={() => setPreviewBoardIndex(previewBoardIndex + 1)}
                className="p-1 text-stone-600 hover:text-stone-900 disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Authentic Board Mockup with Dynamic Frame & Colors */}
          {currentPreviewBoard && (
            <div className="w-full max-w-md bg-stone-100/80 p-3 sm:p-4 rounded-2xl border border-stone-200/80 shadow-2xs flex flex-col items-center justify-center">
              {/* Paper Sheet Preview Container (Ratio 22:31) */}
              <div
                className="w-full bg-white shadow-sm transition-all relative overflow-hidden rounded-xs"
                style={{
                  aspectRatio: '22 / 31',
                  borderColor: activeFrameStyle !== 'none' ? activeBorderColor : '#E5E7EB',
                  borderWidth: activeFrameStyle === 'none' ? '1px' : activeFrameStyle === 'traditional_gallo' ? '3px' : '2px',
                  borderStyle: activeFrameStyle === 'none' ? 'dashed' : 'solid',
                  padding: activeFrameStyle === 'traditional_gallo' ? '4px' : activeFrameStyle === 'festive_banner' ? '0px' : '6px',
                }}
              >
                {/* Inner wrapper for traditional gallo */}
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
                    borderColor: activeFrameStyle === 'traditional_gallo' || activeFrameStyle === 'talavera_frame'
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
        </div>
      </div>
    </div>
  );
};

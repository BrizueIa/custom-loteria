import React, { useState, useRef } from 'react';
import {
  CardStyleConfig,
  FrameStyle,
  NumberPosition,
  NamePosition,
  LogoPosition,
  LogoSize,
  CardDimensionPreset,
  LoteriaCard,
} from '../types/loteria';
import { CardPreview } from './CardPreview';
import { optimizeLogoImage } from '../utils/imageOptimizer';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  LayoutTemplate,
  Hash,
  Type,
  Check,
  Palette,
  Image as ImageIcon,
  Maximize2,
  Trash2,
  Upload,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

type SectionKey = 'frame' | 'number' | 'name' | 'logo' | 'colors' | 'dimensions';

const CARD_COLOR_PALETTES = [
  { hex: '#141413', label: 'Negro Carbón (Clásico)' },
  { hex: '#164E3D', label: 'Verde Tradicional' },
  { hex: '#991B1B', label: 'Rojo Patrio' },
  { hex: '#1E3A8A', label: 'Azul Talavera' },
  { hex: '#B45309', label: 'Ocre Dorado' },
  { hex: '#7C2D12', label: 'Barro Cocido' },
  { hex: '#BE185D', label: 'Rosa Mexicano' },
  { hex: '#581C87', label: 'Morado Festivo' },
  { hex: '#0F766E', label: 'Esmeralda' },
  { hex: '#475569', label: 'Gris Pizarra' },
];

interface CardStyleSelectorProps {
  config: CardStyleConfig;
  onChange: (updated: CardStyleConfig) => void;
  cards?: LoteriaCard[];
  sampleCard?: LoteriaCard;
  onBack: () => void;
  onNext: () => void;
  initialTourDone?: boolean;
  onCompleteInitialTour?: () => void;
}

export const CardStyleSelector: React.FC<CardStyleSelectorProps> = ({
  config,
  onChange,
  cards,
  sampleCard,
  onBack,
  onNext,
  initialTourDone = false,
  onCompleteInitialTour,
}) => {
  const { t, language } = useLanguage();
  const [showFullPreview, setShowFullPreview] = useState(false);

  // Card sample selection logic:
  // Never default to the cover card (#0 without visible number); default to Card #1 or first playable card
  const cardList = cards && cards.length > 0 ? cards : sampleCard ? [sampleCard] : [];
  const defaultPlayableCard =
    (sampleCard && sampleCard.number > 0 && !sampleCard.isCover ? sampleCard : null) ||
    cardList.find((c) => c.number === 1) ||
    cardList.find((c) => !c.isCover && c.number > 0) ||
    cardList[0];

  const [selectedCardId, setSelectedCardId] = useState<string>(
    () => defaultPlayableCard?.id || sampleCard?.id || ''
  );

  const activeSampleCard =
    cardList.find((c) => c.id === selectedCardId) || defaultPlayableCard || sampleCard || cardList[0];

  const currentCardIndex = cardList.findIndex((c) => c.id === activeSampleCard?.id);

  const handlePrevCard = () => {
    if (cardList.length === 0) return;
    const nextIdx = (currentCardIndex - 1 + cardList.length) % cardList.length;
    setSelectedCardId(cardList[nextIdx].id);
  };

  const handleNextCard = () => {
    if (cardList.length === 0) return;
    const nextIdx = (currentCardIndex + 1) % cardList.length;
    setSelectedCardId(cardList[nextIdx].id);
  };

  const logoInputRef = useRef<HTMLInputElement>(null);
  const [customBorderColor, setCustomBorderColor] = useState(config.borderColor || '#141413');
  const [customTextColor, setCustomTextColor] = useState(config.textColor || '#141413');

  // Guided walkthrough only on first time if initialTourDone is false
  const [autoGuidedStep, setAutoGuidedStep] = useState<SectionKey | null>(
    initialTourDone ? null : 'frame'
  );
  const [openSection, setOpenSection] = useState<SectionKey | null>(
    initialTourDone ? null : 'frame'
  );

  const toggleSection = (s: SectionKey) => {
    if (openSection === s) {
      setOpenSection(null);
    } else {
      setOpenSection(s);
    }
    // Any manual click on a section header disables auto-advancing (enters exploration mode)
    setAutoGuidedStep(null);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await optimizeLogoImage(file);
      onChange({
        ...config,
        logo: {
          enabled: true,
          image: dataUrl,
          position: config.logo?.position || (config.numberPosition === 'top-left' ? 'top-right' : 'top-left'),
          size: config.logo?.size || 'md',
          opacity: config.logo?.opacity ?? 1,
        },
      });
    } catch (err) {
      console.error('Error uploading logo:', err);
    }
  };

  const handleRemoveLogo = () => {
    onChange({
      ...config,
      logo: undefined,
    });
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const handleSelectFrame = (frameId: FrameStyle) => {
    onChange({ ...config, frameStyle: frameId });
    if (autoGuidedStep === 'frame') {
      setOpenSection('number');
      setAutoGuidedStep('number');
    }
    // In exploration mode (autoGuidedStep !== 'frame'), keep section open so user can test styles
  };

  const handleSelectNumber = (posId: NumberPosition) => {
    onChange({ ...config, numberPosition: posId });
    if (autoGuidedStep === 'number') {
      setOpenSection('name');
      setAutoGuidedStep('name');
    }
    // In exploration mode, keep section open so user can test corners
  };

  const handleSelectName = (namePos: NamePosition) => {
    onChange({ ...config, namePosition: namePos });
    if (autoGuidedStep === 'name') {
      setOpenSection(null);
      setAutoGuidedStep(null);
      onCompleteInitialTour?.();
    }
    // In exploration mode, keep section open so user can test positions
  };

  const frameOptions: Array<{ id: FrameStyle; label: string; desc: string }> = [
    {
      id: 'classic_loteria',
      label: t('frame_classic'),
      desc: t('frame_classic_desc')
    },
    {
      id: 'botanical_litho',
      label: t('frame_litho'),
      desc: t('frame_litho_desc')
    },
    {
      id: 'talavera',
      label: t('frame_talavera'),
      desc: t('frame_talavera_desc')
    },
    {
      id: 'editorial_luxury',
      label: t('frame_editorial'),
      desc: t('frame_editorial_desc')
    },
    {
      id: 'organic_floral',
      label: t('frame_floral'),
      desc: t('frame_floral_desc')
    }
  ];

  const numberPositions: Array<{ id: NumberPosition; label: string }> = [
    { id: 'top-left', label: t('pos_top_left') },
    { id: 'top-right', label: t('pos_top_right') },
    { id: 'bottom-left', label: t('pos_bottom_left') },
    { id: 'bottom-right', label: t('pos_bottom_right') }
  ];

  const namePositions: Array<{ id: NamePosition; label: string }> = [
    { id: 'bottom', label: t('pos_bottom') },
    { id: 'top', label: t('pos_top') }
  ];

  const logoPositions: Array<{ id: LogoPosition; label: string }> = [
    { id: 'top-left', label: t('pos_top_left') },
    { id: 'top-right', label: t('pos_top_right') },
    { id: 'bottom-left', label: t('pos_bottom_left') },
    { id: 'bottom-right', label: t('pos_bottom_right') },
  ];

  const logoSizes: Array<{ id: LogoSize; label: string }> = [
    { id: 'sm', label: t('size_sm') },
    { id: 'md', label: t('size_md') },
    { id: 'lg', label: t('size_lg') },
  ];

  const cardDimensionPresets: Array<{ id: CardDimensionPreset; label: string; desc: string }> = [
    { id: '4_per_page', label: t('card_size_4'), desc: '8.4 × 11.8 cm • 4 por hoja' },
    { id: '6_per_page', label: t('card_size_6'), desc: '7.0 × 9.8 cm • 6 por hoja' },
    { id: '9_per_page', label: t('card_size_9'), desc: '6.3 × 8.8 cm • 9 por hoja (Baraja Tradicional)' },
    { id: '16_per_page', label: t('card_size_16'), desc: '4.5 × 6.3 cm • 16 por hoja (Mini)' },
    { id: 'custom', label: t('card_size_custom'), desc: 'Medidas exactas en cm' },
  ];

  const activeFrame = frameOptions.find((f) => f.id === config.frameStyle) || frameOptions[0];
  const activeNumberPos = numberPositions.find((p) => p.id === config.numberPosition) || numberPositions[0];
  const activeNamePos = namePositions.find((p) => p.id === config.namePosition) || namePositions[0];

  return (
    <div className="w-full max-w-5xl mx-auto pb-24 px-1 sm:px-2">
      {/* 2-Column Responsive Layout: Left = Sticky Preview, Right = Customization Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start">
        {/* Left Column: Live Card Preview & Switcher (Sticky on Desktop) */}
        <div className="lg:col-span-5 xl:col-span-5 lg:sticky lg:top-4 flex flex-col items-center">
          <div className="w-full bg-white rounded-2xl border border-stone-200 p-3 sm:p-5 shadow-2xs flex flex-col items-center justify-center gap-3">
            <div className="w-56 sm:w-64 aspect-[3/4] relative">
              <CardPreview
                card={activeSampleCard}
                style={config}
                className="w-full h-full shadow-md"
              />
            </div>

            {/* Card switcher / selector to test any card */}
            {cardList.length > 1 && (
              <div className="w-full max-w-xs flex items-center justify-between gap-1 p-1 bg-stone-50 rounded-xl border border-stone-200">
                <button
                  type="button"
                  onClick={handlePrevCard}
                  className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                  title={language === 'en' ? 'Previous sample card' : 'Carta de muestra anterior'}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex-1 min-w-0 flex items-center justify-center">
                  <select
                    value={activeSampleCard?.id}
                    onChange={(e) => setSelectedCardId(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-lg px-2 py-1 text-xs font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-emerald-700 truncate cursor-pointer text-center"
                  >
                    {cardList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.number === 0 || c.isCover
                          ? `🎴 Portada: ${c.name}`
                          : `#${c.number} ${c.name}`}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleNextCard}
                  className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                  title={language === 'en' ? 'Next sample card' : 'Siguiente carta de muestra'}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="text-center text-xs text-stone-500 flex flex-col items-center gap-1">
              <p className="font-bold text-stone-800 text-xs sm:text-sm">{t('card_preview_title')}</p>
              <button
                onClick={() => setShowFullPreview(true)}
                className="flex items-center gap-1 px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-emerald-700" />
                <span>{t('final_preview')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Controls & Configuration Accordions */}
        <div className="lg:col-span-7 xl:col-span-7 space-y-3">

      {/* Modal de Vista Previa Final */}
      {showFullPreview && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-stone-100 rounded-3xl p-5 max-w-sm w-full flex flex-col items-center relative shadow-2xl border border-stone-300">
            <button
              onClick={() => setShowFullPreview(false)}
              className="absolute top-3 right-3 p-1.5 bg-white text-stone-700 hover:text-black rounded-full border border-stone-200 shadow-xs cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3">
              {t('final_preview')}
            </span>
            <div className="w-64 aspect-[3/4] relative">
              <CardPreview card={activeSampleCard} style={config} className="w-full h-full shadow-lg" />
            </div>
            <p className="text-[11px] text-stone-500 text-center mt-3">
              Proporción y marco idénticos al formato de impresión en PDF.
            </p>
          </div>
        </div>
      )}

      {/* 1. Estilo de Marco (Colapsable con auto-minimización al elegir) */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => toggleSection('frame')}
          className="w-full p-3 flex items-center justify-between text-left cursor-pointer hover:bg-stone-50/80 transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <LayoutTemplate className="w-4 h-4 text-stone-600 shrink-0" />
            <span className="text-xs font-bold text-stone-900">
              1. {t('frame_style')}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-bold text-emerald-900 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
              {activeFrame.label}
            </span>
            {openSection === 'frame' ? (
              <ChevronUp className="w-4 h-4 text-stone-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-stone-400" />
            )}
          </div>
        </button>

        {openSection === 'frame' && (
          <div className="p-3 pt-1 border-t border-stone-100 bg-stone-50/40">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {frameOptions.map((f) => {
                const isSelected = config.frameStyle === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => handleSelectFrame(f.id)}
                    className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-800 bg-emerald-50/80 ring-1 ring-emerald-800 text-emerald-950 font-bold'
                        : 'border-stone-200 hover:border-stone-300 bg-white text-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs">{f.label}</p>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-800 shrink-0 ml-1" />}
                    </div>
                    <p className="text-[10px] text-stone-500 font-normal mt-0.5 line-clamp-1">{f.desc}</p>
                  </button>
                );
              })}
            </div>

            {/* Sub-footer for open section */}
            <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-stone-200/60">
              <span className="text-[10px] text-stone-500 italic">
                {autoGuidedStep === 'frame'
                  ? (language === 'en' ? 'Choose a frame to continue' : 'Elige un marco para avanzar')
                  : (language === 'en' ? 'Tap frames to test in preview' : 'Toca opciones para probar en vivo')}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (autoGuidedStep === 'frame') {
                    setOpenSection('number');
                    setAutoGuidedStep('number');
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

      {/* 2. Posición del Número (Colapsable con auto-minimización en primer paso y prueba libre al reabrir) */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => toggleSection('number')}
          className="w-full p-3 flex items-center justify-between text-left cursor-pointer hover:bg-stone-50/80 transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Hash className="w-4 h-4 text-stone-600 shrink-0" />
            <span className="text-xs font-bold text-stone-900">
              2. {t('number_pos')}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-md">
              {activeNumberPos.label}
            </span>
            {openSection === 'number' ? (
              <ChevronUp className="w-4 h-4 text-stone-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-stone-400" />
            )}
          </div>
        </button>

        {openSection === 'number' && (
          <div className="p-3 pt-1 border-t border-stone-100 bg-stone-50/40">
            <div className="grid grid-cols-4 gap-1.5">
              {numberPositions.map((pos) => {
                const isSelected = config.numberPosition === pos.id;
                return (
                  <button
                    key={pos.id}
                    onClick={() => handleSelectNumber(pos.id)}
                    className={`p-2 rounded-lg border text-center text-[11px] font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-800 bg-emerald-800 text-white shadow-xs'
                        : 'border-stone-200 text-stone-600 bg-white hover:border-stone-300'
                    }`}
                  >
                    {pos.label}
                  </button>
                );
              })}
            </div>

            {/* Sub-footer for open section */}
            <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-stone-200/60">
              <span className="text-[10px] text-stone-500 italic">
                {autoGuidedStep === 'number'
                  ? (language === 'en' ? 'Select position to continue' : 'Elige posición para avanzar')
                  : (language === 'en' ? 'Tap corners to test in preview' : 'Toca esquinas para probar en vivo')}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (autoGuidedStep === 'number') {
                    setOpenSection('name');
                    setAutoGuidedStep('name');
                  } else {
                    setOpenSection(null);
                  }
                }}
                className="flex items-center gap-1 px-3 py-1 bg-stone-900 hover:bg-black text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{autoGuidedStep === 'number' ? (language === 'en' ? 'Next' : 'Siguiente') : t('done')}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Posición del Nombre (Colapsable con auto-minimización en primer paso y prueba libre al reabrir) */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => toggleSection('name')}
          className="w-full p-3 flex items-center justify-between text-left cursor-pointer hover:bg-stone-50/80 transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Type className="w-4 h-4 text-stone-600 shrink-0" />
            <span className="text-xs font-bold text-stone-900">
              3. {t('name_pos')}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-md">
              {activeNamePos.label}
            </span>
            {openSection === 'name' ? (
              <ChevronUp className="w-4 h-4 text-stone-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-stone-400" />
            )}
          </div>
        </button>

        {openSection === 'name' && (
          <div className="p-3 pt-1 border-t border-stone-100 bg-stone-50/40">
            <div className="grid grid-cols-2 gap-2">
              {namePositions.map((nPos) => {
                const isSelected = config.namePosition === nPos.id;
                return (
                  <button
                    key={nPos.id}
                    onClick={() => handleSelectName(nPos.id)}
                    className={`p-2 rounded-lg border text-center text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-800 bg-emerald-800 text-white shadow-xs'
                        : 'border-stone-200 text-stone-600 bg-white hover:border-stone-300'
                    }`}
                  >
                    {nPos.label}
                  </button>
                );
              })}
            </div>

            {/* Sub-footer for open section */}
            <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-stone-200/60">
              <span className="text-[10px] text-stone-500 italic">
                {autoGuidedStep === 'name'
                  ? (language === 'en' ? 'Select position to finish' : 'Elige posición para finalizar')
                  : (language === 'en' ? 'Tap position to test in preview' : 'Toca posición para probar en vivo')}
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

      {/* 4. Logotipo en Cartas */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => toggleSection('logo')}
          className="w-full p-3 flex items-center justify-between text-left cursor-pointer hover:bg-stone-50/80 transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <ImageIcon className="w-4 h-4 text-stone-600 shrink-0" />
            <span className="text-xs font-bold text-stone-900">
              4. {t('card_logo_title')}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                config.logo?.enabled && config.logo?.image
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-stone-100 text-stone-600'
              }`}
            >
              {config.logo?.enabled && config.logo?.image
                ? language === 'en'
                  ? 'Active'
                  : 'Activo'
                : language === 'en'
                ? 'None'
                : 'Sin logo'}
            </span>
            {openSection === 'logo' ? (
              <ChevronUp className="w-4 h-4 text-stone-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-stone-400" />
            )}
          </div>
        </button>

        {openSection === 'logo' && (
          <div className="p-3 pt-1 border-t border-stone-100 bg-stone-50/40 space-y-3">
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/svg+xml,image/jpeg,image/webp"
              onChange={handleLogoUpload}
              className="hidden"
            />

            {!config.logo?.image ? (
              <div className="p-3 border-2 border-dashed border-stone-300 rounded-xl bg-white text-center space-y-2">
                <p className="text-xs text-stone-600">
                  {t('card_logo_desc')}
                </p>
                <p className="text-[10px] text-stone-400">
                  {language === 'en' ? 'PNG with transparent background is recommended' : 'Se recomienda PNG con fondo transparente'}
                </p>
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl cursor-pointer shadow-2xs transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{t('upload_logo')}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Logo active card & actions */}
                <div className="flex items-center justify-between p-2.5 bg-white border border-stone-200 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-lg border border-stone-200 bg-stone-50 p-1 flex items-center justify-center overflow-hidden">
                      <img
                        src={config.logo.image}
                        alt="Logo"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-stone-900 block">
                        {language === 'en' ? 'Logo Loaded' : 'Logotipo Cargado'}
                      </span>
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="text-[11px] text-emerald-700 hover:underline font-semibold cursor-pointer"
                      >
                        {t('change_logo')}
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title={t('remove_logo')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Corner Selector */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                    {t('logo_position')}
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {logoPositions.map((pos) => {
                      const isSelected = (config.logo?.position || 'top-right') === pos.id;
                      const hasNumber = config.numberPosition === pos.id;
                      return (
                        <button
                          key={pos.id}
                          type="button"
                          onClick={() =>
                            onChange({
                              ...config,
                              logo: {
                                enabled: true,
                                image: '',
                                size: 'md',
                                opacity: 1,
                                ...(config.logo || {}),
                                position: pos.id,
                              },
                            })
                          }
                          className={`p-2 rounded-lg border text-left text-[11px] font-semibold transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'border-emerald-800 bg-emerald-800 text-white shadow-xs'
                              : 'border-stone-200 text-stone-700 bg-white hover:border-stone-300'
                          }`}
                        >
                          <span>{pos.label}</span>
                          {hasNumber && (
                            <span
                              className={`text-[9px] px-1 rounded ${
                                isSelected ? 'bg-emerald-950/60 text-emerald-100' : 'bg-stone-100 text-stone-500'
                              }`}
                            >
                              N°
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Size Selector */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                    {t('logo_size')}
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {logoSizes.map((sz) => {
                      const isSelected = (config.logo?.size || 'md') === sz.id;
                      return (
                        <button
                          key={sz.id}
                          type="button"
                          onClick={() =>
                            onChange({
                              ...config,
                              logo: {
                                enabled: true,
                                image: '',
                                position: 'top-right',
                                opacity: 1,
                                ...(config.logo || {}),
                                size: sz.id,
                              },
                            })
                          }
                          className={`p-1.5 rounded-lg border text-center text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? 'border-emerald-800 bg-emerald-800 text-white shadow-xs'
                              : 'border-stone-200 text-stone-700 bg-white hover:border-stone-300'
                          }`}
                        >
                          {sz.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Opacity Slider */}
                <div>
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                    <span>{t('logo_opacity')}</span>
                    <span>{Math.round((config.logo?.opacity ?? 1) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="1"
                    step="0.05"
                    value={config.logo?.opacity ?? 1}
                    onChange={(e) =>
                      onChange({
                        ...config,
                        logo: {
                          enabled: true,
                          image: '',
                          position: 'top-right',
                          size: 'md',
                          ...(config.logo || {}),
                          opacity: parseFloat(e.target.value),
                        },
                      })
                    }
                    className="w-full accent-emerald-800 cursor-pointer"
                  />
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

      {/* 5. Colores de la Carta (Marco y Texto) */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => toggleSection('colors')}
          className="w-full p-3 flex items-center justify-between text-left cursor-pointer hover:bg-stone-50/80 transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Palette className="w-4 h-4 text-stone-600 shrink-0" />
            <span className="text-xs font-bold text-stone-900">
              5. {t('card_colors_title')}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="w-3.5 h-3.5 rounded-full border border-stone-300 shadow-2xs shrink-0"
              style={{ backgroundColor: config.borderColor || '#141413' }}
              title="Color de marco"
            />
            <span
              className="w-3.5 h-3.5 rounded-full border border-stone-300 shadow-2xs shrink-0 font-bold text-[9px] flex items-center justify-center bg-stone-100"
              style={{ color: config.textColor || '#141413' }}
              title="Color de texto"
            >
              A
            </span>
            {openSection === 'colors' ? (
              <ChevronUp className="w-4 h-4 text-stone-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-stone-400" />
            )}
          </div>
        </button>

        {openSection === 'colors' && (
          <div className="p-3 pt-1 border-t border-stone-100 bg-stone-50/40 space-y-3">
            {/* Color del Marco de la Carta */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                {t('border_color')}
              </label>
              <div className="flex items-center gap-2 flex-wrap py-1">
                {CARD_COLOR_PALETTES.map((palette) => {
                  const isSelected = (config.borderColor || '#141413').toLowerCase() === palette.hex.toLowerCase();
                  return (
                    <button
                      key={palette.hex}
                      type="button"
                      title={palette.label}
                      onClick={() => {
                        setCustomBorderColor(palette.hex);
                        onChange({ ...config, borderColor: palette.hex });
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
                {/* Native color picker for card border */}
                <div className="flex items-center gap-1.5 ml-1">
                  <input
                    type="color"
                    value={customBorderColor}
                    onChange={(e) => {
                      setCustomBorderColor(e.target.value);
                      onChange({ ...config, borderColor: e.target.value });
                    }}
                    className="w-7 h-7 rounded-full border border-stone-300 cursor-pointer overflow-hidden p-0"
                    title={t('custom_color')}
                  />
                  <span className="text-[10px] font-mono text-stone-500">{config.borderColor || '#141413'}</span>
                </div>
              </div>
            </div>

            {/* Color del Texto de la Carta */}
            <div className="pt-2 border-t border-stone-200/60">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                {t('text_color')}
              </label>
              <div className="flex items-center gap-2 flex-wrap py-1">
                {CARD_COLOR_PALETTES.map((palette) => {
                  const isSelected = (config.textColor || '#141413').toLowerCase() === palette.hex.toLowerCase();
                  return (
                    <button
                      key={palette.hex}
                      type="button"
                      title={palette.label}
                      onClick={() => {
                        setCustomTextColor(palette.hex);
                        onChange({ ...config, textColor: palette.hex });
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
                {/* Native color picker for card text */}
                <div className="flex items-center gap-1.5 ml-1">
                  <input
                    type="color"
                    value={customTextColor}
                    onChange={(e) => {
                      setCustomTextColor(e.target.value);
                      onChange({ ...config, textColor: e.target.value });
                    }}
                    className="w-7 h-7 rounded-full border border-stone-300 cursor-pointer overflow-hidden p-0"
                    title={t('custom_color')}
                  />
                  <span className="text-[10px] font-mono text-stone-500">{config.textColor || '#141413'}</span>
                </div>
              </div>
            </div>

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

      {/* 6. Medidas de Cartas para Impresión en PDF */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => toggleSection('dimensions')}
          className="w-full p-3 flex items-center justify-between text-left cursor-pointer hover:bg-stone-50/80 transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Maximize2 className="w-4 h-4 text-stone-600 shrink-0" />
            <span className="text-xs font-bold text-stone-900">
              6. {t('card_print_size')}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-md">
              {config.cardDimensions?.preset === '9_per_page'
                ? '9 por hoja'
                : config.cardDimensions?.preset === '6_per_page'
                ? '6 por hoja'
                : config.cardDimensions?.preset === '16_per_page'
                ? '16 por hoja'
                : config.cardDimensions?.preset === 'custom'
                ? 'Personalizado'
                : '4 por hoja'}
            </span>
            {openSection === 'dimensions' ? (
              <ChevronUp className="w-4 h-4 text-stone-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-stone-400" />
            )}
          </div>
        </button>

        {openSection === 'dimensions' && (
          <div className="p-3 pt-1 border-t border-stone-100 bg-stone-50/40 space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {cardDimensionPresets.map((p) => {
                const activePreset = config.cardDimensions?.preset || '4_per_page';
                const isSelected = activePreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() =>
                      onChange({
                        ...config,
                        cardDimensions: {
                          preset: p.id,
                          widthCm: config.cardDimensions?.widthCm || 6.3,
                          heightCm: config.cardDimensions?.heightCm || 8.8,
                        },
                      })
                    }
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-800 bg-emerald-800 text-white font-bold shadow-xs'
                        : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                    }`}
                  >
                    <p className="text-xs leading-tight">{p.label}</p>
                    <p
                      className={`text-[10px] mt-0.5 line-clamp-1 ${
                        isSelected ? 'text-emerald-100' : 'text-stone-400'
                      }`}
                    >
                      {p.desc}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Custom dimensions inputs if 'custom' is selected */}
            {config.cardDimensions?.preset === 'custom' && (
              <div className="p-2.5 bg-white border border-stone-200 rounded-xl space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600 block">
                  {language === 'en' ? 'Custom Card Size (cm)' : 'Medidas de cada Carta (cm)'}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-stone-500 mb-0.5">Ancho (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="3"
                      max="15"
                      value={config.cardDimensions?.widthCm || 6.3}
                      onChange={(e) =>
                        onChange({
                          ...config,
                          cardDimensions: {
                            preset: 'custom',
                            widthCm: parseFloat(e.target.value) || 6.3,
                            heightCm: config.cardDimensions?.heightCm || 8.8,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1 text-xs border border-stone-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-stone-500 mb-0.5">Alto (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="4"
                      max="20"
                      value={config.cardDimensions?.heightCm || 8.8}
                      onChange={(e) =>
                        onChange({
                          ...config,
                          cardDimensions: {
                            preset: 'custom',
                            widthCm: config.cardDimensions?.widthCm || 6.3,
                            heightCm: parseFloat(e.target.value) || 8.8,
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

      {/* Option: Show/Hide Tagline */}
      <div className="bg-white rounded-2xl border border-stone-200 p-3 flex items-center justify-between shadow-2xs">
        <div>
          <p className="text-xs font-bold text-stone-900">
            {t('show_tagline_card')}
          </p>
          <p className="text-[11px] text-stone-500">
            {t('show_tagline_hint')}
          </p>
        </div>
        <input
          type="checkbox"
          checked={config.showTaglineOnCard}
          onChange={(e) => onChange({ ...config, showTaglineOnCard: e.target.checked })}
          className="w-4 h-4 rounded border-stone-300 text-emerald-800 focus:ring-emerald-800 cursor-pointer"
        />
      </div>

      {/* Desktop inline footer actions (visible on lg screens) */}
      <div className="hidden lg:flex items-center justify-between gap-3 pt-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('back')}</span>
        </button>
        <button
          onClick={onNext}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-sm transition-transform active:scale-95 cursor-pointer"
        >
          <span>{t('next_boards')}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>

      {/* Sticky Bottom Actions (Mobile only) */}
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
            <span>{t('next_boards')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

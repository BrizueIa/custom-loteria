import React, { useState } from 'react';
import { CardStyleConfig, FrameStyle, NumberPosition, NamePosition, LoteriaCard } from '../types/loteria';
import { CardPreview } from './CardPreview';
import { ArrowLeft, ArrowRight, Eye, X, ChevronDown, ChevronUp, LayoutTemplate, Hash, Type } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface CardStyleSelectorProps {
  config: CardStyleConfig;
  onChange: (updated: CardStyleConfig) => void;
  sampleCard: LoteriaCard;
  onBack: () => void;
  onNext: () => void;
}

export const CardStyleSelector: React.FC<CardStyleSelectorProps> = ({
  config,
  onChange,
  sampleCard,
  onBack,
  onNext,
}) => {
  const { t } = useLanguage();
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [openSection, setOpenSection] = useState<'frame' | 'number' | 'name' | null>('frame');

  const toggleSection = (s: 'frame' | 'number' | 'name') => {
    setOpenSection((prev) => (prev === s ? null : s));
  };

  const frameOptions: Array<{ id: FrameStyle; label: string; desc: string }> = [
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
      id: 'classic_loteria',
      label: t('frame_classic'),
      desc: t('frame_classic_desc')
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

  const activeFrame = frameOptions.find((f) => f.id === config.frameStyle) || frameOptions[0];
  const activeNumberPos = numberPositions.find((p) => p.id === config.numberPosition) || numberPositions[0];
  const activeNamePos = namePositions.find((p) => p.id === config.namePosition) || namePositions[0];

  return (
    <div className="w-full max-w-md mx-auto space-y-3 pb-24">
      {/* Live Preview Container (Top, Centered, Fits Mobile) */}
      <div className="w-full bg-white rounded-2xl border border-stone-200 p-3 sm:p-4 shadow-2xs flex flex-col items-center justify-center gap-2">
        <div className="w-56 sm:w-64 aspect-[3/4] relative">
          <CardPreview
            card={sampleCard}
            style={config}
            className="w-full h-full shadow-md"
          />
        </div>
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
              <CardPreview card={sampleCard} style={config} className="w-full h-full shadow-lg" />
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
              {frameOptions.map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    onChange({ ...config, frameStyle: f.id });
                    setOpenSection('number'); // Auto-despliega el siguiente (Número)
                  }}
                  className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                    config.frameStyle === f.id
                      ? 'border-emerald-800 bg-emerald-50/80 ring-1 ring-emerald-800 text-emerald-950 font-bold'
                      : 'border-stone-200 hover:border-stone-300 bg-white text-stone-700'
                  }`}
                >
                  <p className="text-xs">{f.label}</p>
                  <p className="text-[10px] text-stone-500 font-normal mt-0.5 line-clamp-1">{f.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Posición del Número (Colapsable con auto-minimización al elegir) */}
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
              {numberPositions.map((pos) => (
                <button
                  key={pos.id}
                  onClick={() => {
                    onChange({ ...config, numberPosition: pos.id });
                    setOpenSection('name'); // Auto-despliega el siguiente (Nombre)
                  }}
                  className={`p-2 rounded-lg border text-center text-[11px] font-semibold transition-all cursor-pointer ${
                    config.numberPosition === pos.id
                      ? 'border-emerald-800 bg-emerald-800 text-white'
                      : 'border-stone-200 text-stone-600 bg-white hover:border-stone-300'
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Posición del Nombre (Colapsable con auto-minimización al elegir) */}
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
              {namePositions.map((nPos) => (
                <button
                  key={nPos.id}
                  onClick={() => {
                    onChange({ ...config, namePosition: nPos.id });
                    setOpenSection(null); // Auto-colapsa al seleccionar
                  }}
                  className={`p-2 rounded-lg border text-center text-xs font-semibold transition-all cursor-pointer ${
                    config.namePosition === nPos.id
                      ? 'border-emerald-800 bg-emerald-800 text-white'
                      : 'border-stone-200 text-stone-600 bg-white hover:border-stone-300'
                  }`}
                >
                  {nPos.label}
                </button>
              ))}
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

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-stone-200 z-20 flex justify-center">
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

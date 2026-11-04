import React, { useState } from 'react';
import { CardStyleConfig, FrameStyle, NumberPosition, NamePosition, LoteriaCard } from '../types/loteria';
import { CardPreview } from './CardPreview';
import { ArrowLeft, ArrowRight, Eye, X } from 'lucide-react';
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

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 pb-20">
      {/* Live Preview Container (Matches exact card size and proportions from Step 1) */}
      <div className="w-full bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs flex flex-col items-center justify-center gap-3">
        <div className="w-64 sm:w-72 aspect-[3/4] relative">
          <CardPreview
            card={sampleCard}
            style={config}
            className="w-full h-full shadow-md"
          />
        </div>
        <div className="text-center text-xs text-stone-500 max-w-sm flex flex-col items-center gap-1.5">
          <p className="font-bold text-stone-800 text-sm">{t('card_preview_title')}</p>
          <p className="mt-0.5">{t('card_preview_hint')}</p>
          <button
            onClick={() => setShowFullPreview(true)}
            className="mt-1 flex items-center gap-1 px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition-colors"
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
              className="absolute top-3 right-3 p-1.5 bg-white text-stone-700 hover:text-black rounded-full border border-stone-200 shadow-xs"
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

      {/* Frame Style Grid (Compact 2 columns) */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
          1. {t('frame_style')}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {frameOptions.map((f) => (
            <button
              key={f.id}
              onClick={() => onChange({ ...config, frameStyle: f.id })}
              className={`text-left p-2.5 rounded-xl border transition-all ${
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

      {/* Number & Name Placement */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Number position */}
        <div className="bg-white rounded-2xl border border-stone-200 p-3.5 space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
            2. {t('number_pos')}
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {numberPositions.map((pos) => (
              <button
                key={pos.id}
                onClick={() => onChange({ ...config, numberPosition: pos.id })}
                className={`p-2 rounded-lg border text-center text-[11px] font-semibold transition-all ${
                  config.numberPosition === pos.id
                    ? 'border-emerald-800 bg-emerald-800 text-white'
                    : 'border-stone-200 text-stone-600 bg-stone-50'
                }`}
              >
                {pos.label}
              </button>
            ))}
          </div>
        </div>

        {/* Name position */}
        <div className="bg-white rounded-2xl border border-stone-200 p-3.5 space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
            3. {t('name_pos')}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {namePositions.map((nPos) => (
              <button
                key={nPos.id}
                onClick={() => onChange({ ...config, namePosition: nPos.id })}
                className={`p-2 rounded-lg border text-center text-xs font-semibold transition-all ${
                  config.namePosition === nPos.id
                    ? 'border-emerald-800 bg-emerald-800 text-white'
                    : 'border-stone-200 text-stone-600 bg-stone-50'
                }`}
              >
                {nPos.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Option: Show/Hide Tagline */}
      <div className="bg-white rounded-2xl border border-stone-200 p-3.5 flex items-center justify-between">
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
            className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 rounded-xl"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t('back')}
          </button>
          <button
            onClick={onNext}
            className="flex-1 max-w-xs flex items-center justify-center gap-1.5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-sm transition-transform active:scale-95"
          >
            <span>{t('next_boards')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

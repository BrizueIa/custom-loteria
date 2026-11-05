import React, { useState, useRef } from 'react';
import { LoteriaCard, CardStyleConfig } from '../types/loteria';
import { CardPreview } from './CardPreview';
import { useLanguage } from '../i18n/LanguageContext';
import { Upload, ArrowRight, HelpCircle, X, Trash2, RotateCcw } from 'lucide-react';

interface CardsGridViewProps {
  cards: LoteriaCard[];
  cardStyle: CardStyleConfig;
  onSelectCard: (index: number) => void;
  onUpdateCardName?: (cardId: string, newName: string) => void;
  onBatchUpload: (files: FileList) => void;
  onClearAllImages?: () => void;
  onResetToDefaultDeck?: () => void;
  onSwapNumber: (cardId: string, newNumber: number) => void;
  onContinue: () => void;
}

export const CardsGridView: React.FC<CardsGridViewProps> = ({
  cards,
  cardStyle,
  onSelectCard,
  onUpdateCardName,
  onBatchUpload,
  onClearAllImages,
  onResetToDefaultDeck,
  onSwapNumber,
  onContinue
}) => {
  const { t, language } = useLanguage();
  const [showHelp, setShowHelp] = useState(false);
  const batchInputRef = useRef<HTMLInputElement>(null);
  const playableCards = cards.filter(c => c.number > 0 && !c.isCover);

  const handleBatchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onBatchUpload(e.target.files);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 pb-24 px-1 sm:px-2">
      {/* Super Compact Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs sm:text-sm font-bold text-stone-800">
            {language === 'en'
              ? `1 Cover + ${playableCards.length} ${t('cards')}`
              : `1 Tapa + ${playableCards.length} ${t('cards')}`}
          </span>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="text-stone-400 hover:text-emerald-800 p-1 rounded-md transition-colors cursor-pointer"
            title={t('instructions_title')}
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <button
            onClick={() => batchInputRef.current?.click()}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 rounded-xl text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer"
            title={t('batch_upload_photos')}
          >
            <Upload className="w-3.5 h-3.5 text-emerald-700" />
            <span>{t('batch_upload_photos')}</span>
          </button>
          <input
            ref={batchInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleBatchChange}
          />

          {onClearAllImages && (
            <button
              onClick={onClearAllImages}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-white hover:bg-rose-50 border border-stone-200 hover:border-rose-200 text-stone-700 hover:text-rose-700 rounded-xl text-xs sm:text-sm font-semibold shadow-2xs transition-all cursor-pointer"
              title={t('clear_all_photos')}
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>{t('clear_all_photos')}</span>
            </button>
          )}

          {onResetToDefaultDeck && (
            <button
              onClick={onResetToDefaultDeck}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-600 rounded-xl text-xs sm:text-sm font-semibold shadow-2xs transition-all cursor-pointer"
              title={t('reset_default_deck')}
            >
              <RotateCcw className="w-3 h-3 text-stone-500" />
              <span className="hidden sm:inline">{t('reset_default_deck')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Optional / Dismissible Help Banner */}
      {showHelp && (
        <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-3 sm:p-4 text-xs sm:text-sm text-emerald-950 flex items-start justify-between gap-3 animate-in fade-in">
          <p className="leading-relaxed">
            {t('instructions_text')}
          </p>
          <button
            onClick={() => setShowHelp(false)}
            className="text-emerald-700 hover:text-emerald-950 p-0.5 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Grid of 54 cards:
          - Mobile (<640px): 3 columns (3 x 18 = 54)
          - Tablet (640-768px): 4 columns
          - Laptop / Medium desktop (768-1280px): 6 columns (6 x 9 = 54)
          - Large widescreen desktop (>=1280px): 9 columns (9 x 6 = 54, exactly 6 uniform rows)
      */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-9 gap-2 sm:gap-2.5 lg:gap-3">
        {cards.map((card, idx) => {
          const isCover = card.number === 0 || Boolean(card.isCover);
          return (
            <div
              key={card.id}
              className={`group relative flex flex-col items-center rounded-2xl p-1.5 sm:p-2 border transition-all cursor-pointer ${
                isCover
                  ? 'bg-amber-50/40 border-amber-400/90 ring-1 ring-amber-400/50 hover:border-amber-600 hover:shadow-md'
                  : 'bg-white border-stone-200/90 hover:border-emerald-600 hover:shadow-md'
              }`}
            >
              <div
                onClick={() => onSelectCard(idx)}
                className="w-full"
              >
                <CardPreview
                  card={card}
                  style={cardStyle}
                  variant="grid"
                  className="w-full"
                />
              </div>

              {/* Footer: Editable Number + Editable Name */}
              <div className="w-full mt-1.5 pt-1 border-t border-stone-100 flex flex-col gap-1 px-0.5">
                <div className="flex items-center justify-between gap-1 w-full">
                  {isCover ? (
                    <span className="text-[10px] font-mono font-extrabold text-amber-900 bg-amber-100/80 border border-amber-300/80 rounded px-1.5 py-0.5 uppercase tracking-wide">
                      {language === 'en' ? 'COVER' : 'PORTADA'}
                    </span>
                  ) : (
                    <div className="flex items-center">
                      <select
                        value={card.number}
                        onChange={(e) => onSwapNumber(card.id, parseInt(e.target.value, 10))}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[10px] sm:text-[11px] font-mono font-bold bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-600 transition-colors cursor-pointer"
                        title="Cambiar número de carta"
                      >
                        {playableCards.map(c => (
                          <option key={c.number} value={c.number}>
                            #{c.number}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCard(idx);
                    }}
                    className="text-[10px] text-stone-400 hover:text-emerald-700 transition-colors p-0.5 rounded cursor-pointer"
                    title="Editar foto y detalles"
                  >
                    ✏️
                  </button>
                </div>

                <input
                  type="text"
                  value={card.name}
                  onChange={(e) => onUpdateCardName?.(card.id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder={isCover ? 'Portada' : 'Nombre'}
                  className="w-full text-[10px] sm:text-[11px] font-bold text-stone-800 bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 hover:border-stone-300 focus:border-emerald-600 rounded px-1 py-0.5 text-center truncate focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all cursor-text"
                  title="Editar nombre directamente"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky Bottom Action Bar for Mobile Thumb Ergonomics */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-stone-200 z-20 flex justify-center">
        <div className="w-full max-w-md flex items-center justify-between gap-3">
          <span className="text-xs text-stone-500 font-medium">
            {language === 'en'
              ? `1 Cover + ${playableCards.length} ${t('cards')}`
              : `1 Tapa + ${playableCards.length} ${t('cards')}`}
          </span>
          <button
            onClick={onContinue}
            className="flex-1 max-w-xs flex items-center justify-center gap-1.5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-sm transition-transform active:scale-95"
          >
            <span>{t('continue_to_frames')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

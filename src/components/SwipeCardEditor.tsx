import React, { useRef, useState } from 'react';
import { LoteriaCard, CardStyleConfig } from '../types/loteria';
import { CardPreview } from './CardPreview';
import { ChevronLeft, ChevronRight, Upload, LayoutGrid, ArrowLeftRight, Trash2, Eye, X } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { createCleanCardPlaceholder } from '../data/defaultCards';
import { optimizeImage } from '../utils/imageOptimizer';

interface SwipeCardEditorProps {
  cards: LoteriaCard[];
  cardStyle: CardStyleConfig;
  currentIndex: number;
  onSelectIndex: (index: number) => void;
  onUpdateCard: (updated: LoteriaCard) => void;
  onSwapNumber: (cardId: string, newNumber: number) => void;
  onOpenGrid: () => void;
}

export const SwipeCardEditor: React.FC<SwipeCardEditorProps> = ({
  cards,
  cardStyle,
  currentIndex,
  onSelectIndex,
  onUpdateCard,
  onSwapNumber,
  onOpenGrid,
}) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const currentCard = cards[currentIndex] || cards[0];

  const handlePrev = () => {
    if (currentIndex > 0) onSelectIndex(currentIndex - 1);
    else onSelectIndex(cards.length - 1);
  };

  const handleNext = () => {
    if (currentIndex < cards.length - 1) onSelectIndex(currentIndex + 1);
    else onSelectIndex(0);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await optimizeImage(file);
      if (dataUrl) {
        onUpdateCard({
          ...currentCard,
          image: dataUrl
        });
      }
    } catch (err) {
      console.error('Error optimizing image:', err);
    }
    if (e.target) e.target.value = '';
  };

  const handleRemoveImage = () => {
    onUpdateCard({
      ...currentCard,
      image: createCleanCardPlaceholder(currentCard.name, currentCard.number)
    });
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center">
      {/* Top action bar */}
      <div className="w-full flex items-center justify-between mb-3 px-1">
        <button
          onClick={onOpenGrid}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold transition-colors"
        >
          <LayoutGrid className="w-3.5 h-3.5 text-stone-600" />
          {t('view_grid_btn', { count: cards.length })}
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFullPreview(true)}
            className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-semibold rounded-lg shadow-2xs"
            title={t('final_preview')}
          >
            <Eye className="w-3.5 h-3.5 text-emerald-700" />
            <span className="hidden xs:inline">{t('final_preview')}</span>
          </button>

          <span className="text-xs font-mono text-stone-500 bg-white border border-stone-200 px-2.5 py-0.5 rounded-md">
            {t('card_n_of_54', { num: currentIndex + 1 })}
          </span>
        </div>
      </div>

      {/* Carousel */}
      <div className="relative w-full flex items-center justify-center gap-2 sm:gap-3 py-1">
        <button
          onClick={handlePrev}
          aria-label={t('previous')}
          className="p-2.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 rounded-full shadow-2xs transition-transform active:scale-95"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Center Card */}
        <div className="w-64 sm:w-72 relative group">
          <CardPreview
            card={currentCard}
            style={cardStyle}
            onClick={() => fileInputRef.current?.click()}
            className="shadow-md cursor-pointer hover:ring-2 hover:ring-emerald-700/50 transition-all"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-3 right-3 bg-stone-900/90 hover:bg-black text-white p-2 rounded-full shadow-md transition-transform active:scale-95 flex items-center justify-center"
            title={t('change_photo')}
          >
            <Upload className="w-3.5 h-3.5" />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>

        <button
          onClick={handleNext}
          aria-label={t('next')}
          className="p-2.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 rounded-full shadow-2xs transition-transform active:scale-95"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Controles rápidos de imagen para esta carta */}
      <div className="flex items-center justify-center gap-2 mt-2 w-full max-w-xs">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-2xs active:scale-95 transition-all"
          title={t('change_photo')}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>{t('change_photo')}</span>
        </button>

        <button
          onClick={handleRemoveImage}
          className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white hover:bg-rose-50 text-stone-700 hover:text-rose-700 text-xs font-semibold border border-stone-200 hover:border-rose-200 rounded-xl active:scale-95 transition-all"
          title={t('remove_photo')}
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
          <span>{t('remove_photo')}</span>
        </button>
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
              <CardPreview card={currentCard} style={cardStyle} className="w-full h-full shadow-lg" />
            </div>
            <p className="text-[11px] text-stone-500 text-center mt-3">
              Así es exactamente como se imprimirá y se verá en tus tablas PDF.
            </p>
          </div>
        </div>
      )}

      {/* Card Details Editor */}
      <div className="w-full bg-white border border-stone-200/80 rounded-2xl p-4 sm:p-5 mt-4 shadow-2xs space-y-4">
        {/* Name input */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
            {t('card_name')}
          </label>
          <input
            type="text"
            value={currentCard.name}
            onChange={(e) => onUpdateCard({ ...currentCard, name: e.target.value })}
            className="w-full px-3.5 py-2 rounded-xl border border-stone-300 font-loteria-card text-base font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
            placeholder={t('card_name_placeholder')}
          />
        </div>

        {/* Tagline / Frase */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
            {t('card_tagline')}
          </label>
          <input
            type="text"
            value={currentCard.tagline || ''}
            onChange={(e) => onUpdateCard({ ...currentCard, tagline: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-700 focus:outline-none focus:ring-1 focus:ring-stone-900"
            placeholder={t('card_tagline_placeholder')}
          />
        </div>

        {/* Swap number */}
        <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-stone-600">
            <ArrowLeftRight className="w-3.5 h-3.5 text-stone-400" />
            <span className="font-semibold">{t('swap_number_with')}</span>
          </div>

          <select
            value={currentCard.number}
            onChange={(e) => onSwapNumber(currentCard.id, parseInt(e.target.value, 10))}
            className="px-2.5 py-1 rounded-lg border border-stone-300 bg-stone-50 text-stone-900 font-bold text-xs focus:outline-none"
          >
            {Array.from({ length: cards.length }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                #{n} {cards.find(c => c.number === n && c.id !== currentCard.id) ? `(${cards.find(c => c.number === n)?.name.slice(0, 16)})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

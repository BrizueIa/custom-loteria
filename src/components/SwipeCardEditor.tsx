import React, { useRef, useState } from 'react';
import { LoteriaCard, CardStyleConfig } from '../types/loteria';
import { CardPreview } from './CardPreview';
import {
  ChevronLeft,
  ChevronRight,
  Upload,
  LayoutGrid,
  ArrowLeftRight,
  Trash2,
  Eye,
  X,
  Pipette,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { createCleanCardPlaceholder } from '../data/defaultCards';
import { optimizeImage, extractBackgroundColorFromImage } from '../utils/imageOptimizer';

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
  const { t, language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [isEyedropperActive, setIsEyedropperActive] = useState(false);
  const currentCard = cards[currentIndex] || cards[0];
  const isCoverCard = currentCard.number === 0 || Boolean(currentCard.isCover);
  const playableCards = cards.filter(c => c.number > 0 && !c.isCover);

  const handlePrev = () => {
    setIsEyedropperActive(false);
    if (currentIndex > 0) onSelectIndex(currentIndex - 1);
    else onSelectIndex(cards.length - 1);
  };

  const handleNext = () => {
    setIsEyedropperActive(false);
    if (currentIndex < cards.length - 1) onSelectIndex(currentIndex + 1);
    else onSelectIndex(0);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await optimizeImage(file);
      if (dataUrl) {
        const autoBg = await extractBackgroundColorFromImage(dataUrl);
        onUpdateCard({
          ...currentCard,
          image: dataUrl,
          backgroundColor: autoBg,
          featherEdges: true,
        });
      }
    } catch (err) {
      console.error('Error optimizing image:', err);
    }
    if (e.target) e.target.value = '';
  };

  const handleRemoveImage = () => {
    setIsEyedropperActive(false);
    onUpdateCard({
      ...currentCard,
      image: createCleanCardPlaceholder(currentCard.name, currentCard.number),
      backgroundColor: '#FAF7F2',
    });
  };

  const handleAutoDetectColor = async () => {
    const autoBg = await extractBackgroundColorFromImage(currentCard.image);
    onUpdateCard({
      ...currentCard,
      backgroundColor: autoBg,
    });
    setIsEyedropperActive(false);
  };

  const handlePickColorFromCard = (hexColor: string) => {
    onUpdateCard({
      ...currentCard,
      backgroundColor: hexColor,
    });
    setIsEyedropperActive(false);
  };

  const activeBgColor = currentCard.backgroundColor || cardStyle.cardBgColor || '#FFFFFF';

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, cards.length]);

  return (
    <div className="w-full max-w-5xl mx-auto pb-12 px-1 sm:px-2">
      {/* Top action bar */}
      <div className="w-full flex items-center justify-between mb-4 px-1">
        <button
          onClick={onOpenGrid}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
        >
          <LayoutGrid className="w-3.5 h-3.5 text-stone-600" />
          {t('view_grid_btn', { count: cards.length })}
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFullPreview(true)}
            className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-xs font-semibold rounded-lg shadow-2xs cursor-pointer"
            title={t('final_preview')}
          >
            <Eye className="w-3.5 h-3.5 text-emerald-700" />
            <span className="hidden xs:inline">{t('final_preview')}</span>
          </button>

          <span
            className={`text-xs font-mono px-2.5 py-0.5 rounded-md border ${
              isCoverCard
                ? 'bg-amber-50 text-amber-900 border-amber-300 font-bold'
                : 'text-stone-500 bg-white border-stone-200'
            }`}
          >
            {isCoverCard
              ? language === 'en'
                ? 'Cover / Portada (No #)'
                : 'Tapa / Portada (Sin #)'
              : t('card_n_of_54', { num: currentCard.number })}
          </span>
        </div>
      </div>

      {/* Two-Column Grid on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column: Carousel, Visual Card Preview, Photo & Color Controls */}
        <div className="lg:col-span-6 xl:col-span-5 flex flex-col items-center lg:sticky lg:top-4">
          {/* Eyedropper active instruction banner */}
      {isEyedropperActive && (
        <div className="w-full max-w-xs mb-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-semibold flex items-center justify-between gap-2 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-1.5">
            <Pipette className="w-4 h-4 text-amber-700 shrink-0 animate-bounce" />
            <span>
              {language === 'en'
                ? 'Tap anywhere on the card image to absorb that background color'
                : 'Toca el fondo de la imagen en la carta para absorber ese color'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsEyedropperActive(false)}
            className="p-1 text-amber-800 hover:text-amber-950 rounded-md"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

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
            isEyedropperActive={isEyedropperActive}
            onPickColor={handlePickColorFromCard}
            onClick={() => fileInputRef.current?.click()}
            className="shadow-md cursor-pointer hover:ring-2 hover:ring-emerald-700/50 transition-all"
          />

          {!isEyedropperActive && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-3 right-3 bg-stone-900/90 hover:bg-black text-white p-2 rounded-full shadow-md transition-transform active:scale-95 flex items-center justify-center z-30"
              title={t('change_photo')}
            >
              <Upload className="w-3.5 h-3.5" />
            </button>
          )}

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

      {/* Barra de Gotero y Color de Fondo Unificado */}
      <div className="w-full max-w-xs mt-2.5 bg-white border border-stone-200/90 rounded-2xl p-2.5 shadow-2xs space-y-2">
        <div className="flex items-center justify-between gap-1.5">
          {/* Botón Gotero Interactivo */}
          <button
            type="button"
            onClick={() => setIsEyedropperActive((prev) => !prev)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              isEyedropperActive
                ? 'bg-amber-600 text-white border-amber-700 ring-2 ring-amber-300 shadow-xs'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-800 border-stone-200'
            }`}
            title={
              language === 'en'
                ? 'Pick background color directly from the image'
                : 'Absorber color de fondo tocando la imagen'
            }
          >
            <Pipette className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Eyedropper' : 'Gotero'}</span>
          </button>

          {/* Botón Auto-Detectar Fondo */}
          <button
            type="button"
            onClick={handleAutoDetectColor}
            className="flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 transition-colors cursor-pointer"
            title={
              language === 'en'
                ? 'Auto-detect border color from image'
                : 'Detectar automáticamente el color de la orilla de la imagen'
            }
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            <span>Auto</span>
          </button>

          {/* Selector manual / Muestra del color actual */}
          <label
            className="flex items-center gap-1.5 px-2 py-1 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 cursor-pointer"
            title={language === 'en' ? 'Adjust background color manually' : 'Ajustar color de fondo manualmente'}
          >
            <input
              type="color"
              value={activeBgColor}
              onChange={(e) =>
                onUpdateCard({
                  ...currentCard,
                  backgroundColor: e.target.value.toUpperCase(),
                })
              }
              className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent"
            />
            <span className="font-mono text-[10px] font-bold text-stone-600 uppercase">
              {activeBgColor}
            </span>
          </label>
        </div>

        {/* Toggle para suavizar orillas de la imagen */}
        <label className="flex items-center justify-between pt-1.5 border-t border-stone-100 text-[11px] text-stone-600 cursor-pointer select-none">
          <span>
            {language === 'en'
              ? 'Blend image edges with background'
              : 'Suavizar orillas de la imagen con el fondo'}
          </span>
          <input
            type="checkbox"
            checked={currentCard.featherEdges !== false}
            onChange={(e) =>
              onUpdateCard({
                ...currentCard,
                featherEdges: e.target.checked,
              })
            }
            className="w-3.5 h-3.5 rounded border-stone-300 text-emerald-800 focus:ring-emerald-800 cursor-pointer"
          />
        </label>
      </div>
    </div>

    {/* Right Column: Card Details Editor */}
    <div className="lg:col-span-6 xl:col-span-7 space-y-4">
      <div className="w-full bg-white border border-stone-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
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

        {/* Cover info OR Swap number */}
        <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
          {isCoverCard ? (
            <div className="w-full py-1 px-2.5 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 font-semibold text-[11px] text-center">
              {language === 'en'
                ? 'Deck Cover Card: Printed without visible number and excluded from caller game & boards.'
                : 'Carta Tapa / Portada: Se imprime sin número visible y no entra al juego ni a las tablas.'}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1.5 text-stone-600">
                <ArrowLeftRight className="w-3.5 h-3.5 text-stone-400" />
                <span className="font-semibold">{t('swap_number_with')}</span>
              </div>

              <select
                value={currentCard.number}
                onChange={(e) => onSwapNumber(currentCard.id, parseInt(e.target.value, 10))}
                className="px-2.5 py-1 rounded-lg border border-stone-300 bg-stone-50 text-stone-900 font-bold text-xs focus:outline-none"
              >
                {playableCards.map((c) => (
                  <option key={c.number} value={c.number}>
                    #{c.number} {c.id !== currentCard.id ? `(${c.name.slice(0, 16)})` : ''}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>

      {/* Desktop navigation hint */}
      <div className="hidden lg:flex items-center justify-between p-3 bg-stone-50 border border-stone-200/80 rounded-xl text-stone-500 text-xs">
        <span className="text-[11px]">
          {language === 'en'
            ? 'Tip: You can use the ← and → arrow keys to navigate between cards.'
            : 'Tip: Puedes usar las flechas ← y → del teclado para navegar entre cartas.'}
        </span>
        <div className="flex items-center gap-1 font-mono text-[10px]">
          <kbd className="px-1.5 py-0.5 bg-white border border-stone-200 rounded shadow-2xs font-semibold">←</kbd>
          <kbd className="px-1.5 py-0.5 bg-white border border-stone-200 rounded shadow-2xs font-semibold">→</kbd>
        </div>
      </div>
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
          <CardPreview card={currentCard} style={cardStyle} className="w-full h-full shadow-lg" />
        </div>
        <p className="text-[11px] text-stone-500 text-center mt-3">
          Así es exactamente como se imprimirá y se verá en tus tablas PDF.
        </p>
      </div>
    </div>
  )}
</div>
  );
};

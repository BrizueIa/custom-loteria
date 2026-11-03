import React, { useRef } from 'react';
import { LoteriaCard, CardStyleConfig } from '../types/loteria';
import { CardPreview } from './CardPreview';
import { ChevronLeft, ChevronRight, Upload, LayoutGrid, ArrowLeftRight } from 'lucide-react';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentCard = cards[currentIndex] || cards[0];

  const handlePrev = () => {
    if (currentIndex > 0) onSelectIndex(currentIndex - 1);
    else onSelectIndex(cards.length - 1);
  };

  const handleNext = () => {
    if (currentIndex < cards.length - 1) onSelectIndex(currentIndex + 1);
    else onSelectIndex(0);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onUpdateCard({
          ...currentCard,
          image: dataUrl
        });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center">
      {/* Top action bar */}
      <div className="w-full flex items-center justify-between mb-4 px-1">
        <button
          onClick={onOpenGrid}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold transition-colors"
        >
          <LayoutGrid className="w-3.5 h-3.5 text-stone-600" />
          Ver Cuadrícula (54)
        </button>

        <span className="text-xs font-mono text-stone-500 bg-white border border-stone-200 px-2.5 py-0.5 rounded-md">
          Carta {currentIndex + 1} de {cards.length}
        </span>
      </div>

      {/* Carousel */}
      <div className="relative w-full flex items-center justify-center gap-3 py-2">
        <button
          onClick={handlePrev}
          aria-label="Anterior"
          className="p-2.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 rounded-full shadow-2xs transition-transform active:scale-95"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Center Card */}
        <div className="w-64 sm:w-72 relative">
          <CardPreview
            card={currentCard}
            style={cardStyle}
            className="shadow-md"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-3 right-3 bg-stone-900 hover:bg-black text-white p-2 rounded-full shadow-sm transition-transform active:scale-95 flex items-center justify-center"
            title="Cambiar imagen de esta carta"
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
          aria-label="Siguiente"
          className="p-2.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 rounded-full shadow-2xs transition-transform active:scale-95"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Card Details Editor */}
      <div className="w-full bg-white border border-stone-200/80 rounded-2xl p-4 sm:p-5 mt-4 shadow-2xs space-y-4">
        {/* Name input */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
            Nombre de la Carta
          </label>
          <input
            type="text"
            value={currentCard.name}
            onChange={(e) => onUpdateCard({ ...currentCard, name: e.target.value })}
            className="w-full px-3.5 py-2 rounded-xl border border-stone-300 font-loteria-card text-base font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
            placeholder="Nombre de la carta..."
          />
        </div>

        {/* Tagline / Frase */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
            Frase o Dicho Opcional
          </label>
          <input
            type="text"
            value={currentCard.tagline || ''}
            onChange={(e) => onUpdateCard({ ...currentCard, tagline: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-700 focus:outline-none focus:ring-1 focus:ring-stone-900"
            placeholder="Ej. ¡La que decora la sala con orgullo!"
          />
        </div>

        {/* Swap number */}
        <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-stone-600">
            <ArrowLeftRight className="w-3.5 h-3.5 text-stone-400" />
            <span className="font-semibold">Intercambiar número:</span>
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

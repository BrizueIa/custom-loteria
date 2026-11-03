import React, { useState, useRef } from 'react';
import { LoteriaCard, CardStyleConfig } from '../types/loteria';
import { CardPreview } from './CardPreview';
import { Upload, ArrowRight, HelpCircle, X } from 'lucide-react';

interface CardsGridViewProps {
  cards: LoteriaCard[];
  cardStyle: CardStyleConfig;
  onSelectCard: (index: number) => void;
  onBatchUpload: (files: FileList) => void;
  onSwapNumber: (cardId: string, newNumber: number) => void;
  onContinue: () => void;
}

export const CardsGridView: React.FC<CardsGridViewProps> = ({
  cards,
  cardStyle,
  onSelectCard,
  onBatchUpload,
  onSwapNumber,
  onContinue
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const batchInputRef = useRef<HTMLInputElement>(null);

  const handleBatchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onBatchUpload(e.target.files);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-3 pb-20">
      {/* Super Compact Action Bar */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-stone-800">54 Cartas</span>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="text-stone-400 hover:text-emerald-800 p-0.5"
            title="Instrucciones"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => batchInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-700" />
            <span>Cargar Fotos</span>
          </button>
          <input
            ref={batchInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleBatchChange}
          />
        </div>
      </div>

      {/* Optional / Dismissible Help Banner */}
      {showHelp && (
        <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-950 flex items-start justify-between gap-2 animate-in fade-in">
          <p>
            Toca cualquier carta para editar su foto o nombre. Si cambias el número, se intercambiará automáticamente con el que ocupaba ese lugar.
          </p>
          <button
            onClick={() => setShowHelp(false)}
            className="text-emerald-700 hover:text-emerald-950 p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Grid of 54 cards (Optimized 3 cols on mobile, 4-6 on tablet/desktop) */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {cards.map((card, idx) => (
          <div
            key={card.id}
            className="group relative flex flex-col items-center bg-white rounded-xl p-1 border border-stone-200/90 hover:border-emerald-600 hover:shadow-sm transition-all cursor-pointer"
          >
            <div
              onClick={() => onSelectCard(idx)}
              className="w-full"
            >
              <CardPreview
                card={card}
                style={cardStyle}
                isCompactTable={true}
                className="w-full"
              />
            </div>

            {/* Quick swap number selector */}
            <div className="w-full mt-1 pt-0.5 border-t border-stone-100 flex items-center justify-between px-1">
              <span className="text-[10px] font-mono font-bold text-stone-400">#{card.number}</span>
              <select
                value={card.number}
                onChange={(e) => onSwapNumber(card.id, parseInt(e.target.value, 10))}
                onClick={(e) => e.stopPropagation()}
                className="text-[10px] font-mono font-bold bg-stone-50 text-stone-700 border border-stone-200 rounded px-1 py-0.2 focus:outline-none"
              >
                {cards.map(c => (
                  <option key={c.number} value={c.number}>
                    {c.number}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>

      {/* Sticky Bottom Action Bar for Mobile Thumb Ergonomics */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-stone-200 z-20 flex justify-center">
        <div className="w-full max-w-md flex items-center justify-between gap-3">
          <span className="text-xs text-stone-500 font-medium">
            54 cartas preparadas
          </span>
          <button
            onClick={onContinue}
            className="flex-1 max-w-xs flex items-center justify-center gap-1.5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-sm transition-transform active:scale-95"
          >
            <span>Siguiente: Formato</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { LoteriaCard, CardStyleConfig, BoardConfig, GeneratorStep } from '../types/loteria';
import { SwipeCardEditor } from './SwipeCardEditor';
import { CardsGridView } from './CardsGridView';
import { CardStyleSelector } from './CardStyleSelector';
import { BoardGeneratorSettings } from './BoardGeneratorSettings';
import { DownloadPDFView } from './DownloadPDFView';
import { swapCardNumbers } from '../utils/loteriaEngine';
import { useLanguage } from '../i18n/LanguageContext';
import { createCleanCardPlaceholder, DEFAULT_CARDS } from '../data/defaultCards';
import { Images, LayoutGrid, Volume2, Lock, Globe } from 'lucide-react';

interface GeneratorViewProps {
  cards: LoteriaCard[];
  cardStyle: CardStyleConfig;
  boardConfig: BoardConfig;
  onUpdateCards: (cards: LoteriaCard[]) => void;
  onUpdateCardStyle: (style: CardStyleConfig) => void;
  onUpdateBoardConfig: (config: BoardConfig) => void;
  onGoToGame: () => void;
  onLockGenerator?: () => void;
}

export const GeneratorView: React.FC<GeneratorViewProps> = ({
  cards,
  cardStyle,
  boardConfig,
  onUpdateCards,
  onUpdateCardStyle,
  onUpdateBoardConfig,
  onGoToGame,
  onLockGenerator,
}) => {
  const { t, language, toggleLanguage } = useLanguage();
  const [currentStep, setCurrentStep] = useState<GeneratorStep>('cards_input');
  const [subView, setSubView] = useState<'grid' | 'swipe'>('grid');
  const [activeCardIndex, setActiveCardIndex] = useState<number>(0);

  const handleUpdateCard = (updated: LoteriaCard) => {
    const newCards = cards.map(c => (c.id === updated.id ? updated : c));
    onUpdateCards(newCards);
  };

  const handleSwapNumber = (cardId: string, newNumber: number) => {
    const swapped = swapCardNumbers(cards, cardId, newNumber);
    onUpdateCards(swapped);
  };

  const handleBatchUpload = (files: FileList) => {
    const fileArray = Array.from(files).slice(0, 54);
    if (fileArray.length === 0) return;

    let loadedCount = 0;
    const newCards = [...cards];

    fileArray.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl && newCards[index]) {
          const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
          newCards[index] = {
            ...newCards[index],
            name: cleanName || newCards[index].name,
            image: dataUrl
          };
        }
        loadedCount++;
        if (loadedCount === fileArray.length) {
          onUpdateCards([...newCards]);
          alert(`Se cargaron ${fileArray.length} fotos a la baraja.`);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleClearAllImages = () => {
    if (window.confirm(t('clear_all_photos_confirm'))) {
      const cleared = cards.map(c => ({
        ...c,
        image: createCleanCardPlaceholder(c.name, c.number)
      }));
      onUpdateCards(cleared);
    }
  };

  const handleResetToDefaultDeck = () => {
    if (window.confirm(t('reset_default_deck_confirm'))) {
      onUpdateCards(DEFAULT_CARDS);
    }
  };

  const steps = [
    { id: 'cards_input', label: t('step_cards') },
    { id: 'card_style', label: t('step_frames') },
    { id: 'board_config', label: t('step_boards') },
    { id: 'download_pdf', label: t('step_download') },
  ];

  return (
    <div className="w-full space-y-3 pb-8">
      {/* Top Controls of Generator */}
      <div className="flex items-center justify-between gap-2 max-w-2xl mx-auto bg-white/90 backdrop-blur-md rounded-2xl border border-stone-200/80 p-2 shadow-2xs">
        <button
          onClick={onGoToGame}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          title={t('go_to_game')}
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>{t('go_to_game')}</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="font-serif font-black text-xs text-stone-800 uppercase tracking-wider">
            {t('generator')}
          </span>
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-black bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 rounded-lg transition-colors"
            title={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
          >
            <Globe className="w-3 h-3 text-[#B45309]" />
            <span>{language.toUpperCase()}</span>
          </button>
        </div>

        {onLockGenerator && (
          <button
            onClick={onLockGenerator}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-all"
            title={t('lock_client')}
          >
            <Lock className="w-3.5 h-3.5 text-amber-700" />
            <span className="hidden xs:inline">{t('lock_client')}</span>
          </button>
        )}
      </div>

      {/* Super Compact Segmented Steps Navigation */}
      <div className="max-w-md mx-auto flex items-center justify-between bg-white rounded-xl p-1 border border-stone-200 text-xs shadow-2xs">
        {steps.map((st) => {
          const isActive = currentStep === st.id;
          return (
            <button
              key={st.id}
              onClick={() => setCurrentStep(st.id as GeneratorStep)}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-all text-center ${
                isActive
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              {st.label}
            </button>
          );
        })}
      </div>

      {/* STEP 1: CARDS INPUT */}
      {currentStep === 'cards_input' && (
        <div className="space-y-3">
          {/* Sub-view toggle (Cuadrícula / Una por una) */}
          <div className="max-w-xs mx-auto flex items-center justify-center p-0.5 bg-stone-200/80 rounded-xl border border-stone-300 text-xs">
            <button
              onClick={() => setSubView('grid')}
              className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-lg font-bold transition-all ${
                subView === 'grid'
                  ? 'bg-white text-emerald-900 shadow-2xs'
                  : 'text-stone-600'
              }`}
            >
              <LayoutGrid className="w-3 h-3" />
              <span>{t('view_grid')}</span>
            </button>
            <button
              onClick={() => setSubView('swipe')}
              className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-lg font-bold transition-all ${
                subView === 'swipe'
                  ? 'bg-white text-emerald-900 shadow-2xs'
                  : 'text-stone-600'
              }`}
            >
              <Images className="w-3 h-3" />
              <span>{t('view_swipe')}</span>
            </button>
          </div>

          {subView === 'grid' ? (
            <CardsGridView
              cards={cards}
              cardStyle={cardStyle}
              onSelectCard={(idx) => {
                setActiveCardIndex(idx);
                setSubView('swipe');
              }}
              onBatchUpload={handleBatchUpload}
              onClearAllImages={handleClearAllImages}
              onResetToDefaultDeck={handleResetToDefaultDeck}
              onSwapNumber={handleSwapNumber}
              onContinue={() => setCurrentStep('card_style')}
            />
          ) : (
            <SwipeCardEditor
              cards={cards}
              cardStyle={cardStyle}
              currentIndex={activeCardIndex}
              onSelectIndex={setActiveCardIndex}
              onUpdateCard={handleUpdateCard}
              onSwapNumber={handleSwapNumber}
              onOpenGrid={() => setSubView('grid')}
            />
          )}
        </div>
      )}

      {/* STEP 2: CARD STYLES */}
      {currentStep === 'card_style' && (
        <CardStyleSelector
          config={cardStyle}
          onChange={onUpdateCardStyle}
          sampleCard={cards[activeCardIndex] || cards[0]}
          onBack={() => setCurrentStep('cards_input')}
          onNext={() => setCurrentStep('board_config')}
        />
      )}

      {/* STEP 3: BOARD CONFIGURATION */}
      {currentStep === 'board_config' && (
        <BoardGeneratorSettings
          cards={cards}
          cardStyle={cardStyle}
          config={boardConfig}
          onChangeConfig={onUpdateBoardConfig}
          onBack={() => setCurrentStep('card_style')}
          onNext={() => setCurrentStep('download_pdf')}
          onGoToGame={onGoToGame}
        />
      )}

      {/* STEP 4: DOWNLOAD PDF */}
      {currentStep === 'download_pdf' && (
        <DownloadPDFView
          cards={cards}
          cardStyle={cardStyle}
          boardConfig={boardConfig}
          onBack={() => setCurrentStep('board_config')}
          onGoToGame={onGoToGame}
        />
      )}
    </div>
  );
};

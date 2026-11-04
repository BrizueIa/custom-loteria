import React, { useState, useEffect } from 'react';
import { LoteriaCard, CardStyleConfig, BoardConfig, GeneratorStep, GeneratedBoard } from '../types/loteria';
import { SwipeCardEditor } from './SwipeCardEditor';
import { CardsGridView } from './CardsGridView';
import { CardStyleSelector } from './CardStyleSelector';
import { BoardGeneratorSettings } from './BoardGeneratorSettings';
import { DownloadPDFView } from './DownloadPDFView';
import { swapCardNumbers, generateBoards } from '../utils/loteriaEngine';
import { useLanguage } from '../i18n/LanguageContext';
import { createCleanCardPlaceholder, DEFAULT_CARDS } from '../data/defaultCards';
import { exportDeckToJson, validateAndParseDeckJson } from '../utils/deckIO';
import { optimizeImage, isSvgDataUrl } from '../utils/imageOptimizer';
import { Images, LayoutGrid, Volume2, Lock, Globe, Download, Upload, QrCode } from 'lucide-react';

interface GeneratorViewProps {
  cards: LoteriaCard[];
  cardStyle: CardStyleConfig;
  boardConfig: BoardConfig;
  onUpdateCards: (cards: LoteriaCard[]) => void;
  onUpdateCardStyle: (style: CardStyleConfig) => void;
  onUpdateBoardConfig: (config: BoardConfig) => void;
  onGoToGame: () => void;
  onLockGenerator?: () => void;
  onImportDeck?: (imported: { cards: LoteriaCard[]; style: CardStyleConfig; boardConfig: BoardConfig }) => void;
  onOpenQRModal?: (mode: 'send' | 'receive') => void;
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
  onImportDeck,
  onOpenQRModal,
}) => {
  const { t, language, toggleLanguage } = useLanguage();
  const jsonFileInputRef = React.useRef<HTMLInputElement>(null);
  const [currentStep, setCurrentStep] = useState<GeneratorStep>('cards_input');
  const [subView, setSubView] = useState<'grid' | 'swipe'>('grid');
  const [activeCardIndex, setActiveCardIndex] = useState<number>(0);
  const [hasCompletedCardStyleTour, setHasCompletedCardStyleTour] = useState(false);
  const [hasCompletedBoardTour, setHasCompletedBoardTour] = useState(false);

  // Synchronized persistent boards state (ensures preview and downloaded PDF are 100% identical)
  const [generatedBoards, setGeneratedBoards] = useState<GeneratedBoard[]>(() => {
    try {
      return generateBoards(cards, boardConfig);
    } catch {
      return [];
    }
  });

  const handleRegenerateBoards = (newConfig?: BoardConfig) => {
    try {
      const cfg = newConfig || boardConfig;
      const newBoards = generateBoards(cards, cfg);
      setGeneratedBoards(newBoards);
    } catch (e: any) {
      console.error('Error generating boards:', e);
    }
  };

  // Sync board cards when cards in deck update (e.g. photos changed or numbers swapped)
  useEffect(() => {
    setGeneratedBoards(prev => {
      if (!prev || prev.length === 0) {
        try {
          return generateBoards(cards, boardConfig);
        } catch {
          return [];
        }
      }
      const cardMap = new Map(cards.map(c => [c.id, c]));
      return prev.map(board => ({
        ...board,
        cards: board.cards.map(c => cardMap.get(c.id) || c)
      }));
    });
  }, [cards]);

  const handleUpdateBoardConfig = (newConfig: BoardConfig) => {
    const dimensionsChanged =
      newConfig.rows !== boardConfig.rows ||
      newConfig.cols !== boardConfig.cols ||
      newConfig.quantity !== boardConfig.quantity ||
      newConfig.allowDuplicates !== boardConfig.allowDuplicates;

    onUpdateBoardConfig(newConfig);

    if (dimensionsChanged) {
      handleRegenerateBoards(newConfig);
    }
  };

  const handleUpdateCard = (updated: LoteriaCard) => {
    const newCards = cards.map(c => (c.id === updated.id ? updated : c));
    onUpdateCards(newCards);
  };

  const handleSwapNumber = (cardId: string, newNumber: number) => {
    const swapped = swapCardNumbers(cards, cardId, newNumber);
    onUpdateCards(swapped);
  };

  const handleBatchUpload = async (files: FileList) => {
    const fileArray = Array.from(files).slice(0, 54);
    if (fileArray.length === 0) return;

    let startIdx = 0;
    const firstEmptyIdx = cards.findIndex(c => isSvgDataUrl(c.image));
    if (firstEmptyIdx > 0 && firstEmptyIdx < cards.length) {
      const fillFromEmpty = window.confirm(
        language === 'en'
          ? `Add these photos starting from empty card #${firstEmptyIdx + 1}? (Click Cancel to replace from card #1)`
          : `¿Deseas agregar estas fotos a partir de la carta vacía #${firstEmptyIdx + 1}? (Pulsa Cancelar para reemplazar desde la #1)`
      );
      if (fillFromEmpty) {
        startIdx = firstEmptyIdx;
      }
    }

    const newCards = [...cards];
    let loadedCount = 0;

    for (let i = 0; i < fileArray.length; i++) {
      const targetIndex = (startIdx + i) % 54;
      const file = fileArray[i];
      try {
        const dataUrl = await optimizeImage(file);
        if (dataUrl && newCards[targetIndex]) {
          const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
          newCards[targetIndex] = {
            ...newCards[targetIndex],
            name: cleanName || newCards[targetIndex].name,
            image: dataUrl
          };
          loadedCount++;
        }
      } catch (err) {
        console.error('Error optimizing batch image:', err);
      }
    }

    onUpdateCards(newCards);
    alert(
      language === 'en'
        ? `Successfully loaded and optimized ${loadedCount} photos.`
        : `Se cargaron y optimizaron ${loadedCount} fotos para la baraja.`
    );
  };

  const handleJsonImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = validateAndParseDeckJson(content);
      if (res.success && res.data) {
        if (onImportDeck) {
          onImportDeck({
            cards: res.data.cards,
            style: res.data.style || cardStyle,
            boardConfig: res.data.boardConfig || boardConfig
          });
        } else {
          onUpdateCards(res.data.cards);
          if (res.data.style) onUpdateCardStyle(res.data.style);
          if (res.data.boardConfig) onUpdateBoardConfig(res.data.boardConfig);
        }
        alert(t('deck_imported_success'));
      } else {
        alert(res.error || t('deck_import_error'));
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
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
      <div className="flex flex-wrap items-center justify-between gap-2 max-w-2xl mx-auto bg-white/90 backdrop-blur-md rounded-2xl border border-stone-200/80 p-2 shadow-2xs">
        <button
          onClick={onGoToGame}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          title={t('go_to_game')}
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>{t('go_to_game')}</span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => exportDeckToJson(cards, cardStyle, boardConfig)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-all cursor-pointer border border-stone-200"
            title={t('export_deck')}
          >
            <Download className="w-3.5 h-3.5 text-stone-600" />
            <span className="hidden sm:inline">{t('export_deck')}</span>
          </button>

          <button
            onClick={() => jsonFileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-all cursor-pointer border border-stone-200"
            title={t('import_deck')}
          >
            <Upload className="w-3.5 h-3.5 text-stone-600" />
            <span className="hidden sm:inline">{t('import_deck')}</span>
          </button>

          {onOpenQRModal && (
            <button
              onClick={() => onOpenQRModal('send')}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition-all cursor-pointer border border-emerald-300"
              title={language === 'en' ? 'Send Deck via QR' : 'Pasar Baraja con QR'}
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-700" />
              <span>QR</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-serif font-black text-xs text-stone-800 uppercase tracking-wider">
            {t('generator')}
          </span>
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-black bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 rounded-lg transition-colors cursor-pointer"
            title={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
          >
            <Globe className="w-3 h-3 text-[#B45309]" />
            <span>{language.toUpperCase()}</span>
          </button>

          {onLockGenerator && (
            <button
              onClick={onLockGenerator}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              title={t('lock_client')}
            >
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden xs:inline">{t('lock_client')}</span>
            </button>
          )}
        </div>

        <input
          ref={jsonFileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleJsonImport}
        />
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
          initialTourDone={hasCompletedCardStyleTour}
          onCompleteInitialTour={() => setHasCompletedCardStyleTour(true)}
        />
      )}

      {/* STEP 3: BOARD CONFIGURATION */}
      {currentStep === 'board_config' && (
        <BoardGeneratorSettings
          cards={cards}
          cardStyle={cardStyle}
          config={boardConfig}
          boards={generatedBoards}
          onUpdateBoards={setGeneratedBoards}
          onRegenerateBoards={() => handleRegenerateBoards()}
          onChangeConfig={handleUpdateBoardConfig}
          onBack={() => setCurrentStep('card_style')}
          onNext={() => setCurrentStep('download_pdf')}
          onGoToGame={onGoToGame}
          initialTourDone={hasCompletedBoardTour}
          onCompleteInitialTour={() => setHasCompletedBoardTour(true)}
        />
      )}

      {/* STEP 4: DOWNLOAD PDF */}
      {currentStep === 'download_pdf' && (
        <DownloadPDFView
          cards={cards}
          cardStyle={cardStyle}
          boardConfig={boardConfig}
          boards={generatedBoards}
          onRegenerateBoards={() => handleRegenerateBoards()}
          onBack={() => setCurrentStep('board_config')}
          onGoToGame={onGoToGame}
          onLockGenerator={onLockGenerator}
          onOpenQRModal={onOpenQRModal}
        />
      )}
    </div>
  );
};

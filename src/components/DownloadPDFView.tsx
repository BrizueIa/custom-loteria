import React, { useState } from 'react';
import { BoardConfig, LoteriaCard, CardStyleConfig } from '../types/loteria';
import { generateBoards } from '../utils/loteriaEngine';
import { generateCardsPDF, generateBoardsPDF } from '../utils/pdfGenerator';
import { FileDown, Play, ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface DownloadPDFViewProps {
  cards: LoteriaCard[];
  cardStyle: CardStyleConfig;
  boardConfig: BoardConfig;
  onBack: () => void;
  onGoToGame: () => void;
}

export const DownloadPDFView: React.FC<DownloadPDFViewProps> = ({
  cards,
  cardStyle,
  boardConfig,
  onBack,
  onGoToGame,
}) => {
  const { t, language } = useLanguage();
  const [isGeneratingCardsPDF, setIsGeneratingCardsPDF] = useState(false);
  const [isGeneratingBoardsPDF, setIsGeneratingBoardsPDF] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);

  const handleDownloadCardsPDF = async () => {
    try {
      setIsGeneratingCardsPDF(true);
      setPdfProgress(0);
      const blob = await generateCardsPDF(cards, cardStyle, 4, (pct) => setPdfProgress(pct));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `baraja-54-cartas-4-por-hoja.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Error al generar PDF de la baraja.');
    } finally {
      setIsGeneratingCardsPDF(false);
    }
  };

  const handleDownloadBoardsPDF = async () => {
    try {
      setIsGeneratingBoardsPDF(true);
      setPdfProgress(0);
      const boards = generateBoards(cards, boardConfig);
      const blob = await generateBoardsPDF(boards, boardConfig, cardStyle, (pct) => setPdfProgress(pct));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tablas-loteria-${boardConfig.quantity}-tablas.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Error al generar PDF de las tablas.');
    } finally {
      setIsGeneratingBoardsPDF(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4 pb-20">
      {/* Top Banner Card */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-2xs text-center space-y-1.5">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200/60 mx-auto">
          <Sparkles className="w-5 h-5 text-emerald-700" />
        </div>
        <h3 className="text-base font-bold text-stone-900">
          {language === 'en' ? '4. Download Print Files' : '4. Descarga de Archivos de Impresión'}
        </h3>
        <p className="text-xs text-stone-500 leading-relaxed max-w-xs mx-auto">
          {language === 'en'
            ? 'Your 54 deck cards and custom boards are ready. Download the high-resolution PDFs below to cut and play.'
            : 'Tu baraja de 54 cartas y tus tablas personalizadas están listas. Descarga los archivos PDF para imprimir en papel Carta o A4.'}
        </p>
      </div>

      {/* Card 1: Baraja PDF */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-2xs space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-stone-900 text-sm">{t('pdf_deck_title')}</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">
              {t('cards_per_page_hint')}
            </p>
          </div>
          <span className="bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-md border border-emerald-200 text-[10px] shrink-0">
            {t('cards_4_per_sheet')}
          </span>
        </div>

        <button
          disabled={isGeneratingCardsPDF}
          onClick={handleDownloadCardsPDF}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-stone-900 hover:bg-black text-white rounded-xl text-xs font-bold disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
        >
          <FileDown className="w-4 h-4" />
          {isGeneratingCardsPDF ? t('generating_pdf', { progress: pdfProgress }) : t('download_deck_pdf')}
        </button>
      </div>

      {/* Card 2: Tablas PDF */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-2xs space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-stone-900 text-sm">
                {t('pdf_boards_title', { count: boardConfig.quantity })}
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">
              {language === 'en'
                ? 'Boards centered with authentic proportions and cutting crop guides.'
                : 'Tableros individuales centrados con proporciones tradicionales y guías de recorte.'}
            </p>
          </div>
          <span className="bg-amber-50 text-amber-900 font-bold px-2 py-0.5 rounded-md border border-amber-200 text-[10px] shrink-0">
            22 × 31 cm
          </span>
        </div>

        <button
          disabled={isGeneratingBoardsPDF}
          onClick={handleDownloadBoardsPDF}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-stone-900 hover:bg-black text-white rounded-xl text-xs font-bold disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
        >
          <FileDown className="w-4 h-4" />
          {isGeneratingBoardsPDF
            ? t('generating_pdf', { progress: pdfProgress })
            : t('download_boards_pdf', { count: boardConfig.quantity })}
        </button>
      </div>

      {/* Play Game Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-200">
            {language === 'en' ? 'Start Calling Cards' : 'Comenzar a Jugar'}
          </h4>
          <p className="text-[11px] text-emerald-100 mt-0.5">
            {language === 'en'
              ? 'Voice caller and game board are ready.'
              : 'El cantador automático con voz y sonido está listo.'}
          </p>
        </div>
        <button
          onClick={onGoToGame}
          className="flex items-center gap-1.5 px-4 py-2 bg-white text-emerald-950 font-bold rounded-xl text-xs shadow-xs hover:bg-emerald-50 transition-colors cursor-pointer shrink-0"
        >
          <Play className="w-3.5 h-3.5 fill-emerald-950" />
          <span>{t('go_to_game')}</span>
        </button>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{language === 'en' ? 'Back to Boards' : 'Volver a Tablas'}</span>
        </button>
      </div>
    </div>
  );
};

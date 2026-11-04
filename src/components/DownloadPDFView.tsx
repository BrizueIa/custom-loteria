import React, { useState, useEffect } from 'react';
import { BoardConfig, LoteriaCard, CardStyleConfig, GeneratedBoard } from '../types/loteria';
import { generateBoards } from '../utils/loteriaEngine';
import { generateCardsPDF, generateBoardsPDF } from '../utils/pdfGenerator';
import { CardPreview } from './CardPreview';
import { exportDeckToJson } from '../utils/deckIO';
import { FileDown, Play, ArrowLeft, Sparkles, CheckCircle2, RefreshCw, Smartphone, Lock, HardDrive, QrCode } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { subscribePWA, promptPWAInstall, isStandalone, isIOS } from '../utils/pwaInstaller';
import { estimateStorageUsage } from '../utils/deckStorage';

interface DownloadPDFViewProps {
  cards: LoteriaCard[];
  cardStyle: CardStyleConfig;
  boardConfig: BoardConfig;
  boards?: GeneratedBoard[];
  onRegenerateBoards?: () => void;
  onBack: () => void;
  onGoToGame: () => void;
  onLockGenerator?: () => void;
  onOpenQRModal?: (mode: 'send' | 'receive') => void;
}

export const DownloadPDFView: React.FC<DownloadPDFViewProps> = ({
  cards,
  cardStyle,
  boardConfig,
  boards,
  onRegenerateBoards,
  onBack,
  onGoToGame,
  onLockGenerator,
  onOpenQRModal,
}) => {
  const { t, language } = useLanguage();
  const [paperSize, setPaperSize] = useState<'letter' | 'a4'>('letter');
  const [isGeneratingCardsPDF, setIsGeneratingCardsPDF] = useState(false);
  const [isGeneratingBoardsPDF, setIsGeneratingBoardsPDF] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [previewBoardIdx, setPreviewBoardIdx] = useState(0);

  // PWA and Storage state
  const [canInstallPwa, setCanInstallPwa] = useState<boolean>(false);
  const [isPwaInstalled, setIsPwaInstalled] = useState<boolean>(() => isStandalone());
  const [storageUsageMB, setStorageUsageMB] = useState<number | null>(null);

  useEffect(() => {
    estimateStorageUsage().then((est) => {
      if (est) setStorageUsageMB(est.usageMB);
    });
    return subscribePWA((canInstall) => {
      setCanInstallPwa(canInstall);
      setIsPwaInstalled(isStandalone());
    });
  }, []);

  const activeBoards = boards && boards.length > 0 ? boards : generateBoards(cards, boardConfig);
  const currentPreviewBoard = activeBoards[previewBoardIdx] || activeBoards[0];

  const handleDownloadCardsPDF = async () => {
    try {
      setIsGeneratingCardsPDF(true);
      setPdfProgress(0);
      const blob = await generateCardsPDF(cards, cardStyle, 4, (pct) => setPdfProgress(pct), paperSize);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `baraja-54-cartas-4-por-hoja-${paperSize}.pdf`;
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
      const boardsToExport = activeBoards;
      const blob = await generateBoardsPDF(boardsToExport, boardConfig, cardStyle, (pct) => setPdfProgress(pct), paperSize);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tablas-loteria-${boardConfig.quantity}-tablas-${paperSize}.pdf`;
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

        {/* Paper Size selector */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-100 max-w-xs mx-auto">
          <span className="text-[11px] font-bold text-stone-600">
            {language === 'en' ? 'Paper format:' : 'Tamaño de papel:'}
          </span>
          <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg border border-stone-200 text-xs">
            <button
              onClick={() => setPaperSize('letter')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                paperSize === 'letter' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Carta (Letter)
            </button>
            <button
              onClick={() => setPaperSize('a4')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                paperSize === 'a4' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              A4
            </button>
          </div>
        </div>
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

      {/* Board Confirmation & Live Preview */}
      {currentPreviewBoard && (
        <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-stone-900 text-sm">
                {language === 'en' ? 'Boards to be printed' : 'Tablas exactas a imprimir'}
              </span>
              <span className="bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-md border border-emerald-200 text-[10px]">
                {activeBoards.length} {activeBoards.length === 1 ? (language === 'en' ? 'board' : 'tabla') : (language === 'en' ? 'boards' : 'tablas')}
              </span>
            </div>

            {onRegenerateBoards && (
              <button
                type="button"
                onClick={onRegenerateBoards}
                className="flex items-center gap-1 text-[11px] font-bold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                title={language === 'en' ? 'Shuffle combinations' : 'Revolver combinaciones'}
              >
                <RefreshCw className="w-3 h-3 text-stone-500" />
                <span>{language === 'en' ? 'Shuffle' : 'Revolver'}</span>
              </button>
            )}
          </div>

          <p className="text-[11px] text-stone-500 leading-snug">
            {language === 'en'
              ? 'These exact cards will be printed in your PDF in the exact order shown.'
              : 'Estas cartas exactas se imprimirán en tu PDF en el mismo orden que ves aquí:'}
          </p>

          <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/80">
            <div className="flex items-center justify-between mb-2 text-[10px] text-stone-600 font-medium">
              <span className="font-bold text-stone-800">
                {language === 'en' ? 'Board' : 'Tabla'} #{currentPreviewBoard.index} ({currentPreviewBoard.cards.length} {t('cards').toLowerCase()})
              </span>
              {activeBoards.length > 1 && (
                <div className="flex items-center gap-1 font-mono">
                  <button
                    type="button"
                    disabled={previewBoardIdx <= 0}
                    onClick={() => setPreviewBoardIdx(p => p - 1)}
                    className="px-1.5 py-0.5 text-stone-600 hover:text-stone-900 bg-white rounded border border-stone-200 disabled:opacity-30 cursor-pointer"
                  >
                    ◀
                  </button>
                  <span className="px-1 text-[11px]">{previewBoardIdx + 1} / {activeBoards.length}</span>
                  <button
                    type="button"
                    disabled={previewBoardIdx >= activeBoards.length - 1}
                    onClick={() => setPreviewBoardIdx(p => p + 1)}
                    className="px-1.5 py-0.5 text-stone-600 hover:text-stone-900 bg-white rounded border border-stone-200 disabled:opacity-30 cursor-pointer"
                  >
                    ▶
                  </button>
                </div>
              )}
            </div>

            <div
              className="grid gap-1"
              style={{
                gridTemplateColumns: `repeat(${boardConfig.cols}, minmax(0, 1fr))`
              }}
            >
              {currentPreviewBoard.cards.map((c) => (
                <CardPreview
                  key={c.id}
                  card={c}
                  style={cardStyle}
                  variant="board"
                  className="w-full"
                />
              ))}
            </div>
          </div>
        </div>
      )}

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

      {/* Card 3: Respaldo editable Baraja JSON */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-2xs space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-stone-900 text-sm">
                {language === 'en' ? '3. Project Backup (.json)' : '3. Respaldo de Proyecto (.json)'}
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">
              {language === 'en'
                ? 'Save your custom deck file so you can reopen, edit, or play anytime.'
                : 'Guarda tu archivo de baraja para volver a editarla, actualizar fotos o compartirla.'}
            </p>
          </div>
          <span className="bg-blue-50 text-blue-800 font-bold px-2 py-0.5 rounded-md border border-blue-200 text-[10px] shrink-0">
            JSON
          </span>
        </div>

        <button
          onClick={() => exportDeckToJson(cards, cardStyle, boardConfig)}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs border border-stone-300"
        >
          <FileDown className="w-4 h-4 text-stone-600" />
          <span>{t('export_deck')}</span>
        </button>
      </div>

      {/* Card 4: Preparar Cantador para el Evento (Organizador) */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-2xs space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-stone-900 text-sm">
                {language === 'en' ? '4. Organizer Setup (Game Night)' : '4. Listo para el Evento (Cantador)'}
              </span>
              <Smartphone className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">
              {language === 'en'
                ? 'Your custom deck is saved offline in IndexedDB. Lock it with your PIN so only the caller runs.'
                : 'Tus 54 cartas e imágenes están guardadas en este dispositivo (IndexedDB). Bloquéalo con tu PIN para el evento.'}
            </p>
          </div>
          <span className="bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-md border border-emerald-200 text-[10px] shrink-0">
            OFFLINE
          </span>
        </div>

        {/* Estado de almacenamiento en disco */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-200 text-xs">
          <div className="flex items-center gap-2 text-stone-700">
            <HardDrive className="w-3.5 h-3.5 text-stone-500" />
            <span className="font-medium text-[11px]">
              {language === 'en' ? 'Local Storage Status:' : 'Almacenamiento Local:'}
            </span>
          </div>
          <span className="font-bold text-emerald-700 text-[11px]">
            {cards.length} {language === 'en' ? 'cards ready' : 'cartas guardadas'}
            {storageUsageMB !== null ? ` (${storageUsageMB} MB)` : ''}
          </span>
        </div>

        {/* Instalación PWA */}
        {isPwaInstalled ? (
          <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200/70">
            <span className="text-sm">📱</span>
            <span>{language === 'en' ? 'App Installed (Running Offline)' : 'App Instalada (Funciona sin internet)'}</span>
          </div>
        ) : canInstallPwa ? (
          <button
            onClick={async () => {
              const outcome = await promptPWAInstall();
              if (outcome === 'accepted') setIsPwaInstalled(true);
            }}
            className="w-full py-2 px-3 bg-gradient-to-r from-teal-700 to-emerald-800 hover:from-teal-800 hover:to-emerald-900 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <span>📲</span>
            <span>{language === 'en' ? 'Install App on this Device' : 'Instalar App en este Dispositivo (PWA)'}</span>
          </button>
        ) : isIOS() ? (
          <div className="p-2.5 rounded-xl bg-stone-50 text-stone-600 text-[11px] leading-snug border border-stone-200">
            <span className="font-bold text-stone-800 block mb-0.5">📲 {language === 'en' ? 'Install on iPhone/iPad' : 'Instalar en iPhone/iPad'}:</span>
            {language === 'en'
              ? 'In Safari, tap Share (box with arrow up) and choose "Add to Home Screen".'
              : 'En Safari, toca Compartir (cuadrado con flecha arriba) y elige "Agregar al inicio".'}
          </div>
        ) : null}

        {/* Bloqueo y Paso al Cantador */}
        <div className="pt-1 space-y-2">
          {onOpenQRModal && (
            <button
              onClick={() => onOpenQRModal('send')}
              className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-800 to-teal-900 hover:from-emerald-900 hover:to-teal-950 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-emerald-300" />
              <span>{language === 'en' ? 'Transfer to Phone with QR Code' : 'Pasar Baraja a otro Teléfono con QR'}</span>
            </button>
          )}

          {onLockGenerator ? (
            <button
              onClick={onLockGenerator}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Lock App & Open Caller Mode' : 'Bloquear con PIN y Abrir Cantador'}</span>
            </button>
          ) : null}

          <button
            onClick={onGoToGame}
            className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-stone-200"
          >
            <Play className="w-3.5 h-3.5 text-stone-700" />
            <span>{language === 'en' ? 'Open Caller without Locking' : 'Ir al Cantador (Modo Libre)'}</span>
          </button>
        </div>
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

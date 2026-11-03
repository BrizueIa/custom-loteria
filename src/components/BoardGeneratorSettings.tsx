import React, { useState } from 'react';
import { BoardConfig, LoteriaCard, CardStyleConfig, GeneratedBoard } from '../types/loteria';
import { generateBoards } from '../utils/loteriaEngine';
import { generateCardsPDF, generateBoardsPDF } from '../utils/pdfGenerator';
import { CardPreview } from './CardPreview';
import { FileDown, Play, RefreshCw, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

interface BoardGeneratorSettingsProps {
  cards: LoteriaCard[];
  cardStyle: CardStyleConfig;
  config: BoardConfig;
  onChangeConfig: (newConfig: BoardConfig) => void;
  onBack: () => void;
  onGoToGame: () => void;
}

export const BoardGeneratorSettings: React.FC<BoardGeneratorSettingsProps> = ({
  cards,
  cardStyle,
  config,
  onChangeConfig,
  onBack,
  onGoToGame,
}) => {
  const [generatedBoards, setGeneratedBoards] = useState<GeneratedBoard[]>(() => {
    return generateBoards(cards, config);
  });
  const [previewBoardIndex, setPreviewBoardIndex] = useState<number>(0);
  const [cardsPerPage, setCardsPerPage] = useState<2 | 4 | 9>(2);
  const [isGeneratingCardsPDF, setIsGeneratingCardsPDF] = useState(false);
  const [isGeneratingBoardsPDF, setIsGeneratingBoardsPDF] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);

  const presets = [
    { label: '3 × 3 (9 cartas)', rows: 3, cols: 3 },
    { label: '4 × 4 (16 cartas - Estándar)', rows: 4, cols: 4 },
    { label: '4 × 5 (20 cartas)', rows: 4, cols: 5 },
    { label: '5 × 5 (25 cartas)', rows: 5, cols: 5 },
  ];

  const handleRegenerate = () => {
    try {
      const boards = generateBoards(cards, config);
      setGeneratedBoards(boards);
      setPreviewBoardIndex(0);
    } catch (e: any) {
      alert(e.message || 'Error al generar tablas');
    }
  };

  const handleDownloadCardsPDF = async () => {
    try {
      setIsGeneratingCardsPDF(true);
      setPdfProgress(0);
      const blob = await generateCardsPDF(cards, cardStyle, cardsPerPage, (pct) => setPdfProgress(pct));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `baraja-54-cartas-${cardsPerPage}-por-hoja.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Error al generar el PDF de las cartas.');
    } finally {
      setIsGeneratingCardsPDF(false);
    }
  };

  const handleDownloadBoardsPDF = async () => {
    try {
      setIsGeneratingBoardsPDF(true);
      setPdfProgress(0);
      const blob = await generateBoardsPDF(generatedBoards, config, cardStyle, (pct) => setPdfProgress(pct));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tablas-loteria-${generatedBoards.length}-tablas.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Error al generar el PDF de las tablas.');
    } finally {
      setIsGeneratingBoardsPDF(false);
    }
  };

  const currentPreviewBoard = generatedBoards[previewBoardIndex] || generatedBoards[0];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-stone-900">
            Formato de Tablas y Descarga de PDFs
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Configura las casillas por tabla, reglas de duplicación y genera los archivos de impresión.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver
          </button>
          <button
            onClick={onGoToGame}
            className="flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-black text-white rounded-xl font-bold text-xs shadow-xs transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            Ir al Cantador
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Settings Column */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200/80 p-5 space-y-5 shadow-2xs">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">
              Título en el encabezado de las tablas
            </label>
            <input
              type="text"
              value={config.title}
              onChange={(e) => onChangeConfig({ ...config, title: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 font-loteria-title text-sm font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
              placeholder="LOTERÍA MEXICANA"
            />
          </div>

          {/* Grid Presets */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
              Tamaño de Cuadrícula
            </label>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((p) => {
                const isSelected = config.rows === p.rows && config.cols === p.cols;
                return (
                  <button
                    key={p.label}
                    onClick={() => {
                      const updated = { ...config, rows: p.rows, cols: p.cols };
                      onChangeConfig(updated);
                      try {
                        setGeneratedBoards(generateBoards(cards, updated));
                      } catch (err: any) {
                        alert(err.message);
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                      isSelected
                        ? 'border-stone-900 bg-stone-900 text-white'
                        : 'border-stone-200 text-stone-700 hover:border-stone-300 bg-white'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Duplicates Rule */}
          <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/60 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-stone-900">
                Permitir cartas repetidas dentro de la tabla
              </p>
              <p className="text-[11px] text-stone-500 mt-0.5">
                {config.allowDuplicates ? 'Permitido (pueden repetirse)' : 'No permitido (todas las cartas son únicas)'}
              </p>
            </div>
            <input
              type="checkbox"
              checked={config.allowDuplicates}
              onChange={(e) => {
                const updated = { ...config, allowDuplicates: e.target.checked };
                onChangeConfig(updated);
                setGeneratedBoards(generateBoards(cards, updated));
              }}
              className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900 cursor-pointer"
            />
          </div>

          {/* Quantity of Boards Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-stone-600 uppercase tracking-wider">Cantidad de Tablas</span>
              <span className="font-mono font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded">
                {config.quantity} tablas
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={60}
              value={config.quantity}
              onChange={(e) => onChangeConfig({ ...config, quantity: parseInt(e.target.value, 10) })}
              className="w-full accent-stone-800 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-stone-400 font-mono">
              <span>1</span>
              <span>15</span>
              <span>30</span>
              <span>60</span>
            </div>
          </div>

          <button
            onClick={handleRegenerate}
            className="w-full flex items-center justify-center gap-1.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-semibold text-xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Regenerar combinaciones
          </button>

          {/* PDF Downloads */}
          <div className="pt-4 border-t border-stone-100 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Archivos de Impresión (PDF)
            </p>

            {/* PDF 1 */}
            <div className="p-3 rounded-xl border border-stone-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-stone-900">1. Baraja (54 cartas)</span>
                <select
                  value={cardsPerPage}
                  onChange={(e) => setCardsPerPage(parseInt(e.target.value, 10) as any)}
                  className="bg-white border border-stone-300 rounded px-1.5 py-0.5 text-xs text-stone-700"
                >
                  <option value={2}>2 por hoja (grandes)</option>
                  <option value={4}>4 por hoja (estándar)</option>
                  <option value={9}>9 por hoja (póker)</option>
                </select>
              </div>
              <button
                disabled={isGeneratingCardsPDF}
                onClick={handleDownloadCardsPDF}
                className="w-full flex items-center justify-center gap-1.5 py-2 bg-stone-900 hover:bg-black text-white rounded-lg text-xs font-bold disabled:opacity-50 transition-colors"
              >
                <FileDown className="w-3.5 h-3.5" />
                {isGeneratingCardsPDF ? `Generando ${pdfProgress}%...` : 'Descargar PDF de Baraja'}
              </button>
            </div>

            {/* PDF 2 */}
            <div className="p-3 rounded-xl border border-stone-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-stone-900">2. Tablas ({generatedBoards.length} tablas)</span>
                <span className="text-[11px] text-stone-500">1 tabla por hoja</span>
              </div>
              <button
                disabled={isGeneratingBoardsPDF}
                onClick={handleDownloadBoardsPDF}
                className="w-full flex items-center justify-center gap-1.5 py-2 bg-stone-900 hover:bg-black text-white rounded-lg text-xs font-bold disabled:opacity-50 transition-colors"
              >
                <FileDown className="w-3.5 h-3.5" />
                {isGeneratingBoardsPDF ? `Generando ${pdfProgress}%...` : `Descargar PDF de ${generatedBoards.length} Tablas`}
              </button>
            </div>
          </div>
        </div>

        {/* Live Board Preview Column */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-3 px-1 text-xs">
            <span className="font-mono text-stone-500 uppercase tracking-widest">
              Vista Previa de Impresión
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={previewBoardIndex <= 0}
                onClick={() => setPreviewBoardIndex(previewBoardIndex - 1)}
                className="p-1 text-stone-600 hover:text-stone-900 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-stone-700">
                Tabla {previewBoardIndex + 1} de {generatedBoards.length}
              </span>
              <button
                disabled={previewBoardIndex >= generatedBoards.length - 1}
                onClick={() => setPreviewBoardIndex(previewBoardIndex + 1)}
                className="p-1 text-stone-600 hover:text-stone-900 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Board Mockup */}
          {currentPreviewBoard && (
            <div className="w-full max-w-md bg-white rounded-2xl border border-stone-300 p-4 shadow-sm">
              <div className="text-center pb-2 mb-3 border-b border-stone-200">
                <h2 className="font-loteria-title text-sm sm:text-base font-black text-stone-900 uppercase tracking-wider">
                  {config.title || 'LOTERÍA MEXICANA'}
                </h2>
                <span className="font-mono text-[10px] text-stone-500 uppercase tracking-widest">
                  TABLA #{currentPreviewBoard.index}
                </span>
              </div>

              {/* Grid Layout - Names adapt and wrap fully with isCompactTable */}
              <div
                className="grid gap-1.5"
                style={{
                  gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`
                }}
              >
                {currentPreviewBoard.cards.map((card, cIdx) => (
                  <div key={`${currentPreviewBoard.id}-${cIdx}`} className="aspect-[3/4]">
                    <CardPreview
                      card={card}
                      style={cardStyle}
                      isCompactTable={true}
                      className="w-full h-full"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

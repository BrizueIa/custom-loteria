import React, { useState, useEffect, useRef } from 'react';
import { LoteriaCard, CardStyleConfig, BoardConfig } from '../types/loteria';
import { shuffleArray } from '../utils/loteriaEngine';
import { audioCantador, VoiceId, VOICES_CATALOG } from '../utils/audioCantador';
import { exportDeckToJson } from '../utils/deckIO';
import { CardPreview } from './CardPreview';
import confetti from 'canvas-confetti';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Volume2,
  VolumeX,
  History,
  Trophy,
  Sliders,
  X,
  Sparkles,
  Swords,
  Lock,
  KeyRound,
  Download,
  Upload,
  Palette
} from 'lucide-react';

interface CantadorViewProps {
  cards: LoteriaCard[];
  cardStyle: CardStyleConfig;
  boardConfig: BoardConfig;
  canAccessGenerator: boolean;
  onGoToGenerator: () => void;
  onLockGenerator: () => void;
  onOpenPasswordModal: (mode: 'unlock' | 'change_password') => void;
  onImportDeck: (imported: { cards: LoteriaCard[]; style: CardStyleConfig; boardConfig: BoardConfig }) => void;
  onResetToDefault: () => void;
}

export const CantadorView: React.FC<CantadorViewProps> = ({
  cards,
  cardStyle,
  boardConfig,
  canAccessGenerator,
  onGoToGenerator,
  onLockGenerator,
  onOpenPasswordModal,
  onImportDeck,
  onResetToDefault,
}) => {
  const [shuffledDeck, setShuffledDeck] = useState<LoteriaCard[]>(() => shuffleArray(cards));
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [intervalSeconds, setIntervalSeconds] = useState<number>(4);
  const [gameEnded, setGameEnded] = useState<boolean>(false);

  // Modals & Panels
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [showDesempateModal, setShowDesempateModal] = useState<boolean>(false);
  const [desempateCard, setDesempateCard] = useState<LoteriaCard | null>(null);

  // Secret 4-tap on title to open admin PIN prompt
  const titleTapCountRef = useRef(0);
  const titleTapTimerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTitleTap = () => {
    if (canAccessGenerator) return;
    titleTapCountRef.current += 1;
    if (titleTapCountRef.current >= 4) {
      titleTapCountRef.current = 0;
      onOpenPasswordModal('unlock');
      return;
    }
    if (titleTapTimerRef.current) clearTimeout(titleTapTimerRef.current);
    titleTapTimerRef.current = window.setTimeout(() => {
      titleTapCountRef.current = 0;
    }, 2000);
  };

  // Voice Engine State
  const [selectedVoiceId, setSelectedVoiceId] = useState<VoiceId>(() => {
    try {
      const saved = localStorage.getItem('loteria_voice_id_v1');
      if (saved && ['dona_plantas', 'don_fermin', 'sobrina', 'locutor'].includes(saved)) {
        return saved as VoiceId;
      }
    } catch (e) {}
    return 'dona_plantas';
  });

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [playChime, setPlayChime] = useState<boolean>(true);
  const [isTestingVoice, setIsTestingVoice] = useState<boolean>(false);

  // Opciones de dictado: cantar número y cantar frase/verso
  const [announceNumber, setAnnounceNumber] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('loteria_announce_number_v1');
      if (saved !== null) return JSON.parse(saved);
    } catch (e) {}
    return true; // Por defecto: cantar número
  });

  const [announceTagline, setAnnounceTagline] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('loteria_announce_tagline_v1');
      if (saved !== null) return JSON.parse(saved);
    } catch (e) {}
    return false; // Por defecto: no cantar frase
  });

  const timerRef = useRef<number | null>(null);

  // Sync settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('loteria_announce_number_v1', JSON.stringify(announceNumber));
    } catch (e) {}
  }, [announceNumber]);

  useEffect(() => {
    try {
      localStorage.setItem('loteria_announce_tagline_v1', JSON.stringify(announceTagline));
    } catch (e) {}
  }, [announceTagline]);

  // Sync chosen voice to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('loteria_voice_id_v1', selectedVoiceId);
    } catch (e) {}
  }, [selectedVoiceId]);

  // Load system voices for browser mode
  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const available = window.speechSynthesis.getVoices();
        if (available && available.length > 0) {
          const sorted = [...available].sort((a, b) => {
            const aEs = a.lang.startsWith('es') ? -1 : 1;
            const bEs = b.lang.startsWith('es') ? -1 : 1;
            return aEs - bEs;
          });
          setVoices(sorted);
          if (!selectedVoiceURI) {
            const es = sorted.find(v => v.lang.startsWith('es'));
            setSelectedVoiceURI(es ? es.voiceURI : sorted[0].voiceURI);
          }
        }
      }
    };

    loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [selectedVoiceURI]);

  // Construir frase de dictado respetando opciones de número y frase/verso
  const buildCardSpeech = (card: LoteriaCard) => {
    let phrase = '';
    if (announceNumber) {
      phrase += `El ${card.number}. `;
    }
    phrase += card.name;
    if (announceTagline && card.tagline && card.tagline.trim()) {
      phrase += `. ${card.tagline}`;
    }
    return phrase.trim();
  };

  // Cantar carta dinámicamente con su nombre real (funciona para cualquier baraja personalizada)
  const announceCard = (card: LoteriaCard) => {
    if (playChime) audioCantador.playCardChime();
    if (isMuted) return;

    const speechText = buildCardSpeech(card);
    audioCantador.announceCard(speechText, selectedVoiceId, speechRate, selectedVoiceURI);
  };

  // Solo usar el audio de "¡Buenas!" como ejemplo de voz neutral
  const handleTestVoice = async (voiceToTest: VoiceId = selectedVoiceId) => {
    setIsTestingVoice(true);
    await audioCantador.speakSpecial('buenas', voiceToTest, speechRate);
    setIsTestingVoice(false);
  };

  const handleNextCard = () => {
    if (currentIndex + 1 < shuffledDeck.length) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      announceCard(shuffledDeck[nextIdx]);
    } else {
      setIsPlaying(false);
      setGameEnded(true);
    }
  };

  const handlePrevCard = () => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      announceCard(shuffledDeck[prevIdx]);
    }
  };

  const handleRestart = () => {
    setIsPlaying(false);
    audioCantador.stop();
    setShuffledDeck(shuffleArray(cards));
    setCurrentIndex(-1);
    setGameEnded(false);
  };

  // Loop de llamada automática
  useEffect(() => {
    if (isPlaying && !gameEnded) {
      timerRef.current = window.setTimeout(() => {
        handleNextCard();
      }, intervalSeconds * 1000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isPlaying, currentIndex, intervalSeconds, gameEnded, shuffledDeck]);

  // Celebrar ganador con ¡BUENAS!
  const handleBuenasWin = async () => {
    setIsPlaying(false);
    audioCantador.playFanfare();
    confetti({
      particleCount: 160,
      spread: 80,
      origin: { y: 0.5 }
    });
    audioCantador.speakSpecial('buenas', selectedVoiceId, speechRate);
  };

  const handleDesempateCartaMayor = () => {
    setIsPlaying(false);
    const pool = shuffledDeck.slice(currentIndex + 1).length > 0
      ? shuffledDeck.slice(currentIndex + 1)
      : cards;
    const drawn = pool[Math.floor(Math.random() * pool.length)];
    setDesempateCard(drawn);
    if (playChime) audioCantador.playCardChime();
    const speechText = buildCardSpeech(drawn);
    audioCantador.announceCard(speechText, selectedVoiceId, speechRate, selectedVoiceURI);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed.cards && Array.isArray(parsed.cards)) {
          onImportDeck({
            cards: parsed.cards,
            style: parsed.cardStyle || cardStyle,
            boardConfig: parsed.boardConfig || boardConfig
          });
          alert('¡Baraja importada exitosamente!');
        } else {
          alert('El archivo no tiene el formato de baraja válido.');
        }
      } catch (err) {
        alert('Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const currentCard = currentIndex >= 0 ? shuffledDeck[currentIndex] : null;
  const calledCards = shuffledDeck.slice(0, currentIndex + 1);

  return (
    <div className="w-full max-w-md mx-auto flex flex-col h-[100dvh] justify-between p-2.5 select-none bg-gradient-to-b from-[#F7F2EA] via-[#F4ECE1] to-[#EFE4D6]">
      {/* 1. BARRA SUPERIOR (Cálida, minimalista, solo dice LOTERÍA) */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#FFFDF9]/95 backdrop-blur-md rounded-2xl border border-[#DFCBB5] shadow-xs">
        {/* Título & Contador */}
        <div 
          onClick={handleTitleTap}
          className="flex items-center gap-2 cursor-pointer active:opacity-80 transition-opacity"
          title="Toca para opciones de administración"
        >
          <span className="font-serif font-black text-sm tracking-wider text-[#4A2E18] uppercase">
            LOTERÍA
          </span>
          <span className="font-mono text-xs font-black bg-[#EFE3D3] text-[#5C381E] border border-[#DFC7B0] px-2.5 py-0.5 rounded-full">
            {currentIndex + 1} / {cards.length}
          </span>
        </div>

        {/* Acciones superiores (Generador, Silencio y Ajustes) */}
        <div className="flex items-center gap-1.5">
          {canAccessGenerator && (
            <button
              onClick={onGoToGenerator}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-[#FEF3C7] hover:bg-[#FDE68A] text-[#78350F] border border-[#FCD34D] rounded-xl shadow-2xs transition-colors"
              title="Abrir Generador de Tablas"
            >
              <Palette className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Generador</span>
            </button>
          )}

          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2 rounded-xl transition-colors border shadow-2xs ${
              isMuted
                ? 'text-rose-600 bg-rose-100/80 border-rose-300'
                : 'text-[#5C381E] bg-[#EFE3D3] hover:bg-[#E5D5C0] border-[#DFC7B0]'
            }`}
            title={isMuted ? 'Sonido silenciado' : 'Silenciar'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2 rounded-xl text-[#5C381E] bg-[#EFE3D3] hover:bg-[#E5D5C0] border border-[#DFC7B0] shadow-2xs transition-colors"
            title="Ajustes de tiempo, voz y opciones"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. ESCENARIO CENTRAL (Carta Principal con sombra cálida artesanal) */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-1">
        {currentCard ? (
          <div className="h-full max-h-[460px] aspect-[3/4] flex items-center justify-center transform transition-all duration-300">
            <CardPreview
              card={currentCard}
              style={cardStyle}
              className="w-full h-full shadow-xl shadow-amber-950/15"
            />
          </div>
        ) : (
          <div className="h-full max-h-[380px] aspect-[3/4] bg-[#FFFDF9] rounded-3xl border-2 border-dashed border-[#DFCBB5] flex flex-col items-center justify-center p-6 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center text-[#92400E]">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-black text-[#4A2E18]">
                Baraja Lista
              </h3>
              <p className="text-xs text-[#78593F] mt-1">
                {cards.length} cartas barajadas. Toca comenzar para cantar la primera.
              </p>
            </div>
            <button
              onClick={handleNextCard}
              className="px-6 py-3 bg-[#1B5236] hover:bg-[#14422B] text-white rounded-2xl font-black text-sm shadow-md transition-transform active:scale-95 flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" />
              Comenzar Ronda
            </button>
          </div>
        )}

        {/* Repetir voz de la carta actual */}
        {currentCard && (
          <button
            onClick={() => announceCard(currentCard)}
            className="mt-2 text-xs text-[#5C381E] hover:text-[#382110] font-bold bg-[#EFE3D3] hover:bg-[#E5D5C0] border border-[#DFC7B0] px-3.5 py-1.5 rounded-full shadow-2xs flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <Volume2 className="w-3.5 h-3.5 text-[#B45309]" />
            Repetir voz
          </button>
        )}
      </div>

      {/* 3. CONTROLES INFERIORES (Coloridos, interactivos y táctiles) */}
      <div className="bg-[#FFFDF9] rounded-3xl border border-[#DFCBB5] p-3 shadow-md space-y-2.5">
        {/* BOTÓN ¡BUENAS! ACCESIBLE Y DIRECTO */}
        <button
          onClick={handleBuenasWin}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-[#D97706] via-[#DC2626] to-[#B45309] hover:brightness-105 active:scale-98 text-white rounded-2xl font-black text-base shadow-md ring-2 ring-amber-400/50 flex items-center justify-center gap-2 transition-all uppercase tracking-wider select-none"
          title="Gritar ¡Buenas! y pausar partida"
        >
          <Trophy className="w-5 h-5 fill-amber-200 text-amber-200" />
          <span>¡BUENAS!</span>
        </button>

        <div className="flex items-center justify-between gap-2.5">
          {/* Carta Anterior */}
          <button
            onClick={handlePrevCard}
            disabled={currentIndex <= 0}
            className="p-3.5 bg-[#EFE3D3] hover:bg-[#E5D5C0] text-[#5C381E] border border-[#D8C1A8] rounded-2xl shadow-xs active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center"
            title="Carta anterior"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          {/* Botón Central Play / Pause */}
          <button
            onClick={() => {
              if (currentIndex === -1) handleNextCard();
              setIsPlaying(!isPlaying);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm shadow-md transition-all active:scale-98 text-white ${
              isPlaying
                ? 'bg-gradient-to-r from-[#C2410C] to-[#9A3412] hover:brightness-105 border border-amber-600/50'
                : 'bg-gradient-to-r from-[#1B5236] to-[#123E28] hover:from-[#216342] hover:to-[#174B31] border border-[#2B734F]/50 ring-2 ring-emerald-700/20'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-5 h-5 fill-white" />
                <span>Pausar ({intervalSeconds}s)</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-white" />
                <span>{currentIndex === -1 ? 'Comenzar Ronda' : 'Continuar'}</span>
              </>
            )}
          </button>

          {/* Siguiente Carta */}
          <button
            onClick={handleNextCard}
            disabled={currentIndex >= shuffledDeck.length - 1}
            className="p-3.5 bg-[#EFE3D3] hover:bg-[#E5D5C0] text-[#5C381E] border border-[#D8C1A8] rounded-2xl shadow-xs active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center"
            title="Siguiente carta"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Acciones de juego secundarias (Chips táctiles y coloridos) */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#EFE3D3]">
          <button
            onClick={() => setShowHistoryModal(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 bg-[#F6ECE0] hover:bg-[#EEDDCC] text-[#78350F] border border-[#E5CFBA] rounded-xl font-bold text-xs shadow-2xs active:scale-95 transition-all"
          >
            <History className="w-3.5 h-3.5 text-[#B45309]" />
            <span>Historial ({calledCards.length})</span>
          </button>

          <button
            onClick={() => {
              setShowDesempateModal(true);
              setDesempateCard(null);
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 bg-[#FBECE8] hover:bg-[#F6DCD6] text-[#991B1B] border border-[#F2C2B8] rounded-xl font-bold text-xs shadow-2xs active:scale-95 transition-all"
          >
            <Swords className="w-3.5 h-3.5 text-[#DC2626]" />
            <span>Desempate</span>
          </button>

          <button
            onClick={handleRestart}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 bg-[#EBF3EC] hover:bg-[#DBEADF] text-[#14532D] border border-[#C5DEC9] rounded-xl font-bold text-xs shadow-2xs active:scale-95 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#16A34A]" />
            <span>Barajear</span>
          </button>
        </div>
      </div>

      {/* ================= MODAL: AJUSTES, TIEMPO, VOZ Y OPCIONES SUTILES ================= */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 max-h-[85dvh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-serif font-bold text-base text-stone-900">
                Ajustes y Opciones
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-800 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selector de Voces con Ejemplo Únicamente de "¡Buenas!" */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Voz del Cantador
                </label>
                <span className="text-[10px] text-stone-400">Toca para escuchar</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {VOICES_CATALOG.map((v) => {
                  const isSelected = selectedVoiceId === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => {
                        setSelectedVoiceId(v.id);
                        handleTestVoice(v.id);
                      }}
                      className={`text-left p-2.5 rounded-2xl border transition-all ${
                        isSelected
                          ? 'border-amber-600 bg-amber-50/70 ring-2 ring-amber-500/30 shadow-xs'
                          : 'border-stone-200 hover:border-stone-300 bg-stone-50/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-900 leading-tight">{v.name}</span>
                        {isSelected && <span className="text-[10px] text-amber-700 font-bold">✓</span>}
                      </div>
                      <span className="text-[10px] font-semibold text-stone-800 bg-stone-200/70 px-1.5 py-0.5 rounded mt-1 inline-block">
                        {v.badge}
                      </span>
                      <p className="text-[10px] text-stone-500 mt-1 line-clamp-1 leading-tight">{v.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Botón de Prueba Únicamente con "¡Buenas!" */}
            <button
              onClick={() => handleTestVoice(selectedVoiceId)}
              disabled={isTestingVoice}
              className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-stone-200 transition-colors"
            >
              <Volume2 className="w-4 h-4 text-stone-600" />
              {isTestingVoice ? 'Reproduciendo audio...' : '🔊 Escuchar ejemplo: "¡Buenas!"'}
            </button>

            {/* Voz del sistema si está disponible */}
            {voices.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  Voz del Dispositivo ({voices.length} disponibles)
                </label>
                <select
                  value={selectedVoiceURI}
                  onChange={(e) => setSelectedVoiceURI(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 text-xs rounded-xl p-2 font-medium"
                >
                  {voices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sliders de Tiempo y Velocidad */}
            <div className="space-y-3 pt-1">
              <div>
                <div className="flex justify-between text-xs font-semibold text-stone-700 mb-1">
                  <span>Tiempo automático por carta</span>
                  <span className="font-mono font-bold text-stone-900">{intervalSeconds}s</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={9}
                  value={intervalSeconds}
                  onChange={(e) => setIntervalSeconds(parseInt(e.target.value, 10))}
                  className="w-full accent-stone-800 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-stone-700 mb-1">
                  <span>Velocidad de narración</span>
                  <span className="font-mono font-bold text-stone-900">{speechRate.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min={0.7}
                  max={1.4}
                  step={0.1}
                  value={speechRate}
                  onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                  className="w-full accent-stone-800 cursor-pointer"
                />
              </div>
            </div>

            {/* Opciones de Narración: Número, Frase y Campana */}
            <div className="pt-2 border-t border-[#EFE3D3] space-y-2 text-xs">
              <label className="text-[11px] font-bold text-[#78593F] uppercase tracking-wider block">
                Opciones del Cantado
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF5EE] border border-[#E5CFBA] cursor-pointer hover:bg-[#F5ECE0] transition-colors">
                <div>
                  <span className="text-[#4A2E18] font-bold block">Cantar número de carta</span>
                  <span className="text-[10px] text-[#8C6D53]">Ej: "El 54..." o "El 10..."</span>
                </div>
                <input
                  type="checkbox"
                  checked={announceNumber}
                  onChange={(e) => setAnnounceNumber(e.target.checked)}
                  className="w-4 h-4 rounded border-stone-300 text-amber-700 focus:ring-amber-700 accent-amber-700 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF5EE] border border-[#E5CFBA] cursor-pointer hover:bg-[#F5ECE0] transition-colors">
                <div>
                  <span className="text-[#4A2E18] font-bold block">Cantar frase o verso de la carta</span>
                  <span className="text-[10px] text-[#8C6D53]">Dicta la frase cómica o verso tradicional</span>
                </div>
                <input
                  type="checkbox"
                  checked={announceTagline}
                  onChange={(e) => setAnnounceTagline(e.target.checked)}
                  className="w-4 h-4 rounded border-stone-300 text-amber-700 focus:ring-amber-700 accent-amber-700 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF5EE] border border-[#E5CFBA] cursor-pointer hover:bg-[#F5ECE0] transition-colors">
                <span className="text-[#4A2E18] font-medium">Sonido de campana al salir carta</span>
                <input
                  type="checkbox"
                  checked={playChime}
                  onChange={(e) => setPlayChime(e.target.checked)}
                  className="w-4 h-4 rounded border-stone-300 text-amber-700 focus:ring-amber-700 accent-amber-700 cursor-pointer"
                />
              </label>
            </div>

            {/* ================= SECCIÓN SUTIL Y NO NOTORIA DE ADMINISTRACIÓN ================= */}
            <div className="pt-3 border-t border-stone-100">
              {!canAccessGenerator ? (
                /* En modo cliente/bloqueado: completamente sutil y no notorio */
                <div className="flex items-center justify-between text-xs text-stone-400">
                  <span className="text-[11px] font-mono">Lotería v1.0</span>
                  <button
                    onClick={() => {
                      setShowSettingsModal(false);
                      onOpenPasswordModal('unlock');
                    }}
                    className="flex items-center gap-1.5 text-stone-400 hover:text-stone-700 text-xs px-2 py-1 rounded-lg transition-colors"
                    title="Acceso Administrador"
                  >
                    <Lock className="w-3.5 h-3.5 text-stone-400" />
                    <span>Acceso Admin</span>
                  </button>
                </div>
              ) : (
                /* En modo administrador desbloqueado: herramientas de baraja */
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                      Herramientas de Baraja
                    </p>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                      Admin Activo
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setShowSettingsModal(false);
                      onGoToGenerator();
                    }}
                    className="w-full py-2.5 px-3 bg-amber-400 hover:bg-amber-500 text-stone-900 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    <Palette className="w-4 h-4" />
                    <span>Ir al Generador de Cartas y Tablas</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      onClick={() => {
                        setShowSettingsModal(false);
                        onLockGenerator();
                      }}
                      className="py-2 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl font-bold flex items-center justify-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5 text-amber-700" />
                      <span>Bloquear Cliente</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowSettingsModal(false);
                        onOpenPasswordModal('change_password');
                      }}
                      className="py-2 px-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 rounded-xl font-medium flex items-center justify-center gap-1.5"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-stone-600" />
                      <span>Cambiar PIN</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <button
                      onClick={() => {
                        setShowSettingsModal(false);
                        exportDeckToJson(cards, cardStyle, boardConfig);
                      }}
                      className="py-1.5 px-2 bg-stone-50 hover:bg-stone-100 text-stone-700 rounded-lg border border-stone-200 flex items-center justify-center gap-1.5 text-[11px]"
                    >
                      <Download className="w-3 h-3 text-stone-500" />
                      <span>Exportar Baraja (.json)</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowSettingsModal(false);
                        fileInputRef.current?.click();
                      }}
                      className="py-1.5 px-2 bg-stone-50 hover:bg-stone-100 text-stone-700 rounded-lg border border-stone-200 flex items-center justify-center gap-1.5 text-[11px]"
                    >
                      <Upload className="w-3 h-3 text-stone-500" />
                      <span>Importar Baraja (.json)</span>
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setShowSettingsModal(false);
                      onResetToDefault();
                    }}
                    className="w-full py-1.5 text-rose-600 hover:bg-rose-50 text-[11px] font-medium rounded-lg flex items-center justify-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restaurar Baraja Original</span>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowSettingsModal(false)}
              className="w-full py-2.5 bg-stone-900 text-white rounded-xl text-xs font-bold mt-2"
            >
              Listo
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL: HISTORIAL DE CARTAS ================= */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[80dvh] flex flex-col space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-serif font-bold text-base text-stone-900">
                Cartas Cantadas ({calledCards.length})
              </h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {calledCards.length === 0 ? (
                <p className="text-xs text-stone-400 italic text-center py-8">
                  Aún no se ha cantado ninguna carta en esta ronda.
                </p>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {calledCards.slice().reverse().map((c) => (
                    <div
                      key={c.id}
                      className="bg-stone-50 rounded-xl p-1.5 border border-stone-200 text-center flex flex-col items-center"
                    >
                      <span className="text-[10px] font-mono font-bold text-stone-800">#{c.number}</span>
                      <div className="w-full aspect-[3/4] my-1 rounded overflow-hidden">
                        <img src={c.image} alt={c.name} className="w-full h-full object-contain" />
                      </div>
                      <p className="text-[9px] font-medium text-stone-800 truncate w-full">{c.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowHistoryModal(false)}
              className="w-full py-2 bg-stone-900 text-white rounded-xl text-xs font-bold"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL: DESEMPATE ================= */}
      {showDesempateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl text-center space-y-4">
            <h3 className="font-serif font-bold text-base text-stone-900">
              Desempate: Carta Mayor
            </h3>
            <p className="text-xs text-stone-500">
              Saca una carta al azar para desempatar la jugada entre los ganadores.
            </p>

            {desempateCard ? (
              <div className="w-40 mx-auto aspect-[3/4]">
                <CardPreview card={desempateCard} style={cardStyle} />
              </div>
            ) : (
              <div className="w-40 mx-auto aspect-[3/4] rounded-2xl border-2 border-dashed border-rose-300 flex items-center justify-center bg-rose-50/50">
                <Swords className="w-8 h-8 text-rose-400" />
              </div>
            )}

            <div className="space-y-2">
              <button
                onClick={handleDesempateCartaMayor}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                <Swords className="w-4 h-4" />
                {desempateCard ? 'Sacar Otra Carta' : 'Sacar Carta de Desempate'}
              </button>

              <button
                onClick={() => setShowDesempateModal(false)}
                className="w-full py-2 text-stone-500 hover:text-stone-800 text-xs font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input oculto para importar baraja JSON */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};
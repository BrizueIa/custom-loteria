import React, { useState, useEffect, useRef } from 'react';
import { LoteriaCard, CardStyleConfig, BoardConfig } from '../types/loteria';
import { shuffleArray } from '../utils/loteriaEngine';
import { audioCantador, VoiceId, getVoicesCatalog } from '../utils/audioCantador';
import { exportDeckToJson } from '../utils/deckIO';
import { CardPreview } from './CardPreview';
import { useLanguage } from '../i18n/LanguageContext';
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
  Swords,
  Lock,
  KeyRound,
  Download,
  Upload,
  Palette,
  Globe,
  Clock
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
  const { t, language, setLanguage, toggleLanguage } = useLanguage();

  const [shuffledDeck, setShuffledDeck] = useState<LoteriaCard[]>(() => shuffleArray(cards));
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [intervalSeconds, setIntervalSeconds] = useState<number>(4);
  const [gameEnded, setGameEnded] = useState<boolean>(false);
  const [hasCalledBuenas, setHasCalledBuenas] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(() => intervalSeconds * 1000);
  const [isAnnouncing, setIsAnnouncing] = useState<boolean>(false);
  const announcementTokenRef = useRef<number>(0);

  useEffect(() => {
    setTimeRemaining(intervalSeconds * 1000);
  }, [intervalSeconds]);

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
      if (saved) return saved as VoiceId;
    } catch (e) {}
    return language === 'en' ? 'jenny_us' : 'dona_plantas';
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

  const applauseTimerRef = useRef<number | null>(null);

  // Auto-switch voice catalog when language changes
  useEffect(() => {
    const catalog = getVoicesCatalog(language);
    const validIds = catalog.map((v) => v.id);
    if (!validIds.includes(selectedVoiceId)) {
      setSelectedVoiceId(validIds[0]);
    }
  }, [language]);

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
            const prefix = language === 'en' ? 'en' : 'es';
            const aMatch = a.lang.startsWith(prefix) ? -1 : 1;
            const bMatch = b.lang.startsWith(prefix) ? -1 : 1;
            return aMatch - bMatch;
          });
          setVoices(sorted);
          if (!selectedVoiceURI) {
            const match = sorted.find((v) => v.lang.startsWith(language === 'en' ? 'en' : 'es'));
            setSelectedVoiceURI(match ? match.voiceURI : sorted[0].voiceURI);
          }
        }
      }
    };

    loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [selectedVoiceURI, language]);

  // Construir frase de dictado respetando opciones de número y frase/verso
  const buildCardSpeech = (card: LoteriaCard) => {
    let phrase = '';
    if (announceNumber) {
      if (language === 'en') {
        phrase += `Number ${card.number}. `;
      } else {
        phrase += `El ${card.number}. `;
      }
    }
    phrase += card.name;
    if (announceTagline && card.tagline && card.tagline.trim()) {
      phrase += `. ${card.tagline}`;
    }
    return phrase.trim();
  };

  // Precargar las siguientes cartas en segundo plano para que el TTS responda en 1ms
  const prefetchUpcomingCards = (startIdx: number, count: number = 3) => {
    if (isMuted) return;
    for (let i = 1; i <= count; i++) {
      const targetCard = shuffledDeck[startIdx + i];
      if (targetCard) {
        const speechText = buildCardSpeech(targetCard);
        audioCantador.preloadCard(speechText, selectedVoiceId);
      }
    }
  };

  // Precargar las primeras cartas al inicializar, cambiar de voz o barajear
  useEffect(() => {
    if (shuffledDeck.length > 0 && currentIndex === -1 && !isMuted) {
      for (let i = 0; i < Math.min(3, shuffledDeck.length); i++) {
        const speechText = buildCardSpeech(shuffledDeck[i]);
        audioCantador.preloadCard(speechText, selectedVoiceId);
      }
    }
  }, [shuffledDeck, selectedVoiceId, announceNumber, announceTagline, isMuted]);

  // Cantar carta dinámicamente:
  // - Precarga las cartas siguientes en segundo plano
  // - El tiempo NO corre mientras se canta (isAnnouncing = true)
  // - Al finalizar la locución, isAnnouncing pasa a false y comienza el conteo del intervalo
  const announceCard = async (card: LoteriaCard, cardIndex: number) => {
    announcementTokenRef.current++;
    const currentToken = announcementTokenRef.current;

    // Disparar precarga en segundo plano de las siguientes cartas
    prefetchUpcomingCards(cardIndex, 3);

    // Chime si está habilitado
    if (playChime) audioCantador.playCardChime();

    // Mantener tiempo restante completo durante la locución
    setTimeRemaining(intervalSeconds * 1000);

    if (isMuted) {
      setIsAnnouncing(false);
      return;
    }

    setIsAnnouncing(true);

    const speechText = buildCardSpeech(card);

    // Timeout de seguridad: máximo 7 segundos para que la partida nunca quede congelada si hay fallo de red
    const safetyTimeout = new Promise<void>((resolve) => {
      window.setTimeout(resolve, 7000);
    });

    try {
      await Promise.race([
        audioCantador.announceCard(speechText, selectedVoiceId, speechRate, selectedVoiceURI),
        safetyTimeout
      ]);
    } catch (e) {
      // Ignorar errores de audio
    }

    // Solo avanzar al conteo si esta carta sigue siendo la activa
    if (announcementTokenRef.current === currentToken) {
      setIsAnnouncing(false);
      setTimeRemaining(intervalSeconds * 1000);
    }
  };

  // Probar voz con "¡Buenas!" o "Bingo!"
  const handleTestVoice = async (voiceToTest: VoiceId = selectedVoiceId) => {
    setIsTestingVoice(true);
    await audioCantador.speakSpecial('buenas', voiceToTest, speechRate);
    setIsTestingVoice(false);
  };

  const handleStartRound = () => {
    if (applauseTimerRef.current) {
      clearTimeout(applauseTimerRef.current);
    }
    audioCantador.stopApplause();
    audioCantador.stop();
    const nextIdx = 0;
    setCurrentIndex(nextIdx);
    setIsPlaying(true);
    setGameEnded(false);
    setHasCalledBuenas(false);
    announceCard(shuffledDeck[nextIdx], nextIdx);
  };

  const handleNextCard = () => {
    if (applauseTimerRef.current) {
      clearTimeout(applauseTimerRef.current);
    }
    audioCantador.stopApplause();
    audioCantador.stop();
    if (currentIndex + 1 < shuffledDeck.length) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      announceCard(shuffledDeck[nextIdx], nextIdx);
    } else {
      setIsPlaying(false);
      setIsAnnouncing(false);
      setGameEnded(true);
    }
  };

  const handlePrevCard = () => {
    if (applauseTimerRef.current) {
      clearTimeout(applauseTimerRef.current);
    }
    audioCantador.stopApplause();
    audioCantador.stop();
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      announceCard(shuffledDeck[prevIdx], prevIdx);
    }
  };

  const handleRestart = () => {
    setIsPlaying(false);
    setIsAnnouncing(false);
    announcementTokenRef.current++;
    if (applauseTimerRef.current) {
      clearTimeout(applauseTimerRef.current);
    }
    audioCantador.stop();
    if (!isMuted) {
      audioCantador.playShuffleSound();
    }
    setShuffledDeck(shuffleArray(cards));
    setCurrentIndex(-1);
    setGameEnded(false);
    setHasCalledBuenas(false);
    setTimeRemaining(intervalSeconds * 1000);
  };

  const handleTogglePlayPause = () => {
    if (currentIndex === -1) {
      handleStartRound();
      return;
    }

    if (isPlaying) {
      setIsPlaying(false);
      setIsAnnouncing(false);
      announcementTokenRef.current++;
      audioCantador.stop();
    } else {
      setIsPlaying(true);
    }
  };

  // Loop de llamada automática: el tiempo corre ÚNICAMENTE después de que el audio finaliza
  useEffect(() => {
    if (!isPlaying || gameEnded || currentIndex === -1 || isAnnouncing) {
      return;
    }

    const tickMs = 50;
    const intervalId = window.setInterval(() => {
      setTimeRemaining((prev) => {
        const next = prev - tickMs;
        if (next <= 0) {
          return 0;
        }
        return next;
      });
    }, tickMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isPlaying, gameEnded, currentIndex, isAnnouncing, intervalSeconds]);

  // Cuando el temporizador llega a cero (y ya terminó la locución), avanza automáticamente a la siguiente carta
  useEffect(() => {
    if (isPlaying && !gameEnded && currentIndex >= 0 && !isAnnouncing && timeRemaining === 0) {
      handleNextCard();
    }
  }, [timeRemaining, isPlaying, gameEnded, currentIndex, isAnnouncing]);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      if (applauseTimerRef.current) {
        clearTimeout(applauseTimerRef.current);
      }
      audioCantador.stop();
    };
  }, []);

  // Celebrar ganador con ¡BUENAS!
  const handleBuenasWin = async () => {
    setIsPlaying(false);
    setIsAnnouncing(false);
    announcementTokenRef.current++;
    audioCantador.stop();
    setHasCalledBuenas(true);
    if (applauseTimerRef.current) {
      clearTimeout(applauseTimerRef.current);
    }
    audioCantador.stopApplause();

    // 1. Confeti y primero la voz del cantador diciendo ¡BUENAS!
    confetti({
      particleCount: 160,
      spread: 80,
      origin: { y: 0.5 }
    });
    audioCantador.speakSpecial('buenas', selectedVoiceId, speechRate);

    // 2. Exactamente 1 segundo después, entran los aplausos y ovación
    applauseTimerRef.current = window.setTimeout(() => {
      audioCantador.playApplause();
    }, 1000);
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
          alert(t('deck_imported_success'));
        } else {
          alert(t('deck_import_error'));
        }
      } catch (err) {
        alert(t('deck_import_read_error'));
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const currentCard = currentIndex >= 0 ? shuffledDeck[currentIndex] : null;
  const calledCards = shuffledDeck.slice(0, currentIndex + 1);
  const activeVoicesCatalog = getVoicesCatalog(language);

  // Reglas de juego para evitar romper partidas en curso:
  const isDesempateAllowed = hasCalledBuenas;
  const isShuffleAllowed = currentIndex === -1 || hasCalledBuenas || gameEnded;

  return (
    <div className="w-full max-w-md mx-auto flex flex-col h-[100dvh] justify-between p-2.5 select-none bg-gradient-to-b from-[#F7F2EA] via-[#F4ECE1] to-[#EFE4D6]">
      {/* 1. BARRA SUPERIOR (Cálida, minimalista, con selector de idioma) */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#FFFDF9]/95 backdrop-blur-md rounded-2xl border border-[#DFCBB5] shadow-xs">
        {/* Título & Contador */}
        <div 
          onClick={handleTitleTap}
          className="flex items-center gap-2 cursor-pointer active:opacity-80 transition-opacity"
          title={t('admin_auth')}
        >
          <span className="font-serif font-black text-base tracking-wide text-[#4A2E18] uppercase">
            {boardConfig.title || t('app_title')}
          </span>
          <span className="font-mono text-xs font-black bg-[#EFE3D3] text-[#5C381E] border border-[#DFC7B0] px-2.5 py-0.5 rounded-full">
            {currentIndex + 1} / {cards.length}
          </span>
        </div>

        {/* Acciones superiores (Idioma, Generador, Silencio y Ajustes) */}
        <div className="flex items-center gap-1.5">
          {/* Quick Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-black bg-[#EFE3D3] hover:bg-[#E5D5C0] text-[#5C381E] border border-[#DFC7B0] rounded-xl shadow-2xs transition-all active:scale-95"
            title={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
          >
            <Globe className="w-3.5 h-3.5 text-[#B45309]" />
            <span>{language.toUpperCase()}</span>
          </button>

          {canAccessGenerator && (
            <button
              onClick={onGoToGenerator}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-[#FEF3C7] hover:bg-[#FDE68A] text-[#78350F] border border-[#FCD34D] rounded-xl shadow-2xs transition-colors"
              title={t('open_generator')}
            >
              <Palette className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">{t('generator')}</span>
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
            title={t('settings_title')}
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. ESCENARIO CENTRAL (Carta Principal) */}
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
            <img
              src="/logo.png"
              alt="Custom Lotería"
              className="w-20 h-20 object-contain drop-shadow-md select-none"
            />
            <div>
              <h3 className="font-serif text-xl font-black text-[#4A2E18] tracking-tight">
                {t('deck_ready')}
              </h3>
              <p className="text-xs text-[#78593F] mt-1 font-medium">
                {t('deck_ready_desc', { count: cards.length })}
              </p>
            </div>
            <button
              onClick={handleStartRound}
              className="px-6 py-3 bg-[#1B5236] hover:bg-[#14422B] text-white rounded-2xl font-black text-sm shadow-md transition-transform active:scale-95 flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" />
              {t('start_round')}
            </button>
          </div>
        )}

        {/* Repetir voz de la carta actual */}
        {currentCard && (
          <button
            onClick={() => announceCard(currentCard, currentIndex)}
            className="mt-2 text-xs text-[#5C381E] hover:text-[#382110] font-bold bg-[#EFE3D3] hover:bg-[#E5D5C0] border border-[#DFC7B0] px-3.5 py-1.5 rounded-full shadow-2xs flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <Volume2 className="w-3.5 h-3.5 text-[#B45309]" />
            {t('repeat_voice')}
          </button>
        )}
      </div>

      {/* 3. CONTROLES INFERIORES */}
      <div className="bg-[#FFFDF9] rounded-3xl border border-[#DFCBB5] p-3 shadow-md space-y-2.5">
        {/* BOTÓN ¡BUENAS! ACCESIBLE Y DIRECTO */}
        <button
          onClick={handleBuenasWin}
          disabled={currentIndex === -1}
          className={`w-full py-3.5 px-4 rounded-2xl font-black text-base shadow-md flex items-center justify-center gap-2 transition-all uppercase tracking-wider select-none ${
            currentIndex === -1
              ? 'bg-stone-200 text-stone-400 border border-stone-300 opacity-50 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#D97706] via-[#DC2626] to-[#B45309] hover:brightness-105 active:scale-98 text-white ring-2 ring-amber-400/50'
          }`}
          title={currentIndex === -1 ? 'Inicia la ronda para poder cantar ¡BUENAS!' : t('buenas')}
        >
          <Trophy className={`w-5 h-5 ${currentIndex === -1 ? 'text-stone-400' : 'fill-amber-200 text-amber-200'}`} />
          <span>{t('buenas')}</span>
        </button>

        {/* Indicador de tiempo que se consume para la siguiente carta */}
        {currentIndex >= 0 && !gameEnded && (
          <div className="bg-[#FAF3EA] border border-[#DFC7B0] rounded-2xl px-3.5 py-2 flex flex-col gap-1.5 shadow-2xs transition-all">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#78350F]">
              <span className="flex items-center gap-1.5">
                {isAnnouncing ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                    <span className="text-rose-700 font-extrabold">{t('calling_card')}</span>
                  </>
                ) : (
                  <>
                    <Clock className={`w-3.5 h-3.5 text-amber-700 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
                    <span>{isPlaying ? t('next_card_in') : t('timer_paused')}</span>
                  </>
                )}
              </span>
              <span className={`font-mono text-xs font-black px-2 py-0.5 rounded-md border ${
                isAnnouncing
                  ? 'text-rose-700 bg-rose-50 border-rose-200 animate-pulse'
                  : 'text-[#5C381E] bg-[#EFE3D3] border-[#DFC7B0]'
              }`}>
                {isAnnouncing ? '🔊' : `${(Math.max(0, timeRemaining) / 1000).toFixed(1)}s`}
              </span>
            </div>
            <div className="w-full bg-[#E5D2BE] h-2.5 rounded-full overflow-hidden p-0.5 border border-[#D8C1A8]">
              <div
                className={`h-full rounded-full transition-all duration-75 ${
                  isAnnouncing
                    ? 'w-full bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400 animate-pulse'
                    : isPlaying
                    ? 'bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500'
                    : 'bg-stone-400'
                }`}
                style={{
                  width: isAnnouncing ? '100%' : `${Math.max(0, Math.min(100, (timeRemaining / (intervalSeconds * 1000)) * 100))}%`
                }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-2.5">
          {/* Carta Anterior */}
          <button
            onClick={handlePrevCard}
            disabled={currentIndex <= 0}
            className="p-3.5 bg-[#EFE3D3] hover:bg-[#E5D5C0] text-[#5C381E] border border-[#D8C1A8] rounded-2xl shadow-xs active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center"
            title={t('prev_card')}
          >
            <SkipBack className="w-5 h-5" />
          </button>

          {/* Botón Central Play / Pause / Continuar */}
          <button
            onClick={handleTogglePlayPause}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm shadow-md transition-all active:scale-98 text-white ${
              isPlaying
                ? 'bg-gradient-to-r from-[#C2410C] to-[#9A3412] hover:brightness-105 border border-amber-600/50'
                : 'bg-gradient-to-r from-[#1B5236] to-[#123E28] hover:from-[#216342] hover:to-[#174B31] border border-[#2B734F]/50 ring-2 ring-emerald-700/20'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-5 h-5 fill-white" />
                <span>{t('pause', { seconds: intervalSeconds })}</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-white" />
                <span>{currentIndex === -1 ? t('start_round') : t('continue')}</span>
              </>
            )}
          </button>

          {/* Siguiente Carta */}
          <button
            onClick={handleNextCard}
            disabled={currentIndex >= shuffledDeck.length - 1}
            className="p-3.5 bg-[#EFE3D3] hover:bg-[#E5D5C0] text-[#5C381E] border border-[#D8C1A8] rounded-2xl shadow-xs active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center"
            title={t('next_card')}
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
            <span>{t('history')} ({calledCards.length})</span>
          </button>

          {/* Desempate (Carta Mayor) */}
          <button
            onClick={() => {
              if (!isDesempateAllowed) return;
              setShowDesempateModal(true);
              setDesempateCard(null);
            }}
            disabled={!isDesempateAllowed}
            title={!isDesempateAllowed ? t('tie_breaker_locked_hint') : t('tie_breaker')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl font-bold text-xs shadow-2xs transition-all ${
              isDesempateAllowed
                ? 'bg-[#FBECE8] hover:bg-[#F6DCD6] text-[#991B1B] border border-[#F2C2B8] active:scale-95'
                : 'bg-stone-100 text-stone-400 border border-stone-200 opacity-40 cursor-not-allowed'
            }`}
          >
            <Swords className={`w-3.5 h-3.5 ${isDesempateAllowed ? 'text-[#DC2626]' : 'text-stone-400'}`} />
            <span>{t('tie_breaker')}</span>
          </button>

          {/* Barajear / Siguiente Ronda */}
          <button
            onClick={() => {
              if (!isShuffleAllowed) return;
              handleRestart();
            }}
            disabled={!isShuffleAllowed}
            title={!isShuffleAllowed ? t('shuffle_locked_hint') : t('shuffle')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl font-bold text-xs shadow-2xs transition-all ${
              isShuffleAllowed
                ? 'bg-[#EBF3EC] hover:bg-[#DBEADF] text-[#14532D] border border-[#C5DEC9] active:scale-95'
                : 'bg-stone-100 text-stone-400 border border-stone-200 opacity-40 cursor-not-allowed'
            }`}
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isShuffleAllowed ? 'text-[#16A34A]' : 'text-stone-400'}`} />
            <span>{t('shuffle')}</span>
          </button>
        </div>
      </div>

      {/* ================= MODAL: AJUSTES, IDIOMA, TIEMPO, VOZ Y OPCIONES SUTILES ================= */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 max-h-[85dvh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-serif font-black text-lg text-stone-900 tracking-tight">
                {t('settings_title')}
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-800 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selector de Idioma (Español / English) */}
            <div>
              <label className="text-[11px] font-bold text-[#78593F] uppercase tracking-wider block mb-1.5">
                {t('language')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setLanguage('es')}
                  className={`py-2 px-3 rounded-2xl border text-xs font-black flex items-center justify-center gap-2 transition-all ${
                    language === 'es'
                      ? 'bg-[#FEF3C7] border-amber-600 text-[#78350F] ring-2 ring-amber-500/30 shadow-xs'
                      : 'bg-[#FAF5EE] border-[#DFCBB5] text-[#5C381E] hover:bg-[#F3ECE0]'
                  }`}
                >
                  <span className="text-base">🇲🇽</span>
                  <span>Español</span>
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`py-2 px-3 rounded-2xl border text-xs font-black flex items-center justify-center gap-2 transition-all ${
                    language === 'en'
                      ? 'bg-[#FEF3C7] border-amber-600 text-[#78350F] ring-2 ring-amber-500/30 shadow-xs'
                      : 'bg-[#FAF5EE] border-[#DFCBB5] text-[#5C381E] hover:bg-[#F3ECE0]'
                  }`}
                >
                  <span className="text-base">🇺🇸</span>
                  <span>English</span>
                </button>
              </div>
            </div>

            {/* Selector de Voces según el Idioma */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                  {t('caller_voice')}
                </label>
                <span className="text-[10px] text-stone-400">{t('tap_to_listen')}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {activeVoicesCatalog.map((v) => {
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

            {/* Botón de Prueba */}
            <button
              onClick={() => handleTestVoice(selectedVoiceId)}
              disabled={isTestingVoice}
              className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-stone-200 transition-colors"
            >
              <Volume2 className="w-4 h-4 text-stone-600" />
              {isTestingVoice ? '...' : language === 'en' ? '🔊 Listen sample: "Bingo!"' : '🔊 Escuchar ejemplo: "¡Buenas!"'}
            </button>

            {/* Voz del sistema si está disponible */}
            {voices.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1">
                  {t('device_voice', { count: voices.length })}
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
                  <span>{t('auto_time_per_card')}</span>
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
                  <span>{t('speech_rate')}</span>
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
                {t('calling_options')}
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF5EE] border border-[#E5CFBA] cursor-pointer hover:bg-[#F5ECE0] transition-colors">
                <div>
                  <span className="text-[#4A2E18] font-bold block">{t('announce_number')}</span>
                  <span className="text-[10px] text-[#8C6D53]">{t('announce_number_desc')}</span>
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
                  <span className="text-[#4A2E18] font-bold block">{t('announce_tagline')}</span>
                  <span className="text-[10px] text-[#8C6D53]">{t('announce_tagline_desc')}</span>
                </div>
                <input
                  type="checkbox"
                  checked={announceTagline}
                  onChange={(e) => setAnnounceTagline(e.target.checked)}
                  className="w-4 h-4 rounded border-stone-300 text-amber-700 focus:ring-amber-700 accent-amber-700 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF5EE] border border-[#E5CFBA] cursor-pointer hover:bg-[#F5ECE0] transition-colors">
                <span className="text-[#4A2E18] font-medium">{t('bell_chime')}</span>
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
                  <span className="text-[11px] font-mono">v1.0</span>
                  <button
                    onClick={() => {
                      setShowSettingsModal(false);
                      onOpenPasswordModal('unlock');
                    }}
                    className="flex items-center gap-1.5 text-stone-400 hover:text-stone-700 text-xs px-2 py-1 rounded-lg transition-colors"
                    title={t('admin_access')}
                  >
                    <Lock className="w-3.5 h-3.5 text-stone-400" />
                    <span>{t('admin_access')}</span>
                  </button>
                </div>
              ) : (
                /* En modo administrador desbloqueado: herramientas de baraja */
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                      {t('deck_tools')}
                    </p>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                      {t('admin_active')}
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
                    <span>{t('open_generator')}</span>
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
                      <span>{t('lock_client')}</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowSettingsModal(false);
                        onOpenPasswordModal('change_password');
                      }}
                      className="py-2 px-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 rounded-xl font-medium flex items-center justify-center gap-1.5"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-stone-600" />
                      <span>{t('change_pin')}</span>
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
                      <span>{t('export_deck')}</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowSettingsModal(false);
                        fileInputRef.current?.click();
                      }}
                      className="py-1.5 px-2 bg-stone-50 hover:bg-stone-100 text-stone-700 rounded-lg border border-stone-200 flex items-center justify-center gap-1.5 text-[11px]"
                    >
                      <Upload className="w-3 h-3 text-stone-500" />
                      <span>{t('import_deck')}</span>
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
                    <span>{t('restore_original')}</span>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowSettingsModal(false)}
              className="w-full py-2.5 bg-stone-900 text-white rounded-xl text-xs font-bold mt-2"
            >
              {t('done')}
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL: HISTORIAL DE CARTAS ================= */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[80dvh] flex flex-col space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-stone-100">
              <h3 className="font-serif font-black text-lg text-stone-900 tracking-tight">
                {t('called_cards', { count: calledCards.length })}
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
                  {t('no_cards_called')}
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
              {t('close')}
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL: DESEMPATE ================= */}
      {showDesempateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl text-center space-y-4">
            <h3 className="font-serif font-black text-lg text-stone-900 tracking-tight">
              {t('tie_breaker_title')}
            </h3>
            <p className="text-xs text-stone-500">
              {t('tie_breaker_desc')}
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
                {desempateCard ? t('draw_another_card') : t('draw_tie_card')}
              </button>

              <button
                onClick={() => setShowDesempateModal(false)}
                className="w-full py-2 text-stone-500 hover:text-stone-800 text-xs font-semibold"
              >
                {t('close')}
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

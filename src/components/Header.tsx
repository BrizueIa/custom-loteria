import React, { useState, useRef } from 'react';
import { AppTab, LoteriaCard, CardStyleConfig, BoardConfig } from '../types/loteria';
import { Download, Upload, Volume2, Palette, MoreVertical, RotateCcw, Lock, KeyRound } from 'lucide-react';

interface HeaderProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  cards: LoteriaCard[];
  cardStyle: CardStyleConfig;
  boardConfig: BoardConfig;
  onImportDeck: (imported: { cards: LoteriaCard[]; style: CardStyleConfig; boardConfig: BoardConfig }) => void;
  onResetToDefault: () => void;
  isLocked: boolean;
  isSessionUnlocked: boolean;
  onLockGenerator: () => void;
  onOpenPasswordModal: (mode: 'unlock' | 'change_password') => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  cards,
  cardStyle,
  boardConfig,
  onImportDeck,
  onResetToDefault,
  isLocked,
  isSessionUnlocked,
  onLockGenerator,
  onOpenPasswordModal,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const tapCountRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tapTimerRef = useRef<number | null>(null);

  // Secret 4-tap on logo to open admin unlock
  const handleLogoTap = () => {
    if (!isLocked || isSessionUnlocked) return;
    tapCountRef.current += 1;
    if (tapCountRef.current >= 4) {
      tapCountRef.current = 0;
      onOpenPasswordModal('unlock');
      return;
    }

    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = window.setTimeout(() => {
      tapCountRef.current = 0;
    }, 2000);
  };

  const handleExportDeck = () => {
    const data = {
      version: 1,
      name: boardConfig.title || 'Lotería Personalizada',
      exportDate: new Date().toISOString(),
      cards,
      cardStyle,
      boardConfig
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(boardConfig.title || 'loteria-personalizada').toLowerCase().replace(/\s+/g, '-')}-baraja.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowMenu(false);
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
          alert('Baraja importada exitosamente.');
        } else {
          alert('El archivo no tiene el formato de baraja válido.');
        }
      } catch (err) {
        alert('Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
    setShowMenu(false);
  };

  const canShowGenerator = !isLocked || isSessionUnlocked;

  return (
    <header className="w-full bg-[#143626] text-white border-b border-emerald-950/40 sticky top-0 z-30 shadow-sm">
      <div className="max-w-4xl mx-auto px-3 py-2 flex items-center justify-between gap-2">
        {/* Brand / Logo (with secret tap support) */}
        <div
          onClick={handleLogoTap}
          className="flex items-center gap-2 cursor-pointer select-none active:scale-95 transition-transform"
          title={isLocked && !isSessionUnlocked ? 'Toca varias veces para desbloquear' : 'Lotería'}
        >
          <div className="w-7 h-7 rounded-lg bg-emerald-700/80 border border-emerald-500/30 flex items-center justify-center font-serif font-black text-amber-300 text-sm">
            🌿
          </div>
          <div>
            <h1 className="font-serif text-xs sm:text-sm font-black tracking-wide leading-tight text-amber-100 flex items-center gap-1.5">
              SEÑORA DE LAS PLANTAS
              {isSessionUnlocked && (
                <span className="text-[9px] font-sans font-bold bg-amber-400 text-stone-900 px-1.5 py-0.2 rounded-full uppercase tracking-normal">
                  Admin
                </span>
              )}
            </h1>
            <p className="text-[10px] text-emerald-300/80 hidden sm:block">
              Lotería Mexicana Personalizada
            </p>
          </div>
        </div>

        {/* Tab Switcher - ONLY VISIBLE IF GENERATOR IS UNLOCKED */}
        {canShowGenerator ? (
          <div className="flex items-center bg-black/25 p-0.5 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => onTabChange('generator')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'generator'
                  ? 'bg-amber-400 text-stone-900 shadow-xs'
                  : 'text-emerald-100/70 hover:text-white'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Generador</span>
            </button>

            <button
              onClick={() => onTabChange('game')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'game'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-emerald-100/70 hover:text-white'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Jugar</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-amber-200/90 font-serif font-bold">
            <span>Modo de Juego</span>
          </div>
        )}

        {/* Menu & Options */}
        <div className="relative flex items-center gap-1">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
            title="Opciones"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-9 w-52 bg-white text-stone-800 rounded-2xl shadow-2xl border border-stone-200 py-2 z-50 text-xs animate-in fade-in">
              {canShowGenerator ? (
                <>
                  <button
                    onClick={() => {
                      onLockGenerator();
                      setShowMenu(false);
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-amber-50 text-amber-900 flex items-center gap-2 font-bold"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-700" />
                    Bloquear y Modo Solo Juego
                  </button>

                  <button
                    onClick={() => {
                      onOpenPasswordModal('change_password');
                      setShowMenu(false);
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-stone-50 flex items-center gap-2 font-medium"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-stone-600" />
                    Cambiar Contraseña Admin
                  </button>

                  <div className="my-1 border-t border-stone-100" />

                  <button
                    onClick={handleExportDeck}
                    className="w-full px-3.5 py-2 text-left hover:bg-emerald-50 flex items-center gap-2 font-medium"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-800" />
                    Descargar Baraja (.json)
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-3.5 py-2 text-left hover:bg-emerald-50 flex items-center gap-2 font-medium"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-800" />
                    Cargar Baraja (.json)
                  </button>
                  <button
                    onClick={() => {
                      onResetToDefault();
                      setShowMenu(false);
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-rose-50 text-rose-700 flex items-center gap-2 font-medium border-t border-stone-100 mt-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Restaurar Baraja Original
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      onOpenPasswordModal('unlock');
                      setShowMenu(false);
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-emerald-50 text-emerald-950 flex items-center gap-2 font-bold"
                  >
                    <Lock className="w-3.5 h-3.5 text-emerald-700" />
                    Acceso Administrador (Generador)
                  </button>
                </>
              )}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>
    </header>
  );
};

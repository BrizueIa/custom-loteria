import { useState, useEffect } from 'react';
import { LoteriaCard, CardStyleConfig, BoardConfig, AppTab } from './types/loteria';
import { DEFAULT_CARDS } from './data/defaultCards';
import { GeneratorView } from './components/GeneratorView';
import { CantadorView } from './components/CantadorView';
import { PasswordModal } from './components/PasswordModal';
import { QRTransferModal } from './components/QRTransferModal';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import { loadCardsFromStorage, debounceSaveCards, saveCardsToStorage, clearDeckStorage } from './utils/deckStorage';
import { SyncDeckPayload } from './utils/p2pDeckSync';

const STORAGE_KEY_CARDS = 'loteria_cards_v3';
const STORAGE_KEY_STYLE = 'loteria_style_v3';
const STORAGE_KEY_BOARD = 'loteria_board_v3';
const STORAGE_KEY_LOCKED = 'loteria_is_locked_v1';
const STORAGE_KEY_PWD = 'loteria_admin_pwd_v1';

const DEFAULT_STYLE: CardStyleConfig = {
  frameStyle: 'botanical_litho',
  numberPosition: 'top-left',
  namePosition: 'bottom',
  showTaglineOnCard: false,
  borderColor: '#164E3D',
  cardBgColor: '#FFFFFF',
  textColor: '#164E3D',
  fontFamily: 'serif'
};

const DEFAULT_BOARD_CONFIG: BoardConfig = {
  rows: 4,
  cols: 4,
  allowDuplicates: false,
  quantity: 20,
  title: 'LOTERÍA',
  subtitle: '',
  showBoardNumber: false,
  boardFrameStyle: 'traditional_gallo',
  boardBorderColor: '#164E3D'
};

function MainApp() {
  const { t } = useLanguage();

  // Security State
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOCKED);
      if (saved !== null) return JSON.parse(saved);
    } catch (e) {}
    return true; // Default locked: purely standalone game for client
  });

  const [adminPassword, setAdminPassword] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PWD);
      if (saved) return saved;
    } catch (e) {}
    return '1234'; // Default PIN
  });

  const [isSessionUnlocked, setIsSessionUnlocked] = useState<boolean>(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [passwordModalMode, setPasswordModalMode] = useState<'unlock' | 'change_password'>('unlock');

  // P2P QR Transfer Modal state
  const [isQRModalOpen, setIsQRModalOpen] = useState<boolean>(false);
  const [qrModalMode, setQrModalMode] = useState<'send' | 'receive'>('send');
  const [qrInitialCode, setQrInitialCode] = useState<string>('');

  // Check URL query parameters on initial mount (?sync=XXXXXX)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const syncParam = params.get('sync');
      if (syncParam) {
        setQrInitialCode(syncParam);
        setQrModalMode('receive');
        setIsQRModalOpen(true);
        // Clean up URL without triggering re-render/reload
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    } catch (_) {}
  }, []);

  // Active tab: if locked and not session unlocked, always default to 'game'
  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    return 'game'; // Always start in game
  });

  const [isStorageReady, setIsStorageReady] = useState<boolean>(false);
  const [cards, setCards] = useState<LoteriaCard[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CARDS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_CARDS;
  });

  // Inicializar carga asíncrona desde IndexedDB (con fallback/migración de localStorage)
  useEffect(() => {
    let isMounted = true;
    loadCardsFromStorage(DEFAULT_CARDS).then((loadedCards) => {
      if (isMounted) {
        setCards(loadedCards);
        setIsStorageReady(true);
      }
    }).catch((err) => {
      console.warn('Error al cargar cartas de IndexedDB:', err);
      if (isMounted) setIsStorageReady(true);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const [cardStyle, setCardStyle] = useState<CardStyleConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STYLE);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_STYLE;
  });

  const [boardConfig, setBoardConfig] = useState<BoardConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BOARD);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_BOARD_CONFIG;
  });

  // Keep 'game' view if locked
  useEffect(() => {
    if (isLocked && !isSessionUnlocked && activeTab === 'generator') {
      setActiveTab('game');
    }
  }, [isLocked, isSessionUnlocked, activeTab]);

  // Guardar en IndexedDB con debounce para soportar cientos de MB sin límite de cuota
  useEffect(() => {
    if (!isStorageReady) return;
    debounceSaveCards(cards);
  }, [cards, isStorageReady]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STYLE, JSON.stringify(cardStyle));
    } catch (e) {}
  }, [cardStyle]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BOARD, JSON.stringify(boardConfig));
    } catch (e) {}
  }, [boardConfig]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LOCKED, JSON.stringify(isLocked));
    } catch (e) {}
  }, [isLocked]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PWD, adminPassword);
    } catch (e) {}
  }, [adminPassword]);

  const handleResetToDefault = async () => {
    if (window.confirm(t('restore_confirm'))) {
      setCards(DEFAULT_CARDS);
      setCardStyle(DEFAULT_STYLE);
      setBoardConfig(DEFAULT_BOARD_CONFIG);
      await clearDeckStorage();
      localStorage.removeItem(STORAGE_KEY_STYLE);
      localStorage.removeItem(STORAGE_KEY_BOARD);
    }
  };

  const handleImportDeck = (imported: { cards: LoteriaCard[]; style: CardStyleConfig; boardConfig: BoardConfig }) => {
    setCards(imported.cards);
    if (imported.style) setCardStyle(imported.style);
    if (imported.boardConfig) setBoardConfig(imported.boardConfig);
  };

  // Lock generator for client
  const handleLockGenerator = () => {
    setIsLocked(true);
    setIsSessionUnlocked(false);
    setActiveTab('game');
    alert(t('client_locked_alert'));
  };

  // Unlock generator
  const handleSuccessUnlock = () => {
    setIsSessionUnlocked(true);
    setActiveTab('generator');
  };

  const handleOpenPasswordModal = (mode: 'unlock' | 'change_password') => {
    setPasswordModalMode(mode);
    setIsPasswordModalOpen(true);
  };

  const handleOpenQRModal = (mode: 'send' | 'receive') => {
    setQrModalMode(mode);
    setQrInitialCode('');
    setIsQRModalOpen(true);
  };

  const handleCompleteP2PSync = async (payload: SyncDeckPayload) => {
    if (payload.parsedDeck) {
      setCards(payload.parsedDeck.cards);
      if (payload.parsedDeck.cardStyle) setCardStyle(payload.parsedDeck.cardStyle);
      if (payload.parsedDeck.boardConfig) setBoardConfig(payload.parsedDeck.boardConfig);
      await saveCardsToStorage(payload.parsedDeck.cards);
    }
    if (payload.lockOnReceive) {
      if (payload.adminPin) {
        setAdminPassword(payload.adminPin);
      }
      setIsLocked(true);
      setIsSessionUnlocked(false);
      setActiveTab('game');
    }
  };

  const canAccessGenerator = !isLocked || isSessionUnlocked;

  const currentDeckJson = JSON.stringify({
    version: 1,
    name: boardConfig.title || 'Lotería Personalizada',
    exportDate: new Date().toISOString(),
    cards,
    cardStyle,
    boardConfig
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#F6EFE6] text-[#3D2514] select-none">
      {/* Main Content Area */}
      <main className="flex-1 w-full mx-auto">
        {activeTab === 'generator' && canAccessGenerator ? (
          <div className="w-full max-w-7xl mx-auto p-2.5 sm:p-4 lg:p-6">
            <GeneratorView
              cards={cards}
              cardStyle={cardStyle}
              boardConfig={boardConfig}
              onUpdateCards={setCards}
              onUpdateCardStyle={setCardStyle}
              onUpdateBoardConfig={setBoardConfig}
              onGoToGame={() => setActiveTab('game')}
              onLockGenerator={handleLockGenerator}
              onImportDeck={handleImportDeck}
              onOpenQRModal={handleOpenQRModal}
            />
          </div>
        ) : (
          <CantadorView
            cards={cards}
            cardStyle={cardStyle}
            boardConfig={boardConfig}
            canAccessGenerator={canAccessGenerator}
            onGoToGenerator={() => setActiveTab('generator')}
            onLockGenerator={handleLockGenerator}
            onOpenPasswordModal={handleOpenPasswordModal}
            onImportDeck={handleImportDeck}
            onResetToDefault={handleResetToDefault}
            onOpenQRModal={handleOpenQRModal}
          />
        )}
      </main>

      {/* Password Prompt Modal */}
      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccessUnlock={handleSuccessUnlock}
        currentPassword={adminPassword}
        onUpdatePassword={setAdminPassword}
        mode={passwordModalMode}
        setMode={setPasswordModalMode}
      />

      {/* P2P QR Transfer Modal */}
      <QRTransferModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        mode={qrModalMode}
        initialCode={qrInitialCode}
        deckPackageJson={currentDeckJson}
        deckName={boardConfig.title || 'Lotería Personalizada'}
        currentAdminPin={adminPassword}
        onCompleteSync={handleCompleteP2PSync}
      />
    </div>
  );
}

export function App() {
  return (
    <LanguageProvider>
      <MainApp />
    </LanguageProvider>
  );
}

export default App;

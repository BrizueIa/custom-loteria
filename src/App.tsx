import { useState, useEffect } from 'react';
import { LoteriaCard, CardStyleConfig, BoardConfig, AppTab } from './types/loteria';
import { DEFAULT_CARDS } from './data/defaultCards';
import { GeneratorView } from './components/GeneratorView';
import { CantadorView } from './components/CantadorView';
import { PasswordModal } from './components/PasswordModal';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';

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
  title: 'LOTERÍA'
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

  // Active tab: if locked and not session unlocked, always default to 'game'
  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    return 'game'; // Always start in game
  });

  const [cards, setCards] = useState<LoteriaCard[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CARDS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_CARDS;
  });

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
        const parsed = JSON.parse(saved);
        if (parsed.title && (parsed.title.includes('PLANTAS') || parsed.title.includes('SEÑORA'))) {
          parsed.title = 'LOTERÍA';
        }
        return parsed;
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

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CARDS, JSON.stringify(cards));
    } catch (e) {
      console.warn('LocalStorage limit or error:', e);
    }
  }, [cards]);

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

  const handleResetToDefault = () => {
    if (window.confirm(t('restore_confirm'))) {
      setCards(DEFAULT_CARDS);
      setCardStyle(DEFAULT_STYLE);
      setBoardConfig(DEFAULT_BOARD_CONFIG);
      localStorage.removeItem(STORAGE_KEY_CARDS);
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

  const canAccessGenerator = !isLocked || isSessionUnlocked;

  return (
    <div className="min-h-screen flex flex-col bg-[#F6EFE6] text-[#3D2514] select-none">
      {/* Main Content Area */}
      <main className="flex-1 w-full mx-auto">
        {activeTab === 'generator' && canAccessGenerator ? (
          <div className="max-w-4xl mx-auto p-2.5 sm:p-4">
            <GeneratorView
              cards={cards}
              cardStyle={cardStyle}
              boardConfig={boardConfig}
              onUpdateCards={setCards}
              onUpdateCardStyle={setCardStyle}
              onUpdateBoardConfig={setBoardConfig}
              onGoToGame={() => setActiveTab('game')}
              onLockGenerator={handleLockGenerator}
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

import { LoteriaCard } from '../types/loteria';

const DB_NAME = 'loteria_custom_db';
const DB_VERSION = 1;
const STORE_NAME = 'decks';
const CARDS_KEY = 'active_deck_cards';
const LEGACY_STORAGE_KEY = 'loteria_cards_v3';

/**
 * Abre o inicializa la base de datos IndexedDB.
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB no está disponible en este entorno.'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Error al abrir IndexedDB'));
    };
  });
}

/**
 * Carga las 54 cartas con sus imágenes desde IndexedDB.
 * Si IndexedDB está vacío pero hay datos previos en localStorage,
 * realiza una migración transparente a IndexedDB y libera localStorage.
 */
export async function loadCardsFromStorage(fallbackCards: LoteriaCard[]): Promise<LoteriaCard[]> {
  try {
    const db = await openDB();
    const storedCards = await new Promise<LoteriaCard[] | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(CARDS_KEY);

      req.onsuccess = () => resolve(req.result as LoteriaCard[] | undefined);
      req.onerror = () => reject(req.error);
    });

    if (Array.isArray(storedCards) && storedCards.length > 0) {
      return storedCards;
    }
  } catch (err) {
    console.warn('[deckStorage] Fallback al leer IndexedDB, intentando localStorage:', err);
  }

  // Verificación de migración desde localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        const parsed = JSON.parse(legacy) as LoteriaCard[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Migrar asíncronamente a IndexedDB y limpiar localStorage para liberar espacio
          saveCardsToStorage(parsed)
            .then(() => {
              try {
                localStorage.removeItem(LEGACY_STORAGE_KEY);
                console.info('[deckStorage] Migración exitosa de localStorage a IndexedDB.');
              } catch (_) {}
            })
            .catch((e) => console.warn('[deckStorage] No se pudo guardar la migración en IndexedDB:', e));

          return parsed;
        }
      }
    } catch (e) {
      console.warn('[deckStorage] Error al leer legacy localStorage:', e);
    }
  }

  return fallbackCards;
}

let saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Guarda las cartas en IndexedDB.
 * Permite almacenar cientos de megabytes de imágenes en base64 sin el límite de 5MB de localStorage.
 */
export async function saveCardsToStorage(cards: LoteriaCard[]): Promise<boolean> {
  try {
    const db = await openDB();
    return await new Promise<boolean>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(cards, CARDS_KEY);

      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[deckStorage] Error al guardar en IndexedDB, cayendo a localStorage de emergencia:', err);
    // Fallback de emergencia si IndexedDB falla
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(cards));
        return true;
      } catch (storageErr) {
        console.error('[deckStorage] Falló almacenamiento en localStorage:', storageErr);
        return false;
      }
    }
    return false;
  }
}

/**
 * Guarda con debounce para llamadas continuas (ej. al teclear el nombre de una carta).
 */
export function debounceSaveCards(cards: LoteriaCard[], delayMs = 300): void {
  if (saveDebounceTimer) {
    clearTimeout(saveDebounceTimer);
  }
  saveDebounceTimer = setTimeout(() => {
    saveCardsToStorage(cards).catch((e) => console.error('[deckStorage] Error en debounceSave:', e));
  }, delayMs);
}

/**
 * Limpia el mazo de IndexedDB y el respaldo de localStorage.
 */
export async function clearDeckStorage(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(CARDS_KEY);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('[deckStorage] Error al borrar en IndexedDB:', e);
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch (_) {}
  }
}

/**
 * Estima el espacio utilizado y disponible en disco por el navegador.
 */
export async function estimateStorageUsage(): Promise<{ usageMB: number; quotaMB: number } | null> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const usageMB = (estimate.usage || 0) / (1024 * 1024);
      const quotaMB = (estimate.quota || 0) / (1024 * 1024);
      return {
        usageMB: Math.round(usageMB * 10) / 10,
        quotaMB: Math.round(quotaMB * 10) / 10
      };
    } catch (e) {
      console.warn('[deckStorage] No se pudo estimar almacenamiento:', e);
    }
  }
  return null;
}

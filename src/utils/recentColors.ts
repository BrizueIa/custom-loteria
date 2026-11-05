import { useState, useEffect, useCallback } from 'react';

const RECENT_COLORS_STORAGE_KEY = 'loteria_recent_colors_v1';
const MAX_RECENT_COLORS = 8;
const RECENT_COLORS_EVENT = 'loteria-recent-colors-updated';

/**
 * Normalizes any valid hex string to uppercase #RRGGBB format
 */
export function normalizeHexColor(hex?: string): string | null {
  if (!hex || typeof hex !== 'string') return null;
  let clean = hex.trim().replace(/^#/, '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  if (!/^[0-9A-Fa-f]{6}$/.test(clean)) return null;
  return `#${clean.toUpperCase()}`;
}

/**
 * Reads recent colors from localStorage
 */
export function getStoredRecentColors(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENT_COLORS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .map((c) => normalizeHexColor(c))
        .filter((c): c is string => Boolean(c))
        .slice(0, MAX_RECENT_COLORS);
    }
  } catch (e) {
    console.error('Error reading recent colors from storage', e);
  }
  return [];
}

/**
 * Saves a color into recent colors (MRU - Most Recently Used first)
 */
export function saveRecentColor(hex: string): string[] {
  const normalized = normalizeHexColor(hex);
  if (!normalized || typeof window === 'undefined') return getStoredRecentColors();

  try {
    const current = getStoredRecentColors();
    // Remove if already present, then prepend to the front
    const filtered = current.filter((c) => c.toLowerCase() !== normalized.toLowerCase());
    const updated = [normalized, ...filtered].slice(0, MAX_RECENT_COLORS);

    localStorage.setItem(RECENT_COLORS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(RECENT_COLORS_EVENT, { detail: updated }));
    return updated;
  } catch (e) {
    console.error('Error saving recent color to storage', e);
  }
  return [];
}

/**
 * Clears stored recent colors
 */
export function clearStoredRecentColors(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(RECENT_COLORS_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(RECENT_COLORS_EVENT, { detail: [] }));
  } catch (e) {}
}

/**
 * React hook to access and update shared recent colors
 */
export function useRecentColors() {
  const [recentColors, setRecentColors] = useState<string[]>(() => getStoredRecentColors());

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<string[]>;
      if (customEvent.detail && Array.isArray(customEvent.detail)) {
        setRecentColors(customEvent.detail);
      } else {
        setRecentColors(getStoredRecentColors());
      }
    };

    window.addEventListener(RECENT_COLORS_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(RECENT_COLORS_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const addColor = useCallback((hex: string) => {
    return saveRecentColor(hex);
  }, []);

  const clearColors = useCallback(() => {
    clearStoredRecentColors();
  }, []);

  return {
    recentColors,
    addColor,
    clearColors,
  };
}

/**
 * Safely tries to use the modern EyeDropper API (Chromium browsers)
 * Falls back to onFallback if not supported or canceled
 */
export async function triggerEyeDropper(
  onPick: (hex: string) => void,
  onFallback?: () => void
): Promise<boolean> {
  if (typeof window !== 'undefined' && 'EyeDropper' in window) {
    try {
      const EyeDropperClass = (window as unknown as { EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper;
      const eyeDropper = new EyeDropperClass();
      const result = await eyeDropper.open();
      if (result && result.sRGBHex) {
        const hex = normalizeHexColor(result.sRGBHex);
        if (hex) {
          saveRecentColor(hex);
          onPick(hex);
          return true;
        }
      }
    } catch (err: unknown) {
      // User canceled eyedropper (DOMException AbortError) or permission denied
      const isAbort = (err as { name?: string })?.name === 'AbortError';
      if (!isAbort && onFallback) {
        onFallback();
      }
      return false;
    }
  }

  // EyeDropper API not available
  if (onFallback) {
    onFallback();
  }
  return false;
}

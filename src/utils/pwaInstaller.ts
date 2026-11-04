/**
 * Gestor de instalación de Progressive Web App (PWA) y Service Worker.
 */

type InstallListener = (canInstall: boolean) => void;

let deferredPrompt: any = null;
const listeners: Set<InstallListener> = new Set();

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const matchMediaMatches =
    typeof window.matchMedia === 'function' ? window.matchMedia('(display-mode: standalone)').matches : false;
  return (
    Boolean(matchMediaMatches) ||
    Boolean((window.navigator as any)?.standalone) ||
    Boolean(typeof document !== 'undefined' && document.referrer && document.referrer.includes('android-app://'))
  );
}

export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua);
}

export function initPWA(): void {
  if (typeof window === 'undefined') return;

  // Registrar Service Worker en producción o si está disponible
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      // Usar ruta relativa para compatibilidad con subdirectorio de GitHub Pages
      const swUrl = `${import.meta.env.BASE_URL}sw.js`;
      navigator.serviceWorker
        .register(swUrl)
        .then((reg) => {
          console.info('[PWA] Service Worker registrado exitosamente:', reg.scope);
        })
        .catch((err) => {
          console.warn('[PWA] Error al registrar Service Worker:', err);
        });
    });
  }

  // Capturar evento de instalación de Chrome/Android/Desktop
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    listeners.forEach((l) => l(true));
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    listeners.forEach((l) => l(false));
    console.info('[PWA] Aplicación instalada en el dispositivo.');
  });
}

export function subscribePWA(listener: InstallListener): () => void {
  listeners.add(listener);
  listener(deferredPrompt !== null);
  return () => {
    listeners.delete(listener);
  };
}

export async function promptPWAInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferredPrompt) {
    return 'unavailable';
  }
  try {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    listeners.forEach((l) => l(false));
    return outcome;
  } catch (err) {
    console.warn('[PWA] Error durante prompt de instalación:', err);
    return 'unavailable';
  }
}

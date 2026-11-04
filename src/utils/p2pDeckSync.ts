import { Peer, DataConnection } from 'peerjs';
import { DeckPackage, validateAndParseDeckJson } from './deckIO';

export const CHUNK_SIZE = 16 * 1024; // 16 KB: Tamaño seguro para WebRTC DataChannel
const PEER_PREFIX = 'custom-loteria-v2-';
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // Excluye 0/O y 1/I/L para evitar confusiones

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' }
];

export interface SyncDeckPayload {
  packageJson: string;
  deckName: string;
  lockOnReceive: boolean;
  adminPin?: string;
  parsedDeck?: DeckPackage;
}

export type SyncMessage =
  | { type: 'HELLO'; clientInfo?: string }
  | {
      type: 'META';
      deckName: string;
      totalChunks: number;
      totalLength: number;
      checksum: string;
      lockOnReceive: boolean;
      adminPin?: string;
    }
  | { type: 'CHUNK'; index: number; data: string }
  | { type: 'COMPLETE'; checksum: string }
  | { type: 'ACK'; success: boolean; message?: string };

/**
 * Checksum rápido FNV-1a de 32 bits en hexadecimal para verificar integridad de la baraja.
 */
export function fnv1aChecksum(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Genera un código de 6 caracteres seguro y legible (ej. K7M49P).
 */
export function generateSyncCode(length = 6): string {
  let code = '';
  const cryptoObj = typeof window !== 'undefined' && window.crypto ? window.crypto : null;
  if (cryptoObj && cryptoObj.getRandomValues) {
    const bytes = new Uint8Array(length);
    cryptoObj.getRandomValues(bytes);
    for (let i = 0; i < length; i++) {
      code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      const idx = Math.floor(Math.random() * CODE_ALPHABET.length);
      code += CODE_ALPHABET[idx];
    }
  }
  return code;
}

/**
 * Normaliza y limpia un código ingresado por el usuario (quita guiones, espacios y convierte a mayúsculas).
 */
export function normalizeSyncCode(input: string): string {
  return (input || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8);
}

/**
 * Formatea un código de 6 caracteres con un guion para fácil lectura humana (ej. K7M-49P).
 */
export function formatSyncCode(code: string): string {
  const clean = normalizeSyncCode(code);
  if (clean.length <= 3) return clean;
  return `${clean.slice(0, 3)}-${clean.slice(3)}`;
}

/**
 * Divide una cadena larga en fragmentos de tamaño seguro.
 */
export function splitIntoChunks(content: string, chunkSize = CHUNK_SIZE): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < content.length; i += chunkSize) {
    chunks.push(content.slice(i, i + chunkSize));
  }
  return chunks;
}

export interface SenderCallbacks {
  onReady: (code: string, peerId: string) => void;
  onConnecting: () => void;
  onProgress: (pct: number, sentChunks: number, totalChunks: number) => void;
  onSuccess: (info: { deckName: string }) => void;
  onError: (errorMsg: string) => void;
}

/**
 * Inicia el Emisor P2P (en la PC del creador) esperando que un teléfono escanee el QR o ingrese el código.
 */
export function startDeckSender(
  payload: SyncDeckPayload,
  callbacks: SenderCallbacks,
  customCode?: string
): () => void {
  let isCleanedUp = false;
  const syncCode = customCode ? normalizeSyncCode(customCode) : generateSyncCode();
  const peerId = `${PEER_PREFIX}${syncCode}`;

  let peer: Peer | null = null;
  let activeConn: DataConnection | null = null;

  try {
    peer = new Peer(peerId, {
      config: { iceServers: ICE_SERVERS }
    });

    peer.on('open', () => {
      if (isCleanedUp) return;
      callbacks.onReady(syncCode, peerId);
    });

    peer.on('connection', (conn) => {
      if (isCleanedUp) {
        conn.close();
        return;
      }

      activeConn = conn;
      callbacks.onConnecting();

      conn.on('open', async () => {
        try {
          const content = payload.packageJson;
          const checksum = fnv1aChecksum(content);
          const chunks = splitIntoChunks(content, CHUNK_SIZE);
          const totalChunks = chunks.length;

          // 1. Enviar META
          const metaMsg: SyncMessage = {
            type: 'META',
            deckName: payload.deckName,
            totalChunks,
            totalLength: content.length,
            checksum,
            lockOnReceive: payload.lockOnReceive,
            adminPin: payload.adminPin
          };
          conn.send(metaMsg);

          // 2. Enviar fragmentos controlando backpressure del DataChannel
          for (let i = 0; i < totalChunks; i++) {
            if (isCleanedUp) return;

            // Si el buffer de red se está llenando (> 64 KB), pausar brevemente
            const dc = (conn as any).dataChannel as RTCDataChannel | undefined;
            if (dc && dc.bufferedAmount > 64 * 1024) {
              await new Promise((r) => setTimeout(r, 20));
            }

            const chunkMsg: SyncMessage = {
              type: 'CHUNK',
              index: i,
              data: chunks[i]
            };
            conn.send(chunkMsg);

            const pct = Math.round(((i + 1) / totalChunks) * 100);
            callbacks.onProgress(pct, i + 1, totalChunks);
          }

          // 3. Enviar señal de fin
          const completeMsg: SyncMessage = {
            type: 'COMPLETE',
            checksum
          };
          conn.send(completeMsg);
        } catch (err: any) {
          callbacks.onError(err.message || 'Error al transmitir baraja por WebRTC');
        }
      });

      conn.on('data', (data: any) => {
        if (data && typeof data === 'object' && data.type === 'ACK') {
          if (data.success) {
            callbacks.onSuccess({ deckName: payload.deckName });
          } else {
            callbacks.onError(data.message || 'El receptor rechazó la baraja.');
          }
        }
      });

      conn.on('error', (err) => {
        callbacks.onError(err.message || 'Error en la conexión con el teléfono.');
      });
    });

    peer.on('error', (err: any) => {
      if (isCleanedUp) return;
      if (err.type === 'unavailable-id') {
        // En caso raro de colisión, reintentar con otro código
        callbacks.onError('El código ya estaba en uso. Por favor vuelve a abrir el QR.');
      } else {
        callbacks.onError(err.message || 'Error al inicializar conexión P2P.');
      }
    });
  } catch (e: any) {
    callbacks.onError(e.message || 'No se pudo iniciar PeerJS.');
  }

  return () => {
    isCleanedUp = true;
    try {
      if (activeConn) activeConn.close();
      if (peer) peer.destroy();
    } catch (_) {}
  };
}

export interface ReceiverCallbacks {
  onConnecting: () => void;
  onProgress: (pct: number, receivedChunks: number, totalChunks: number) => void;
  onSuccess: (receivedPayload: SyncDeckPayload) => void;
  onError: (errorMsg: string) => void;
}

/**
 * Inicia el Receptor P2P (en el teléfono) conectándose al código del emisor para recibir las 54 fotos.
 */
export function startDeckReceiver(
  code: string,
  callbacks: ReceiverCallbacks
): () => void {
  let isCleanedUp = false;
  const syncCode = normalizeSyncCode(code);
  const targetPeerId = `${PEER_PREFIX}${syncCode}`;

  let peer: Peer | null = null;
  let conn: DataConnection | null = null;

  try {
    callbacks.onConnecting();
    peer = new Peer({
      config: { iceServers: ICE_SERVERS }
    });

    peer.on('open', () => {
      if (isCleanedUp || !peer) return;

      conn = peer.connect(targetPeerId, {
        reliable: true
      });

      let metaReceived: (SyncMessage & { type: 'META' }) | null = null;
      const chunksMap: Map<number, string> = new Map();

      conn.on('open', () => {
        conn?.send({ type: 'HELLO', clientInfo: 'CustomLoteria-PWA-Client' });
      });

      conn.on('data', (raw: any) => {
        if (!raw || typeof raw !== 'object') return;
        const msg = raw as SyncMessage;

        if (msg.type === 'META') {
          metaReceived = msg;
          callbacks.onProgress(0, 0, msg.totalChunks);
        } else if (msg.type === 'CHUNK') {
          chunksMap.set(msg.index, msg.data);
          if (metaReceived) {
            const pct = Math.round((chunksMap.size / metaReceived.totalChunks) * 100);
            callbacks.onProgress(pct, chunksMap.size, metaReceived.totalChunks);
          }
        } else if (msg.type === 'COMPLETE') {
          if (!metaReceived) {
            conn?.send({ type: 'ACK', success: false, message: 'Faltan metadatos de la baraja' });
            callbacks.onError('Faltan metadatos de la baraja.');
            return;
          }

          if (chunksMap.size !== metaReceived.totalChunks) {
            conn?.send({ type: 'ACK', success: false, message: 'Faltan fragmentos de la transmisión' });
            callbacks.onError('La descarga quedó incompleta.');
            return;
          }

          // Reensamblar cadena completa en orden
          const parts: string[] = [];
          for (let i = 0; i < metaReceived.totalChunks; i++) {
            parts.push(chunksMap.get(i) || '');
          }
          const fullJson = parts.join('');

          // Validar integridad por Checksum
          const calcChecksum = fnv1aChecksum(fullJson);
          if (calcChecksum !== metaReceived.checksum) {
            conn?.send({ type: 'ACK', success: false, message: 'Checksum de integridad no coincide' });
            callbacks.onError('Error de integridad: el archivo recibido se dañó en la red.');
            return;
          }

          // Validar estructura de baraja
          const validation = validateAndParseDeckJson(fullJson);
          if (!validation.success || !validation.data) {
            conn?.send({ type: 'ACK', success: false, message: validation.error || 'JSON inválido' });
            callbacks.onError(validation.error || 'La baraja no tiene un formato válido.');
            return;
          }

          // Notificar éxito al emisor
          conn?.send({ type: 'ACK', success: true });

          // Despachar baraja recibida
          callbacks.onSuccess({
            packageJson: fullJson,
            deckName: metaReceived.deckName,
            lockOnReceive: metaReceived.lockOnReceive,
            adminPin: metaReceived.adminPin,
            parsedDeck: {
              version: 1,
              name: metaReceived.deckName,
              exportDate: new Date().toISOString(),
              cards: validation.data.cards,
              cardStyle: validation.data.style,
              boardConfig: validation.data.boardConfig
            }
          });
        }
      });

      conn.on('error', (err) => {
        callbacks.onError(err.message || 'Error en la conexión con la PC.');
      });

      conn.on('close', () => {
        // Conexión cerrada
      });
    });

    peer.on('error', (err: any) => {
      if (isCleanedUp) return;
      if (err.type === 'peer-unavailable') {
        callbacks.onError('No se encontró la computadora con ese código. Asegúrate de que la PC tenga el QR abierto.');
      } else {
        callbacks.onError(err.message || 'Error al conectar con la PC.');
      }
    });
  } catch (e: any) {
    callbacks.onError(e.message || 'No se pudo iniciar receptor.');
  }

  return () => {
    isCleanedUp = true;
    try {
      if (conn) conn.close();
      if (peer) peer.destroy();
    } catch (_) {}
  };
}

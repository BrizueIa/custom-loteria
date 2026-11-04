import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  X,
  QrCode,
  Smartphone,
  Copy,
  Check,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  DownloadCloud,
  Send
} from 'lucide-react';
import {
  startDeckSender,
  startDeckReceiver,
  formatSyncCode,
  normalizeSyncCode,
  SyncDeckPayload
} from '../utils/p2pDeckSync';
import { useLanguage } from '../i18n/LanguageContext';

interface QRTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'send' | 'receive';
  initialCode?: string;
  deckPackageJson?: string;
  deckName?: string;
  currentAdminPin?: string;
  onCompleteSync?: (payload: SyncDeckPayload) => void;
}

export const QRTransferModal: React.FC<QRTransferModalProps> = ({
  isOpen,
  onClose,
  mode,
  initialCode = '',
  deckPackageJson = '',
  deckName = 'Lotería Personalizada',
  currentAdminPin = '1234',
  onCompleteSync
}) => {
  const { t, language } = useLanguage();

  // Mode state (can toggle between send/receive if desired)
  const [activeTab, setActiveTab] = useState<'send' | 'receive'>(mode);

  // Sender state
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [syncCode, setSyncCode] = useState<string>('');
  const [fullShareUrl, setFullShareUrl] = useState<string>('');
  const [lockOnReceive, setLockOnReceive] = useState<boolean>(true);
  const [targetAdminPin, setTargetAdminPin] = useState<string>(currentAdminPin);
  const [senderStatus, setSenderStatus] = useState<'waiting' | 'connecting' | 'sending' | 'success' | 'error'>('waiting');
  const [senderProgress, setSenderProgress] = useState<number>(0);
  const [senderError, setSenderError] = useState<string>('');
  const [hasCopiedUrl, setHasCopiedUrl] = useState<boolean>(false);

  // Receiver state
  const [inputCode, setInputCode] = useState<string>(normalizeSyncCode(initialCode));
  const [receiverStatus, setReceiverStatus] = useState<'idle' | 'connecting' | 'downloading' | 'success' | 'error'>(
    initialCode ? 'connecting' : 'idle'
  );
  const [receiverProgress, setReceiverProgress] = useState<number>(0);
  const [receiverError, setReceiverError] = useState<string>('');
  const [receivedDeckName, setReceivedDeckName] = useState<string>('');

  const cleanupSenderRef = useRef<(() => void) | null>(null);
  const cleanupReceiverRef = useRef<(() => void) | null>(null);

  // Sync mode with props
  useEffect(() => {
    setActiveTab(mode);
    if (initialCode) {
      setInputCode(normalizeSyncCode(initialCode));
    }
  }, [mode, initialCode]);

  // Clean up on close/unmount
  const cleanupAll = () => {
    if (cleanupSenderRef.current) {
      cleanupSenderRef.current();
      cleanupSenderRef.current = null;
    }
    if (cleanupReceiverRef.current) {
      cleanupReceiverRef.current();
      cleanupReceiverRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      cleanupAll();
    };
  }, []);

  // START SENDER FLOW
  const initSender = () => {
    cleanupAll();
    setSenderStatus('waiting');
    setSenderProgress(0);
    setSenderError('');

    if (!deckPackageJson) {
      setSenderError('No hay datos de baraja para transmitir.');
      setSenderStatus('error');
      return;
    }

    const payload: SyncDeckPayload = {
      packageJson: deckPackageJson,
      deckName: deckName || 'Lotería',
      lockOnReceive,
      adminPin: targetAdminPin || '1234'
    };

    const cleanup = startDeckSender(payload, {
      onReady: (code) => {
        setSyncCode(code);
        const origin = window.location.origin;
        const pathname = window.location.pathname;
        const url = `${origin}${pathname}?sync=${code}`;
        setFullShareUrl(url);

        QRCode.toDataURL(url, {
          width: 320,
          margin: 1.5,
          color: {
            dark: '#164E3D',
            light: '#FAF5EE'
          }
        })
          .then((dataUri) => setQrDataUrl(dataUri))
          .catch((err) => console.error('Error al generar QR:', err));
      },
      onConnecting: () => {
        setSenderStatus('connecting');
      },
      onProgress: (pct) => {
        setSenderStatus('sending');
        setSenderProgress(pct);
      },
      onSuccess: () => {
        setSenderStatus('success');
      },
      onError: (err) => {
        setSenderStatus('error');
        setSenderError(err);
      }
    });

    cleanupSenderRef.current = cleanup;
  };

  // START RECEIVER FLOW
  const startReceiving = (targetCode: string) => {
    cleanupAll();
    const clean = normalizeSyncCode(targetCode);
    if (clean.length < 4) {
      setReceiverError('Por favor ingresa el código completo de 6 caracteres.');
      setReceiverStatus('error');
      return;
    }

    setReceiverStatus('connecting');
    setReceiverProgress(0);
    setReceiverError('');

    const cleanup = startDeckReceiver(clean, {
      onConnecting: () => {
        setReceiverStatus('connecting');
      },
      onProgress: (pct) => {
        setReceiverStatus('downloading');
        setReceiverProgress(pct);
      },
      onSuccess: (receivedPayload) => {
        setReceiverStatus('success');
        setReceivedDeckName(receivedPayload.deckName || 'Lotería');
        if (onCompleteSync) {
          onCompleteSync(receivedPayload);
        }
      },
      onError: (err) => {
        setReceiverStatus('error');
        setReceiverError(err);
      }
    });

    cleanupReceiverRef.current = cleanup;
  };

  // Launch sender when modal opens in send mode
  useEffect(() => {
    if (isOpen && activeTab === 'send') {
      initSender();
    } else if (isOpen && activeTab === 'receive' && initialCode) {
      startReceiving(initialCode);
    } else if (!isOpen) {
      cleanupAll();
    }
  }, [isOpen, activeTab]);

  const handleCopyUrl = async () => {
    if (!fullShareUrl) return;
    try {
      await navigator.clipboard.writeText(fullShareUrl);
      setHasCopiedUrl(true);
      setTimeout(() => setHasCopiedUrl(false), 2500);
    } catch (_) {}
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FAF5EE] border border-[#E5CFBA] text-[#3D2514] w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header with Close */}
        <div className="p-4 bg-white/80 border-b border-[#EFE3D3] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <QrCode className="w-4 h-4 text-emerald-800" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 leading-tight">
                {language === 'en' ? 'P2P Deck Transfer' : 'Pasar Baraja con QR'}
              </h3>
              <p className="text-[10px] text-stone-500">
                {language === 'en' ? 'Direct PC to Mobile Sync' : 'Directo de PC a Teléfono (Sin WhatsApp)'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              cleanupAll();
              onClose();
            }}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch (only if not pre-locked into receiving initialCode) */}
        {!initialCode && (
          <div className="p-2 bg-stone-100/80 border-b border-stone-200/80 flex gap-1">
            <button
              onClick={() => setActiveTab('send')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'send'
                  ? 'bg-white text-emerald-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Send (from PC)' : 'Enviar (desde PC)'}</span>
            </button>
            <button
              onClick={() => setActiveTab('receive')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'receive'
                  ? 'bg-white text-emerald-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <DownloadCloud className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Receive (Phone)' : 'Recibir (Teléfono)'}</span>
            </button>
          </div>
        )}

        {/* Body Container */}
        <div className="p-4 overflow-y-auto space-y-3.5 flex-1 text-center">
          {activeTab === 'send' ? (
            /* ================= MODE: SEND ================= */
            <div className="space-y-3">
              {/* QR Image Area */}
              <div className="bg-white p-3 rounded-2xl border border-[#E5CFBA] shadow-2xs inline-block mx-auto max-w-[260px]">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Código QR de Lotería"
                    className="w-full h-auto rounded-xl mx-auto block select-none"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-stone-400 text-xs font-medium">
                    <RefreshCw className="w-6 h-6 animate-spin text-emerald-700" />
                  </div>
                )}
              </div>

              {/* Code display */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block">
                  {language === 'en' ? 'Code for installed PWA:' : 'Código para la PWA en iPhone/Android:'}
                </span>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#E5CFBA] rounded-xl font-mono text-lg font-black text-emerald-900 tracking-widest shadow-2xs">
                  <span>{formatSyncCode(syncCode) || '...'}</span>
                </div>
              </div>

              {/* Status and Progress */}
              {senderStatus === 'waiting' && (
                <p className="text-xs text-stone-600 leading-snug">
                  {language === 'en'
                    ? '1. Open the camera on the phone and point it at this QR.'
                    : '1. Abre la cámara de tu teléfono y apunta a este código QR para recibir las 54 cartas.'}
                </p>
              )}

              {senderStatus === 'connecting' && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center justify-center gap-2 animate-pulse">
                  <Smartphone className="w-4 h-4 text-amber-700" />
                  <span>{language === 'en' ? 'Phone connected! Preparing deck...' : '¡Teléfono conectado! Preparando baraja...'}</span>
                </div>
              )}

              {senderStatus === 'sending' && (
                <div className="space-y-1.5 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="flex justify-between text-xs font-bold text-emerald-900">
                    <span>{language === 'en' ? 'Transferring 54 cards...' : 'Transfiriendo 54 cartas e imágenes...'}</span>
                    <span>{senderProgress}%</span>
                  </div>
                  <div className="w-full bg-emerald-200/60 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-700 h-2 rounded-full transition-all duration-150"
                      style={{ width: `${senderProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {senderStatus === 'success' && (
                <div className="p-3 rounded-2xl bg-emerald-100/80 border border-emerald-300 text-emerald-950 space-y-1">
                  <div className="flex items-center justify-center gap-1.5 font-bold text-xs text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>{language === 'en' ? 'Transfer Complete!' : '¡Baraja instalada en el teléfono!'}</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-tight">
                    {language === 'en'
                      ? 'The phone is now running offline with your custom deck.'
                      : 'El teléfono ya tiene las 54 fotos en su memoria y está listo para cantar.'}
                  </p>
                </div>
              )}

              {senderStatus === 'error' && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{senderError}</span>
                </div>
              )}

              {/* Options before transfer */}
              <div className="pt-2 border-t border-[#EFE3D3] space-y-2 text-left">
                <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#E5CFBA] text-xs cursor-pointer">
                  <div className="pr-2">
                    <span className="font-bold text-stone-900 block leading-tight">
                      {language === 'en' ? 'Lock caller on phone' : 'Bloquear modo Cantador'}
                    </span>
                    <span className="text-[10px] text-stone-500">
                      {language === 'en' ? 'Guest mode: hides generator' : 'Solo muestra el juego'}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={lockOnReceive}
                    onChange={(e) => setLockOnReceive(e.target.checked)}
                    className="w-4 h-4 accent-emerald-700 rounded cursor-pointer"
                  />
                </label>

                {lockOnReceive && (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#E5CFBA] text-xs">
                    <span className="text-[11px] font-semibold text-stone-700">
                      {language === 'en' ? 'Organizer unlock PIN:' : 'PIN de organizador:'}
                    </span>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={8}
                      value={targetAdminPin}
                      onChange={(e) => setTargetAdminPin(e.target.value)}
                      className="w-20 px-2 py-1 text-center font-mono font-bold bg-stone-50 border border-stone-200 rounded-lg text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Direct Link Copy Button */}
              {fullShareUrl && (
                <button
                  onClick={handleCopyUrl}
                  className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-stone-200 transition-colors"
                >
                  {hasCopiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
                  <span>{hasCopiedUrl ? (language === 'en' ? 'Copied Link!' : '¡Enlace copiado!') : (language === 'en' ? 'Copy Direct Link' : 'Copiar enlace directo')}</span>
                </button>
              )}
            </div>
          ) : (
            /* ================= MODE: RECEIVE ================= */
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                <Smartphone className="w-6 h-6 text-emerald-700" />
              </div>

              <div>
                <h4 className="font-bold text-sm text-stone-900">
                  {language === 'en' ? 'Receive Deck from Computer' : 'Recibir Baraja desde tu Computadora'}
                </h4>
                <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
                  {language === 'en'
                    ? 'Enter the 6-character code shown below the QR on your PC.'
                    : 'Ingresa las 6 letras que ves debajo del código QR en la pantalla de tu computadora.'}
                </p>
              </div>

              {/* Code Input */}
              <div className="space-y-2">
                <input
                  type="text"
                  maxLength={8}
                  placeholder="K7M-49P"
                  value={inputCode}
                  onChange={(e) => setInputCode(normalizeSyncCode(e.target.value))}
                  disabled={receiverStatus === 'connecting' || receiverStatus === 'downloading'}
                  className="w-full text-center font-mono font-black text-2xl tracking-widest px-3 py-2.5 bg-white border-2 border-emerald-700/60 focus:border-emerald-700 rounded-2xl text-emerald-950 uppercase shadow-xs outline-none"
                />

                <button
                  onClick={() => startReceiving(inputCode)}
                  disabled={normalizeSyncCode(inputCode).length < 4 || receiverStatus === 'connecting' || receiverStatus === 'downloading'}
                  className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <DownloadCloud className="w-4 h-4" />
                  <span>{language === 'en' ? 'Connect & Download' : 'Conectar y Descargar'}</span>
                </button>
              </div>

              {/* Progress and status */}
              {receiverStatus === 'connecting' && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center justify-center gap-2 animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-700" />
                  <span>{language === 'en' ? 'Connecting to computer...' : 'Conectando con tu computadora...'}</span>
                </div>
              )}

              {receiverStatus === 'downloading' && (
                <div className="space-y-1.5 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="flex justify-between text-xs font-bold text-emerald-900">
                    <span>{language === 'en' ? 'Downloading 54 cards...' : 'Descargando 54 cartas e imágenes...'}</span>
                    <span>{receiverProgress}%</span>
                  </div>
                  <div className="w-full bg-emerald-200/60 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-700 h-2 rounded-full transition-all duration-150"
                      style={{ width: `${receiverProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {receiverStatus === 'success' && (
                <div className="p-3.5 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-950 space-y-2">
                  <div className="flex items-center justify-center gap-1.5 font-bold text-sm text-emerald-900">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                    <span>{language === 'en' ? 'Deck Installed!' : '¡Baraja Instalada!'}</span>
                  </div>
                  <p className="text-xs text-emerald-800 leading-snug">
                    {language === 'en'
                      ? `"${receivedDeckName}" is now stored offline on this device.`
                      : `"${receivedDeckName}" ha sido guardada en la memoria local de este teléfono.`}
                  </p>

                  <button
                    onClick={() => {
                      cleanupAll();
                      onClose();
                    }}
                    className="w-full py-2 bg-emerald-800 text-white font-bold rounded-xl text-xs hover:bg-emerald-900 transition-colors cursor-pointer mt-1"
                  >
                    {language === 'en' ? 'Start Calling Cards' : '¡Comenzar a Jugar!'}
                  </button>
                </div>
              )}

              {receiverStatus === 'error' && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium space-y-1">
                  <div className="flex items-center justify-center gap-1.5 font-bold">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>{language === 'en' ? 'Connection Error' : 'Error de Conexión'}</span>
                  </div>
                  <p className="text-[11px] leading-tight text-rose-700">{receiverError}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-white/80 border-t border-[#EFE3D3] flex items-center justify-between">
          <button
            onClick={() => {
              cleanupAll();
              onClose();
            }}
            className="w-full py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold rounded-xl text-xs transition-colors"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};

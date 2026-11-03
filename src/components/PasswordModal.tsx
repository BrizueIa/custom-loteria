import React, { useState } from 'react';
import { Lock, KeyRound, Eye, EyeOff, X, Check } from 'lucide-react';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessUnlock: () => void;
  currentPassword: string;
  onUpdatePassword: (newPass: string) => void;
  mode: 'unlock' | 'change_password';
  setMode: (mode: 'unlock' | 'change_password') => void;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccessUnlock,
  currentPassword,
  onUpdatePassword,
  mode,
  setMode,
}) => {
  const [inputPass, setInputPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPass === currentPassword) {
      setErrorMsg('');
      setInputPass('');
      onSuccessUnlock();
      onClose();
    } else {
      setErrorMsg('Contraseña incorrecta. Intenta nuevamente.');
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPass !== currentPassword) {
      setErrorMsg('La contraseña actual es incorrecta.');
      return;
    }
    if (!newPass || newPass.trim().length < 3) {
      setErrorMsg('La nueva contraseña debe tener al menos 3 caracteres.');
      return;
    }
    if (newPass !== confirmPass) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    onUpdatePassword(newPass.trim());
    setSuccessMsg('¡Contraseña actualizada con éxito!');
    setErrorMsg('');
    setTimeout(() => {
      setSuccessMsg('');
      setInputPass('');
      setNewPass('');
      setConfirmPass('');
      setMode('unlock');
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              {mode === 'unlock' ? <Lock className="w-4 h-4" /> : <KeyRound className="w-4 h-4" />}
            </div>
            <h3 className="font-serif font-bold text-base text-stone-900">
              {mode === 'unlock' ? 'Acceso Administrador' : 'Cambiar Contraseña'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-stone-800 hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content based on mode */}
        {mode === 'unlock' ? (
          <form onSubmit={handleUnlock} className="space-y-4">
            <p className="text-xs text-stone-500">
              Ingresa tu contraseña para desbloquear el generador de cartas y tablas.
            </p>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                Contraseña o PIN
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={inputPass}
                  onChange={(e) => {
                    setInputPass(e.target.value);
                    setErrorMsg('');
                  }}
                  autoFocus
                  placeholder="Ej. 1234"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 font-mono tracking-wider"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errorMsg && (
                <p className="text-xs text-rose-600 font-semibold mt-1.5 animate-in fade-in">
                  {errorMsg}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-sm transition-transform active:scale-95"
            >
              Desbloquear Generador
            </button>

            <div className="text-center pt-1">
              <span className="text-[11px] text-stone-400">
                (Por defecto la clave inicial es: <strong className="text-stone-600 font-mono">1234</strong>)
              </span>
            </div>
          </form>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-3">
            {successMsg ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />
                {successMsg}
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">
                    Contraseña Actual
                  </label>
                  <input
                    type="password"
                    value={inputPass}
                    onChange={(e) => setInputPass(e.target.value)}
                    placeholder="Contraseña actual..."
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-1 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">
                    Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="Nueva clave o PIN..."
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-1 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 mb-1">
                    Confirmar Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    placeholder="Repite la nueva clave..."
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-1 focus:ring-emerald-700"
                  />
                </div>

                {errorMsg && (
                  <p className="text-xs text-rose-600 font-semibold mt-1">
                    {errorMsg}
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('unlock');
                      setErrorMsg('');
                    }}
                    className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-xs"
                  >
                    Guardar
                  </button>
                </div>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

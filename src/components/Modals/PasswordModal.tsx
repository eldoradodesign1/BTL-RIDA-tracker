import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Camera, 
  MapPin, 
  Bell, 
  Clipboard, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle,
  Loader2 
} from 'lucide-react';
import { User } from '../../types';
import { updateUserPassword } from '../../utils/storage';

interface PasswordModalProps {
  isOpen: boolean;
  currentUser: User | null;
  onClose: () => void;
}

const PERMISSION_HELP = "Si le navigateur ne propose plus de fenêtre, ouvrez les réglages du site ou de l’application installée pour réactiver cette autorisation.";

export const PasswordModal: React.FC<PasswordModalProps> = ({ isOpen, currentUser, onClose }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isError, setIsError] = useState(false);
  const [activeCheck, setActiveCheck] = useState<string | null>(null);
  const [permStatus, setPermStatus] = useState<{ kind: 'info' | 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !currentUser) return;
    const res = updateUserPassword(currentUser.id, oldPassword, newPassword);
    setIsError(!res.success);
    setFeedback(res.message);
    if (res.success) {
      setOldPassword('');
      setNewPassword('');
      setTimeout(() => {
        setFeedback('');
        onClose();
      }, 1500);
    }
  };

  const handleCameraPermission = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setPermStatus({ kind: 'error', text: 'La caméra n’est pas prise en charge par cet appareil ou ce navigateur.' });
      return;
    }
    setActiveCheck('camera');
    setPermStatus({ kind: 'info', text: 'Demande d’autorisation caméra en cours…' });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });
      stream.getTracks().forEach((t) => t.stop());
      setPermStatus({
        kind: 'success',
        text: 'Caméra autorisée. Elle sera utilisée pour les photos de pointage terrain RIDA.'
      });
    } catch (err) {
      const name = err instanceof DOMException ? err.name : '';
      const text = name === 'NotAllowedError' || name === 'SecurityError'
        ? `Caméra refusée. ${PERMISSION_HELP}`
        : 'La caméra est indisponible pour le moment.';
      setPermStatus({ kind: 'error', text });
    } finally {
      setActiveCheck(null);
    }
  };

  const handleGpsPermission = () => {
    if (!navigator.geolocation) {
      setPermStatus({ kind: 'error', text: 'Le GPS n’est pas pris en charge par cet appareil ou ce navigateur.' });
      return;
    }
    setActiveCheck('gps');
    setPermStatus({ kind: 'info', text: 'Demande d’autorisation GPS en cours…' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPermStatus({
          kind: 'success',
          text: `GPS actif (précision ~${Math.round(pos.coords.accuracy || 0)} m).`
        });
        setActiveCheck(null);
      },
      (err) => {
        const text = err.code === err.PERMISSION_DENIED
          ? `GPS refusé. ${PERMISSION_HELP}`
          : 'Position indisponible pour le moment. Vérifiez votre localisation.';
        setPermStatus({ kind: 'error', text });
        setActiveCheck(null);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleNotifPermission = async () => {
    if (!('Notification' in window)) {
      setPermStatus({ kind: 'error', text: 'Notifications non supportées sur ce navigateur.' });
      return;
    }
    setActiveCheck('notifications');
    try {
      const res = await Notification.requestPermission();
      setPermStatus(res === 'granted'
        ? { kind: 'success', text: 'Notifications système autorisées avec succès.' }
        : { kind: 'error', text: `Notifications non autorisées. ${PERMISSION_HELP}` }
      );
    } finally {
      setActiveCheck(null);
    }
  };

  const handleClipboardPermission = async () => {
    if (!navigator.clipboard?.readText) {
      setPermStatus({ kind: 'error', text: 'Presse-papier non disponible dans ce navigateur.' });
      return;
    }
    setActiveCheck('clipboard');
    try {
      await navigator.clipboard.readText();
      setPermStatus({ kind: 'success', text: 'Accès au presse-papier validé.' });
    } catch {
      setPermStatus({ kind: 'error', text: `Presse-papier non autorisé. ${PERMISSION_HELP}` });
    } finally {
      setActiveCheck(null);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-pop"
      onClick={onClose}
    >
      <div
        className="modal-sheet relative w-full max-w-md bg-zinc-950 border border-emerald-500/20 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-handle mb-4 sm:hidden" />
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-[#00D084] flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black uppercase text-white tracking-wider">Sécurité & Permissions</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Compte : <span className="text-white font-bold">{currentUser?.name || 'Agent'}</span>
          </p>
        </div>

        {/* Device Permissions Card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 mb-5 text-left">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-[#00D084]" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-white">Autorisations de l'appareil</p>
              <p className="text-[9px] text-gray-400">Requis pour pointage GPS & photos terrain</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCameraPermission}
              disabled={activeCheck !== null}
              className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-left transition hover:bg-emerald-500/20 active:scale-95 disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <Camera className="w-4 h-4 text-[#00D084]" />
                {activeCheck === 'camera' && <Loader2 className="w-3 h-3 animate-spin text-[#00D084]" />}
              </div>
              <span className="block mt-1.5 text-[10px] font-bold uppercase text-white">Caméra</span>
            </button>

            <button
              type="button"
              onClick={handleGpsPermission}
              disabled={activeCheck !== null}
              className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-2.5 text-left transition hover:bg-cyan-500/20 active:scale-95 disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <MapPin className="w-4 h-4 text-cyan-400" />
                {activeCheck === 'gps' && <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />}
              </div>
              <span className="block mt-1.5 text-[10px] font-bold uppercase text-white">GPS Localisation</span>
            </button>

            <button
              type="button"
              onClick={handleNotifPermission}
              disabled={activeCheck !== null}
              className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-2.5 text-left transition hover:bg-amber-500/20 active:scale-95 disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <Bell className="w-4 h-4 text-amber-400" />
                {activeCheck === 'notifications' && <Loader2 className="w-3 h-3 animate-spin text-amber-400" />}
              </div>
              <span className="block mt-1.5 text-[10px] font-bold uppercase text-white">Notifications</span>
            </button>

            <button
              type="button"
              onClick={handleClipboardPermission}
              disabled={activeCheck !== null}
              className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-left transition hover:bg-white/10 active:scale-95 disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <Clipboard className="w-4 h-4 text-gray-300" />
                {activeCheck === 'clipboard' && <Loader2 className="w-3 h-3 animate-spin text-gray-300" />}
              </div>
              <span className="block mt-1.5 text-[10px] font-bold uppercase text-white">Presse-papier</span>
            </button>
          </div>

          {permStatus && (
            <div className={`mt-2.5 rounded-xl border p-2 text-[10px] font-semibold ${
              permStatus.kind === 'success' ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' :
              permStatus.kind === 'error' ? 'bg-rose-950/60 border-rose-500/40 text-rose-300' :
              'bg-cyan-950/60 border-cyan-500/40 text-cyan-200'
            }`}>
              {permStatus.text}
            </div>
          )}
        </div>

        {/* Change Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Ancien mot de passe</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00D084]"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Nouveau mot de passe</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 4 caractères"
              required
              minLength={4}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00D084]"
            />
          </div>

          {feedback && (
            <div className={`p-3 rounded-2xl text-xs font-black uppercase flex items-center justify-center space-x-2 ${
              isError ? 'bg-rose-950/60 border border-rose-500/40 text-rose-300' : 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
            }`}>
              {isError ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{feedback}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#00D084] to-[#059669] hover:from-[#10B981] hover:to-[#047857] text-[#032313] font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-[0_8px_25px_rgba(0,208,132,0.3)] mt-4 transition-all"
          >
            <KeyRound className="w-4 h-4" />
            <span>Mettre à jour ma clé</span>
          </button>
        </form>
      </div>
    </div>
  );
};

import React, { useMemo, useState } from 'react';
import { X, UserPlus, Shield, Smartphone } from 'lucide-react';
import { User, Shop, UserRole } from '../../types';
import { getUsers, saveUser } from '../../utils/storage';
import { isValidDRCPhone, normalizeDRCPhone } from '../../utils/phoneValidator';

interface UserModalProps {
  isOpen: boolean;
  shops: Shop[];
  onClose: () => void;
  onSuccess: () => void;
}

export const UserModal: React.FC<UserModalProps> = ({ isOpen, shops, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('agent');
  const [supervisorId, setSupervisorId] = useState('');
  const [permanentShopId, setPermanentShopId] = useState('');
  const [password, setPassword] = useState('rida2025');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const supervisors = useMemo(() => {
    return getUsers().filter((u) => u.role === 'supervisor' || u.role === 'admin');
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    if (!isValidDRCPhone(phone)) {
      setErrorMsg('Format téléphone invalide : utilisez 081… (10 chiffres) ou 097/099/082.');
      return;
    }

    if (role === 'agent' && !permanentShopId) {
      setErrorMsg('Veuillez sélectionner le Hub / Secteur de rattachement.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const cleanPhone = normalizeDRCPhone(phone);
      saveUser({
        name,
        phone: cleanPhone,
        role,
        supervisorId: role === 'agent' && supervisorId ? supervisorId : undefined,
        permanentShopId: role === 'agent' ? permanentShopId : undefined,
        password: password || 'rida2025',
        userCategory: role === 'agent' ? 'hostess' : 'operations'
      });

      setName('');
      setPhone('');
      setRole('agent');
      setSupervisorId('');
      setPermanentShopId('');
      setPassword('rida2025');
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erreur lors de la création du compte.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-pop"
      onClick={onClose}
    >
      <div
        className="modal-sheet relative w-full max-w-lg bg-zinc-950 border border-emerald-500/20 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-handle mb-4 sm:hidden" />
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-[#00D084] flex items-center justify-center mx-auto mb-3">
            <UserPlus className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black uppercase text-white tracking-wider">Nouvel Acteur Campagne</h2>
          <p className="text-xs text-gray-400 font-semibold mt-1">Création de profil agent ou superviseur RIDA</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Nom Complet</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Patrick Kalala"
              required
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00D084]"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Numéro MSISDN</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="081XXXXXXX ou 097XXXXXXX"
              required
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00D084]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Rôle</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs focus:outline-none focus:border-[#00D084]"
              >
                <option value="agent">Agent Terrain (RIDA)</option>
                <option value="supervisor">Superviseur Lubumbashi</option>
                <option value="admin">Administrateur</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Mot de passe initial</label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="rida2025"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs focus:outline-none focus:border-[#00D084]"
              />
            </div>
          </div>

          {role === 'agent' && (
            <>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Hub / Secteur de base</label>
                <select
                  value={permanentShopId}
                  onChange={(e) => setPermanentShopId(e.target.value)}
                  required
                  className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs focus:outline-none focus:border-[#00D084]"
                >
                  <option value="">-- Sélectionner Hub / Secteur --</option>
                  {shops.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Superviseur Rattaché</label>
                <select
                  value={supervisorId}
                  onChange={(e) => setSupervisorId(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs focus:outline-none focus:border-[#00D084]"
                >
                  <option value="">-- Aucun superviseur particulier --</option>
                  {supervisors.map((sup) => (
                    <option key={sup.id} value={sup.id}>
                      {sup.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {errorMsg && (
            <div className="p-3 rounded-2xl border border-rose-500/30 bg-rose-950/40 text-xs font-bold text-rose-300">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#00D084] to-[#059669] hover:from-[#10B981] hover:to-[#047857] text-[#032313] font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-[0_8px_25px_rgba(0,208,132,0.3)] mt-6 transition-all disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isSubmitting ? 'Création en cours...' : "Enregistrer l'utilisateur"}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

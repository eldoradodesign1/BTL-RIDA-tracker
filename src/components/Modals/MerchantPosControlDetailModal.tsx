import React from 'react';
import { X, Store, CheckCircle2, AlertTriangle, MapPin, Hash, UserCheck } from 'lucide-react';
import type { MerchantPosControlItem } from '../../utils/merchantCampaign';

interface MerchantPosControlDetailModalProps {
  item: MerchantPosControlItem | null;
  transactionsPerPosTarget: number;
  onClose: () => void;
  onUpdated?: () => void;
}

export const MerchantPosControlDetailModal: React.FC<MerchantPosControlDetailModalProps> = ({
  item,
  transactionsPerPosTarget,
  onClose,
  onUpdated,
}) => {
  if (!item) return null;

  const pos = item.pos;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/85 p-3 backdrop-blur-md sm:p-6"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="glass-card max-h-[92vh] w-full max-w-lg overflow-y-auto border border-emerald-400/25 p-5 shadow-2xl rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Contrôle POS</p>
              <h2 className="text-lg font-black text-white">{pos?.denomination || 'Point de Vente'}</h2>
              <p className="text-xs text-gray-400">N° Agent: {pos?.agent_number || 'Non renseigné'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Pool / Zone :</span>
              <span className="font-bold text-white">{pos?.pool || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">MFS Associé :</span>
              <span className="font-bold text-fuchsia-300">{pos?.mfs_name || 'Non renseigné'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">BA Assigné :</span>
              <span className="font-bold text-cyan-300">{item.ba?.name || 'Non assigné'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Statut opérationnel :</span>
              <span className={`font-bold ${item.status === 'validated' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {item.status === 'validated' ? 'Validé & Actif' : item.status || 'En attente'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Transactions enregistrées :</span>
              <span className="font-bold text-white">
                {item.transactionCount || 0} / cible ({transactionsPerPosTarget})
              </span>
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-2xl border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 font-bold text-xs uppercase tracking-wider transition"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantPosControlDetailModal;

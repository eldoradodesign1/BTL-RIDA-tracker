import React from 'react';
import { X, Store, MapPin, CheckCircle2, Clock } from 'lucide-react';
import type { CampaignRun } from '../../types';

interface MerchantVisitedPosModalProps {
  isOpen: boolean;
  activity: any;
  run: CampaignRun | null;
  onClose: () => void;
}

export const MerchantVisitedPosModal: React.FC<MerchantVisitedPosModalProps> = ({
  isOpen,
  activity,
  run,
  onClose,
}) => {
  if (!isOpen || !activity) return null;

  const visits = activity.visits || [];
  const ba = activity.ba || {};

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/85 p-3 backdrop-blur-md sm:p-6"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="glass-card max-h-[92vh] w-full max-w-lg overflow-y-auto border border-cyan-400/25 p-5 shadow-2xl rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-cyan-400">Points de vente</p>
              <h2 className="text-lg font-black text-white">POS visités par {ba.name}</h2>
              <p className="text-xs text-gray-400">{activity.visitedPosCount || visits.length} POS enregistrés</p>
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

        <div className="mt-4 space-y-2">
          {visits.length > 0 ? (
            visits.map((v: any, idx: number) => (
              <div
                key={v.id || idx}
                className="p-3.5 rounded-2xl border border-white/10 bg-white/[0.03] flex items-start justify-between gap-3"
              >
                <div>
                  <b className="text-sm text-white block">{v.point_of_sale?.denomination || v.pos_id}</b>
                  <p className="text-[10px] text-cyan-300 font-bold mt-0.5">
                    Code POS : {v.point_of_sale?.agent_number || '—'}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Arrivée : {v.arrived_at ? new Date(v.arrived_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'Heure non précisée'}
                  </p>
                </div>
                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg border ${
                  v.operational_status === 'active'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}>
                  {v.operational_status === 'active' ? 'Actif' : 'Inactif'}
                </span>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-gray-400 bg-white/5 rounded-2xl">
              Aucun POS enregistré pour cette journée.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

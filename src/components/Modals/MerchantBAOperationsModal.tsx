import React from 'react';
import { X, UserRound, FileText, MapPin, CalendarDays, CheckCircle2, Clock, Phone, Store, DollarSign } from 'lucide-react';
import type { CampaignRun } from '../../types';

interface MerchantBAOperationsModalProps {
  isOpen: boolean;
  mode: 'profile' | 'report' | 'location' | 'calendar';
  activity: any;
  run: CampaignRun | null;
  onClose: () => void;
}

export const MerchantBAOperationsModal: React.FC<MerchantBAOperationsModalProps> = ({
  isOpen,
  mode,
  activity,
  run,
  onClose,
}) => {
  if (!isOpen || !activity) return null;

  const ba = activity.ba || {};
  const attendance = activity.attendance;
  const checkinTime = attendance?.checkin_at
    ? new Date(attendance.checkin_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : '—';
  const checkoutTime = attendance?.checkout_at
    ? new Date(attendance.checkout_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : '—';

  const lat = attendance?.checkin_latitude || attendance?.checkout_latitude;
  const lng = attendance?.checkin_longitude || attendance?.checkout_longitude;
  const mapUrl = lat && lng ? `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed` : null;

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
              {mode === 'profile' && <UserRound className="w-5 h-5" />}
              {mode === 'report' && <FileText className="w-5 h-5" />}
              {mode === 'location' && <MapPin className="w-5 h-5" />}
              {mode === 'calendar' && <CalendarDays className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-cyan-400">
                {mode === 'profile' && 'Profil Brand Ambassador'}
                {mode === 'report' && 'Rapport d\'activité journalier'}
                {mode === 'location' && 'Localisation GPS terrain'}
                {mode === 'calendar' && 'Historique de présence'}
              </p>
              <h2 className="text-lg font-black text-white">{ba.name || 'Brand Ambassador'}</h2>
              <p className="text-xs text-gray-400">{ba.phone || 'Numéro non renseigné'}</p>
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

        {/* Content based on mode */}
        <div className="mt-4 space-y-4">
          {mode === 'profile' && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-3">
                  <span className="text-[9px] font-black uppercase text-cyan-300 block">POS</span>
                  <span className="text-lg font-black text-white">{activity.visitedPosCount || 0}</span>
                </div>
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3">
                  <span className="text-[9px] font-black uppercase text-amber-300 block">Transactions</span>
                  <span className="text-lg font-black text-white">{activity.transactionCount || 0}</span>
                </div>
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                  <span className="text-[9px] font-black uppercase text-emerald-300 block">Volume</span>
                  <span className="text-lg font-black text-emerald-400">
                    {(activity.totalAmount || 0).toLocaleString('fr-FR')}
                  </span>
                </div>
              </div>

              {activity.mfsNames && activity.mfsNames.length > 0 && (
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-[10px] font-black uppercase text-gray-400">MFS Associés</p>
                  <p className="text-xs font-bold text-fuchsia-300 mt-0.5">{activity.mfsNames.join(', ')}</p>
                </div>
              )}
            </div>
          )}

          {mode === 'report' && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Pointage Arrivée :</span>
                  <span className="font-bold text-white">{checkinTime}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Pointage Clôture :</span>
                  <span className="font-bold text-white">{checkoutTime}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Statut de la session :</span>
                  <span className="font-bold text-emerald-400">{attendance?.status || 'Non renseigné'}</span>
                </div>
              </div>

              {attendance?.closing_comment && (
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-[10px] font-black uppercase text-gray-400">Commentaire de clôture</p>
                  <p className="text-xs text-gray-200 mt-1 italic">"{attendance.closing_comment}"</p>
                </div>
              )}
            </div>
          )}

          {mode === 'location' && (
            <div className="space-y-3">
              {mapUrl ? (
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                  <iframe title="Position GPS" src={mapUrl} className="h-64 w-full border-0" loading="lazy" />
                  <div className="p-3 text-[10px] text-gray-400 flex justify-between">
                    <span>Coordonnées : {lat?.toFixed(5)}, {lng?.toFixed(5)}</span>
                    <span>Précision : ~{attendance?.checkin_accuracy_m || 15}m</span>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-gray-400 bg-white/5 rounded-2xl">
                  Coordonnées GPS non disponibles pour cet agent.
                </div>
              )}
            </div>
          )}

          {mode === 'calendar' && (
            <div className="space-y-2">
              <p className="text-xs text-gray-400">Suivi des présences récentes de l'ambassadeur.</p>
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                  <p className="text-[10px] text-gray-400">Arrivée à {checkinTime}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {attendance?.status === 'closed' ? 'Clôturé' : attendance ? 'Actif' : 'Absent'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { X, Banknote, Clock, CheckCircle2, XCircle, FileSpreadsheet, Archive } from 'lucide-react';
import type { MerchantFundRequest } from '../../types';

interface MerchantFundRequestsModalProps {
  isOpen: boolean;
  requests: MerchantFundRequest[];
  canArchiveRejected?: boolean;
  onArchiveRejected?: () => void;
  onClose: () => void;
  onOpenReport?: (requests: MerchantFundRequest[]) => void;
  onSelect?: (request: MerchantFundRequest) => void;
}

export const MerchantFundRequestsModal: React.FC<MerchantFundRequestsModalProps> = ({
  isOpen,
  requests = [],
  canArchiveRejected,
  onArchiveRejected,
  onClose,
  onOpenReport,
  onSelect,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/85 p-3 backdrop-blur-md sm:p-6"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="glass-card max-h-[92vh] w-full max-w-2xl overflow-y-auto border border-emerald-400/25 p-5 shadow-2xl rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Trésorerie & Approvisionnement</p>
              <h2 className="text-lg font-black text-white">Demandes de fonds BA</h2>
              <p className="text-xs text-gray-400">{requests.length} demande(s) enregistrée(s)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onOpenReport && (
              <button
                type="button"
                onClick={() => onOpenReport(requests)}
                className="p-2 rounded-xl border border-white/10 bg-white/5 text-gray-300 hover:text-white transition"
                title="Exporter le rapport"
              >
                <FileSpreadsheet size={16} />
              </button>
            )}
            {canArchiveRejected && onArchiveRejected && (
              <button
                type="button"
                onClick={onArchiveRejected}
                className="p-2 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 transition"
                title="Archiver les demandes rejetées"
              >
                <Archive size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-gray-400 hover:text-white hover:bg-white/10 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {requests.length > 0 ? (
            requests.map((req) => (
              <div
                key={req.id}
                onClick={() => onSelect?.(req)}
                className="p-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] cursor-pointer transition flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <b className="text-sm text-white">{req.ba?.name || 'BA'}</b>
                    <span className="text-xs text-gray-400">({req.ba?.phone || '—'})</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    POS : {req.point_of_sale?.denomination || 'Global'}
                    {req.notes && ` · "${req.notes}"`}
                  </p>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <span className="text-sm font-black text-emerald-400">
                    {Number(req.amount).toLocaleString('fr-FR')} $
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border ${
                      req.status === 'approved'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : req.status === 'rejected'
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    }`}
                  >
                    {req.status === 'approved' ? 'Approuvée' : req.status === 'rejected' ? 'Rejetée' : 'En attente'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-gray-400 bg-white/5 rounded-2xl">
              Aucune demande de fonds en cours.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MerchantFundRequestsModal;

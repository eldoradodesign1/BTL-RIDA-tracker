import React, { useState } from 'react';
import { X, Check, XCircle, AlertCircle, Loader2, Banknote } from 'lucide-react';
import type { MerchantFundRequest, User } from '../../types';
import { updateMerchantFundRequestStatus } from '../../utils/merchantCampaign';

interface MerchantFundRequestDecisionModalProps {
  request: MerchantFundRequest | null;
  currentUser: User;
  onClose: () => void;
  onUpdated: () => void;
}

export const MerchantFundRequestDecisionModal: React.FC<MerchantFundRequestDecisionModalProps> = ({
  request,
  currentUser,
  onClose,
  onUpdated,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!request) return null;

  const handleDecision = async (status: 'approved' | 'rejected') => {
    setIsSubmitting(true);
    setError('');
    try {
      await updateMerchantFundRequestStatus(request.id, status, currentUser.name);
      onUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Action impossible.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/85 p-3 backdrop-blur-md sm:p-6"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="glass-card max-h-[92vh] w-full max-w-md overflow-y-auto border border-emerald-400/25 p-5 shadow-2xl rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Décision Trésorerie</p>
              <h2 className="text-lg font-black text-white">Validation de fonds</h2>
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

        {error && (
          <div className="mt-4 p-3 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-xs font-bold text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-4 space-y-3">
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Demandeur (BA) :</span>
              <span className="font-bold text-white">{request.ba?.name || 'BA'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Téléphone :</span>
              <span className="font-bold text-white">{request.ba?.phone || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Montant :</span>
              <span className="text-base font-black text-emerald-400">
                {Number(request.amount).toLocaleString('fr-FR')} $
              </span>
            </div>
            {request.notes && (
              <div className="pt-2 border-t border-white/5">
                <span className="text-[10px] text-gray-400 uppercase font-black block">Motif</span>
                <p className="text-gray-200 mt-0.5">{request.notes}</p>
              </div>
            )}
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleDecision('rejected')}
              className="flex-1 py-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              <span>Rejeter</span>
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleDecision('approved')}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-zinc-950 font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(16,185,129,0.3)]"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>Approuver</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantFundRequestDecisionModal;

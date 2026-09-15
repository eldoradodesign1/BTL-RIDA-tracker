import React, { useState } from 'react';
import { X, Banknote, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import type { CampaignRun, PointOfSale, User, BAPosVisit } from '../../types';
import { createMerchantFundRequest } from '../../utils/merchantCampaign';

interface MerchantFundRequestModalProps {
  isOpen: boolean;
  currentUser: User;
  run: CampaignRun | null;
  positions: PointOfSale[];
  visits: BAPosVisit[];
  mfsName?: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export const MerchantFundRequestModal: React.FC<MerchantFundRequestModalProps> = ({
  isOpen,
  currentUser,
  run,
  positions,
  visits,
  mfsName,
  onClose,
  onSubmitted,
}) => {
  const [selectedPosId, setSelectedPosId] = useState('');
  const [amount, setAmount] = useState('50');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setError('Veuillez spécifier un montant valide.');
      return;
    }
    if (!run) {
      setError('Campagne non active.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await createMerchantFundRequest({
        campaign_run_id: run.id,
        ba_id: currentUser.id,
        supervisor_id: currentUser.supervisorId || null,
        pos_id: selectedPosId || null,
        mfs_name: mfsName || null,
        amount: Number(amount),
        note: notes.trim() || null,
      });

      onSubmitted();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'envoi de la demande.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/85 p-3 backdrop-blur-md sm:p-6" role="dialog" aria-modal="true">
      <div className="glass-card max-h-[92vh] w-full max-w-lg overflow-y-auto border border-emerald-400/30 p-5 shadow-2xl rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Trésorerie Terrain</p>
              <h2 className="text-lg font-black text-white">Demande de fonds</h2>
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* POS Selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-300 block">
              POS concerné (optionnel)
            </label>
            <select
              value={selectedPosId}
              onChange={(e) => setSelectedPosId(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs font-medium focus:outline-none focus:border-emerald-400"
            >
              <option value="">-- Aucun POS spécifique / Global --</option>
              {visits.map((v) => (
                <option key={v.id} value={v.pos_id}>
                  {v.point_of_sale?.denomination || v.pos_id}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-300 block">
              Montant demandé ($ USD)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="50"
              className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-3 py-2.5 text-white text-xs font-bold focus:outline-none focus:border-emerald-400"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-300 block">
              Motif / Justification
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Réapprovisionnement e-money pour activations SIM..."
              rows={2}
              className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-3 text-white text-xs focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 font-bold text-xs uppercase tracking-wider transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-zinc-950 font-black text-xs uppercase tracking-wider transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(16,185,129,0.3)]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Envoi...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Envoyer la demande</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

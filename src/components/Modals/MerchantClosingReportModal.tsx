import React, { useState } from 'react';
import { X, FileCheck, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

interface MerchantClosingReportModalProps {
  isOpen: boolean;
  isSaving: boolean;
  posCount: number;
  transactionCount: number;
  posTarget: number;
  transactionsPerPosTarget: number;
  inactivePosCount: number;
  onClose: () => void;
  onSubmit: (comment: string) => void;
}

export const MerchantClosingReportModal: React.FC<MerchantClosingReportModalProps> = ({
  isOpen,
  isSaving,
  posCount,
  transactionCount,
  posTarget,
  transactionsPerPosTarget,
  inactivePosCount,
  onClose,
  onSubmit,
}) => {
  const [comment, setComment] = useState('');

  if (!isOpen) return null;

  const totalExpectedTransactions = (posCount - inactivePosCount) * transactionsPerPosTarget;
  const isTargetMet = posCount >= posTarget && transactionCount >= totalExpectedTransactions;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(comment);
  };

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/85 p-3 backdrop-blur-md sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="glass-card max-h-[92vh] w-full max-w-lg overflow-y-auto border border-emerald-400/30 p-5 shadow-2xl rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Rapport journalier</p>
              <h2 className="text-lg font-black text-white">Clôturer la journée</h2>
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

        {/* Summary metrics */}
        <div className="grid grid-cols-2 gap-3 mt-4 text-center">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 block">POS visités</span>
            <span className="text-xl font-black text-white mt-1 block">
              {posCount} / {posTarget}
            </span>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 block">Transactions</span>
            <span className="text-xl font-black text-emerald-400 mt-1 block">
              {transactionCount}
            </span>
          </div>
        </div>

        {inactivePosCount > 0 && (
          <div className="mt-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{inactivePosCount} POS déclaré(s) non actif(s) sur le terrain.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-300 block">
              Commentaire de clôture & faits marquants
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ex: Bonne affluence au marché Kenya, tous les commerçants ont validé leur QR code..."
              rows={3}
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
              disabled={isSaving}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-zinc-950 font-black text-xs uppercase tracking-wider transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(16,185,129,0.3)]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmer la clôture</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

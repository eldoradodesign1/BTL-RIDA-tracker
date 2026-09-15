import React, { useState } from 'react';
import { X, Plus, Store, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { getMerchantClient, invalidateMerchantCache } from '../../utils/merchantCampaign';

interface MerchantPosCreateModalProps {
  campaignId: string;
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export const MerchantPosCreateModal: React.FC<MerchantPosCreateModalProps> = ({
  campaignId,
  isOpen,
  onClose,
  onCreated,
}) => {
  const [denomination, setDenomination] = useState('');
  const [agentNumber, setAgentNumber] = useState('');
  const [pool, setPool] = useState('');
  const [mfsName, setMfsName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!denomination.trim()) {
      setError('Le nom du POS est requis.');
      return;
    }
    if (!agentNumber.trim()) {
      setError('Le numéro agent POS est requis.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const client = getMerchantClient();
      const { error: insertError } = await client.from('points_of_sale').insert({
        campaign_id: campaignId,
        denomination: denomination.trim(),
        agent_number: agentNumber.trim(),
        pool: pool.trim() || null,
        mfs_name: mfsName.trim() || null,
        is_active: true,
      });

      if (insertError) throw insertError;
      invalidateMerchantCache();
      onCreated();
    } catch (err: any) {
      setError(err.message || 'Impossible de créer le POS.');
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
        className="glass-card max-h-[92vh] w-full max-w-lg overflow-y-auto border border-emerald-400/25 p-5 shadow-2xl rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Nouveau Point de Vente</p>
              <h2 className="text-lg font-black text-white">Ajouter un POS</h2>
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
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-300 block">
              Dénomination / Nom de la boutique *
            </label>
            <input
              type="text"
              required
              value={denomination}
              onChange={(e) => setDenomination(e.target.value)}
              placeholder="Ex: Alimentation La Grâce"
              className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs font-medium focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-300 block">
              Numéro Agent / Code POS *
            </label>
            <input
              type="text"
              required
              value={agentNumber}
              onChange={(e) => setAgentNumber(e.target.value)}
              placeholder="Ex: 8123456"
              className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs font-medium focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-300 block">
                Pool / Secteur
              </label>
              <input
                type="text"
                value={pool}
                onChange={(e) => setPool(e.target.value)}
                placeholder="Ex: Katuba"
                className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs font-medium focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-300 block">
                MFS Référent
              </label>
              <input
                type="text"
                value={mfsName}
                onChange={(e) => setMfsName(e.target.value)}
                placeholder="Ex: MFS Patrick"
                className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs font-medium focus:outline-none focus:border-emerald-400"
              />
            </div>
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
                  <span>Création...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Créer le POS</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MerchantPosCreateModal;

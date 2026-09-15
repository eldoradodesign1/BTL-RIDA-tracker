import React, { useState } from 'react';
import { X, DollarSign, Camera, MapPin, Search, AlertCircle, CheckCircle2, Loader2, Store } from 'lucide-react';
import type { CampaignRun, PointOfSale, User, BAPosVisit, BATransaction } from '../../types';
import { createTransaction, uploadMerchantEvidence, recordPosArrival } from '../../utils/merchantCampaign';

interface MerchantTransactionModalProps {
  isOpen: boolean;
  currentUser: User;
  run: CampaignRun | null;
  positions: PointOfSale[];
  visits: BAPosVisit[];
  activityDate: string;
  mfsName?: string;
  onClose: () => void;
  onRecorded: (transaction: BATransaction) => void;
  onPosArrivalRecorded?: (visit: BAPosVisit) => void;
}

export const MerchantTransactionModal: React.FC<MerchantTransactionModalProps> = ({
  isOpen,
  currentUser,
  run,
  positions,
  visits,
  activityDate,
  mfsName,
  onClose,
  onRecorded,
  onPosArrivalRecorded,
}) => {
  const [selectedVisitId, setSelectedVisitId] = useState('');
  const [clientNumber, setClientNumber] = useState('');
  const [amount, setAmount] = useState('2000');
  const [reference, setReference] = useState('');
  const [comment, setComment] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Active visits
  const activeVisits = visits.filter((v) => v.operational_status !== 'inactive');

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisitId) {
      setError('Veuillez sélectionner le POS concerné par la transaction.');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError('Veuillez saisir un montant valide.');
      return;
    }
    if (!run) {
      setError('Campagne non active.');
      return;
    }

    const currentVisit = visits.find((v) => v.id === selectedVisitId);
    if (!currentVisit) {
      setError('Visite introuvable.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      let lat = currentVisit.latitude || -11.66089;
      let long = currentVisit.longitude || 27.47938;
      let accuracy = currentVisit.accuracy_m || 15;

      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
          });
          lat = pos.coords.latitude;
          long = pos.coords.longitude;
          accuracy = Math.round(pos.coords.accuracy || 15);
        } catch {
          // fallback
        }
      }

      let evidencePath = `tx_${Date.now()}`;
      if (photoFile) {
        try {
          evidencePath = await uploadMerchantEvidence(run.campaign_id, `tx_evidence_${selectedVisitId}_${Date.now()}.jpg`, photoFile);
        } catch (err) {
          console.warn('Evidence upload fallback:', err);
        }
      }

      const tx = await createTransaction({
        campaign_run_id: run.id,
        ba_id: currentUser.id,
        pos_id: currentVisit.pos_id,
        pos_visit_id: currentVisit.id,
        client_number: clientNumber.trim() || null,
        amount: Number(amount),
        transaction_reference: reference.trim() || null,
        comment: comment.trim() || null,
        occurred_at: new Date().toISOString(),
        latitude: lat,
        longitude: long,
        accuracy_m: accuracy,
        evidence_path: evidencePath,
        status: 'recorded',
      });

      onRecorded(tx);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'enregistrement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/85 p-3 backdrop-blur-md sm:p-6" role="dialog" aria-modal="true">
      <div className="glass-card max-h-[92vh] w-full max-w-lg overflow-y-auto border border-emerald-400/30 p-5 shadow-2xl rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-cyan-400">Nouvelle Vente / Activation</p>
              <h2 className="text-lg font-black text-white">Enregistrer une transaction</h2>
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
              POS validé du jour
            </label>
            <select
              value={selectedVisitId}
              onChange={(e) => setSelectedVisitId(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs font-medium focus:outline-none focus:border-cyan-400"
            >
              <option value="">-- Choisir le POS concerné --</option>
              {activeVisits.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.point_of_sale?.denomination || v.pos_id} ({v.point_of_sale?.agent_number || 'Code POS'})
                </option>
              ))}
            </select>
            {activeVisits.length === 0 && (
              <p className="text-[10px] text-amber-300">
                Vous devez d'abord pointer votre arrivée sur un POS avant de saisir une transaction.
              </p>
            )}
          </div>

          {/* Amount & Client Number */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-300 block">
                Montant (CDF)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="2000"
                className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-3 py-2.5 text-white text-xs font-bold focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-gray-300 block">
                Numéro Client (MSISDN)
              </label>
              <input
                type="text"
                value={clientNumber}
                onChange={(e) => setClientNumber(e.target.value)}
                placeholder="0821234567"
                className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Reference */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-300 block">
              ID Transaction M-Pesa (optionnel)
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Ex: MP240915.1234..."
              className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Photo capture / proof */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-300 block">
              Preuve SMS / Ticket (optionnelle)
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-200 transition">
                <Camera className="w-4 h-4 text-cyan-400" />
                <span>Prendre Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </label>
              {photoPreview && (
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-cyan-400/40">
                  <img src={photoPreview} alt="Aperçu" className="w-full h-full object-cover" />
                </div>
              )}
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
              disabled={isSubmitting || !selectedVisitId}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs uppercase tracking-wider transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(6,182,212,0.3)]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Envoi...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Enregistrer</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

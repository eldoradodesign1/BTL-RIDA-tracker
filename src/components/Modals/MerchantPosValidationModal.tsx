import React, { useState } from 'react';
import { X, Store, Camera, MapPin, Search, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import type { CampaignRun, PointOfSale, User, BAPosVisit } from '../../types';
import { recordPosArrival, uploadMerchantEvidence } from '../../utils/merchantCampaign';

interface MerchantPosValidationModalProps {
  isOpen: boolean;
  currentUser: User;
  run: CampaignRun | null;
  positions: PointOfSale[];
  visits: (BAPosVisit & { photoUrl?: string })[];
  activityDate: string;
  mfsName: string;
  onClose: () => void;
  onValidated: () => void;
}

export const MerchantPosValidationModal: React.FC<MerchantPosValidationModalProps> = ({
  isOpen,
  currentUser,
  run,
  positions,
  visits,
  activityDate,
  mfsName,
  onClose,
  onValidated,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosId, setSelectedPosId] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const visitedPosIds = new Set(visits.map((v) => v.pos_id));
  const availablePositions = positions.filter((p) => !visitedPosIds.has(p.id));

  const filteredPositions = availablePositions.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      (p.denomination && p.denomination.toLowerCase().includes(term)) ||
      (p.agent_number && p.agent_number.toLowerCase().includes(term)) ||
      (p.address && p.address.toLowerCase().includes(term)) ||
      (p.pool && p.pool.toLowerCase().includes(term))
    );
  });

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
    if (!selectedPosId) {
      setError('Veuillez sélectionner un point de vente (POS).');
      return;
    }
    if (!run) {
      setError('Aucune campagne active trouvée.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      let lat = -11.66089;
      let long = 27.47938;
      let accuracy = 15;

      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 10000,
              enableHighAccuracy: true,
            });
          });
          lat = pos.coords.latitude;
          long = pos.coords.longitude;
          accuracy = Math.round(pos.coords.accuracy || 15);
        } catch {
          // fallback
        }
      }

      let photoPath = '';
      if (photoFile) {
        try {
          photoPath = await uploadMerchantEvidence(run.campaign_id, `pos_arrival_${selectedPosId}_${Date.now()}.jpg`, photoFile);
        } catch (err: any) {
          console.warn('Photo upload fallback:', err);
          photoPath = `local-pos-${Date.now()}`;
        }
      }

      await recordPosArrival({
        campaign_run_id: run.id,
        ba_id: currentUser.id,
        pos_id: selectedPosId,
        activity_date: activityDate,
        visited_at: new Date().toISOString(),
        latitude: lat,
        longitude: long,
        accuracy_m: accuracy,
        arrival_photo_path: photoPath || null,
        status: 'visited',
        operational_status: 'active',
        operational_note: null,
      });

      onValidated();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la validation du POS.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/85 p-3 backdrop-blur-md sm:p-6" role="dialog" aria-modal="true">
      <div className="glass-card max-h-[92vh] w-full max-w-lg overflow-y-auto border border-emerald-300/25 p-5 shadow-2xl rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Pointage Arrivée</p>
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
          {/* POS Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-300 block">
              Sélectionner le POS
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Rechercher par nom, short-code, adresse..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-900 border border-white/10 rounded-2xl pl-9 pr-3 py-2.5 text-white text-xs font-medium focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 rounded-2xl border border-white/10 bg-black/40 p-2">
              {filteredPositions.length === 0 ? (
                <p className="p-3 text-center text-xs text-gray-500">Aucun POS disponible trouvé.</p>
              ) : (
                filteredPositions.map((pos) => {
                  const isSelected = selectedPosId === pos.id;
                  return (
                    <div
                      key={pos.id}
                      onClick={() => setSelectedPosId(pos.id)}
                      className={`cursor-pointer rounded-xl p-2.5 transition flex items-center justify-between border ${
                        isSelected
                          ? 'bg-emerald-500/20 border-emerald-400 text-white'
                          : 'bg-white/[0.03] border-white/5 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-xs font-bold truncate">{pos.denomination || 'POS sans nom'}</p>
                        <p className="text-[10px] text-gray-400 truncate">
                          Code: <span className="text-emerald-300 font-bold">{pos.agent_number || pos.id}</span> • {pos.address || 'Pas d\'adresse'}
                        </p>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Photo Capture */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-300 block">
              Photo d'arrivée sur site (optionnelle)
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-200 transition">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>Prendre / Choisir Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </label>
              {photoPreview && (
                <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-emerald-400/40">
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
              disabled={!selectedPosId || isSubmitting}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-zinc-950 font-black text-xs uppercase tracking-wider transition disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_15px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validation...</span>
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4" />
                  <span>Valider l'arrivée</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

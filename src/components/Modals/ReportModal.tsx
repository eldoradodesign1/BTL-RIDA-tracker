import React, { useState } from 'react';
import { User, Lead } from '../../types';
import { getTargetsByShop, getShopById, addReport, addCheckin, attachReportPdf, getCheckins, toISO, resolveStoredPhotoUrl, getLeads, isMatchAgent } from '../../utils/storage';
import { generateAgentPDF } from '../../utils/pdfGenerator';
import { FileText, Plus, X, Smartphone, Users, Car, CheckCircle2, AlertCircle } from 'lucide-react';
import { DateIconPicker } from '../DateIconPicker';
import { runInBackground } from '../../utils/backgroundOperations';

interface ReportModalProps {
  isOpen: boolean;
  currentUser: User;
  todayLeads: Lead[];
  activeShopId: string;
  onClose: () => void;
  onReportGenerated: (pdfUrl: string) => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  currentUser,
  todayLeads,
  activeShopId,
  onClose,
  onReportGenerated
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [reportDate, setReportDate] = useState(todayStr);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [commentError, setCommentError] = useState('');

  if (!isOpen) return null;

  // RIDA metrics
  const totalInstallations = todayLeads.length;
  const androidCount = todayLeads.filter(l => l.os_type === 'Android' || !l.os_type).length;
  const iosCount = todayLeads.filter(l => l.os_type === 'iOS').length;
  const passengerCount = todayLeads.filter(l => l.client_type === 'Passager' || !l.client_type).length;
  const driverCount = todayLeads.filter(l => l.client_type === 'Chauffeur / Conducteur').length;

  const shopIdToUse = activeShopId || currentUser.permanentShopId;
  const shopObj = getShopById(shopIdToUse);
  const shopName = shopObj ? shopObj.name : "Hub RIDA Lubumbashi";
  const targets = getTargetsByShop(shopIdToUse);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    files.forEach((file: File) => {
      if (photos.length >= 3) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const maxDim = 400;
          let w = img.width;
          let h = img.height;
          if (w > h) {
            if (w > maxDim) { h *= maxDim / w; w = maxDim; }
          } else {
            if (h > maxDim) { w *= maxDim / h; h = maxDim; }
          }
          canvas.width = w;
          canvas.height = h;
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            const base64 = canvas.toDataURL('image/jpeg', 0.5);
            setPhotos(prev => [...prev.slice(0, 2), base64]);
          }
        };
        img.src = ev.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSendReport = async () => {
    if (!comment.trim()) {
      setCommentError('Le commentaire de clôture est obligatoire pour valider la journée.');
      return;
    }
    setCommentError('');
    setLoading(true);

    const nowIso = new Date().toISOString();
    const todayCheckins = getCheckins().filter(c => c.agent_id === currentUser.id && toISO(c.timestamp) === toISO(nowIso));
    const inCheck = todayCheckins.find(c => c.type === 'IN');
    const pointagePhoto = resolveStoredPhotoUrl(inCheck?.photo_drive_url || inCheck?.photo) || '';
    const targetTotal = Math.max(1, (targets.privilege || 0) + (targets.roaming || 0) + (targets.bundle || 0));
    const evolutionSeries = (() => {
      const allLeads = getLeads();
      const matchingLeads = allLeads.filter(l => l.agent_id === currentUser.id || l.agent_id === currentUser.name || isMatchAgent(l.agent_id, currentUser));
      const sortedDates = Array.from(new Set(matchingLeads.map(l => toISO(l.timestamp)).filter(Boolean))).sort((a, b) => a.localeCompare(b));
      const datesToInclude = sortedDates.includes(reportDate) ? sortedDates : [...sortedDates, reportDate].filter(Boolean).sort((a, b) => a.localeCompare(b));
      let cumulative = 0;
      const evolutionActivationData = datesToInclude.map((date) => {
        const dayLeads = matchingLeads.filter(l => toISO(l.timestamp) === date);
        cumulative += dayLeads.length;
        return cumulative;
      });
      const evolutionTargetData = datesToInclude.map((_, index) => targetTotal * (index + 1));
      return { evolutionTargetData, evolutionActivationData };
    })();

    // Silent OUT check-in
    const outCheckin = addCheckin({
      agent_id: currentUser.id,
      type: 'OUT',
      timestamp: nowIso,
      lat: shopObj?.lat || -11.66089,
      long: shopObj?.long || 27.47938,
      accuracy: 5,
      status: 'synced'
    });

    const nowTimeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    const mapsIn = inCheck && typeof inCheck.lat === 'number' && typeof inCheck.long === 'number'
      ? `https://www.google.com/maps/search/?api=1&query=${inCheck.lat},${inCheck.long}`
      : 'donnees gps non disponible';
    const mapsOut = outCheckin && typeof outCheckin.lat === 'number' && typeof outCheckin.long === 'number'
      ? `https://www.google.com/maps/search/?api=1&query=${outCheckin.lat},${outCheckin.long}`
      : 'donnees gps non disponible';

    const savedReport = await addReport({
      date: reportDate,
      agent_id: currentUser.id,
      agent_name: currentUser.name,
      shop_id: shopIdToUse,
      shop_name: shopName,
      total_installations: totalInstallations,
      android_count: androidCount,
      ios_count: iosCount,
      passenger_count: passengerCount,
      driver_count: driverCount,
      priv: androidCount,
      roam: iosCount,
      bund: totalInstallations,
      amount: 0,
      comment,
      photos,
      pointage_photo: pointagePhoto,
      arrival_time: inCheck ? new Date(inCheck.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '00:00',
      departure_time: nowTimeStr,
      maps_in: mapsIn,
      maps_out: mapsOut
    });

    setLoading(false);
    onReportGenerated(`report-id:${savedReport.id}`);
    onClose();

    runInBackground('PDF du rapport journalier RIDA', () => generateAgentPDF({
      agentName: currentUser.name,
      shopName,
      date: reportDate,
      arrivalTime: inCheck ? new Date(inCheck.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '00:00',
      departureTime: nowTimeStr,
      mapsIn,
      mapsOut,
      totalPrivilege: androidCount,
      totalRoaming: iosCount,
      totalBundles: totalInstallations,
      targets,
      leads: todayLeads,
      pointagePhoto,
      photos,
      comment,
      evolutionTargetData: evolutionSeries.evolutionTargetData,
      evolutionActivationData: evolutionSeries.evolutionActivationData,
    }), {
      queued: 'Rapport RIDA enregistré. Le PDF est généré en arrière-plan.',
      success: 'PDF du rapport RIDA prêt dans vos archives.',
      onSuccess: (pdfUrl) => attachReportPdf(savedReport.id, pdfUrl),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-pop" onClick={onClose}>
      <div 
        className="relative w-full max-w-lg bg-[#0c121e] border border-white/10 rounded-t-[28px] sm:rounded-[28px] p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4 sm:hidden" />

        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#00D084] bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 inline-block mb-1.5">
            Campagne RIDA-Installation
          </span>
          <h2 className="text-xl font-black text-white tracking-tight">
            Clôture de Session <span className="text-[#00D084]">Journalière</span>
          </h2>
          <p className="text-xs text-gray-400 font-medium mt-0.5">Lubumbashi • Synthèse & Rapport PDF officiel</p>
        </div>

        <div className="space-y-4">
          {/* Date Picker */}
          <div>
            <label className="text-[11px] font-black uppercase text-gray-300 block mb-1">Date d'activité</label>
            <div className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2.5">
              <DateIconPicker
                value={reportDate}
                onChange={setReportDate}
                className="inline-flex items-center w-full"
                buttonClassName="h-9 w-9 rounded-lg bg-black/50 border border-white/10 text-gray-200 hover:bg-white/10"
                labelClassName="text-xs font-black uppercase text-white"
              />
            </div>
          </div>

          {/* RIDA Performance Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-emerald-500/10 border border-[#00D084]/30 p-3 rounded-xl">
              <span className="text-[9px] font-black uppercase text-emerald-400 block">Total Install.</span>
              <p className="text-xl font-black text-white mt-0.5">{totalInstallations}</p>
            </div>
            <div className="bg-white/[0.04] border border-white/10 p-3 rounded-xl">
              <span className="text-[9px] font-black uppercase text-gray-400 block">Android</span>
              <p className="text-xl font-black text-emerald-400 mt-0.5">{androidCount}</p>
            </div>
            <div className="bg-white/[0.04] border border-white/10 p-3 rounded-xl">
              <span className="text-[9px] font-black uppercase text-gray-400 block">iOS (Apple)</span>
              <p className="text-xl font-black text-sky-400 mt-0.5">{iosCount}</p>
            </div>
          </div>

          {/* Profil Breakdown */}
          <div className="grid grid-cols-2 gap-2 text-center text-xs font-bold">
            <div className="bg-white/[0.03] border border-white/5 p-2.5 rounded-xl flex items-center justify-center space-x-2 text-gray-300">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>{passengerCount} Passagers</span>
            </div>
            <div className="bg-white/[0.03] border border-white/5 p-2.5 rounded-xl flex items-center justify-center space-x-2 text-gray-300">
              <Car className="w-4 h-4 text-amber-400" />
              <span>{driverCount} Chauffeurs</span>
            </div>
          </div>

          {/* Preuves Photos */}
          <div>
            <label className="text-[11px] font-black uppercase text-gray-300 block mb-1">
              Photos terrain / installations (Max 3)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((p, idx) => (
                <div key={idx} className="aspect-square rounded-xl bg-cover bg-center relative border border-white/20 overflow-hidden" style={{ backgroundImage: `url(${p})` }}>
                  <button
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute top-1 right-1 bg-rose-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
              {photos.length < 3 && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-gray-400 hover:text-white cursor-pointer bg-white/[0.03] hover:bg-white/[0.08] transition-all">
                  <Plus className="w-6 h-6 mb-1 text-emerald-400" />
                  <span className="text-[9px] font-black uppercase">Photo</span>
                  <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* Commentaire de clôture */}
          <div>
            <label className="text-[11px] font-black uppercase text-gray-300 block mb-1">
              Commentaire de clôture <span className="text-[#00D084]">*</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => { setComment(e.target.value); if (commentError) setCommentError(''); }}
              required
              placeholder="Résumé obligatoire de la journée, retours prospects, zone couverte..."
              className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-white text-xs h-24 placeholder:text-gray-500 focus:outline-none focus:border-[#00D084]"
            />
            {commentError && <p className="mt-1.5 text-[11px] font-bold text-rose-300">{commentError}</p>}
          </div>

          {/* Submit */}
          <button
            onClick={handleSendReport}
            disabled={loading || !comment.trim()}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#00D084] to-[#059669] hover:from-[#10B981] hover:to-[#047857] text-[#032313] font-black text-sm uppercase tracking-wider flex items-center justify-center space-x-2 shadow-[0_8px_25px_rgba(0,208,132,0.35)] disabled:opacity-40 disabled:cursor-not-allowed transition-all mt-4 active:scale-[0.99]"
          >
            <FileText className="w-4 h-4" />
            <span>{loading ? 'GÉNÉRATION DU PDF...' : 'GÉNÉRER LE RAPPORT RIDA'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

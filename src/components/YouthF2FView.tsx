import React, { useEffect, useState } from 'react';
import { 
  GraduationCap, 
  MapPin, 
  Camera, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  History, 
  Send,
  Building2,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { User, YouthUniversity, YouthDailyAssignment, YouthDailyAttendance } from '../types';
import { 
  getYouthCampaign, 
  getYouthUniversities, 
  getYouthAssignment, 
  saveYouthAssignment, 
  getYouthAttendance, 
  recordYouthCheckin, 
  closeYouthAttendance, 
  getYouthAttendanceHistory,
  youthTodayIso 
} from '../utils/youthCampaign';

interface YouthF2FViewProps {
  currentUser: User;
}

export const YouthF2FView: React.FC<YouthF2FViewProps> = ({ currentUser }) => {
  const [loading, setLoading] = useState(true);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [universities, setUniversities] = useState<YouthUniversity[]>([]);
  const [selectedUnivId, setSelectedUnivId] = useState('');
  const [assignment, setAssignment] = useState<YouthDailyAssignment | null>(null);
  const [attendance, setAttendance] = useState<YouthDailyAttendance | null>(null);
  const [history, setHistory] = useState<YouthDailyAttendance[]>([]);
  const [closingComment, setClosingComment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const today = youthTodayIso();

  const loadData = async () => {
    try {
      setLoading(true);
      const camp = await getYouthCampaign();
      if (!camp) return;
      setCampaignId(camp.id);

      const [univs, currentAssign, currentAtt, attHist] = await Promise.all([
        getYouthUniversities(camp.id),
        getYouthAssignment(currentUser.id, camp.id, today),
        getYouthAttendance(currentUser.id, camp.id, today),
        getYouthAttendanceHistory(currentUser.id, camp.id)
      ]);

      setUniversities(univs);
      setAssignment(currentAssign);
      if (currentAssign?.university_id) {
        setSelectedUnivId(currentAssign.university_id);
      }
      setAttendance(currentAtt);
      setHistory(attHist);
    } catch (err: any) {
      console.error('Error loading Youth data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser.id]);

  const handleSaveUniversity = async () => {
    if (!campaignId || !selectedUnivId) return;
    setIsProcessing(true);
    setMessage(null);
    try {
      const saved = await saveYouthAssignment({
        campaignId,
        baId: currentUser.id,
        universityId: selectedUnivId,
        activityDate: today,
        assignedBy: currentUser.id
      });
      setAssignment(saved);
      setMessage({ type: 'success', text: 'Université du jour enregistrée !' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erreur lors du choix de l’université' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckin = async () => {
    if (!campaignId) return;
    setIsProcessing(true);
    setMessage(null);
    try {
      let lat = -11.66089;
      let long = 27.47938;
      let accuracy = 15;

      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, enableHighAccuracy: true });
          });
          lat = pos.coords.latitude;
          long = pos.coords.longitude;
          accuracy = Math.round(pos.coords.accuracy || 15);
        } catch {
          // Fallback coords
        }
      }

      const rec = await recordYouthCheckin({
        campaignId,
        assignmentId: assignment?.id,
        baId: currentUser.id,
        activityDate: today,
        checkinAt: new Date().toISOString(),
        latitude: lat,
        longitude: long,
        accuracy,
        photoPath: 'photo-pointage-youth-default'
      });
      setAttendance(rec);
      setMessage({ type: 'success', text: 'Pointage arrivée validé avec succès !' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erreur lors du pointage' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckout = async () => {
    if (!attendance || !closingComment.trim()) {
      setMessage({ type: 'error', text: 'Veuillez saisir votre commentaire de fin de journée.' });
      return;
    }
    setIsProcessing(true);
    setMessage(null);
    try {
      let lat = -11.66089;
      let long = 27.47938;
      let accuracy = 15;

      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, enableHighAccuracy: true });
          });
          lat = pos.coords.latitude;
          long = pos.coords.longitude;
          accuracy = Math.round(pos.coords.accuracy || 15);
        } catch {
          // Fallback coords
        }
      }

      const rec = await closeYouthAttendance({
        attendanceId: attendance.id,
        checkoutAt: new Date().toISOString(),
        latitude: lat,
        longitude: long,
        accuracy,
        comment: closingComment
      });
      setAttendance(rec);
      setMessage({ type: 'success', text: 'Clôture de la journée enregistrée !' });
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erreur lors de la clôture' });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="rounded-2xl bg-white/5 border border-white/10 px-6 py-4 text-center">
          <GraduationCap className="w-8 h-8 text-[#00D084] animate-bounce mx-auto mb-2" />
          <p className="text-xs font-black uppercase text-gray-400">Chargement Youth F2F...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6 max-w-4xl mx-auto w-full">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/25 bg-gradient-to-br from-[#041a12] via-[#08281d] to-[#03140e] p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-[#00D084] flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#00D084]">Campagne Terrain</span>
            <h1 className="text-xl sm:text-2xl font-black text-white uppercase">Youth F2F Universités</h1>
          </div>
        </div>
        <p className="text-xs text-emerald-300/80 font-medium">
          Ambassadeur : <span className="text-white font-bold">{currentUser.name}</span> • Lubumbashi
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2.5 ${
          message.type === 'success' 
            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' 
            : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Step 1: Choice of University */}
      <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5 shadow-lg space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#00D084]" />
          <h2 className="text-sm font-black uppercase tracking-wider text-white">1. Université d'Affectation</h2>
        </div>

        {assignment ? (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-emerald-400">Université sélectionnée pour aujourd'hui</p>
              <h3 className="text-base font-black text-white mt-0.5">
                {(assignment as any).university?.name || universities.find(u => u.id === assignment.university_id)?.name || 'Université'}
              </h3>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-[#00D084] text-[10px] font-black uppercase border border-emerald-500/40">
              Confirmé
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            <select
              value={selectedUnivId}
              onChange={(e) => setSelectedUnivId(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs focus:outline-none focus:border-[#00D084]"
            >
              <option value="">-- Choisir une université / campus --</option>
              {universities.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} {u.city ? `(${u.city})` : ''}
                </option>
              ))}
            </select>
            <button
              onClick={handleSaveUniversity}
              disabled={!selectedUnivId || isProcessing}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00D084] to-[#059669] text-[#032313] font-black text-xs uppercase tracking-wider disabled:opacity-50 transition"
            >
              Confirmer mon campus du jour
            </button>
          </div>
        )}
      </div>

      {/* Step 2: Attendance Checkin / Checkout */}
      <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5 shadow-lg space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#00D084]" />
          <h2 className="text-sm font-black uppercase tracking-wider text-white">2. Pointage Présence Terrain</h2>
        </div>

        {!attendance ? (
          <div className="space-y-3 text-center py-4">
            <p className="text-xs text-gray-400">
              Enregistrez votre arrivée sur le campus avec géolocalisation.
            </p>
            <button
              onClick={handleCheckin}
              disabled={isProcessing}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#00D084] to-[#059669] hover:from-[#10B981] hover:to-[#047857] text-[#032313] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 mx-auto shadow-[0_4px_15px_rgba(0,208,132,0.3)] transition"
            >
              <MapPin className="w-4 h-4" />
              <span>Pointer mon arrivée campus</span>
            </button>
          </div>
        ) : attendance.status === 'open' ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase text-cyan-400">Pointage Arrivée Actif</p>
                <p className="text-xs text-white font-bold mt-0.5">
                  Arrivée enregistrée à {new Date(attendance.checkin_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 block">
                Commentaire de clôture de journée (obligatoire)
              </label>
              <textarea
                value={closingComment}
                onChange={(e) => setClosingComment(e.target.value)}
                placeholder="Ex: 45 étudiants sensibilisés, 22 téléchargements d'application, distribution flyers..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-white text-xs focus:outline-none focus:border-[#00D084] h-24"
              />
              <button
                onClick={handleCheckout}
                disabled={!closingComment.trim() || isProcessing}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 text-white font-black text-xs uppercase tracking-wider disabled:opacity-50 transition shadow-lg"
              >
                Clôturer ma journée sur campus
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center py-6">
            <CheckCircle2 className="w-8 h-8 text-[#00D084] mx-auto mb-2" />
            <h3 className="text-sm font-black text-white uppercase">Journée Campus Clôturée</h3>
            <p className="text-xs text-gray-400 mt-1">
              Votre rapport d'activité a été enregistré et transmis.
            </p>
          </div>
        )}
      </div>

      {/* Archives / History */}
      {history.length > 0 && (
        <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5 shadow-lg space-y-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-gray-400" />
            <h2 className="text-sm font-black uppercase tracking-wider text-white">Historique Récents Pointages</h2>
          </div>
          <div className="divide-y divide-white/5">
            {history.slice(0, 5).map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                <span className="font-bold text-gray-300">{item.activity_date}</span>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                  item.status === 'closed' 
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-[#00D084]' 
                    : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                }`}>
                  {item.status === 'closed' ? 'Clôturé' : 'En cours'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

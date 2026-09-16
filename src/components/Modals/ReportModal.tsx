import React, { useState } from 'react';
import { User, Lead } from '../../types';
import { addReport } from '../../utils/storage';
import { CheckCircle2, FileText, Plus, X } from 'lucide-react';
import { DateIconPicker } from '../DateIconPicker';

interface ReportModalProps {
  isOpen: boolean;
  currentUser: User;
  todayLeads: Lead[];
  activeShopId?: string;
  onClose: () => void;
  onReportGenerated: (pdfUrl: string) => void;
}

const metric = (leads: Lead[], key: string) => leads.filter((lead) => key === 'Chauffeur inscrit'
  ? lead.action_type === key || lead.client_type === 'Chauffeur / Conducteur'
  : key === 'Téléchargement appli'
    ? lead.action_type === key
    : lead.action_type === key).length;

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, currentUser, todayLeads, onClose, onReportGenerated }) => {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  if (!isOpen) return null;
  const contacts = metric(todayLeads, 'Contact');
  const chauffeurs = metric(todayLeads, 'Chauffeur inscrit');
  const downloads = metric(todayLeads, 'Téléchargement appli');

  const addPhotos = (event: React.ChangeEvent<HTMLInputElement>) => {
    (Array.from(event.target.files || []) as File[]).slice(0, 3 - photos.length).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => setPhotos((current) => [...current, String(reader.result)]);
      reader.readAsDataURL(file);
    });
  };

  const submit = async () => {
    if (!comment.trim()) { setError('Ajoutez une synthèse courte de votre journée.'); return; }
    setSaving(true);
    const report = await addReport({
      date, agent_id: currentUser.id, agent_name: currentUser.name, shop_id: '', shop_name: 'RIDA',
      total_contacts: contacts, total_chauffeurs: chauffeurs, total_downloads: downloads, total_installations: downloads,
      priv: contacts, roam: chauffeurs, bund: downloads, amount: 0, comment: comment.trim(), photos,
    });
    setSaving(false);
    onReportGenerated(`report-id:${report.id}`);
    onClose();
  };

  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-0 backdrop-blur-md sm:items-center sm:p-4" onClick={onClose}><div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] border border-white/10 bg-[#101718] p-5 shadow-2xl sm:rounded-[2rem]" onClick={(event) => event.stopPropagation()}><button onClick={onClose} className="absolute right-4 top-4 rounded-xl p-2 text-zinc-500 hover:bg-white/10 hover:text-white"><X size={18} /></button><div className="mb-5 pr-8"><p className="text-[10px] font-black uppercase tracking-[.2em] text-teal-200/70">RIDA · activité du jour</p><h2 className="mt-1 text-2xl font-black text-white">Présenter mon rapport</h2><p className="mt-1 text-xs text-zinc-500">Une synthèse simple de votre activité et de vos retours terrain.</p></div><div className="space-y-4"><div className="rounded-2xl border border-white/10 bg-white/[.03] p-3"><p className="mb-2 text-[10px] font-black uppercase text-zinc-500">Date du rapport</p><DateIconPicker value={date} onChange={setDate} className="w-full" buttonClassName="h-9 w-9 rounded-xl border border-white/10 bg-black/20" labelClassName="text-xs font-black text-white" /></div><div className="grid grid-cols-3 gap-2">{[['Contacts', contacts], ['Chauffeurs', chauffeurs], ['Téléchargements', downloads]].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/[.04] p-3 text-center"><p className="text-[9px] font-black uppercase text-zinc-500">{label}</p><p className="mt-1 text-2xl font-black text-white">{value}</p></div>)}</div><div><p className="mb-2 text-[10px] font-black uppercase text-zinc-500">Photos facultatives</p><div className="grid grid-cols-3 gap-2">{photos.map((photo, index) => <div key={photo} className="relative aspect-square overflow-hidden rounded-2xl border border-white/10"><img src={photo} alt="Preuve RIDA" className="h-full w-full object-cover" /><button onClick={() => setPhotos((current) => current.filter((_, item) => item !== index))} className="absolute right-1 top-1 rounded-lg bg-black/70 p-1 text-white"><X size={12} /></button></div>)}{photos.length < 3 && <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[.03] text-zinc-500"><Plus size={18} /><span className="mt-1 text-[9px] font-black uppercase">Ajouter</span><input type="file" accept="image/*" multiple onChange={addPhotos} className="hidden" /></label>}</div></div><div><label className="mb-2 block text-[10px] font-black uppercase text-zinc-500">Synthèse de la journée *</label><textarea value={comment} onChange={(event) => { setComment(event.target.value); setError(''); }} placeholder="Zone couverte, retours importants, difficultés ou observations..." className="h-28 w-full resize-none rounded-2xl border border-white/10 bg-white/[.03] p-3 text-xs font-medium text-white outline-none placeholder:text-zinc-600 focus:border-teal-200/50" />{error && <p className="mt-1 text-[10px] font-bold text-rose-300">{error}</p>}</div><button onClick={submit} disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-200 py-3 text-xs font-black uppercase text-[#102321] disabled:opacity-50"><CheckCircle2 size={16} /> {saving ? 'Enregistrement...' : 'Présenter le rapport'}</button></div></div></div>;
};

export default ReportModal;

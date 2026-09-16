import React, { useState } from 'react';
import { User } from '../../types';
import { addLead } from '../../utils/storage';
import { cleanPhoneNumber, formatMsisdn, isValidMsisdn } from '../../utils/phoneValidator';
import { CheckCircle2, X } from 'lucide-react';

interface LeadModalProps { isOpen: boolean; currentUser: User; activeShopId?: string; onClose: () => void; onSuccess: () => void; }
const TYPES = ['Contact', 'Chauffeur inscrit', 'Téléchargement appli'] as const;

export const LeadModal: React.FC<LeadModalProps> = ({ isOpen, currentUser, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState<(typeof TYPES)[number]>('Contact');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  if (!isOpen) return null;
  const submit = (event: React.FormEvent) => {
    event.preventDefault(); setError('');
    if (!name.trim()) { setError('Le nom ou identifiant du contact est requis.'); return; }
    if (!isValidMsisdn(phone)) { setError('Saisissez un numéro RDC valide à 10 chiffres.'); return; }
    const cleaned = cleanPhoneNumber(phone);
    try {
      addLead({ agent_id: currentUser.id, shop_id: '', timestamp: new Date().toISOString(), client_name: name.trim(), msisdn: cleaned.length === 10 ? cleaned : formatMsisdn(phone), action_type: type, notes: notes.trim() || undefined, status: 'pending' });
      setName(''); setPhone(''); setType('Contact'); setNotes(''); onSuccess(); onClose();
    } catch (submitError) { setError(submitError instanceof Error ? submitError.message : 'Impossible d’enregistrer cette activité.'); }
  };
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-0 backdrop-blur-md sm:items-center sm:p-4" onClick={onClose}><div className="relative w-full max-w-lg rounded-t-[2rem] border border-white/10 bg-[#101718] p-5 shadow-2xl sm:rounded-[2rem]" onClick={(event) => event.stopPropagation()}><button onClick={onClose} className="absolute right-4 top-4 rounded-xl p-2 text-zinc-500 hover:bg-white/10 hover:text-white"><X size={18} /></button><div className="mb-5 pr-8"><p className="text-[10px] font-black uppercase tracking-[.2em] text-teal-200/70">RIDA · nouvelle activité</p><h2 className="mt-1 text-2xl font-black text-white">Enregistrer un contact</h2><p className="mt-1 text-xs text-zinc-500">Une saisie simple : une personne, une action, une note.</p></div><form onSubmit={submit} className="space-y-4"><div><label className="mb-2 block text-[10px] font-black uppercase text-zinc-500">Nom ou identifiant *</label><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex. Jean-Luc Kalombo" className="w-full rounded-2xl border border-white/10 bg-white/[.03] p-3 text-sm font-semibold text-white outline-none focus:border-teal-200/50" /></div><div><label className="mb-2 block text-[10px] font-black uppercase text-zinc-500">Numéro RDC *</label><input value={phone} onChange={(event) => setPhone(event.target.value.replace(/[^\d+\s]/g, ''))} placeholder="097 123 45 67" inputMode="tel" className="w-full rounded-2xl border border-white/10 bg-white/[.03] p-3 font-mono text-sm font-bold text-white outline-none focus:border-teal-200/50" /></div><div><label className="mb-2 block text-[10px] font-black uppercase text-zinc-500">Type d’activité *</label><div className="grid gap-2 sm:grid-cols-3">{TYPES.map((item) => <button type="button" key={item} onClick={() => setType(item)} className={`rounded-2xl border p-3 text-left text-[10px] font-black ${type === item ? 'border-teal-200/60 bg-teal-200/15 text-teal-100' : 'border-white/10 bg-white/[.03] text-zinc-500'}`}>{item}</button>)}</div></div><div><label className="mb-2 block text-[10px] font-black uppercase text-zinc-500">Note facultative</label><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Contexte, retour ou prochaine étape..." className="h-20 w-full resize-none rounded-2xl border border-white/10 bg-white/[.03] p-3 text-xs text-white outline-none focus:border-teal-200/50" /></div>{error && <p className="rounded-xl border border-rose-200/20 bg-rose-300/10 p-3 text-[10px] font-bold text-rose-200">{error}</p>}<button type="submit" className="flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-200 py-3 text-xs font-black uppercase text-[#102321]"><CheckCircle2 size={16} /> Enregistrer l’activité</button></form></div></div>;
};

export default LeadModal;

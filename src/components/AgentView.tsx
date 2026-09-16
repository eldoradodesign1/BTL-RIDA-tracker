import React, { useMemo, useState } from 'react';
import { User, Lead, DailyReport } from '../types';
import { getLeads, isMatchAgent, toISO } from '../utils/storage';
import { TabType } from './BottomNav';
import { Archive, ArrowRight, FileText, Plus, Search, Target, Users, Download, CarFront, X } from 'lucide-react';
import { DateIconPicker } from './DateIconPicker';

interface AgentViewProps {
  currentUser: User;
  activeShopId?: string;
  activeTab?: TabType;
  todayLeads: Lead[];
  todayCheckin?: unknown;
  agentReports: DailyReport[];
  onOpenLeadModal: () => void;
  onOpenReportModal: () => void;
  onOpenPdfModal: (url: string) => void;
  onRefreshData?: () => void;
  campaignPaused?: boolean;
  pauseReason?: string;
}

const KPI = [
  { key: 'Contact', label: 'Contacts', target: 40, icon: Users, color: 'text-teal-200', bar: 'bg-teal-200' },
  { key: 'Chauffeur inscrit', label: 'Chauffeurs inscrits', target: 5, icon: CarFront, color: 'text-amber-200', bar: 'bg-amber-200' },
  { key: 'Téléchargement appli', label: 'Téléchargements', target: 8, icon: Download, color: 'text-sky-200', bar: 'bg-sky-200' },
] as const;

const getKpiValue = (leads: Lead[], key: string) => leads.filter((lead) => key === 'Chauffeur inscrit'
  ? lead.action_type === key || lead.client_type === 'Chauffeur / Conducteur'
  : key === 'Téléchargement appli'
    ? lead.action_type === key
    : lead.action_type === key).length;

export const AgentView: React.FC<AgentViewProps> = ({
  currentUser,
  activeTab = 'home',
  todayLeads,
  agentReports,
  onOpenLeadModal,
  onOpenReportModal,
  onOpenPdfModal,
  campaignPaused = false,
}) => {
  const today = new Date().toISOString().split('T')[0];
  const [search, setSearch] = useState('');
  const [date, setDate] = useState(today);
  const [filter, setFilter] = useState('ALL');
  const allLeads = useMemo(() => getLeads().filter((lead) => lead.agent_id === currentUser.id || lead.agent_id === currentUser.name || isMatchAgent(lead.agent_id, currentUser)), [currentUser]);
  const visibleLeads = allLeads.filter((lead) => {
    const needle = search.toLowerCase();
    const matchesSearch = !needle || lead.client_name.toLowerCase().includes(needle) || lead.msisdn.includes(needle) || (lead.notes || '').toLowerCase().includes(needle);
    const matchesFilter = filter === 'ALL' || lead.action_type === filter || (filter === 'Chauffeur inscrit' && lead.client_type === 'Chauffeur / Conducteur');
    const matchesDate = !date || toISO(lead.timestamp) === date || lead.timestamp.startsWith(date);
    return matchesSearch && matchesFilter && matchesDate;
  });
  const totalToday = todayLeads.length;

  if (activeTab === 'tab2') {
    return <div className="space-y-5 animate-pop pb-32">
      <PageHeading eyebrow="Suivi terrain" title="Mes prospects" description={`${allLeads.length} contact${allLeads.length === 1 ? '' : 's'} enregistré${allLeads.length === 1 ? '' : 's'}`} action={<button onClick={onOpenLeadModal} disabled={campaignPaused} className="inline-flex items-center gap-2 rounded-2xl bg-teal-200 px-3 py-2 text-[10px] font-black uppercase text-[#102321] disabled:cursor-not-allowed disabled:opacity-40"><Plus size={15} /> Ajouter</button>} />
      <div className="glass-card space-y-3 rounded-3xl border border-white/10 p-3">
        <div className="relative"><Search className="absolute left-3 top-3 text-zinc-500" size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un nom, numéro ou note" className="w-full rounded-2xl border border-white/10 bg-black/20 py-2.5 pl-9 pr-3 text-xs font-semibold text-white outline-none focus:border-teal-200/60" /></div>
        <div className="flex gap-2 overflow-x-auto pb-1">{['ALL', 'Contact', 'Chauffeur inscrit', 'Téléchargement appli'].map((item) => <button key={item} onClick={() => setFilter(item)} className={`whitespace-nowrap rounded-xl border px-3 py-1.5 text-[10px] font-black ${filter === item ? 'border-teal-200/60 bg-teal-200/15 text-teal-100' : 'border-white/10 bg-white/[.03] text-zinc-400'}`}>{item === 'ALL' ? 'Toutes' : item}</button>)}</div>
        <div className="flex items-center gap-2"><DateIconPicker value={date} onChange={setDate} className="flex-1" buttonClassName="h-9 w-9 rounded-xl border border-white/10 bg-black/20" labelClassName="text-[10px] font-bold text-zinc-300" /><button onClick={() => setDate('')} className="rounded-xl border border-white/10 px-3 py-2 text-[10px] font-black text-zinc-400">Toutes les dates</button></div>
      </div>
      <div className="space-y-2">{visibleLeads.length === 0 ? <EmptyState icon={Users} title="Aucun prospect" description="Les contacts correspondant à vos filtres apparaîtront ici." /> : visibleLeads.map((lead) => <div key={lead.id} className="glass-card flex items-center justify-between gap-3 rounded-2xl border border-white/10 p-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-xs font-black text-white">{lead.client_name || 'Contact sans nom'}</p><span className="text-[10px] font-mono text-zinc-400">{lead.msisdn}</span></div><p className="mt-1 text-[10px] font-semibold text-zinc-500">{new Date(lead.timestamp).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}{lead.notes ? ` · ${lead.notes}` : ''}</p></div><span className="shrink-0 rounded-xl border border-teal-200/20 bg-teal-200/10 px-2.5 py-1.5 text-[9px] font-black uppercase text-teal-100">{lead.action_type}</span></div>)}</div>
    </div>;
  }

  if (activeTab === 'tab3') {
    return <div className="space-y-5 animate-pop pb-32">
      <PageHeading eyebrow="Votre activité" title="Archives" description={`${agentReports.length} rapport${agentReports.length === 1 ? '' : 's'} journalier${agentReports.length === 1 ? '' : 's'}`} action={<button onClick={onOpenReportModal} disabled={campaignPaused} className="inline-flex items-center gap-2 rounded-2xl bg-teal-200 px-3 py-2 text-[10px] font-black uppercase text-[#102321] disabled:opacity-40"><FileText size={15} /> Nouveau rapport</button>} />
      {agentReports.length === 0 ? <EmptyState icon={Archive} title="Aucun rapport présenté" description="Votre premier rapport journalier apparaîtra ici après présentation." /> : <div className="space-y-3">{agentReports.map((report) => <div key={report.id} className="glass-card rounded-3xl border border-white/10 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[.18em] text-teal-200">Rapport journalier</p><h3 className="mt-1 text-sm font-black text-white">{report.date}</h3><p className="mt-1 text-[10px] text-zinc-500">Présenté par {report.agent_name}</p></div><button onClick={() => onOpenPdfModal(`report-id:${report.id}`)} className="rounded-xl border border-white/10 px-3 py-2 text-[10px] font-black uppercase text-zinc-200">Ouvrir</button></div><div className="mt-4 grid grid-cols-3 gap-2">{[['Contacts', report.total_contacts ?? 0], ['Chauffeurs', report.total_chauffeurs ?? 0], ['Téléchargements', report.total_downloads ?? report.total_installations ?? 0]].map(([label, value]) => <div key={String(label)} className="rounded-2xl bg-white/[.04] p-3 text-center"><p className="text-[9px] font-black uppercase text-zinc-500">{label}</p><p className="mt-1 text-lg font-black text-white">{value}</p></div>)}</div>{report.comment && <p className="mt-3 rounded-2xl bg-black/20 p-3 text-[10px] font-medium leading-relaxed text-zinc-400">{report.comment}</p>}</div>)}</div>}
    </div>;
  }

  return <div className="space-y-5 animate-pop pb-32">
    <section className="relative overflow-hidden rounded-[2rem] border border-teal-100/10 bg-gradient-to-br from-[#1d3938] via-[#142625] to-[#0f1718] p-5 shadow-2xl"><div className="absolute -right-10 -top-16 h-40 w-40 rounded-full bg-teal-200/10 blur-3xl" /><p className="relative text-[10px] font-black uppercase tracking-[.2em] text-teal-100/65">RIDA · suivi d’acquisition</p><h1 className="relative mt-2 text-2xl font-black tracking-tight text-white">Bonjour, {currentUser.name}</h1><p className="relative mt-2 max-w-sm text-xs font-medium leading-relaxed text-zinc-300">Un espace unique pour enregistrer vos contacts, suivre vos objectifs et présenter votre rapport du jour.</p></section>
    {campaignPaused && <div className="rounded-2xl border border-amber-200/20 bg-amber-300/10 p-4 text-xs font-semibold text-amber-100">Les saisies sont temporairement suspendues.</div>}
    <section><div className="mb-3 flex items-end justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-zinc-500">Aujourd’hui</p><h2 className="mt-1 text-lg font-black text-white">Vos objectifs</h2></div><span className="text-xs font-bold text-zinc-500">{totalToday} action{totalToday === 1 ? '' : 's'}</span></div><div className="grid grid-cols-3 gap-2">{KPI.map(({ key, label, target, icon: Icon, color, bar }) => { const value = getKpiValue(todayLeads, key); const progress = Math.min(100, Math.round(value / target * 100)); return <div key={key} className="glass-card rounded-2xl border border-white/10 p-3"><Icon size={16} className={color} /><p className="mt-3 min-h-7 text-[9px] font-black uppercase leading-tight text-zinc-400">{label}</p><p className="mt-1 text-xl font-black text-white">{value}<span className="text-[10px] text-zinc-600">/{target}</span></p><div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full ${bar}`} style={{ width: `${progress}%` }} /></div></div>; })}</div></section>
    <section className="grid gap-3 sm:grid-cols-2"><button onClick={onOpenLeadModal} disabled={campaignPaused} className="group flex items-center justify-between rounded-3xl border border-teal-100/15 bg-teal-200/[.08] p-4 text-left disabled:opacity-40"><span><span className="block text-sm font-black text-white">Enregistrer une activité</span><span className="mt-1 block text-[10px] font-semibold text-zinc-400">Contact, chauffeur ou téléchargement</span></span><ArrowRight className="text-teal-100 transition-transform group-hover:translate-x-1" size={19} /></button><button onClick={onOpenReportModal} disabled={campaignPaused} className="group flex items-center justify-between rounded-3xl border border-white/10 bg-white/[.04] p-4 text-left disabled:opacity-40"><span><span className="block text-sm font-black text-white">Présenter mon rapport</span><span className="mt-1 block text-[10px] font-semibold text-zinc-500">Synthèse de votre journée RIDA</span></span><ArrowRight className="text-zinc-300 transition-transform group-hover:translate-x-1" size={19} /></button></section>
    <div className="rounded-3xl border border-white/10 bg-white/[.025] p-4"><div className="flex items-center gap-3"><Target className="text-teal-200" size={18} /><div><p className="text-xs font-black text-white">Un outil pensé pour RIDA</p><p className="mt-1 text-[10px] leading-relaxed text-zinc-500">Une lecture claire de votre prospection, de vos résultats et de vos retours terrain.</p></div></div></div>
  </div>;
};

const PageHeading = ({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) => <div className="flex items-end justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-teal-200/65">{eyebrow}</p><h1 className="mt-1 text-2xl font-black tracking-tight text-white">{title}</h1><p className="mt-1 text-xs font-semibold text-zinc-500">{description}</p></div>{action}</div>;
const EmptyState = ({ icon: Icon, title, description }: { icon: React.ComponentType<{ size?: number; className?: string }>; title: string; description: string }) => <div className="glass-card rounded-3xl border border-white/10 p-10 text-center"><Icon size={28} className="mx-auto text-zinc-600" /><p className="mt-3 text-sm font-black text-zinc-300">{title}</p><p className="mx-auto mt-1 max-w-xs text-[11px] leading-relaxed text-zinc-500">{description}</p></div>;

export default AgentView;

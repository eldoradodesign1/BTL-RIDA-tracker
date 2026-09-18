import React, { useMemo, useState } from 'react';
import {
  Activity, Archive, BarChart3, Bell, CalendarDays, Camera, CheckCircle2, ChevronDown,
  ClipboardList, Download, FileText, Gauge, Globe2, LayoutDashboard, LogOut,
  MapPin, Menu, Plus, RefreshCw, Search, Settings2, ShieldCheck, Target, UserCog,
  Users, X, Zap, Trash2
} from 'lucide-react';
import type { User, Shop, Lead, Checkin, DailyReport, UserRole } from '../types';
import {
  addCheckin, deleteUserLocal, getCheckins, getLeads, getReports, getTodayCheckinPhoto, getUsers, toISO
} from '../utils/storage';
import { LeadModal } from './Modals/LeadModal';
import { ReportModal } from './Modals/ReportModal';
import { UserModal } from './Modals/UserModal';
import { ShopModal } from './Modals/ShopModal';
import { PdfViewerModal } from './Modals/PdfViewerModal';

type Page = 'overview' | 'field' | 'activity' | 'reports' | 'archive' | 'team' | 'campaigns' | 'people' | 'assignments' | 'settings' | 'account';
type Props = {
  user: User;
  users: User[];
  shops: Shop[];
  online: boolean;
  syncPendingCount: number;
  onRefresh: (force?: boolean) => void;
  onLogout: () => void;
  onOpenSystemConfig?: () => void;
  onSimulateRole?: (role: UserRole) => void;
  simulationActive?: boolean;
  onExitSimulation?: () => void;
};

const roleLabel: Record<UserRole,string> = {
  agent:'Agent', supervisor:'Superviseur', sub_admin:'Sous-admin', admin:'Admin', super_admin:'Superadmin'
};

const fmt = (n:number) => new Intl.NumberFormat('fr-FR').format(n);
const today = () => toISO(new Date());

function initials(name:string) {
  return name.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase();
}

function Stat({label,value,detail,icon:Icon,tone='green'}:{label:string;value:string|number;detail?:string;icon:React.ComponentType<any>;tone?:string}) {
  return <div className="ops-stat">
    <div className={`ops-stat-icon tone-${tone}`}><Icon size={18}/></div>
    <div className="ops-stat-copy"><span>{label}</span><strong>{value}</strong>{detail && <small>{detail}</small>}</div>
  </div>;
}

function SectionTitle({eyebrow,title,description,action}:{eyebrow?:string;title:string;description?:string;action?:React.ReactNode}) {
  return <div className="ops-section-title">
    <div><div className="ops-eyebrow">{eyebrow}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>
    {action}
  </div>;
}

function StatusPill({status}:{status:string}) {
  const s=status.toLowerCase();
  const cls=s.includes('présent')||s.includes('sur site')||s.includes('actif')||s.includes('clôturé')?'ok':s.includes('retard')||s.includes('attente')?'warn':s.includes('absent')||s.includes('erreur')?'bad':'neutral';
  return <span className={`ops-status ${cls}`}><i/> {status}</span>;
}

function Empty({title,description}:{title:string;description:string}) {
  return <div className="ops-empty"><div><Archive size={22}/></div><strong>{title}</strong><p>{description}</p></div>;
}

function AgentHome({user,leads,checkins,reports,onAdd,onReport,onRefresh}:{user:User;leads:Lead[];checkins:Checkin[];reports:DailyReport[];onAdd:()=>void;onReport:()=>void;onRefresh:()=>void}) {
  const day=today();
  const todayLeads=leads.filter(x=>x.agent_id===user.id && toISO(x.timestamp)===day);
  const todayIn=checkins.find(x=>x.agent_id===user.id && x.type==='IN' && toISO(x.timestamp)===day);
  const closed=reports.some(x=>x.agent_id===user.id && toISO(x.date)===day);
  const target=30;
  return <div className="ops-page">
    <section className="ops-hero agent-hero">
      <div><div className="ops-kicker">MA JOURNÉE · {new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'2-digit',month:'long'})}</div>
      <h1>Bonjour, {user.name.split(' ')[0]}.</h1><p>Tout ce dont vous avez besoin pour exécuter votre mission terrain, au même endroit.</p></div>
      <div className="hero-state"><StatusPill status={closed?'Journée clôturée':todayIn?'Sur le terrain':'À démarrer'}/><span>{user.permanentShopId || 'Site à confirmer'}</span></div>
    </section>

    <div className="ops-stat-grid">
      <Stat label="Activités du jour" value={fmt(todayLeads.length)} detail={`${Math.round(todayLeads.length/target*100)}% de l’objectif`} icon={Activity}/>
      <Stat label="Installations" value={fmt(todayLeads.filter(x=>x.action_type==='Installation RIDA').length)} detail="Acquisitions RIDA" icon={Zap} tone="blue"/>
      <Stat label="Présence" value={todayIn?'Validée':'À pointer'} detail={todayOut?'Départ enregistré':'Départ en attente'} icon={MapPin} tone="amber"/>
    </div>

    <div className="ops-two-col">
      <section className="ops-panel action-panel">
        <div className="panel-head"><div><span className="ops-eyebrow">ACTION IMMÉDIATE</span><h2>Votre poste de travail</h2></div><button className="icon-button" onClick={onRefresh}><RefreshCw size={16}/></button></div>
        {!todayIn&&<button className="agent-checkin-command" onClick={()=>captureAttendance(user,'IN',onRefresh)} aria-label="Enregistrer l’arrivée" title="Enregistrer l’arrivée"><MapPin size={34}/></button>}
        {todayIn&&<div className="agent-command-grid">
          <button className="agent-command client-command" disabled={closed} onClick={onAdd} aria-label="Enregistrer un client" title="Enregistrer un client"><Plus size={36}/></button>
          <button className={`agent-command report-command ${closed?'done':''}`} disabled={closed} onClick={onReport} aria-label="Présenter le rapport et clôturer la journée" title="Rapport / clôture"><FileText size={36}/></button>
        </div>
      </section>
      <section className="ops-panel">
        <div className="panel-head"><div><span className="ops-eyebrow">PROGRESSION</span><h2>Objectif quotidien</h2></div><Target size={18}/></div>
        <div className="progress-ring-wrap"><div className="progress-ring" style={{'--progress':`${Math.min(100,Math.round(todayLeads.length/target*100))}%`} as React.CSSProperties}><div><strong>{Math.min(100,Math.round(todayLeads.length/target*100))}%</strong><span>atteint</span></div></div><div className="progress-copy"><b>{todayLeads.length} / {target}</b><span>activités terrain</span><small>{Math.max(0,target-todayLeads.length)} restantes pour l’objectif</small></div></div>
        <div className="mini-timeline">{todayLeads.slice(0,5).map(l=><div key={l.id}><i/><span>{new Date(l.timestamp).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</span><b>{l.action_type}</b><em>{l.client_name}</em></div>)}{todayLeads.length===0&&<p className="muted">Votre activité apparaîtra ici.</p>}</div>
      </section>
    </div>

    <section className="ops-panel">
      <div className="panel-head"><div><span className="ops-eyebrow">HISTORIQUE RÉCENT</span><h2>Vos derniers rapports</h2></div><span className="panel-count">{reports.filter(r=>r.agent_id===user.id).length}</span></div>
      {reports.filter(r=>r.agent_id===user.id).slice(0,4).map(r=><div className="report-row" key={r.id}><div className="report-date"><strong>{new Date(r.date).getDate()}</strong><span>{new Date(r.date).toLocaleDateString('fr-FR',{month:'short'})}</span></div><div><b>Rapport journalier</b><small>{r.shop_name} · {r.total_contacts ?? r.total_installations ?? 0} activités</small></div><StatusPill status="Transmis"/></div>)}
      {reports.filter(r=>r.agent_id===user.id).length===0&&<Empty title="Aucun rapport récent" description="Votre historique apparaîtra après la première clôture."/>}
    </section>
  </div>;
}

function captureAttendance(user:User,type:'IN'|'OUT',refresh:()=>void) {
  const input=document.createElement('input');
  input.type='file';
  input.accept='image/*';
  input.setAttribute('capture','environment');
  input.onchange=()=>{
    const file=input.files&&input.files[0];
    if(!file)return;
    const reader=new FileReader();
    reader.onload=()=>{
      navigator.geolocation.getCurrentPosition(pos=>{
        addCheckin({agent_id:user.id,type,timestamp:new Date().toISOString(),lat:pos.coords.latitude,long:pos.coords.longitude,accuracy:pos.coords.accuracy,status:'pending',device:navigator.userAgent,photo:typeof reader.result==='string'?reader.result:undefined});
        refresh();
      },()=>window.dispatchEvent(new CustomEvent('rida-toast',{detail:{message:'Localisation GPS indisponible. Autorisez la localisation puis réessayez.',level:'error'}})),{enableHighAccuracy:true,timeout:12000,maximumAge:0});
    };
    reader.readAsDataURL(file);
  };
  input.click();
}
function AgentActivity({user,leads,onAdd}:{user:User;leads:Lead[];onAdd:()=>void}) {
  const mine=leads.filter(l=>l.agent_id===user.id);
  return <div className="ops-page"><SectionTitle eyebrow="TERRAIN" title="Activité" description="Toutes vos actions, du plus récent au plus ancien." action={<button className="ops-button primary" onClick={onAdd}><Plus size={16}/> Nouvelle activité</button>}/><div className="ops-toolbar"><div className="search-box"><Search size={16}/><input placeholder="Rechercher un client, numéro ou action…"/></div><button className="filter-button"><CalendarDays size={15}/> Aujourd’hui</button></div><section className="ops-panel table-panel"><table className="ops-table"><thead><tr><th>Heure</th><th>Client</th><th>Type</th><th>Numéro</th><th>Statut</th></tr></thead><tbody>{mine.map(l=><tr key={l.id}><td>{new Date(l.timestamp).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</td><td><b>{l.client_name}</b></td><td>{l.action_type}</td><td className="mono">{l.msisdn}</td><td><StatusPill status={l.status==='Validé'?'Validé':'Enregistré'}/></td></tr>)}</tbody></table>{mine.length===0&&<Empty title="Aucune activité" description="Commencez par enregistrer votre premier client."/>}</section></div>;
}

function TeamView({user,users,shops,leads,checkins,onOpenAgent}:{user:User;users:User[];shops:Shop[];leads:Lead[];checkins:Checkin[];onOpenAgent:(u:User)=>void}) {
  const team=users.filter(u=>u.role==='agent' && u.supervisorId===user.id);
  const day=today();
  const rows=team.map(u=>{const ci=checkins.find(c=>c.agent_id===u.id&&c.type==='IN'&&toISO(c.timestamp)===day);const co=checkins.find(c=>c.agent_id===u.id&&c.type==='OUT'&&toISO(c.timestamp)===day);const count=leads.filter(l=>l.agent_id===u.id&&toISO(l.timestamp)===day).length;const shop=shops.find(s=>s.id===u.permanentShopId);return {u,ci,co,count,shop};});
  return <div className="ops-page ops-cockpit">
    <SectionTitle eyebrow="ÉQUIPE · LIVE" title="Control room"/>
    <div className="ops-stat-grid">
      <Stat label="Agents" value={team.length} detail="rattachés à la campagne" icon={Users}/>
      <Stat label="Sur site" value={rows.filter(x=>x.ci&&!x.co).length} detail="présences ouvertes" icon={MapPin} tone="blue"/>
      <Stat label="Activité" value={fmt(rows.reduce((a,x)=>a+x.count,0))} detail="actions aujourd'hui" icon={Activity} tone="amber"/>
    </div>
    <section className="ops-panel command-panel">
      <div className="panel-head"><div><span className="ops-eyebrow">COMMANDES TERRAIN</span><h2>État des agents</h2></div><span className="live-badge"><i/> LIVE</span></div>
      <div className="ops-roster">
        {rows.map(x=><button className="ops-roster-row" key={x.u.id} onClick={()=>onOpenAgent(x.u)}>
          <span className="roster-avatar">{initials(x.u.name)}</span>
          <span className="roster-main"><b>{x.u.name}</b><small>{x.shop?.name||'Site non affecté'} · {x.count} activité{ x.count===1?'':'s'}</small></span>
          <span className="roster-state"><StatusPill status={x.ci?(x.co?'Clôturé':'Sur site'):'Absent'}/></span>
          <span className="roster-arrow">›</span>
        </button>)}
        {rows.length===0&&<Empty title="Aucun agent affecté" description="Les agents de votre campagne apparaîtront ici."/>}
      </div>
    </section>
  </div>;
}

function AdminOverview({users,leads,checkins,reports,role}:{users:User[];leads:Lead[];checkins:Checkin[];reports:DailyReport[];role:UserRole}) {
  const agents=users.filter(u=>u.role==='agent'); const day=today();
  const active=agents.filter(u=>checkins.some(c=>c.agent_id===u.id&&c.type==='IN'&&toISO(c.timestamp)===day&& !checkins.some(o=>o.agent_id===u.id&&o.type==='OUT'&&toISO(o.timestamp)===day))).length;
  const todayLeads=leads.filter(l=>toISO(l.timestamp)===day);
  return <div className="ops-page"><SectionTitle eyebrow={role==='super_admin'?'CONTROL CENTER':'OPERATIONS'} title="Vue d’ensemble" action={<div className="live-badge"><i/> Données actualisées</div>}/><div className="ops-stat-grid four"><Stat label="Agents" value={agents.length} detail="dans la base" icon={Users}/><Stat label="Sur le terrain" value={active} detail="présences ouvertes" icon={MapPin} tone="blue"/><Stat label="Activité" value={fmt(todayLeads.length)} detail="actions aujourd’hui" icon={Activity} tone="amber"/><Stat label="Rapports" value={reports.filter(r=>toISO(r.date)===day).length} detail="reçus aujourd’hui" icon={FileText} tone="purple"/></div><div className="ops-two-col"><section className="ops-panel"><div className="panel-head"><div><span className="ops-eyebrow">CADENCE</span><h2>Activité des 7 derniers jours</h2></div><BarChart3 size={18}/></div><div className="bar-chart">{Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));const ds=toISO(d);const v=leads.filter(l=>toISO(l.timestamp)===ds).length;const max=Math.max(1,...Array.from({length:7},(_,j)=>{const q=new Date();q.setDate(q.getDate()-(6-j));return leads.filter(l=>toISO(l.timestamp)===toISO(q)).length;}));return <div key={ds}><div className="bar-value">{v}</div><span style={{height:`${Math.max(8,v/max*130)}px`}}/><small>{d.toLocaleDateString('fr-FR',{weekday:'short'}).replace('.','')}</small></div>})}</div></section><section className="ops-panel"><div className="panel-head"><div><span className="ops-eyebrow">QUALITÉ DES DONNÉES</span><h2>Couverture opérationnelle</h2></div><Gauge size={18}/></div><div className="quality-list"><div><span>Pointages GPS</span><b>{checkins.filter(c=>toISO(c.timestamp)===day&&c.lat).length}</b></div><div><span>Activités synchronisées</span><b>{todayLeads.filter(l=>l.status==='synced'||l.status==='Validé').length}</b></div><div><span>Rapports reçus</span><b>{reports.filter(r=>toISO(r.date)===day).length}</b></div></div><div className="insight-box"><Zap size={16}/><span>Le suivi privilégie les données utiles à l’action : présence, activité, couverture et clôture.</span></div></section></div><section className="ops-panel"><div className="panel-head"><div><span className="ops-eyebrow">DERNIÈRES ACTIVITÉS</span><h2>Flux terrain</h2></div></div>{todayLeads.slice(0,8).map(l=><div className="feed-row" key={l.id}><span className="feed-dot"/><div><b>{users.find(u=>u.id===l.agent_id)?.name||l.agent_id}</b><span>{l.action_type} · {l.client_name}</span></div><time>{new Date(l.timestamp).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</time></div>)}</section></div>;
}

function PeopleView({users,onAdd,onRefresh}:{users:User[];onAdd:()=>void;onRefresh:()=>void}) {
  const [deleteId,setDeleteId]=useState<string|null>(null);
  const target=users.find(u=>u.id===deleteId);
  const confirmDelete=()=>{ if(!deleteId)return; deleteUserLocal(deleteId); setDeleteId(null); onRefresh(); };
  return <div className="ops-page">
    <SectionTitle eyebrow="ADMINISTRATION" title="Utilisateurs" action={<button className="ops-button primary icon-action" onClick={onAdd} aria-label="Ajouter un utilisateur" title="Ajouter un utilisateur"><Plus size={19}/><UserCog size={17}/></button>}/>
    <div className="ops-toolbar"><div className="search-box"><Search size={16}/><input placeholder="Rechercher un nom ou numéro…"/></div></div>
    <section className="ops-panel table-panel"><table className="ops-table"><thead><tr><th>Utilisateur</th><th>Rôle</th><th>Statut</th><th>Superviseur</th><th>Dernière connexion</th><th></th></tr></thead>
    <tbody>{users.map(u=><tr key={u.id}><td><div className="person-cell"><span>{initials(u.name)}</span><div><b>{u.name}</b><small>{u.phone}</small></div></div></td><td><span className="role-tag">{roleLabel[u.role]}</span></td><td><StatusPill status="Actif"/></td><td>{users.find(s=>s.id===u.supervisorId)?.name||'—'}</td><td>{u.last_login?new Date(u.last_login).toLocaleString('fr-FR',{dateStyle:'short',timeStyle:'short'}):'—'}</td><td><button className="icon-button danger" onClick={()=>setDeleteId(u.id)} aria-label={`Supprimer ${u.name}`} title="Supprimer"><Trash2 size={16}/></button></td></tr>)}</tbody></table></section>
    {target&&<div className="inline-confirm"><span>Supprimer <b>{target.name}</b> ?</span><button className="icon-button danger" onClick={confirmDelete} aria-label="Confirmer la suppression" title="Confirmer"><CheckCircle2 size={16}/></button><button className="icon-button" onClick={()=>setDeleteId(null)} aria-label="Annuler" title="Annuler"><X size={16}/></button></div>}
  </div>;
}

function ArchiveView({leads,reports,users}:{leads:Lead[];reports:DailyReport[];users:User[]}) {
  const [term,setTerm]=useState('');
  const q=term.toLowerCase();
  const rows=reports.filter(r=>!q||r.agent_name.toLowerCase().includes(q)||r.shop_name.toLowerCase().includes(q)||r.date.includes(q));
  return <div className="ops-page"><SectionTitle eyebrow="HISTORIQUE" title="Archives" description="Retrouvez les données clôturées sans perturber le terrain."/><div className="ops-toolbar"><div className="search-box"><Search size={16}/><input value={term} onChange={e=>setTerm(e.target.value)} placeholder="Agent, site, date…"/></div><button className="filter-button"><Download size={15}/> Exporter</button></div><section className="ops-panel"><div className="panel-head"><div><span className="ops-eyebrow">RAPPORTS JOURNALIERS</span><h2>{rows.length} enregistrement{rows.length!==1?'s':''}</h2></div></div>{rows.slice(0,50).map(r=><div className="report-row" key={r.id}><div className="report-date"><strong>{new Date(r.date).getDate()}</strong><span>{new Date(r.date).toLocaleDateString('fr-FR',{month:'short'})}</span></div><div><b>{r.agent_name}</b><small>{r.shop_name} · {r.total_contacts ?? r.total_installations ?? 0} activités</small></div><div className="archive-metrics"><b>{r.total_installations??0}</b><span>install.</span></div><StatusPill status="Clôturé"/></div>)}{rows.length===0&&<Empty title="Aucun résultat" description="Essayez une autre recherche."/>}</section><div className="sr-only">{leads.length}{users.length}</div></div>;
}

export const RidaOpsApp:React.FC<Props>=({user,users,shops,online,syncPendingCount,onRefresh,onLogout,onOpenSystemConfig,onSimulateRole,simulationActive,onExitSimulation})=>{
  const [page,setPage]=useState<Page>('overview');
  const [leadOpen,setLeadOpen]=useState(false); const [reportOpen,setReportOpen]=useState(false); const [userOpen,setUserOpen]=useState(false); const [shopOpen,setShopOpen]=useState(false); const [pdfUrl,setPdfUrl]=useState<string|null>(null);
  const leads=getLeads(); const checkins=getCheckins(); const reports=getReports();
  const isAgent=user.role==='agent'; const isSupervisor=user.role==='supervisor'||user.role==='sub_admin'; const isAdmin=user.role==='admin'||user.role==='super_admin';
  const nav=useMemo(()=>isAgent?[['overview','Aujourd’hui',LayoutDashboard],['activity','Activité',Activity],['reports','Rapports',FileText],['account','Compte',UserCog]]:isSupervisor?[['overview','Vue d’ensemble',LayoutDashboard],['field','Terrain',MapPin],['activity','Activité',Activity],['reports','Rapports',FileText],['archive','Archives',Archive],['team','Équipe',Users]]:[['overview','Vue d’ensemble',LayoutDashboard],['campaigns','Campagnes',Target],['people','Utilisateurs',Users],['assignments','Affectations',UserCog],['field','Terrain',MapPin],['reports','Rapports',FileText],['archive','Archives',Archive],['settings','Système',Settings2]] as Array<[Page,string,React.ComponentType<any>]>,[isAgent,isSupervisor]);
  const currentLabel=nav.find(x=>x[0]===page)?.[1]||'Vue d’ensemble';
  const openAgent=(u:User)=>{setPage('activity');};
  const refresh=()=>onRefresh(true);
  return <div className="rida-shell">
    <aside className="ops-sidebar">
      <div className="ops-brand"><div className="ops-logo">R</div><div><strong>RIDA<span>OPS</span></strong><small>Field operations</small></div></div>
      <div className="campaign-switch"><span>Campagne active</span><b>RIDA · Lubumbashi</b><ChevronDown size={14}/></div>
      <nav>{nav.map(([key,label,Icon])=><button key={key} className={page===key?'active':''} onClick={()=>setPage(key)}><Icon size={18}/><span>{label}</span>{key==='field'&&<i className="nav-live"/>}</button>)}</nav>
      <div className="sidebar-bottom">
        <div className="connection"><i className={online?'online':''}/><span>{online?'Connecté':'Hors ligne'}</span>{syncPendingCount>0&&<b>{syncPendingCount}</b>}</div>
        <button onClick={onLogout}><LogOut size={16}/> Se déconnecter</button>
      </div>
    </aside>
    <div className="ops-main">
      <header className="ops-topbar"><div className="mobile-brand"><div className="ops-logo">R</div><strong>RIDA<span>OPS</span></strong></div><div className="breadcrumb"><span>RIDA · Lubumbashi</span><b>/</b><strong>{currentLabel}</strong></div><div className="top-actions">{simulationActive&&<button className="control-return" onClick={onExitSimulation} title="Revenir au compte superadmin"><ShieldCheck size={15}/> Superadmin</button>}<button className="icon-button" onClick={refresh} title="Actualiser"><RefreshCw size={17}/></button><button className="icon-button" title="Notifications"><Bell size={17}/></button><div className="user-chip"><span>{initials(user.name)}</span><div><b>{user.name}</b><small>{roleLabel[user.role]}</small></div></div></div></header>
      {!online&&<div className="offline-banner"><Globe2 size={15}/> Connexion indisponible · les actions compatibles restent disponibles localement.</div>}
      {(simulationActive||user.role==='super_admin')&&<div className="sim-console"><ShieldCheck size={15}/><b>MODE CONTRÔLE</b><span>{simulationActive?'Simulation active · vos privilèges superadmin sont conservés':'Vous utilisez les privilèges superadmin'}</span>{simulationActive&&<button onClick={onExitSimulation}>Quitter la simulation</button>}<button onClick={()=>onSimulateRole?.('agent')}>Tester l’espace agent</button><button onClick={()=>onSimulateRole?.('supervisor')}>Tester superviseur</button><button onClick={()=>onSimulateRole?.('admin')}>Tester admin</button></div>}
      <main>
        {isAgent&&page==='overview'&&<AgentHome user={user} leads={leads} checkins={checkins} reports={reports} onAdd={()=>setLeadOpen(true)} onReport={()=>setReportOpen(true)} onRefresh={refresh}/>}
        {isAgent&&page==='activity'&&<AgentActivity user={user} leads={leads} onAdd={()=>setLeadOpen(true)}/>}
        {isAgent&&page==='reports'&&<ArchiveView leads={leads.filter(x=>x.agent_id===user.id)} reports={reports.filter(x=>x.agent_id===user.id)} users={users}/>}
        {isAgent&&page==='account'&&<div className="ops-page"><SectionTitle eyebrow="MON COMPTE" title={user.name} description={`${roleLabel[user.role]} · ${user.phone}`}/><section className="ops-panel profile-panel"><div className="profile-avatar">{initials(user.name)}</div><div><h2>{user.name}</h2><p>{user.phone}</p><StatusPill status="Compte actif"/></div></section></div>}
        {isSupervisor&&page==='overview'&&<AdminOverview users={users.filter(u=>u.supervisorId===user.id||u.id===user.id)} leads={leads.filter(l=>users.some(u=>u.id===l.agent_id&&u.supervisorId===user.id))} checkins={checkins} reports={reports.filter(r=>users.some(u=>u.id===r.agent_id&&u.supervisorId===user.id))} role={user.role}/>}
        {isSupervisor&&page==='field'&&<TeamView user={user} users={users} shops={shops} leads={leads} checkins={checkins} onOpenAgent={openAgent}/>}
        {isSupervisor&&page==='activity'&&<AgentActivity user={user} leads={leads.filter(l=>users.find(u=>u.id===l.agent_id)?.supervisorId===user.id)} onAdd={()=>{}}/>}
        {isSupervisor&&page==='reports'&&<ArchiveView leads={leads} reports={reports.filter(r=>users.find(u=>u.id===r.agent_id)?.supervisorId===user.id)} users={users}/>}
        {isSupervisor&&page==='archive'&&<ArchiveView leads={leads} reports={reports.filter(r=>users.find(u=>u.id===r.agent_id)?.supervisorId===user.id)} users={users}/>}
        {isSupervisor&&page==='team'&&<TeamView user={user} users={users} shops={shops} leads={leads} checkins={checkins} onOpenAgent={openAgent}/>}
        {isAdmin&&page==='overview'&&<AdminOverview users={users} leads={leads} checkins={checkins} reports={reports} role={user.role}/>}
        {isAdmin&&page==='people'&&<PeopleView users={users} onAdd={()=>setUserOpen(true)} onRefresh={()=>onRefresh(true)}/>}
        {isAdmin&&page==='campaigns'&&<div className="ops-page"><SectionTitle eyebrow="ORGANISATION" title="Campagnes" description="Les espaces de travail opérationnels."/><section className="ops-panel campaign-card"><div className="campaign-card-mark">R</div><div><span className="ops-eyebrow">CAMPAGNE ACTIVE</span><h2>RIDA · Lubumbashi</h2><p>Installation et acquisition · campagne terrain</p></div><StatusPill status="Active"/><div className="campaign-details"><span><b>Ville</b>Lubumbashi</span><span><b>Statut</b>Active</span><span><b>Type</b>Acquisition</span><span><b>Données</b>Google Sheets</span></div></section></div>}
        {isAdmin&&page==='assignments'&&<PeopleView users={users.filter(u=>u.role==='agent'||u.role==='supervisor')} onAdd={()=>setUserOpen(true)}/>}
        {isAdmin&&page==='field'&&<TeamView user={users.find(u=>u.role==='supervisor')||user} users={users} shops={shops} leads={leads} checkins={checkins} onOpenAgent={openAgent}/>}
        {isAdmin&&page==='reports'&&<ArchiveView leads={leads} reports={reports} users={users}/>}
        {isAdmin&&page==='archive'&&<ArchiveView leads={leads} reports={reports} users={users}/>}
        {isAdmin&&page==='settings'&&<div className="ops-page"><SectionTitle eyebrow="SYSTÈME" title="Configuration" description="Connexion aux données et paramètres de fonctionnement."/><section className="ops-panel settings-grid"><button onClick={onOpenSystemConfig}><Settings2 size={20}/><b>Google Sheets & Apps Script</b><span>Connexion, synchronisation et stockage</span></button><button onClick={refresh}><RefreshCw size={20}/><b>Synchroniser maintenant</b><span>Recharger les données depuis la source</span></button><button onClick={()=>setShopOpen(true)}><MapPin size={20}/><b>Gérer les sites</b><span>Ajouter ou modifier les lieux d’activité</span></button></section></div>}
      </main>
    </div>
    <div className="mobile-nav">{nav.slice(0,5).map(([key,label,Icon])=><button key={key} className={page===key?'active':''} onClick={()=>setPage(key)}><Icon size={18}/><span>{label}</span></button>)}</div>
    {leadOpen&&<LeadModal isOpen currentUser={user} activeShopId={user.permanentShopId||shops[0]?.id||''} onClose={()=>setLeadOpen(false)} onSuccess={()=>{setLeadOpen(false);refresh();}}/>}
    {reportOpen&&<ReportModal isOpen currentUser={user} todayLeads={leads.filter(l=>l.agent_id===user.id&&toISO(l.timestamp)===today())} activeShopId={user.permanentShopId||shops[0]?.id||''} onClose={()=>setReportOpen(false)} onReportGenerated={url=>{setReportOpen(false);setPdfUrl(url);refresh();}}/>}
    {userOpen&&<UserModal isOpen shops={shops} onClose={()=>setUserOpen(false)} onSuccess={refresh}/>}
    {shopOpen&&<ShopModal isOpen onClose={()=>setShopOpen(false)} onSuccess={refresh}/>}
    {pdfUrl&&<PdfViewerModal isOpen pdfUrl={pdfUrl} onClose={()=>setPdfUrl(null)}/>}
  </div>;
};

import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  MapPin, 
  Calendar, 
  FileText, 
  Eye, 
  CheckCircle2, 
  Clock, 
  Smartphone, 
  ChevronRight, 
  BarChart3, 
  Filter,
  TrendingUp,
  Download,
  AlertCircle
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { User, Shop } from '../types';
import { getReports, getLeads, getUsers, getCheckins } from '../utils/storage';

interface SupervisorViewProps {
  currentUser: User;
  activeTab?: string;
  shops: Shop[];
  onOpenPdfModal: (url: string) => void;
  onOpenAgentProfile: (agent: any) => void;
  onOpenTodayClientsModal: (agent: any) => void;
  onOpenLocationModal: (agent: any) => void;
  onRefreshData?: () => void;
  globalScope?: boolean;
}

export const SupervisorView: React.FC<SupervisorViewProps> = ({
  currentUser,
  activeTab = 'home',
  shops,
  onOpenPdfModal,
  onOpenAgentProfile,
  onOpenTodayClientsModal,
  onOpenLocationModal,
  onRefreshData,
  globalScope = false,
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShopFilter, setSelectedShopFilter] = useState('ALL');
  const [activeSubTab, setActiveSubTab] = useState<'agents' | 'stats' | 'reports'>('agents');

  // Retrieve team agents
  const allUsers = getUsers();
  const allReports = getReports();
  const allLeads = getLeads();
  const allCheckins = getCheckins();

  const teamAgents = useMemo(() => {
    return allUsers.filter((u) => {
      if (u.role !== 'agent') return false;
      if (globalScope) return true;
      return u.supervisorId === currentUser.id || !u.supervisorId;
    });
  }, [allUsers, currentUser.id, globalScope]);

  // Aggregate agent statuses for selected date
  const agentCards = useMemo(() => {
    return teamAgents.map((agent) => {
      const dayCheckin = allCheckins.find(
        (c) => c.agent_id === agent.id && c.type === 'IN' && (c.timestamp?.startsWith(selectedDate))
      );
      const dayReport = allReports.find(
        (r) => r.agent_id === agent.id && r.date === selectedDate
      );
      const dayLeads = allLeads.filter(
        (l) => l.agent_id === agent.id && (l.timestamp?.startsWith(selectedDate))
      );

      const androidCount = dayLeads.filter((l) => l.action_type === 'Android').length;
      const iosCount = dayLeads.filter((l) => l.action_type === 'iOS').length;
      const totalInstall = dayReport?.total_installations ?? (dayLeads.length || (dayReport ? (dayReport.priv + dayReport.roam + dayReport.bund) : 0));

      let status = 'Absent';
      if (dayReport) {
        status = 'Clôturé';
      } else if (dayCheckin) {
        status = 'Présent';
      }

      const shop = shops.find((s) => s.id === agent.permanentShopId)?.name || 'Hub Lubumbashi';

      const arrivalTime = dayCheckin?.timestamp
        ? new Date(dayCheckin.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        : undefined;
      const mapsIn = dayCheckin?.lat && dayCheckin?.long
        ? `https://maps.google.com/?q=${dayCheckin.lat},${dayCheckin.long}`
        : undefined;

      return {
        id: agent.id,
        name: agent.name,
        phone: agent.phone,
        shop,
        status,
        arrivalTime,
        departureTime: dayReport?.departure_time,
        totalInstall,
        androidCount: dayReport?.android_count ?? androidCount,
        iosCount: dayReport?.ios_count ?? iosCount,
        reportObj: dayReport,
        lat: dayCheckin?.lat,
        long: dayCheckin?.long,
        mapsIn,
        mapsOut: dayReport?.maps_out
      };
    });
  }, [teamAgents, allCheckins, allReports, allLeads, selectedDate, shops]);

  // Filtered agents
  const filteredAgents = useMemo(() => {
    return agentCards.filter((a) => {
      const matchSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.shop.toLowerCase().includes(searchQuery.toLowerCase());
      const matchShop = selectedShopFilter === 'ALL' || a.shop === selectedShopFilter;
      return matchSearch && matchShop;
    });
  }, [agentCards, searchQuery, selectedShopFilter]);

  // Global KPIs
  const totalTeamInstallations = useMemo(() => {
    return agentCards.reduce((acc, a) => acc + a.totalInstall, 0);
  }, [agentCards]);

  const activeAgentsCount = useMemo(() => {
    return agentCards.filter((a) => a.status === 'Présent' || a.status === 'Clôturé').length;
  }, [agentCards]);

  const closedReportsCount = useMemo(() => {
    return agentCards.filter((a) => a.status === 'Clôturé').length;
  }, [agentCards]);

  // Chart Data
  const chartData = useMemo(() => {
    return filteredAgents.slice(0, 8).map((a) => ({
      name: a.name.split(' ')[0],
      Installations: a.totalInstall,
      Android: a.androidCount,
      iOS: a.iosCount,
    }));
  }, [filteredAgents]);

  const pieData = useMemo(() => {
    const androidTotal = agentCards.reduce((acc, a) => acc + a.androidCount, 0);
    const iosTotal = agentCards.reduce((acc, a) => acc + a.iosCount, 0);
    return [
      { name: 'Android', value: androidTotal || 1, color: '#00D084' },
      { name: 'iOS', value: iosTotal || 1, color: '#06B6D4' },
    ];
  }, [agentCards]);

  const handleGeneratePdfSummary = () => {
    const supervisorPdfData = {
      supName: currentUser.name,
      date: selectedDate,
      team: agentCards.map((a) => ({
        name: a.name,
        shop: a.shop,
        status: a.status,
        leads: a.totalInstall,
        priv: a.androidCount,
        roam: a.iosCount,
        bund: 0,
        mapsIn: a.mapsIn || '',
        mapsOut: a.mapsOut || '',
      })),
    };
    onOpenPdfModal(`preview-supervisor:${encodeURIComponent(JSON.stringify(supervisorPdfData))}`);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/25 bg-gradient-to-br from-[#041a12] via-[#08281d] to-[#03140e] p-6 shadow-[0_10px_35px_rgba(0,208,132,0.12)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[#00D084] text-[10px] font-black uppercase tracking-wider">
                Supervision RIDA Lubumbashi
              </span>
              <span className="text-gray-400 text-xs font-semibold">• {selectedDate}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              Tableau de Bord Équipe
            </h1>
            <p className="text-xs text-emerald-300/80 font-medium mt-1">
              Superviseur : <span className="text-white font-bold">{currentUser.name}</span> • {teamAgents.length} Agents RIDA rattachés
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-black/60 border border-emerald-500/30 text-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#00D084]"
            />
            <button
              onClick={handleGeneratePdfSummary}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00D084] to-[#059669] hover:from-[#10B981] hover:to-[#047857] text-[#032313] font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_4px_15px_rgba(0,208,132,0.25)] transition-all active:scale-95 shrink-0"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Rapport Équipe PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Total Installations</p>
            <p className="text-2xl sm:text-3xl font-black text-[#00D084] mt-1">{totalTeamInstallations}</p>
            <p className="text-[9px] text-gray-500 mt-0.5">Aujourd'hui</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Agents Actifs</p>
            <p className="text-2xl sm:text-3xl font-black text-cyan-400 mt-1">
              {activeAgentsCount} / {teamAgents.length}
            </p>
            <p className="text-[9px] text-gray-500 mt-0.5">Pointage effectué</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Rapports Clôturés</p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
              {closedReportsCount} / {teamAgents.length}
            </p>
            <p className="text-[9px] text-gray-500 mt-0.5">Clôtures journalières</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Taux Présence</p>
            <p className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">
              {teamAgents.length > 0 ? Math.round((activeAgentsCount / teamAgents.length) * 100) : 0}%
            </p>
            <p className="text-[9px] text-gray-500 mt-0.5">Couverture Hubs</p>
          </div>
        </div>
      </div>

      {/* Modern SubTabs Navigation */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveSubTab('agents')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeSubTab === 'agents'
                ? 'bg-[#00D084] text-[#032313] shadow-[0_4px_15px_rgba(0,208,132,0.3)]'
                : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Agents Terrain ({filteredAgents.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('stats')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeSubTab === 'stats'
                ? 'bg-[#00D084] text-[#032313] shadow-[0_4px_15px_rgba(0,208,132,0.3)]'
                : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Graphiques RIDA</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un agent..."
              className="bg-white/5 border border-white/10 text-white rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-[#00D084] w-36 sm:w-48"
            />
          </div>

          <select
            value={selectedShopFilter}
            onChange={(e) => setSelectedShopFilter(e.target.value)}
            className="bg-white/5 border border-white/10 text-white rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#00D084] cursor-pointer"
          >
            <option value="ALL" className="bg-zinc-900">Tous les Hubs</option>
            {shops.map((s) => (
              <option key={s.id} value={s.name} className="bg-zinc-900">
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SUBTAB 1: AGENTS LIST */}
      {activeSubTab === 'agents' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredAgents.map((agent) => {
            const isClosed = agent.status === 'Clôturé';
            const isPresent = agent.status === 'Présent';

            return (
              <div
                key={agent.id}
                className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4 hover:border-emerald-500/40 hover:bg-zinc-900/80 transition-all shadow-md group"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[#00D084] font-black text-sm flex items-center justify-center">
                      {agent.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white group-hover:text-[#00D084] transition truncate">
                        {agent.name}
                      </h3>
                      <p className="text-[10px] text-gray-400 font-semibold">{agent.shop}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                      isClosed
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-[#00D084]'
                        : isPresent
                        ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                        : 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                    }`}
                  >
                    {agent.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-xl bg-white/[0.02] border border-white/5 text-center mb-3">
                  <div>
                    <span className="text-[8px] uppercase tracking-wider text-gray-500 block font-bold">Total Inst.</span>
                    <span className="text-sm font-black text-[#00D084]">{agent.totalInstall}</span>
                  </div>
                  <div>
                    <span className="text-[8px] uppercase tracking-wider text-gray-500 block font-bold">Android</span>
                    <span className="text-sm font-black text-emerald-400">{agent.androidCount}</span>
                  </div>
                  <div>
                    <span className="text-[8px] uppercase tracking-wider text-gray-500 block font-bold">iOS</span>
                    <span className="text-sm font-black text-cyan-400">{agent.iosCount}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onOpenLocationModal(agent)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-emerald-500/20 hover:text-[#00D084] text-gray-400 transition"
                      title="Vérifier GPS et pointage"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onOpenTodayClientsModal(agent)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-cyan-500/20 hover:text-cyan-400 text-gray-400 transition"
                      title="Voir les installations du jour"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                    </button>
                    {agent.reportObj && (
                      <button
                        onClick={() => onOpenPdfModal(`report-id:${agent.reportObj.id}`)}
                        className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-[#00D084] transition"
                        title="Ouvrir le rapport PDF de l'agent"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => onOpenAgentProfile(agent)}
                    className="flex items-center gap-1 text-[10px] font-bold text-gray-400 hover:text-white transition"
                  >
                    <span>Profil</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SUBTAB 2: CHARTS & STATS */}
      {activeSubTab === 'stats' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bar Chart by Agent */}
            <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-zinc-950/70 p-5 shadow-xl backdrop-blur-xl">
              <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <span>Performances Installations par Agent RIDA</span>
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="supEmeraldGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity={1} />
                        <stop offset="100%" stopColor="#047857" stopOpacity={0.8} />
                      </linearGradient>
                      <linearGradient id="supCyanGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06B6D4" stopOpacity={1} />
                        <stop offset="100%" stopColor="#0284C7" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#090d16',
                        borderColor: 'rgba(16, 185, 129, 0.4)',
                        borderRadius: '16px',
                        boxShadow: '0 12px 35px rgba(0,0,0,0.6)',
                        color: '#fff',
                        fontSize: '11px',
                      }}
                    />
                    <Bar dataKey="Android" fill="url(#supEmeraldGrad)" radius={[7, 7, 0, 0]} />
                    <Bar dataKey="iOS" fill="url(#supCyanGrad)" radius={[7, 7, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart Android vs iOS */}
            <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5 shadow-xl backdrop-blur-xl flex flex-col items-center justify-center">
              <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2 self-start flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <span>Répartition OS</span>
              </h3>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={78}
                      paddingAngle={5}
                      cornerRadius={8}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: `drop-shadow(0 0 8px ${entry.color}88)` }} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#090d16',
                        borderColor: 'rgba(6, 182, 212, 0.4)',
                        borderRadius: '16px',
                        boxShadow: '0 12px 35px rgba(0,0,0,0.6)',
                        color: '#fff',
                        fontSize: '11px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold mt-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  <span className="text-gray-300">Android</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#06B6D4] shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                  <span className="text-gray-300">iOS (Apple)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

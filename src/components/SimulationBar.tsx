import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { ThemeMode } from './Header';
import { 
  Sliders, 
  RotateCcw, 
  UserCheck, 
  Users, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  Eye,
  Radio,
  User as UserIcon,
  Crown,
  Briefcase,
  Smartphone,
  Store
} from 'lucide-react';

interface SimulationBarProps {
  masterUser: User;
  effectiveUser: User;
  users: User[];
  simulatedRole: UserRole | null;
  theme?: ThemeMode;
  onSimulateRole: (role: UserRole) => void;
  onSimulateUserChange: (userId: string) => void;
  onResetSimulation: () => void;
}

export const SimulationBar: React.FC<SimulationBarProps> = ({
  masterUser,
  effectiveUser,
  users,
  simulatedRole,
  onSimulateRole,
  onSimulateUserChange,
  onResetSimulation,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');

  const isSimulating = Boolean(simulatedRole || (masterUser && effectiveUser.id !== masterUser.id));

  const rolesList: Array<{ role: UserRole; label: string; badge: string; icon: React.ReactNode; color: string; activeColor: string }> = [
    { 
      role: 'agent', 
      label: 'Agent Terrain', 
      badge: 'RIDA',
      icon: <Smartphone className="w-3.5 h-3.5" />, 
      color: 'border-emerald-500/30 text-emerald-400 bg-emerald-950/30 hover:bg-emerald-500/20',
      activeColor: 'bg-emerald-500 text-zinc-950 font-black border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
    },
    { 
      role: 'supervisor', 
      label: 'Superviseur', 
      badge: 'L\'SHI',
      icon: <Users className="w-3.5 h-3.5" />, 
      color: 'border-cyan-500/30 text-cyan-400 bg-cyan-950/30 hover:bg-cyan-500/20',
      activeColor: 'bg-cyan-500 text-zinc-950 font-black border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
    },
    { 
      role: 'admin', 
      label: 'Admin Campagne', 
      badge: 'OPS',
      icon: <ShieldCheck className="w-3.5 h-3.5" />, 
      color: 'border-amber-500/30 text-amber-400 bg-amber-950/30 hover:bg-amber-500/20',
      activeColor: 'bg-amber-500 text-zinc-950 font-black border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
    },
    { 
      role: 'super_admin', 
      label: 'Super Admin', 
      badge: 'DIRECTEUR',
      icon: <Crown className="w-3.5 h-3.5" />, 
      color: 'border-fuchsia-500/30 text-fuchsia-400 bg-fuchsia-950/30 hover:bg-fuchsia-500/20',
      activeColor: 'bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white font-black border-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,0.5)]'
    },
  ];

  const filteredUsers = searchFilter 
    ? users.filter(u => u.name.toLowerCase().includes(searchFilter.toLowerCase()) || u.role.toLowerCase().includes(searchFilter.toLowerCase()))
    : users;

  return (
    <aside 
      id="simulation-bar"
      aria-label="Barre de simulation des rôles et profils"
      className="w-full z-50 transition-all duration-300 border-b border-emerald-500/30 bg-zinc-950/95 backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.8)]"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-3">
        {/* Title & Status Indicator */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center">
            <span className="absolute -inset-1 rounded-xl bg-emerald-500/40 animate-pulse blur-sm" />
            <div className="relative p-1.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-400/50 text-emerald-400">
              <Sliders className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex flex-col">
              <span className="text-[11px] font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                <span>Console de Simulation</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold uppercase tracking-widest">
                  Live
                </span>
              </span>
              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                {isSimulating ? (
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <Radio className="w-3 h-3 animate-ping text-amber-400" />
                    Simulé en tant que : {effectiveUser.name} ({effectiveUser.role.toUpperCase()})
                  </span>
                ) : (
                  <span className="text-emerald-400/80 font-medium">
                    Profil actif : {masterUser?.name || effectiveUser.name}
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2.5 ml-auto flex-wrap sm:flex-nowrap">
          {/* Quick Role Switch Buttons */}
          <div className={`flex items-center space-x-1.5 transition-all ${isExpanded ? 'opacity-100 flex' : 'hidden sm:flex'}`}>
            {rolesList.map(({ role, label, badge, icon, color, activeColor }) => {
              const isActive = effectiveUser.role === role;
              return (
                <button
                  key={role}
                  onClick={() => onSimulateRole(role)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] uppercase tracking-wider flex items-center space-x-1.5 border transition-all duration-200 cursor-pointer ${
                    isActive
                      ? activeColor
                      : `${color} hover:text-white`
                  }`}
                  title={`Simuler le profil ${label}`}
                >
                  {icon}
                  <span className="hidden md:inline font-bold">{label}</span>
                  <span className="md:hidden font-bold">{badge}</span>
                </button>
              );
            })}
          </div>

          {/* User selector dropdown */}
          <div className={`relative ${isExpanded ? 'block' : 'hidden md:block'}`}>
            <select
              value={effectiveUser.id}
              onChange={(e) => onSimulateUserChange(e.target.value)}
              className="bg-zinc-900 border border-white/20 text-white rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-emerald-400 transition-all cursor-pointer max-w-[170px] sm:max-w-[210px] truncate shadow-inner"
              title="Choisir un profil d'utilisateur spécifique"
            >
              <optgroup label="Agents de Terrain (RIDA & Merchant)">
                {users.filter(u => u.role === 'agent').map((u) => (
                  <option key={u.id} value={u.id} className="bg-zinc-900 text-white">
                    {u.name} (Agent)
                  </option>
                ))}
              </optgroup>
              <optgroup label="Superviseurs">
                {users.filter(u => u.role === 'supervisor').map((u) => (
                  <option key={u.id} value={u.id} className="bg-zinc-900 text-white">
                    {u.name} (Superviseur)
                  </option>
                ))}
              </optgroup>
              <optgroup label="Administrateurs & Direction">
                {users.filter(u => u.role === 'admin' || u.role === 'super_admin').map((u) => (
                  <option key={u.id} value={u.id} className="bg-zinc-900 text-white">
                    {u.name} ({u.role})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Reset Simulation button */}
          {isSimulating && (
            <button
              onClick={onResetSimulation}
              className="px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-all active:scale-95 shadow-[0_0_12px_rgba(244,63,94,0.3)] cursor-pointer"
              title="Réinitialiser et quitter la simulation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Quitter</span>
            </button>
          )}

          {/* Expand / Collapse toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl text-gray-400 hover:text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
            title={isExpanded ? 'Réduire la barre de simulation' : 'Agrandir la barre de simulation'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default SimulationBar;

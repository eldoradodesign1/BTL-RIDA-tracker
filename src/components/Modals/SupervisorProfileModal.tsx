import React from 'react';
import { X, UserCheck, Phone, Mail, Award, Users, ChevronRight, FileText } from 'lucide-react';
import { User } from '../../types';

export interface SupervisorHostessSummary {
  id: string;
  name: string;
  shop: string;
  totalPriv: number;
  totalRoam: number;
  totalBund: number;
}

export interface SupervisorProfileModalProps {
  isOpen: boolean;
  supervisor: User | null;
  hostesses: SupervisorHostessSummary[];
  onClose: () => void;
  onCompile?: () => void;
  onOpenHostessDetails?: (hostessId: string) => void;
}

export const SupervisorProfileModal: React.FC<SupervisorProfileModalProps> = ({
  isOpen,
  supervisor,
  hostesses,
  onClose,
  onCompile,
  onOpenHostessDetails,
}) => {
  if (!isOpen || !supervisor) return null;

  const totalPriv = hostesses.reduce((acc, h) => acc + h.totalPriv, 0);
  const totalRoam = hostesses.reduce((acc, h) => acc + h.totalRoam, 0);
  const totalBund = hostesses.reduce((acc, h) => acc + h.totalBund, 0);

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/85 p-3 backdrop-blur-md sm:p-6"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="glass-card max-h-[92vh] w-full max-w-xl overflow-y-auto border border-red-500/25 p-5 shadow-2xl rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-400 flex items-center justify-center font-black text-lg">
              {supervisor.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-red-400">Fiche Superviseur</span>
              <h2 className="text-lg font-black text-white">{supervisor.name}</h2>
              <p className="text-xs text-gray-400">{supervisor.phone || 'Pas de numéro'} • {supervisor.email || 'Email non renseigné'}</p>
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

        {/* Global KPIs for this team */}
        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3">
            <span className="text-[9px] font-black uppercase tracking-wider text-red-300 block">Privilèges</span>
            <span className="text-xl font-black text-white mt-1 block">{totalPriv}</span>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3">
            <span className="text-[9px] font-black uppercase tracking-wider text-amber-300 block">Roaming</span>
            <span className="text-xl font-black text-white mt-1 block">{totalRoam}</span>
          </div>
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-3">
            <span className="text-[9px] font-black uppercase tracking-wider text-blue-300 block">Bundles</span>
            <span className="text-xl font-black text-white mt-1 block">{totalBund}</span>
          </div>
        </div>

        {/* Action Button: Compile */}
        {onCompile && (
          <button
            type="button"
            onClick={onCompile}
            className="w-full mt-4 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black text-xs uppercase tracking-wider transition shadow-[0_4px_15px_rgba(239,68,68,0.3)] flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" />
            <span>Compiler le rapport de cette équipe</span>
          </button>
        )}

        {/* Hostesses / Agents List */}
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-red-400" />
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-200">
                Hôtesses supervisées ({hostesses.length})
              </h3>
            </div>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {hostesses.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">Aucune hôtesse affectée à ce superviseur.</p>
            ) : (
              hostesses.map((h) => (
                <div
                  key={h.id}
                  onClick={() => onOpenHostessDetails?.(h.id)}
                  className="rounded-2xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.07] p-3 flex items-center justify-between transition cursor-pointer"
                >
                  <div>
                    <h4 className="text-xs font-bold text-white">{h.name}</h4>
                    <p className="text-[10px] text-gray-400">{h.shop || 'Hub principal'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-[10px] font-black">
                      <span className="text-red-300">{h.totalPriv} P</span>
                      <span className="text-amber-300">{h.totalRoam} R</span>
                      <span className="text-blue-300">{h.totalBund} B</span>
                    </div>
                    {onOpenHostessDetails && <ChevronRight className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

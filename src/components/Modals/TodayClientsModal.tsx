import React from 'react';
import { X, Users, Smartphone, Shield } from 'lucide-react';
import { DetailPdfExportButton } from './DetailPdfExportButton';
import { Lead } from '../../types';

interface TodayClientsModalProps {
  isOpen: boolean;
  agent: any;
  dayLeads: Lead[];
  onClose: () => void;
}

export const TodayClientsModal: React.FC<TodayClientsModalProps> = ({
  isOpen,
  agent,
  dayLeads,
  onClose,
}) => {
  if (!isOpen || !agent) return null;

  const exportDoc = {
    title: 'Installations RIDA du jour',
    subtitle: `${agent.name} · ${agent.shop || 'Lubumbashi'}`,
    filename: `installations-${agent.name}`,
    sections: [
      {
        title: 'Installations enregistrées',
        rows: dayLeads.map((s, idx) => ({
          label: `#${idx + 1} · ${s.client_name || 'Prospect'}`,
          value: `${s.msisdn || 'Numéro non renseigné'} · ${s.action_type || 'Installation'} · ${s.phone_brand || ''}`
        }))
      }
    ]
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-pop"
      onClick={onClose}
    >
      <div
        className="modal-sheet relative w-full max-w-lg bg-zinc-950 border border-emerald-500/20 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-handle mb-4 sm:hidden" />
        <div className="absolute top-5 right-5 flex items-center gap-2">
          <DetailPdfExportButton document={exportDoc} />
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-[#00D084] flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase text-white tracking-wide">Installations RIDA du jour</h2>
            <p className="text-[10px] font-bold uppercase text-gray-400">
              {agent.name} • <span className="text-[#00D084]">{agent.shop || 'Lubumbashi'}</span>
            </p>
          </div>
        </div>

        <div className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-1">
          {dayLeads.length === 0 ? (
            <div className="text-center text-xs text-gray-400 italic py-8 border border-white/5 rounded-2xl bg-white/[0.02]">
              Aucune installation RIDA enregistrée aujourd'hui pour cet agent.
            </div>
          ) : (
            dayLeads.map((item, i) => {
              const isIos = item.action_type?.toLowerCase().includes('ios') || item.action_type?.toLowerCase().includes('apple');
              return (
                <div
                  key={item.id || i}
                  className="p-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-2xl flex items-center justify-between gap-3 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isIos ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-emerald-500/20 text-[#00D084] border border-emerald-500/30'}`}>
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-black text-white truncate">{item.client_name || 'Prospect RIDA'}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${isIos ? 'bg-sky-500/20 text-sky-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                          {item.action_type}
                        </span>
                        {item.phone_brand && (
                          <span className="text-[9px] text-gray-400 font-semibold">{item.phone_brand}</span>
                        )}
                        {item.client_type && (
                          <span className="text-[9px] text-amber-400 font-bold uppercase">• {item.client_type}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-emerald-400 shrink-0 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                    {item.msisdn}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

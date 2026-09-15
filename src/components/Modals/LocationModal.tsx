import React from 'react';
import { X, MapPin } from 'lucide-react';
import { DetailPdfExportButton } from './DetailPdfExportButton';
import { formatLocationStatus, getMapsEmbedUrl } from '../../utils/location';

interface LocationModalProps {
  isOpen: boolean;
  agent: any;
  onClose: () => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({ isOpen, agent, onClose }) => {
  if (!isOpen || !agent) return null;

  const exportDoc = {
    title: 'Localisation agent RIDA',
    subtitle: agent.name,
    filename: `localisation-${agent.name}`,
    sections: [
      {
        title: 'Pointage terrain',
        rows: [
          { label: 'Agent', value: agent.name },
          { label: 'Hub / Secteur', value: agent.shop },
          { label: 'Statut', value: agent.status },
          { label: 'Arrivée', value: agent.arrivalTime || agent.reportObj?.arrival_time || 'Non renseignée' },
          { label: 'Clôture', value: agent.departureTime || agent.reportObj?.departure_time || 'Non renseignée' },
          {
            label: 'Coordonnées',
            value: typeof agent.lat === 'number' && typeof agent.long === 'number'
              ? `${agent.lat}, ${agent.long}`
              : 'Non disponibles'
          }
        ]
      }
    ]
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-pop"
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

        <div className="flex items-start gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-[#00D084] flex items-center justify-center">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase text-white tracking-wide">Localisation & Pointage</h2>
            <p className="text-[11px] font-bold uppercase text-emerald-400">{agent.name}</p>
            <p className="text-[10px] font-bold uppercase text-gray-400 mt-0.5">
              {formatLocationStatus({
                shop: agent.shop,
                status: agent.status,
                arrivalTime: agent.arrivalTime || agent.reportObj?.arrival_time,
                departureTime: agent.departureTime || agent.reportObj?.departure_time
              })}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-emerald-500/20 shadow-inner">
          <iframe
            title={`Localisation ${agent.name}`}
            src={getMapsEmbedUrl(agent)}
            className="w-full h-72 border-0"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </div>
  );
};

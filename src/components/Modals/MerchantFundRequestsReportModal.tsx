import React from 'react';
import { X, FileSpreadsheet, Download } from 'lucide-react';
import type { MerchantFundRequest } from '../../types';

interface MerchantFundRequestsReportModalProps {
  isOpen: boolean;
  requests: MerchantFundRequest[];
  onClose: () => void;
}

export const MerchantFundRequestsReportModal: React.FC<MerchantFundRequestsReportModalProps> = ({
  isOpen,
  requests = [],
  onClose,
}) => {
  if (!isOpen) return null;

  const handleExportCsv = () => {
    const headers = ['ID', 'Date', 'BA', 'Téléphone', 'POS', 'Montant ($)', 'Statut', 'Motif'];
    const rows = requests.map((r) => [
      r.id,
      r.created_at || '',
      `"${r.ba?.name || ''}"`,
      `"${r.ba?.phone || ''}"`,
      `"${r.point_of_sale?.denomination || ''}"`,
      r.amount || 0,
      r.status,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `demandes-de-fonds-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/85 p-3 backdrop-blur-md sm:p-6"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="glass-card max-h-[92vh] w-full max-w-lg overflow-y-auto border border-emerald-400/25 p-5 shadow-2xl rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Export Trésorerie</p>
              <h2 className="text-lg font-black text-white">Rapport des fonds</h2>
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

        <div className="mt-4 space-y-3">
          <p className="text-xs text-gray-300">
            Exportez l'ensemble des {requests.length} demandes de fonds au format CSV pour votre comptabilité.
          </p>
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={handleExportCsv}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-zinc-950 font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(16,185,129,0.3)]"
            >
              <Download className="w-4 h-4" />
              <span>Télécharger l'export CSV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantFundRequestsReportModal;

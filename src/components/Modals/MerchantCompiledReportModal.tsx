import React from 'react';
import { X, FileSpreadsheet, Download, Calendar, CheckCircle2 } from 'lucide-react';

interface MerchantCompiledReportModalProps {
  isOpen: boolean;
  runId: string | null;
  archives: any[];
  startDate: string;
  endDate: string;
  onClose: () => void;
}

export const MerchantCompiledReportModal: React.FC<MerchantCompiledReportModalProps> = ({
  isOpen,
  runId,
  archives = [],
  startDate,
  endDate,
  onClose,
}) => {
  if (!isOpen) return null;

  const handleExportCsv = () => {
    const headers = ['Date', 'BA', 'Téléphone', 'POS Visités', 'Transactions', 'Montant Total (CDF)', 'Commentaire'];
    const rows = archives.map((a) => [
      a.attendance?.activity_date || '',
      `"${a.ba?.name || ''}"`,
      `"${a.ba?.phone || ''}"`,
      a.visitedPosCount || 0,
      a.transactionCount || 0,
      a.totalAmount || 0,
      `"${(a.attendance?.closing_comment || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `compilation-rapports-merchant-${startDate}_${endDate}.csv`);
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
        className="glass-card max-h-[92vh] w-full max-w-xl overflow-y-auto border border-emerald-400/25 p-5 shadow-2xl rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Export & Compilation</p>
              <h2 className="text-lg font-black text-white">Rapport consolidé</h2>
              <p className="text-xs text-gray-400">Du {startDate} au {endDate}</p>
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
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Total rapports archivés :</span>
              <span className="font-bold text-white">{archives.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total POS cumulés :</span>
              <span className="font-bold text-cyan-300">
                {archives.reduce((sum, a) => sum + (a.visitedPosCount || 0), 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total transactions :</span>
              <span className="font-bold text-amber-300">
                {archives.reduce((sum, a) => sum + (a.transactionCount || 0), 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Volume global :</span>
              <span className="font-bold text-emerald-400">
                {archives.reduce((sum, a) => sum + (a.totalAmount || 0), 0).toLocaleString('fr-FR')} CDF
              </span>
            </div>
          </div>

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

export default MerchantCompiledReportModal;

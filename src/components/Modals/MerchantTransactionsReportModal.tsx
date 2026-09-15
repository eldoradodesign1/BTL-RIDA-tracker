import React from 'react';
import { X, FileSpreadsheet, Download } from 'lucide-react';
import type { BATransaction } from '../../types';

interface MerchantTransactionsReportModalProps {
  isOpen: boolean;
  records: any[];
  startsOn: string;
  endsOn: string;
  generatedBy?: string;
  onClose: () => void;
}

export const MerchantTransactionsReportModal: React.FC<MerchantTransactionsReportModalProps> = ({
  isOpen,
  records = [],
  startsOn,
  endsOn,
  generatedBy,
  onClose,
}) => {
  if (!isOpen) return null;

  const handleExportCsv = () => {
    const headers = ['Date', 'POS', 'N° Agent', 'Pool', 'MFS', 'BA', 'Client', 'Montant (CDF)', 'Réf Tx', 'Statut'];
    const rows = records.map((t) => [
      t.occurred_at || '',
      `"${t.point_of_sale?.denomination || ''}"`,
      `"${t.point_of_sale?.agent_number || ''}"`,
      `"${t.point_of_sale?.pool || ''}"`,
      `"${t.point_of_sale?.mfs_name || ''}"`,
      `"${t.ba?.name || ''}"`,
      `"${t.client_number || ''}"`,
      t.amount || 0,
      `"${t.transaction_reference || ''}"`,
      t.status || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rapport-transactions-${startsOn}_${endsOn}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalAmount = records.reduce((sum, r) => sum + Number(r.amount || 0), 0);

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/85 p-3 backdrop-blur-md sm:p-6"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="glass-card max-h-[92vh] w-full max-w-lg overflow-y-auto border border-amber-400/25 p-5 shadow-2xl rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-amber-400">Rapport Financier</p>
              <h2 className="text-lg font-black text-white">Rapport des transactions</h2>
              <p className="text-xs text-gray-400">{records.length} transactions · Du {startsOn} au {endsOn}</p>
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
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Nombre de transactions :</span>
              <span className="font-bold text-white">{records.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Volume global :</span>
              <span className="font-black text-emerald-400">{totalAmount.toLocaleString('fr-FR')} CDF</span>
            </div>
            {generatedBy && (
              <div className="flex justify-between">
                <span className="text-gray-400">Généré par :</span>
                <span className="font-bold text-gray-200">{generatedBy}</span>
              </div>
            )}
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={handleExportCsv}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-zinc-950 font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(245,158,11,0.3)]"
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

export default MerchantTransactionsReportModal;

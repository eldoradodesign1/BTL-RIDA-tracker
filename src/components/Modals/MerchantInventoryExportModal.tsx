import React from 'react';
import { X, FileSpreadsheet, Download } from 'lucide-react';
import type { CampaignRun } from '../../types';
import type { MerchantPosControlItem } from '../../utils/merchantCampaign';

interface MerchantInventoryExportModalProps {
  isOpen: boolean;
  run: CampaignRun;
  controls: MerchantPosControlItem[];
  onClose: () => void;
}

export const MerchantInventoryExportModal: React.FC<MerchantInventoryExportModalProps> = ({
  isOpen,
  run,
  controls = [],
  onClose,
}) => {
  if (!isOpen) return null;

  const handleExportCsv = () => {
    const headers = ['Code POS', 'Dénomination', 'Pool', 'MFS Référent', 'BA Assigné', 'Statut', 'Transactions'];
    const rows = controls.map((c) => [
      `"${c.pos?.agent_number || ''}"`,
      `"${c.pos?.denomination || ''}"`,
      `"${c.pos?.pool || ''}"`,
      `"${c.pos?.mfs_name || ''}"`,
      `"${c.ba?.name || ''}"`,
      c.status || '',
      c.transactionCount || 0,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inventaire-pos-${run.id || 'campagne'}.csv`);
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
        className="glass-card max-h-[92vh] w-full max-w-lg overflow-y-auto border border-fuchsia-400/25 p-5 shadow-2xl rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-fuchsia-500/20 border border-fuchsia-500/30 text-fuchsia-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-fuchsia-400">Export Inventaire</p>
              <h2 className="text-lg font-black text-white">Inventaire POS & MFS</h2>
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
            Exportez l'inventaire complet des {controls.length} POS répertoriés avec leur affectation BA et MFS.
          </p>
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={handleExportCsv}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-pink-600 hover:from-fuchsia-400 hover:to-pink-500 text-white font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(217,70,239,0.3)]"
            >
              <Download className="w-4 h-4" />
              <span>Télécharger l'inventaire CSV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantInventoryExportModal;

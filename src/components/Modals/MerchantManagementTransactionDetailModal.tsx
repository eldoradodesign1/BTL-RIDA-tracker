import React from 'react';
import { X, Receipt, CheckCircle2, XCircle, Clock, MapPin, Store, User, Hash } from 'lucide-react';
import type { BATransaction } from '../../types';

interface MerchantManagementTransactionDetailModalProps {
  transaction: any;
  onClose: () => void;
}

export const MerchantManagementTransactionDetailModal: React.FC<MerchantManagementTransactionDetailModalProps> = ({
  transaction,
  onClose,
}) => {
  if (!transaction) return null;

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
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-amber-400">Détail Opération</p>
              <h2 className="text-lg font-black text-white">Transaction Terrain</h2>
              <p className="text-xs text-gray-400">ID: {transaction.id}</p>
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
              <span className="text-gray-400">Montant :</span>
              <span className="text-base font-black text-emerald-400">
                {Number(transaction.amount || 0).toLocaleString('fr-FR')} CDF
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">POS :</span>
              <span className="font-bold text-white">
                {transaction.point_of_sale?.denomination || transaction.pos_id}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Code Agent POS :</span>
              <span className="font-bold text-gray-200">
                {transaction.point_of_sale?.agent_number || '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Brand Ambassador :</span>
              <span className="font-bold text-cyan-300">
                {transaction.ba?.name || 'BA'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Client MSISDN :</span>
              <span className="font-bold text-gray-200">
                {transaction.client_number || 'Non renseigné'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Réf. M-Pesa :</span>
              <span className="font-bold text-gray-200">
                {transaction.transaction_reference || 'Non renseignée'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Heure :</span>
              <span className="font-bold text-gray-200">
                {transaction.occurred_at ? new Date(transaction.occurred_at).toLocaleString('fr-FR') : '—'}
              </span>
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-2xl border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 font-bold text-xs uppercase tracking-wider transition"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantManagementTransactionDetailModal;

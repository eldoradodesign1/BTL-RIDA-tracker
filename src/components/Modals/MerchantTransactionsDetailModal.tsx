import React from 'react';
import { X, Receipt, DollarSign, Calendar, CheckCircle2 } from 'lucide-react';

interface MerchantTransactionsDetailModalProps {
  isOpen: boolean;
  activity: any;
  onClose: () => void;
}

export const MerchantTransactionsDetailModal: React.FC<MerchantTransactionsDetailModalProps> = ({
  isOpen,
  activity,
  onClose,
}) => {
  if (!isOpen || !activity) return null;

  const transactions = activity.transactions || [];
  const ba = activity.ba || {};

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
              <p className="text-[10px] font-black uppercase tracking-wider text-amber-400">Transactions</p>
              <h2 className="text-lg font-black text-white">Ventes de {ba.name}</h2>
              <p className="text-xs text-gray-400">
                {activity.transactionCount || transactions.length} transactions · Total: {(activity.totalAmount || 0).toLocaleString('fr-FR')} CDF
              </p>
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

        <div className="mt-4 space-y-2">
          {transactions.length > 0 ? (
            transactions.map((tx: any, idx: number) => (
              <div
                key={tx.id || idx}
                className="p-3.5 rounded-2xl border border-white/10 bg-white/[0.03] flex items-center justify-between gap-3"
              >
                <div>
                  <b className="text-sm text-white block">
                    {tx.point_of_sale?.denomination || 'POS Merchant'}
                  </b>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Client: {tx.client_number || 'Non renseigné'}
                    {tx.transaction_reference && ` · Réf: ${tx.transaction_reference}`}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-emerald-400 block">
                    {(tx.amount || 0).toLocaleString('fr-FR')} CDF
                  </span>
                  <span className="text-[9px] font-bold text-gray-500">
                    {tx.occurred_at ? new Date(tx.occurred_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-gray-400 bg-white/5 rounded-2xl">
              Aucune transaction individuelle pour cette date.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

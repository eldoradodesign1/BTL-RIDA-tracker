import React, { useState } from 'react';
import { Search, Store, X } from 'lucide-react';
import type { PointOfSale } from '../../types';

interface MerchantPosCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  positions?: PointOfSale[];
  onSelectPos?: (pos: PointOfSale) => void;
}

export const MerchantPosCommandPalette: React.FC<MerchantPosCommandPaletteProps> = ({
  isOpen,
  onClose,
  positions = [],
  onSelectPos,
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const filtered = positions.filter((p) =>
    (p.denomination?.toLowerCase().includes(query.toLowerCase()) || '') ||
    (p.agent_number?.toLowerCase().includes(query.toLowerCase()) || '')
  );

  return (
    <div className="fixed inset-0 z-[150] flex items-start justify-center pt-20 bg-black/80 backdrop-blur-sm p-4">
      <div className="glass-card w-full max-w-lg border border-white/10 p-4 shadow-2xl rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <Search className="w-5 h-5 text-emerald-400" />
          <input
            type="text"
            placeholder="Rechercher un POS..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white focus:outline-none placeholder:text-gray-500"
            autoFocus
          />
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="max-h-60 overflow-y-auto mt-2 space-y-1">
          {filtered.map((pos) => (
            <div
              key={pos.id}
              onClick={() => { onSelectPos?.(pos); onClose(); }}
              className="p-2.5 rounded-xl hover:bg-white/10 cursor-pointer flex items-center justify-between text-xs text-gray-200"
            >
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-emerald-400" />
                <span>{pos.denomination}</span>
              </div>
              <span className="text-[10px] text-gray-400">{pos.agent_number}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

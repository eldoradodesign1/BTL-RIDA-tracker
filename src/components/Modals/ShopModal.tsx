import React, { useState } from 'react';
import { X, Store, Plus } from 'lucide-react';
import { saveShop } from '../../utils/storage';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [city, setCity] = useState('Lubumbashi');
  const [type, setType] = useState<'Standard' | 'Airport'>('Standard');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !city) return;
    saveShop(name, city, type);
    setName('');
    setCity('Lubumbashi');
    setType('Standard');
    onSuccess();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-pop"
      onClick={onClose}
    >
      <div
        className="modal-sheet relative w-full max-w-lg bg-zinc-950 border border-emerald-500/20 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-handle mb-4 sm:hidden" />
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-[#00D084] flex items-center justify-center mx-auto mb-3">
            <Store className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black uppercase text-white tracking-wider">Nouveau Hub / Point Stratégique</h2>
          <p className="text-xs text-gray-400 font-semibold mt-1">Ajout d'un point d'activation RIDA Lubumbashi</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Nom du Hub / Carrefour</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Hub Kenya, Carrefour SNCC, Rond-point Express"
              required
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00D084]"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Ville</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ex: Lubumbashi"
              required
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00D084]"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 block mb-1">Type de Point Terrain</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'Standard' | 'Airport')}
              className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#00D084]"
            >
              <option value="Standard">Point Standard (Centre-ville, Carrefours, Marchés)</option>
              <option value="Airport">Aéroport / Hub Spécialisé (Luano, Gares)</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#00D084] to-[#059669] hover:from-[#10B981] hover:to-[#047857] text-[#032313] font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-[0_8px_25px_rgba(0,208,132,0.3)] mt-6 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Enregistrer le Hub</span>
          </button>
        </form>
      </div>
    </div>
  );
};

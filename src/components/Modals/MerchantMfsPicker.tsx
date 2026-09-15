import React from 'react';
import { MERCHANT_MFS_LIST, OTHER_MFS_VALUE } from '../../data/merchantMfs';

interface MerchantMfsPickerProps {
  value: string;
  onChange: (value: string) => void;
  accent?: string;
}

export const MerchantMfsPicker: React.FC<MerchantMfsPickerProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
        Sélectionner le MFS accompagnateur
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-4 py-3 text-white text-xs font-medium focus:outline-none focus:border-emerald-400"
      >
        <option value="">-- Choisir un agent MFS --</option>
        {MERCHANT_MFS_LIST.map((mfs) => (
          <option key={mfs} value={mfs}>
            {mfs}
          </option>
        ))}
        <option value={OTHER_MFS_VALUE}>Autre MFS (saisir manuellement)...</option>
      </select>
    </div>
  );
};

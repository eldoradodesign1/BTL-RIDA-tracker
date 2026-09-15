import React, { useState } from 'react';
import { User, RidaOsType, RidaClientType } from '../../types';
import { addLead, checkDailyStatus, toISO } from '../../utils/storage';
import { isValidMsisdn, cleanPhoneNumber, formatMsisdn } from '../../utils/phoneValidator';
import { Smartphone, Check, X, AlertCircle, Sparkles, UserCheck, ShieldCheck, Car, Users } from 'lucide-react';

interface LeadModalProps {
  isOpen: boolean;
  currentUser: User;
  activeShopId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const PHONE_BRANDS = [
  'Samsung',
  'Tecno',
  'Infinix',
  'iPhone (Apple)',
  'Itel',
  'Xiaomi',
  'Huawei',
  'Oppo',
  'Autre'
];

export const LeadModal: React.FC<LeadModalProps> = ({
  isOpen,
  currentUser,
  activeShopId,
  onClose,
  onSuccess
}) => {
  const [clientName, setClientName] = useState('');
  const [msisdn, setMsisdn] = useState('');
  const [osType, setOsType] = useState<RidaOsType>('Android');
  const [phoneBrand, setPhoneBrand] = useState('Samsung');
  const [customBrand, setCustomBrand] = useState('');
  const [clientType, setClientType] = useState<RidaClientType>('Passager');
  const [actionType, setActionType] = useState<string>('Installation Réussie');
  const [promoCode, setPromoCode] = useState('');
  const [notes, setNotes] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const { reportDone } = checkDailyStatus(currentUser.id, toISO(new Date()));

  if (!isOpen) return null;

  const handlePhoneChange = (val: string) => {
    const filtered = val.replace(/[^\d\+\s]/g, '');
    setMsisdn(filtered);
    setSubmitError('');
    if (filtered.trim().length > 0 && !isValidMsisdn(filtered)) {
      setPhoneError('Numéro RDC requis : 10 chiffres (ex: 097..., 081..., 082..., 099...)');
    } else {
      setPhoneError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reportDone) {
      setSubmitError('Session clôturée: le rapport du jour est déjà envoyé, nouvelle saisie bloquée.');
      return;
    }
    if (!clientName.trim()) {
      setSubmitError('Veuillez renseigner le nom du prospect.');
      return;
    }

    if (!isValidMsisdn(msisdn)) {
      setPhoneError('Format invalide. Numéro RDC à 10 chiffres attendu.');
      return;
    }

    const cleanedPhone = cleanPhoneNumber(msisdn);
    const formattedPhone = cleanedPhone.length === 10 ? cleanedPhone : formatMsisdn(msisdn);
    const finalBrand = phoneBrand === 'Autre' && customBrand.trim() ? customBrand.trim() : phoneBrand;

    try {
      addLead({
        agent_id: currentUser.id,
        shop_id: activeShopId || currentUser.permanentShopId,
        timestamp: new Date().toISOString(),
        client_name: clientName.trim(),
        msisdn: formattedPhone,
        os_type: osType,
        phone_brand: finalBrand,
        client_type: clientType,
        action_type: actionType,
        promo_code: promoCode.trim() || undefined,
        notes: notes.trim() || undefined,
        status: 'Installé'
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Impossible d\'enregistrer ce prospect.');
      return;
    }

    // Reset & notify
    setClientName('');
    setMsisdn('');
    setPhoneError('');
    setSubmitError('');
    setPromoCode('');
    setNotes('');
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-pop" onClick={onClose}>
      <div 
        className="relative w-full max-w-lg bg-[#0c121e] border border-white/10 rounded-t-[28px] sm:rounded-[28px] p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile handle */}
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4 sm:hidden" />

        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3" />
            <span>Campagne RIDA-Installation</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            Nouvelle Activation <span className="text-[#00D084]">RIDA</span>
          </h2>
          <p className="text-xs text-gray-400 font-medium mt-0.5">Lubumbashi • Enregistrement de l'application installée</p>
        </div>

        {reportDone && (
          <div className="mb-4 p-3 rounded-2xl border border-amber-500/40 bg-amber-950/35 text-amber-200 text-xs font-bold uppercase">
            Session déjà clôturée aujourd'hui. Saisie désactivée.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom du Prospect */}
          <div>
            <label className="text-[11px] font-black uppercase tracking-wide text-gray-300 block mb-1">
              Nom du prospect / client <span className="text-[#00D084]">*</span>
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => {
                setClientName(e.target.value);
                setSubmitError('');
              }}
              placeholder="Ex: Jean-Luc Kalombo"
              required
              disabled={reportDone}
              className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-semibold placeholder:text-gray-500 focus:outline-none focus:border-[#00D084] focus:ring-1 focus:ring-[#00D084] transition-all"
            />
          </div>

          {/* Numéro de téléphone */}
          <div>
            <label className="text-[11px] font-black uppercase tracking-wide text-gray-300 flex justify-between mb-1">
              <span>Numéro de Téléphone (RDC) <span className="text-[#00D084]">*</span></span>
              <span className="text-emerald-400 text-[10px] font-bold">10 chiffres</span>
            </label>
            <input
              type="tel"
              value={msisdn}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="Ex: 0971234567 ou 0818889900"
              required
              disabled={reportDone}
              className={`w-full bg-white/[0.05] border rounded-xl px-4 py-3 text-white text-sm font-mono font-bold placeholder:text-gray-500 focus:outline-none transition-all ${
                phoneError 
                  ? 'border-rose-500 bg-rose-950/20 focus:border-rose-500' 
                  : 'border-white/10 focus:border-[#00D084] focus:ring-1 focus:ring-[#00D084]'
              }`}
            />
            {phoneError && (
              <div className="mt-1.5 p-2 bg-rose-950/40 border border-rose-500/30 rounded-lg text-rose-300 text-xs font-medium flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{phoneError}</span>
              </div>
            )}
          </div>

          {/* Système d'Exploitation (OS) - Custom Touch Chips */}
          <div>
            <label className="text-[11px] font-black uppercase tracking-wide text-gray-300 block mb-1.5">
              Système d'exploitation (OS) <span className="text-[#00D084]">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOsType('Android')}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 border transition-all ${
                  osType === 'Android'
                    ? 'bg-emerald-500/15 border-[#00D084] text-[#00D084] shadow-[0_0_15px_rgba(0,208,132,0.15)]'
                    : 'bg-white/[0.03] border-white/10 text-gray-400 hover:border-white/20'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Android (Google)</span>
                {osType === 'Android' && <Check className="w-3.5 h-3.5 ml-auto" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setOsType('iOS');
                  setPhoneBrand('iPhone (Apple)');
                }}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 border transition-all ${
                  osType === 'iOS'
                    ? 'bg-emerald-500/15 border-[#00D084] text-[#00D084] shadow-[0_0_15px_rgba(0,208,132,0.15)]'
                    : 'bg-white/[0.03] border-white/10 text-gray-400 hover:border-white/20'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>iOS (Apple)</span>
                {osType === 'iOS' && <Check className="w-3.5 h-3.5 ml-auto" />}
              </button>
            </div>
          </div>

          {/* Marque de Smartphone - Quick-tap chips */}
          <div>
            <label className="text-[11px] font-black uppercase tracking-wide text-gray-300 block mb-1.5">
              Marque de Téléphone
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PHONE_BRANDS.map((brand) => (
                <button
                  type="button"
                  key={brand}
                  onClick={() => {
                    setPhoneBrand(brand);
                    if (brand === 'iPhone (Apple)') setOsType('iOS');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    phoneBrand === brand
                      ? 'bg-white text-zinc-900 border-white shadow-sm'
                      : 'bg-white/[0.04] text-gray-400 border-white/10 hover:border-white/25 hover:text-white'
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>

            {phoneBrand === 'Autre' && (
              <input
                type="text"
                value={customBrand}
                onChange={(e) => setCustomBrand(e.target.value)}
                placeholder="Précisez la marque (ex: Vivo, Realme, Nokia...)"
                className="mt-2 w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs font-semibold focus:outline-none focus:border-[#00D084]"
              />
            )}
          </div>

          {/* Profil Client : Passager ou Chauffeur */}
          <div>
            <label className="text-[11px] font-black uppercase tracking-wide text-gray-300 block mb-1.5">
              Type de Profil RIDA
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setClientType('Passager')}
                className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 border transition-all ${
                  clientType === 'Passager'
                    ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300'
                    : 'bg-white/[0.03] border-white/10 text-gray-400 hover:border-white/20'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Passager</span>
              </button>

              <button
                type="button"
                onClick={() => setClientType('Chauffeur / Conducteur')}
                className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 border transition-all ${
                  clientType === 'Chauffeur / Conducteur'
                    ? 'bg-amber-500/15 border-amber-400 text-amber-300'
                    : 'bg-white/[0.03] border-white/10 text-gray-400 hover:border-white/20'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>Chauffeur / VTC</span>
              </button>
            </div>
          </div>

          {/* Type d'Action / État de l'activation */}
          <div>
            <label className="text-[11px] font-black uppercase tracking-wide text-gray-300 block mb-1">
              Statut de la Conversion
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                'Installation Réussie',
                'Installation & Inscription',
                'Installation & 1ère Course',
                'Contact Intéressé'
              ].map((act) => (
                <button
                  type="button"
                  key={act}
                  onClick={() => setActionType(act)}
                  className={`p-2 rounded-xl text-left text-[11px] font-bold border transition-all leading-tight ${
                    actionType === act
                      ? 'bg-emerald-500/15 border-[#00D084] text-[#00D084]'
                      : 'bg-white/[0.03] border-white/10 text-gray-400 hover:border-white/20'
                  }`}
                >
                  {act}
                </button>
              ))}
            </div>
          </div>

          {/* Code Promo (Optionnel) */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-black uppercase tracking-wide text-gray-400 block mb-1">
                Code Promo / Réf (optionnel)
              </label>
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Ex: RIDA-LSH"
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-mono font-bold placeholder:text-gray-500 focus:outline-none focus:border-[#00D084]"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-wide text-gray-400 block mb-1">
                Note / Lieu précis
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Arrêt Bel-Air"
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-medium placeholder:text-gray-500 focus:outline-none focus:border-[#00D084]"
              />
            </div>
          </div>

          {submitError && (
            <div className="p-2.5 bg-rose-950/60 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-bold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={!!phoneError || reportDone || !clientName.trim() || !msisdn.trim()}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#00D084] to-[#059669] hover:from-[#10B981] hover:to-[#047857] text-[#032313] font-black text-sm uppercase tracking-wider flex items-center justify-center space-x-2 shadow-[0_8px_25px_rgba(0,208,132,0.35)] disabled:opacity-40 disabled:cursor-not-allowed transition-all mt-6 active:scale-[0.99]"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Valider l'installation RIDA</span>
          </button>
        </form>
      </div>
    </div>
  );
};

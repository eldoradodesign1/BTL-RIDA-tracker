import React, { useState } from 'react';
import { ChevronRight, Lock, Phone, Trash2 } from 'lucide-react';
import { User, Campaign, CampaignContext } from '../types';
import { authenticate, purgeAndResetEverything, refreshUsersFromGoogleSheets } from '../utils/storage';
import { getCampaignsForUser } from '../utils/merchantCampaign';

interface LoginScreenProps {
  onLoginSuccess: (user: User, campaign?: CampaignContext) => void;
}

const toCampaignContext = (campaign?: Campaign | null): CampaignContext => {
  if (campaign?.code === 'youth-f2f') return 'youth-f2f';
  if (campaign?.campaign_type === 'brand_ambassador' || campaign?.code === 'merchant-educational-campaign') {
    return 'merchant-educational';
  }
  return 'rida-installation';
};

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [availableCampaigns, setAvailableCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');

  const finishLogin = (user: User, campaign?: Campaign | null) => {
    onLoginSuccess(user, toCampaignContext(campaign));
  };

  const determineCampaign = async (user: User) => {
    if (user.role !== 'agent') {
      finishLogin(user);
      return;
    }

    try {
      const campaigns = await getCampaignsForUser(user.id);
      if (campaigns.length > 1) {
        setPendingUser(user);
        setAvailableCampaigns(campaigns);
        setSelectedCampaignId(campaigns[0].id);
        return;
      }
      finishLogin(user, campaigns[0]);
    } catch {
      // The legacy Vodacom connection remains available when the campaign lookup is offline.
      finishLogin(user, user.userCategory === 'brand_ambassador_youth'
        ? { campaign_type: 'brand_ambassador', code: 'youth-f2f' } as Campaign
        : user.userCategory === 'brand_ambassador'
          ? { campaign_type: 'brand_ambassador', code: 'merchant-educational-campaign' } as Campaign
          : null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneValue = (e.currentTarget as HTMLFormElement).elements.namedItem('phone') as HTMLInputElement | null;
    const passwordValue = (e.currentTarget as HTMLFormElement).elements.namedItem('password') as HTMLInputElement | null;
    const enteredPhone = (phoneValue?.value || phone || '').trim();
    const enteredPassword = (passwordValue?.value || password || '').trim();

    setLoading(true);
    setError('');

    try {
      await refreshUsersFromGoogleSheets();
      const result = authenticate(enteredPhone, enteredPassword);
      if (result.success && result.user) {
        await determineCampaign(result.user);
      } else {
        setError(result.message || 'Identifiants incorrects.');
      }
    } catch {
      const result = authenticate(enteredPhone, enteredPassword);
      if (result.success && result.user) {
        await determineCampaign(result.user);
      } else {
        setError(result.message || 'Identifiants incorrects.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEnterSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  };

  if (pendingUser) {
    return (
      <div className="login-shell w-full flex flex-col justify-center items-center p-6 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="login-panel w-full glass-card border border-white/10 rounded-3xl p-6 relative z-10 animate-pop max-w-md bg-zinc-950/70 backdrop-blur-2xl">
          <div className="text-center mb-7">
            <div className="brand-text text-3xl font-black tracking-tight mb-1 text-white">CHOISIR LA CAMPAGNE</div>
            <p className="text-xs font-semibold text-gray-400">Bienvenue {pendingUser.name.split(' ')[0]}. Sélectionnez l’espace de travail souhaité.</p>
          </div>

          <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-2">Campagne active</label>
          <select
            value={selectedCampaignId}
            onChange={(e) => setSelectedCampaignId(e.target.value)}
            className="app-input w-full border border-white/10 bg-white/[0.04] rounded-2xl px-4 py-3.5 text-white text-sm font-semibold focus:outline-none focus:border-[#00D084]"
          >
            {availableCampaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id} className="bg-zinc-900 text-white">{campaign.name}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => finishLogin(pendingUser, availableCampaigns.find((campaign) => campaign.id === selectedCampaignId))}
            className="w-full mt-5 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#00D084] to-[#059669] hover:from-[#10B981] text-[#032313] font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_8px_25px_rgba(0,208,132,0.35)] transition-all"
          >
            <span>ENTRER DANS LA CAMPAGNE</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => { setPendingUser(null); setAvailableCampaigns([]); }}
            className="w-full mt-4 text-[10px] font-bold text-gray-500 hover:text-emerald-400 uppercase tracking-wider"
          >
            Utiliser un autre compte
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-shell w-full flex flex-col justify-center items-center p-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-teal-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="login-panel w-full glass-card border border-white/10 relative z-10 animate-pop max-w-md">
        <div className="text-center mb-7">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[#00D084] text-[10px] font-black uppercase tracking-wider mb-2">
            <span>RIDA Transport • Lubumbashi</span>
          </div>
          <div className="brand-text text-3xl sm:text-4xl font-black tracking-tight text-white mb-1">
            RIDA <span className="text-[#00D084]">TRACKER</span>
          </div>
          <div className="login-eyebrow text-[10px] font-black uppercase tracking-widest text-gray-400">
            Campagne RIDA-Installation
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center space-x-1">
              <Phone className="w-3 h-3 text-[#00D084]" />
              <span>Numéro de Téléphone (MSISDN)</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={handleEnterSubmit}
              placeholder="081XXXXXXX ou 097XXXXXXX"
              required
              className="app-input w-full border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-semibold focus:outline-none focus:border-[#00D084] transition-all placeholder:text-gray-600 bg-white/[0.04]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center space-x-1">
              <Lock className="w-3 h-3 text-[#00D084]" />
              <span>Mot de Passe / Clé d'Accès</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="app-input w-full border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-semibold focus:outline-none focus:border-[#00D084] transition-all placeholder:text-gray-600 bg-white/[0.04]"
            />
          </div>

          <div className="login-note rounded-xl border border-white/10 px-4 py-2.5 text-[11px] font-semibold text-gray-400 bg-white/[0.02]">
            Connectez-vous pour enregistrer les installations et les pointages sur Lubumbashi.
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#00D084] to-[#059669] hover:from-[#10B981] hover:to-[#047857] text-[#032313] font-black text-sm uppercase tracking-wider flex items-center justify-center space-x-2 shadow-[0_8px_25px_rgba(0,208,132,0.35)] disabled:opacity-50 transition-all mt-4 active:scale-[0.99]"
          >
            <Lock className="w-4 h-4" />
            <span>{loading ? 'VÉRIFICATION...' : 'ACCÉDER À LA CAMPAGNE'}</span>
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-rose-300 text-center text-xs font-black uppercase">
            {error}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-white/10 text-center">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Vider complètement le cache et réinitialiser les données ?')) {
                purgeAndResetEverything();
                window.location.reload();
              }
            }}
            className="inline-flex items-center space-x-1.5 text-[10px] font-bold text-gray-500 hover:text-emerald-400 transition-colors uppercase tracking-wider"
          >
            <Trash2 className="w-3 h-3" />
            <span>Réinitialiser les données locales</span>
          </button>
        </div>
      </div>
    </div>
  );
};

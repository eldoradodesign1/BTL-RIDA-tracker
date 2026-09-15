import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Braces,
  CheckCircle2,
  Copy,
  Database,
  Download,
  ExternalLink,
  FileSpreadsheet,
  Layers,
  RefreshCw,
  Save,
  Trash2,
  UploadCloud,
  X,
  Zap
} from 'lucide-react';
import type { User } from '../../types';
import {
  getAppScriptUrl,
  setAppScriptUrl,
  getGoogleSheetUrl,
  setGoogleSheetUrl,
  testAppScriptConnection,
  initGoogleSheetsViaAppScript,
  syncLocalDataToGoogleSheets,
  isAppScriptConfigured,
  type AppScriptConnectionStatus
} from '../../utils/appScriptApi';
import {
  GOOGLE_APPS_SCRIPT_INSTRUCTIONS,
  GOOGLE_APPS_SCRIPT_SOURCE
} from '../../utils/googleAppsScriptCode';
import {
  getCheckins,
  getLeads,
  getReports,
  getShops,
  getUsers,
  purgeAndResetEverything
} from '../../utils/storage';
import { reloadFromGoogleSheets } from '../../utils/googleSheetStore';

interface SystemConfigurationModalProps {
  isOpen: boolean;
  currentUser: User;
  onClose: () => void;
  onRefreshData: () => void;
}

const csvEscape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;

export const SystemConfigurationModal: React.FC<SystemConfigurationModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onRefreshData
}) => {
  const [appScriptUrl, setAppScriptUrlInput] = useState('');
  const [sheetUrl, setSheetUrlInput] = useState('');
  const [status, setStatus] = useState<AppScriptConnectionStatus | null>(null);
  const [testing, setTesting] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'guide' | 'code'>('config');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const currentUrl = getAppScriptUrl();
    const currentSheet = getGoogleSheetUrl();
    setAppScriptUrlInput(currentUrl);
    setSheetUrlInput(currentSheet);

    if (currentUrl) {
      void runConnectionTest();
    } else {
      setStatus({
        connected: false,
        status: 'disconnected',
        message: 'Aucune URL Google Apps Script configurée. Mode local / hors-ligne actif.'
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const runConnectionTest = async () => {
    setTesting(true);
    setMessage(null);
    try {
      const res = await testAppScriptConnection();
      setStatus(res);
      if (res.connected) {
        setMessage({
          type: 'success',
          text: `Connexion établie avec succès avec le Google Sheet "${res.spreadsheetName || 'DB'}" (${res.latencyMs} ms) !`
        });
      } else {
        setMessage({
          type: 'error',
          text: res.message || 'Impossible de joindre le Google Sheet via Apps Script.'
        });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Erreur lors du test de connexion.' });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveConfig = () => {
    setSaving(true);
    setMessage(null);
    try {
      const cleanUrl = appScriptUrl.trim();
      const cleanSheet = sheetUrl.trim();

      if (cleanUrl && !cleanUrl.startsWith('http')) {
        throw new Error("L'URL Google Apps Script doit commencer par https://");
      }

      setAppScriptUrl(cleanUrl);
      setGoogleSheetUrl(cleanSheet);

      setMessage({ type: 'success', text: 'Paramètres Google Sheets & Apps Script enregistrés !' });

      if (cleanUrl) {
        void runConnectionTest();
      } else {
        setStatus({
          connected: false,
          status: 'disconnected',
          message: 'Mode local / hors-ligne actif.'
        });
      }
      onRefreshData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleInitSheets = async () => {
    if (!isAppScriptConfigured()) {
      setMessage({
        type: 'error',
        text: 'Veuillez d\'abord renseigner et enregistrer l\'URL Apps Script.'
      });
      return;
    }
    setInitializing(true);
    setMessage(null);
    try {
      const res = await initGoogleSheetsViaAppScript();
      setMessage({
        type: 'success',
        text: `Toutes les feuilles (${res.created?.length || 19}) ont été créées et stylisées avec succès dans votre Google Sheet !`
      });
      await runConnectionTest();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erreur lors de l\'initialisation des feuilles.' });
    } finally {
      setInitializing(false);
    }
  };

  const handleFullSync = async () => {
    if (!isAppScriptConfigured()) {
      setMessage({
        type: 'error',
        text: 'Veuillez configurer et tester l\'URL Apps Script avant de synchroniser.'
      });
      return;
    }
    setSyncing(true);
    setMessage(null);
    try {
      const users = getUsers();
      const shops = getShops();
      const checkins = getCheckins();
      const leads = getLeads();
      const reports = getReports();

      const result = await syncLocalDataToGoogleSheets({
        users,
        shops,
        checkins,
        leads,
        reports
      });

      setMessage({
        type: 'success',
        text: `Synchronisation réussie : ${result.users} utilisateurs, ${result.shops} boutiques, ${result.checkins} pointages, ${result.leads} leads, ${result.reports} rapports envoyés vers votre Google Sheet !`
      });
      onRefreshData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erreur lors de la synchronisation vers Google Sheets.' });
    } finally {
      setSyncing(false);
    }
  };

  const handlePullFromSheet = async () => {
    if (!isAppScriptConfigured()) return;
    setSyncing(true);
    setMessage(null);
    try {
      const ok = await reloadFromGoogleSheets();
      if (ok) {
        setMessage({ type: 'success', text: 'Données rechargées depuis le Google Sheet avec succès !' });
        onRefreshData();
      } else {
        setMessage({ type: 'error', text: 'Impossible de récupérer les données depuis le Google Sheet.' });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Erreur lors de la récupération.' });
    } finally {
      setSyncing(false);
    }
  };

  const copyScriptCode = async () => {
    try {
      await navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_SOURCE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setMessage({ type: 'info', text: 'Sélectionnez et copiez le texte dans la zone de code.' });
    }
  };

  const exportBackup = () => {
    const sections: Array<[string, Array<Record<string, unknown>>]> = [
      ['users', getUsers() as unknown as Array<Record<string, unknown>>],
      ['shops', getShops() as unknown as Array<Record<string, unknown>>],
      ['checkins', getCheckins() as unknown as Array<Record<string, unknown>>],
      ['leads', getLeads() as unknown as Array<Record<string, unknown>>],
      ['daily_reports', getReports() as unknown as Array<Record<string, unknown>>]
    ];
    const rows = sections.flatMap(([table, values]) => values.map((value) => ({ table, ...value })));
    const headers = Array.from(rows.reduce((keys, row) => {
      Object.keys(row).forEach((key) => keys.add(key));
      return keys;
    }, new Set<string>()));
    const csv = [headers.join(','), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `Vodacom_Tracker_Backup_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(downloadUrl);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 p-0 backdrop-blur-md sm:items-center sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="system-settings-title"
    >
      <section className="modal-sheet max-h-[92vh] w-full max-w-2xl overflow-y-auto p-5 sm:rounded-3xl bg-zinc-950 text-white border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-red-500/30 bg-red-600/20 p-3 text-red-500 shadow-lg shadow-red-600/20">
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-400">
                Base de données Cloud
              </p>
              <h2 id="system-settings-title" className="text-xl font-black text-white">
                Google Sheets & Apps Script
              </h2>
              <p className="text-xs text-zinc-400">
                Gérez le suivi BTL Vodacom en temps réel directement sur vos feuilles Google Sheets.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Status banner */}
        <div className="mt-4">
          <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
            status?.connected
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-zinc-900 border-zinc-800 text-zinc-300'
          }`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-3 h-3 rounded-full shrink-0 ${
                status?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`} />
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-wider">
                  {status?.connected ? 'Connecté à Google Sheets' : 'Mode Local / Hors-ligne'}
                </p>
                <p className="text-[11px] text-zinc-400 truncate">
                  {status?.spreadsheetName ? `Feuille : "${status.spreadsheetName}"` : (status?.message || 'Prêt')}
                  {status?.latencyMs ? ` • ${status.latencyMs} ms` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {sheetUrl && (
                <a
                  href={sheetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <ExternalLink size={13} />
                  <span>Ouvrir</span>
                </a>
              )}
              <button
                type="button"
                disabled={testing}
                onClick={runConnectionTest}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-black flex items-center gap-1.5 transition shadow"
              >
                <RefreshCw size={13} className={testing ? 'animate-spin' : ''} />
                <span>Tester</span>
              </button>
            </div>
          </div>
        </div>

        {/* Message notification */}
        {message && (
          <div className={`mt-3 rounded-2xl border p-3 text-xs font-bold flex items-center gap-2.5 ${
            message.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
              : message.type === 'error'
              ? 'border-red-500/30 bg-red-500/10 text-red-200'
              : 'border-blue-500/30 bg-blue-500/10 text-blue-200'
          }`}>
            {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="mt-4 flex border-b border-white/10 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider transition border-b-2 ${
              activeTab === 'config'
                ? 'border-red-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Configuration & Sync
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider transition border-b-2 ${
              activeTab === 'guide'
                ? 'border-red-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Guide d'installation (5 min)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider transition border-b-2 ${
              activeTab === 'code'
                ? 'border-red-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Code Apps Script (Code.gs)
          </button>
        </div>

        {/* Tab 1: Configuration */}
        {activeTab === 'config' && (
          <div className="mt-4 space-y-4">
            <section className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4 space-y-3">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-300">
                  URL Web App Google Apps Script
                </label>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  L'adresse générée par Apps Script lors du déploiement en tant qu'Application Web (terminant par <code className="text-red-400">/exec</code>).
                </p>
                <input
                  value={appScriptUrl}
                  onChange={(e) => setAppScriptUrlInput(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="mt-2 w-full rounded-xl bg-black/60 border border-white/15 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-zinc-300">
                  Lien de votre Google Spreadsheet (Optionnel)
                </label>
                <input
                  value={sheetUrl}
                  onChange={(e) => setSheetUrlInput(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="mt-1.5 w-full rounded-xl bg-black/60 border border-white/15 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 font-mono"
                />
              </div>

              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveConfig}
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black flex items-center gap-2 transition shadow-lg shadow-red-600/30"
                >
                  <Save size={15} />
                  <span>Enregistrer la configuration</span>
                </button>

                <button
                  type="button"
                  disabled={initializing || !appScriptUrl}
                  onClick={handleInitSheets}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white text-xs font-black flex items-center gap-2 transition"
                  title="Crée toutes les feuilles et colonnes nécessaires dans votre Google Spreadsheet"
                >
                  <Layers size={15} className="text-red-400" />
                  <span>{initializing ? 'Création en cours…' : 'Initialiser les feuilles'}</span>
                </button>
              </div>
            </section>

            {/* Sync actions */}
            <section className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-200 flex items-center gap-2">
                <UploadCloud size={16} className="text-red-400" />
                Synchronisation & Sauvegarde
              </h3>
              <p className="text-[11px] text-zinc-400 mt-1">
                Envoyez vos données locales vers le Google Sheet ou rechargez les données Cloud.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
                <button
                  type="button"
                  disabled={syncing || !appScriptUrl}
                  onClick={handleFullSync}
                  className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition flex items-start gap-3 disabled:opacity-50"
                >
                  <UploadCloud className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-xs font-black text-white">Pousser vers Google Sheet</span>
                    <span className="block text-[10px] text-zinc-400 mt-0.5">Envoie les utilisateurs, pointages et rapports locaux</span>
                  </div>
                </button>

                <button
                  type="button"
                  disabled={syncing || !appScriptUrl}
                  onClick={handlePullFromSheet}
                  className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition flex items-start gap-3 disabled:opacity-50"
                >
                  <RefreshCw className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-xs font-black text-white">Télécharger depuis Google Sheet</span>
                    <span className="block text-[10px] text-zinc-400 mt-0.5">Met à jour le cache local avec les données du Cloud</span>
                  </div>
                </button>
              </div>
            </section>

            {/* Local maintenance */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={exportBackup}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 text-xs font-bold flex items-center gap-2 transition"
              >
                <Download size={14} className="text-cyan-400" />
                <span>Exporter en CSV</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Voulez-vous vraiment vider le cache local et réinitialiser ?')) {
                    purgeAndResetEverything();
                    window.location.reload();
                  }
                }}
                className="px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/20 text-red-300 text-xs font-bold flex items-center gap-2 transition"
              >
                <Trash2 size={14} />
                <span>Réinitialiser le cache</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Guide */}
        {activeTab === 'guide' && (
          <div className="mt-4 space-y-3">
            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-red-400 flex items-center gap-2">
                <Zap size={16} />
                Guide d'installation rapide en 5 étapes
              </h3>
              {GOOGLE_APPS_SCRIPT_INSTRUCTIONS.map((step) => (
                <div key={step.step} className="flex items-start gap-3 text-xs">
                  <div className="w-6 h-6 rounded-full bg-red-600 text-white font-black flex items-center justify-center shrink-0 text-[11px] shadow">
                    {step.step}
                  </div>
                  <div>
                    <h4 className="font-bold text-white">{step.title}</h4>
                    <p className="text-zinc-400 text-[11px] mt-0.5 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs leading-relaxed flex items-start gap-3">
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-amber-400" />
              <div>
                <b className="font-black uppercase tracking-wide block mb-1">Point important lors du déploiement :</b>
                Dans Google Apps Script, choisissez bien <b>"Qui a accès : Tout le monde"</b>. Cela permet aux agents terrain d'envoyer leurs pointages et ventes en temps réel sans blocage.
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Code source */}
        {activeTab === 'code' && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <Braces size={16} className="text-red-400" />
                Script complet Code.gs
              </span>
              <button
                type="button"
                onClick={copyScriptCode}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black flex items-center gap-1.5 transition shadow"
              >
                {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Copié !' : 'Copier le code'}</span>
              </button>
            </div>

            <div className="relative">
              <pre className="max-h-[50vh] overflow-auto rounded-2xl bg-black border border-white/10 p-4 text-[11px] font-mono leading-relaxed text-zinc-300">
                {GOOGLE_APPS_SCRIPT_SOURCE}
              </pre>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

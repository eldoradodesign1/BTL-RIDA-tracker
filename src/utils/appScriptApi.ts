/**
 * Client API Google Apps Script & Google Sheets pour BTL RIDA Field Tracker
 */

import type {
  ChatMessage,
  Checkin,
  DailyReport,
  Lead,
  NotificationItem,
  Shop,
  User,
  PointOfSale,
  BADailyAssignment,
  BADailyAttendance,
  BAPosVisit,
  BATransaction,
  MerchantFundRequest,
  CampaignPause,
  YouthUniversity,
  YouthDailyAssignment,
  YouthDailyAttendance,
  Campaign
} from '../types';

export interface AppScriptConfig {
  url: string;
  sheetUrl?: string;
}

export interface AppScriptConnectionStatus {
  connected: boolean;
  status: 'connected' | 'disconnected' | 'checking' | 'error';
  appName?: string;
  spreadsheetName?: string;
  spreadsheetId?: string;
  sheets?: string[];
  latencyMs?: number;
  message?: string;
  lastChecked?: string;
}

export interface AppScriptSyncSummary {
  users?: number;
  shops?: number;
  checkins?: number;
  leads?: number;
  reports?: number;
  notifications?: number;
  chatMessages?: number;
  pointOfSale?: number;
  posVisits?: number;
  transactions?: number;
  fundRequests?: number;
  youthAssignments?: number;
}

const STORAGE_KEYS = {
  APPSCRIPT_URL: 'vodacom_appscript_url_v1',
  GOOGLESHEET_URL: 'vodacom_googlesheet_url_v1',
  LAST_STATUS: 'vodacom_appscript_last_status_v1'
};

function readEnv(name: string): string | undefined {
  const env = (typeof import.meta !== 'undefined' ? (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env : undefined);
  const value = env ? env[name] : undefined;
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function getAppScriptUrl(): string {
  if (typeof window === 'undefined') return '';
  const stored = localStorage.getItem(STORAGE_KEYS.APPSCRIPT_URL);
  if (stored && stored.trim()) return stored.trim();
  const envUrl = readEnv('VITE_APPSCRIPT_URL') || readEnv('APPSCRIPT_URL');
  return envUrl ? envUrl.trim() : '';
}

export function setAppScriptUrl(url: string): void {
  if (typeof window === 'undefined') return;
  const clean = (url || '').trim();
  if (clean) {
    localStorage.setItem(STORAGE_KEYS.APPSCRIPT_URL, clean);
  } else {
    localStorage.removeItem(STORAGE_KEYS.APPSCRIPT_URL);
  }
  dispatchStatusChange();
}

export function getGoogleSheetUrl(): string {
  if (typeof window === 'undefined') return '';
  const stored = localStorage.getItem(STORAGE_KEYS.GOOGLESHEET_URL);
  if (stored && stored.trim()) return stored.trim();
  const envUrl = readEnv('VITE_GOOGLESHEET_URL') || readEnv('GOOGLESHEET_URL');
  return envUrl ? envUrl.trim() : 'https://docs.google.com/spreadsheets/d/1UXPbRj0zt3rqStMV-JGx0FUTtRUOowznkDT1N4QzGoU';
}

export function setGoogleSheetUrl(url: string): void {
  if (typeof window === 'undefined') return;
  const clean = (url || '').trim();
  if (clean) {
    localStorage.setItem(STORAGE_KEYS.GOOGLESHEET_URL, clean);
  } else {
    localStorage.removeItem(STORAGE_KEYS.GOOGLESHEET_URL);
  }
}

export function isAppScriptConfigured(): boolean {
  const url = getAppScriptUrl();
  return Boolean(url && url.startsWith('http'));
}

export function dispatchStatusChange(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vodacom-appscript-status-changed'));
  }
}

/**
 * Envoie une requête à l'Application Web Google Apps Script
 * Note : Google Apps Script requiert redirect: 'follow' et accepte text/plain sans déclencher de pré-requête CORS OPTIONS bloquante.
 */
async function callAppScript<T>(payload: Record<string, unknown>, method: 'GET' | 'POST' = 'POST'): Promise<T> {
  const url = getAppScriptUrl();
  if (!url) {
    throw new Error("L'URL Google Apps Script n'est pas configurée.");
  }

  if (method === 'GET') {
    const params = new URLSearchParams();
    Object.entries(payload).forEach(([k, v]) => {
      if (v !== undefined && v !== null) params.append(k, String(v));
    });
    const fullUrl = `${url}${url.includes('?') ? '&' : '?'}${params.toString()}`;

    const response = await fetch(fullUrl, {
      method: 'GET',
      mode: 'cors',
      redirect: 'follow',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Erreur Apps Script HTTP ${response.status} : ${response.statusText}`);
    }
    return (await response.json()) as T;
  } else {
    // Mode POST avec Content-Type text/plain pour compatibilité Apps Script sans blocage CORS
    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Erreur Apps Script HTTP ${response.status} : ${response.statusText}`);
    }
    return (await response.json()) as T;
  }
}

/**
 * Teste la connexion avec le Google Sheet via Apps Script
 */
export async function testAppScriptConnection(): Promise<AppScriptConnectionStatus> {
  const url = getAppScriptUrl();
  if (!url) {
    return {
      connected: false,
      status: 'disconnected',
      message: 'Aucune URL Google Apps Script configurée. Mode Local / Hors-ligne actif.'
    };
  }

  const start = Date.now();
  try {
    const result = await callAppScript<{
      status?: string;
      appName?: string;
      spreadsheetName?: string;
      spreadsheetId?: string;
      sheets?: string[];
      error?: string;
    }>({ action: 'ping' }, 'GET');

    const latency = Date.now() - start;

    if (result.status === 'ok') {
      const statusObj: AppScriptConnectionStatus = {
        connected: true,
        status: 'connected',
        appName: result.appName,
        spreadsheetName: result.spreadsheetName,
        spreadsheetId: result.spreadsheetId,
        sheets: result.sheets || [],
        latencyMs: latency,
        message: `Connecté avec succès au Google Sheet "${result.spreadsheetName || 'DB'}" (${latency} ms)`,
        lastChecked: new Date().toISOString()
      };
      if (result.spreadsheetId && !getGoogleSheetUrl()) {
        setGoogleSheetUrl(`https://docs.google.com/spreadsheets/d/${result.spreadsheetId}`);
      }
      return statusObj;
    } else {
      return {
        connected: false,
        status: 'error',
        message: result.error || 'Réponse inattendue de Google Apps Script',
        latencyMs: latency
      };
    }
  } catch (err: any) {
    return {
      connected: false,
      status: 'error',
      message: err.message || 'Impossible de joindre le script Google Apps Script',
      latencyMs: Date.now() - start
    };
  }
}

/**
 * Initialise toutes les feuilles dans le Google Spreadsheet avec en-têtes Vodacom
 */
export async function initGoogleSheetsViaAppScript(): Promise<{ success: boolean; message: string; created?: string[] }> {
  return await callAppScript<{ success: boolean; message: string; created?: string[] }>({
    action: 'initSheets'
  }, 'POST');
}

/**
 * Récupère l'ensemble des données de toutes les feuilles en un seul appel ultra rapide
 */
export async function fetchAllFromGoogleSheets(): Promise<Record<string, any[]>> {
  const res = await callAppScript<{
    success: boolean;
    data: Record<string, any[]>;
    error?: string;
  }>({ action: 'getAll' }, 'GET');

  if (!res.success && res.error) {
    throw new Error(res.error);
  }
  return res.data || {};
}

/**
 * Récupère les données d'une table spécifique depuis Google Sheets
 */
export async function fetchTableFromGoogleSheets<T>(tableName: string): Promise<T[]> {
  const res = await callAppScript<{
    success: boolean;
    table: string;
    data: T[];
    error?: string;
  }>({ action: 'getTable', table: tableName }, 'GET');

  if (!res.success && res.error) {
    throw new Error(res.error);
  }
  return res.data || [];
}

/**
 * Synchronise les données locales vers le Google Sheet
 */
export async function syncLocalDataToGoogleSheets(payload: {
  users?: User[];
  shops?: Shop[];
  checkins?: Checkin[];
  leads?: Lead[];
  reports?: DailyReport[];
  notifications?: NotificationItem[];
  chatMessages?: ChatMessage[];
  campaigns?: Campaign[];
  pointOfSale?: PointOfSale[];
  posVisits?: BAPosVisit[];
  transactions?: BATransaction[];
  fundRequests?: MerchantFundRequest[];
  pauses?: CampaignPause[];
  youthUniversities?: YouthUniversity[];
  youthAssignments?: YouthDailyAssignment[];
  youthAttendance?: YouthDailyAttendance[];
}): Promise<AppScriptSyncSummary> {
  const dataToSend: Record<string, any[]> = {};

  if (payload.users?.length) dataToSend['users'] = payload.users;
  if (payload.shops?.length) dataToSend['shops'] = payload.shops;
  if (payload.checkins?.length) dataToSend['checkins'] = payload.checkins;
  if (payload.leads?.length) dataToSend['leads'] = payload.leads;
  if (payload.reports?.length) dataToSend['daily_reports'] = payload.reports;
  if (payload.notifications?.length) dataToSend['notifications'] = payload.notifications;
  if (payload.chatMessages?.length) dataToSend['chat_messages'] = payload.chatMessages;
  if (payload.campaigns?.length) dataToSend['campaigns'] = payload.campaigns;
  if (payload.pointOfSale?.length) dataToSend['point_of_sale'] = payload.pointOfSale;
  if (payload.posVisits?.length) dataToSend['ba_pos_visits'] = payload.posVisits;
  if (payload.transactions?.length) dataToSend['ba_transactions'] = payload.transactions;
  if (payload.fundRequests?.length) dataToSend['merchant_fund_requests'] = payload.fundRequests;
  if (payload.pauses?.length) dataToSend['campaign_pauses'] = payload.pauses;
  if (payload.youthUniversities?.length) dataToSend['youth_universities'] = payload.youthUniversities;
  if (payload.youthAssignments?.length) dataToSend['youth_daily_assignments'] = payload.youthAssignments;
  if (payload.youthAttendance?.length) dataToSend['youth_daily_attendance'] = payload.youthAttendance;

  const result = await callAppScript<{
    success: boolean;
    message?: string;
    results?: Record<string, number>;
  }>({
    action: 'syncAll',
    data: dataToSend
  }, 'POST');

  return {
    users: payload.users?.length || 0,
    shops: payload.shops?.length || 0,
    checkins: payload.checkins?.length || 0,
    leads: payload.leads?.length || 0,
    reports: payload.reports?.length || 0,
    notifications: payload.notifications?.length || 0,
    chatMessages: payload.chatMessages?.length || 0,
    pointOfSale: payload.pointOfSale?.length || 0,
    posVisits: payload.posVisits?.length || 0,
    transactions: payload.transactions?.length || 0,
    fundRequests: payload.fundRequests?.length || 0
  };
}

/**
 * Envoie une photo pour sauvegarde dans Google Drive via Apps Script
 */
export async function uploadPhotoToGoogleDrive(
  fileOrDataUrl: string,
  filename?: string,
  folderName = 'Vodacom_BTL_Uploads'
): Promise<string> {
  if (!isAppScriptConfigured()) {
    // Si Apps Script n'est pas encore connecté, conserver la data URL en local
    return fileOrDataUrl;
  }

  try {
    let base64 = fileOrDataUrl;
    if (!fileOrDataUrl.startsWith('data:') && fileOrDataUrl.startsWith('blob:')) {
      const response = await fetch(fileOrDataUrl);
      const blob = await response.blob();
      base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }

    const res = await callAppScript<{
      success: boolean;
      url?: string;
      directUrl?: string;
      driveUrl?: string;
      error?: string;
    }>({
      action: 'uploadPhoto',
      base64,
      filename: filename || `photo_${Date.now()}.jpg`,
      folderName
    }, 'POST');

    if (res.success && (res.directUrl || res.url)) {
      return res.directUrl || res.url || fileOrDataUrl;
    }
    return fileOrDataUrl;
  } catch (e) {
    console.warn("Échec du téléversement Google Drive, utilisation locale:", e);
    return fileOrDataUrl;
  }
}

/**
 * Fonctions de compatibilité avec l'ancien système
 */
export async function fetchUsersFromGoogleSheets(): Promise<User[]> {
  const list = await fetchTableFromGoogleSheets<any>('users');
  return (list || []).map((u) => ({
    id: String(u.id ?? ''),
    phone: u.phone !== undefined && u.phone !== null ? String(u.phone) : '',
    name: String(u.name ?? ''),
    role: u.role,
    password: u.password !== undefined && u.password !== null ? String(u.password) : undefined,
    supervisorId: u.supervisorId || u.supervisor_id,
    permanentShopId: u.permanentShopId || u.permanent_shop_id || null,
    userCategory: u.userCategory || u.user_category || undefined,
    authUserId: u.authUserId || u.auth_user_id || undefined,
    created_at: u.created_at,
    last_login: u.last_login
  })) as User[];
}

export async function fetchShopsFromGoogleSheets(): Promise<Shop[]> {
  return await fetchTableFromGoogleSheets<Shop>('shops');
}

export async function fetchCheckinsFromGoogleSheets(): Promise<Checkin[]> {
  return await fetchTableFromGoogleSheets<Checkin>('checkins');
}

export async function fetchLeadsFromGoogleSheets(): Promise<Lead[]> {
  return await fetchTableFromGoogleSheets<Lead>('leads');
}

export async function fetchReportsFromGoogleSheets(): Promise<DailyReport[]> {
  return await fetchTableFromGoogleSheets<DailyReport>('daily_reports');
}

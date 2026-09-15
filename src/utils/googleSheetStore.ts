/**
 * Base de données Google Sheets & stockage local temps réel pour BTL Vodacom Tracker
 */

import type {
  Campaign,
  CampaignRun,
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
  User,
  Shop,
  Checkin,
  Lead,
  DailyReport,
  ChatMessage,
  NotificationItem
} from '../types';

import { INITIAL_USERS, INITIAL_SHOPS } from '../data/initialData';
import { MERCHANT_MFS_OPTIONS } from '../data/merchantMfs';
import {
  isAppScriptConfigured,
  syncLocalDataToGoogleSheets,
  fetchAllFromGoogleSheets,
  uploadPhotoToGoogleDrive
} from './appScriptApi';

const STORAGE_KEYS = {
  MERCHANT_CAMPAIGNS: 'btl_gs_campaigns_v1',
  MERCHANT_RUNS: 'btl_gs_campaign_runs_v1',
  MERCHANT_POS: 'btl_gs_pos_v1',
  MERCHANT_ASSIGNMENTS: 'btl_gs_assignments_v1',
  MERCHANT_ATTENDANCE: 'btl_gs_attendance_v1',
  MERCHANT_POS_VISITS: 'btl_gs_pos_visits_v1',
  MERCHANT_TRANSACTIONS: 'btl_gs_transactions_v1',
  MERCHANT_FUND_REQUESTS: 'btl_gs_fund_requests_v1',
  MERCHANT_PAUSES: 'btl_gs_pauses_v1',
  YOUTH_UNIVERSITIES: 'btl_gs_youth_universities_v1',
  YOUTH_ASSIGNMENTS: 'btl_gs_youth_assignments_v1',
  YOUTH_ATTENDANCE: 'btl_gs_youth_attendance_v1',
  USERS_CAMPAIGNS: 'btl_gs_user_campaigns_v1'
};

// Données initiales pour la campagne Marchands
const DEFAULT_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp-merchant-001',
    code: 'merchant-educational-campaign',
    name: 'Campagne Éducative Marchands MFS',
    campaign_type: 'brand_ambassador',
    status: 'active',
    starts_on: '2026-08-24',
    ends_on: '2026-10-31',
    daily_pos_target: 10,
    transactions_per_pos_target: 5
  },
  {
    id: 'camp-privilege-001',
    code: 'vodacom-privilege',
    name: 'Vodacom Privilège VIP Shops',
    campaign_type: 'hostess',
    status: 'active',
    starts_on: '2026-08-01',
    ends_on: '2026-12-31'
  },
  {
    id: 'camp-youth-001',
    code: 'youth-f2f',
    name: 'Youth Face-to-Face Universités',
    campaign_type: 'brand_ambassador',
    status: 'active',
    starts_on: '2026-08-24',
    ends_on: '2026-11-30'
  }
];

const DEFAULT_CAMPAIGN_RUNS: CampaignRun[] = [
  {
    id: 'run-merchant-001',
    campaign_id: 'camp-merchant-001',
    name: 'Vague 1 - Kinshasa Éducative MFS',
    starts_on: '2026-08-24',
    ends_on: '2026-10-31',
    status: 'active',
    daily_pos_target: 10,
    transactions_per_pos_target: 5,
    campaign_pos_target: 600
  }
];

const POOLS: Array<'Funa' | 'Mont amba' | 'Tshangu' | 'Lukunga'> = ['Funa', 'Mont amba', 'Tshangu', 'Lukunga'];

function generateInitialPOS(): PointOfSale[] {
  const list: PointOfSale[] = [];
  const names = [
    { name: 'Alimentation La Grâce', pool: 'Funa', addr: 'Av. Kasa-Vubu 45, Kalamu' },
    { name: 'Superette Le Palmier', pool: 'Funa', addr: 'Av. Victoire 12, Kalamu' },
    { name: 'Pharmacie Saint-Sauveur', pool: 'Lukunga', addr: 'Blvd du 30 Juin, Gombe' },
    { name: 'Boutique Ets Koma', pool: 'Mont amba', addr: 'Av. Université 89, Lemba' },
    { name: 'Alimentation Bon Berger', pool: 'Tshangu', addr: 'Blvd Lumumba 210, Masina' },
    { name: 'Dépôt Central Ndjili', pool: 'Tshangu', addr: 'Sainte Thérèse, Ndjili' },
    { name: 'Boutique Express Kintambo', pool: 'Lukunga', addr: 'Av. Nguma, Kintambo' },
    { name: 'Quincaillerie Moderne', pool: 'Mont amba', addr: 'Rond-Point Ngaba' },
    { name: 'Mini-Market Bandal', pool: 'Funa', addr: 'Av. Kimbondo, Bandalungwa' },
    { name: 'Ets La Confiance M-Pesa', pool: 'Lukunga', addr: 'Av. Huileries, Gombe' },
    { name: 'Super Marché Étoile', pool: 'Funa', addr: 'Av. Victoire, Matete' },
    { name: 'Maison Bienvenue MFS', pool: 'Mont amba', addr: 'Av. By-Pass, Lemba' }
  ];

  for (let i = 0; i < names.length; i++) {
    const item = names[i];
    const mfs = MERCHANT_MFS_OPTIONS[i % MERCHANT_MFS_OPTIONS.length];
    list.push({
      id: `pos-${(i + 1).toString().padStart(3, '0')}`,
      campaign_id: 'camp-merchant-001',
      denomination: item.name,
      agent_number: `081${(1000000 + i * 173).toString().slice(0, 7)}`,
      address: item.addr,
      activity: 'Commerce Général & M-Pesa',
      mfs_name: mfs,
      pool: item.pool as any,
      latitude: -4.32 + (i * 0.005),
      longitude: 15.29 + (i * 0.007),
      is_active: true
    });
  }
  return list;
}

const DEFAULT_UNIVERSITIES: YouthUniversity[] = [
  {
    id: 'univ-001',
    campaign_id: 'camp-youth-001',
    code: 'UNIKIN',
    name: 'Université de Kinshasa (UNIKIN)',
    commune: 'Lemba',
    address: 'Mont Amba, Lemba',
    latitude: -4.4177,
    longitude: 15.3094,
    location_validation_status: 'validated',
    is_active: true
  },
  {
    id: 'univ-002',
    campaign_id: 'camp-youth-001',
    code: 'UPC',
    name: 'Université Protestante au Congo (UPC)',
    commune: 'Lingwala',
    address: 'Av. de la Libération, Lingwala',
    latitude: -4.3283,
    longitude: 15.2974,
    location_validation_status: 'validated',
    is_active: true
  },
  {
    id: 'univ-003',
    campaign_id: 'camp-youth-001',
    code: 'ISTA',
    name: 'Institut Supérieur des Techniques Appliquées (ISTA)',
    commune: 'Barumbu',
    address: 'Av. Aérodrome, Barumbu',
    latitude: -4.3167,
    longitude: 15.3333,
    location_validation_status: 'validated',
    is_active: true
  },
  {
    id: 'univ-004',
    campaign_id: 'camp-youth-001',
    code: 'IFASIC',
    name: 'Institut Facultaire des Sciences de l\'Info (IFASIC)',
    commune: 'Gombe',
    address: 'Av. de la Paix, Gombe',
    latitude: -4.3055,
    longitude: 15.3080,
    location_validation_status: 'validated',
    is_active: true
  }
];

// Gestion du stockage local avec typage sûr
function loadLocalList<T>(key: string, defaultVal: T[]): T[] {
  if (typeof window === 'undefined') return defaultVal;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultVal));
      return defaultVal;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : defaultVal;
  } catch {
    return defaultVal;
  }
}

function saveLocalList<T>(key: string, list: T[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch (e) {
    console.warn(`Erreur sauvegarde localStorage pour ${key}:`, e);
  }
}

// État mémoire réactif
let memoryStore = {
  campaigns: loadLocalList<Campaign>(STORAGE_KEYS.MERCHANT_CAMPAIGNS, DEFAULT_CAMPAIGNS),
  campaign_runs: loadLocalList<CampaignRun>(STORAGE_KEYS.MERCHANT_RUNS, DEFAULT_CAMPAIGN_RUNS),
  point_of_sale: loadLocalList<PointOfSale>(STORAGE_KEYS.MERCHANT_POS, generateInitialPOS()),
  ba_daily_assignments: loadLocalList<BADailyAssignment>(STORAGE_KEYS.MERCHANT_ASSIGNMENTS, []),
  ba_daily_attendance: loadLocalList<BADailyAttendance>(STORAGE_KEYS.MERCHANT_ATTENDANCE, []),
  ba_pos_visits: loadLocalList<BAPosVisit>(STORAGE_KEYS.MERCHANT_POS_VISITS, []),
  ba_transactions: loadLocalList<BATransaction>(STORAGE_KEYS.MERCHANT_TRANSACTIONS, []),
  merchant_fund_requests: loadLocalList<MerchantFundRequest>(STORAGE_KEYS.MERCHANT_FUND_REQUESTS, []),
  campaign_pauses: loadLocalList<CampaignPause>(STORAGE_KEYS.MERCHANT_PAUSES, []),
  youth_universities: loadLocalList<YouthUniversity>(STORAGE_KEYS.YOUTH_UNIVERSITIES, DEFAULT_UNIVERSITIES),
  youth_daily_assignments: loadLocalList<YouthDailyAssignment>(STORAGE_KEYS.YOUTH_ASSIGNMENTS, []),
  youth_daily_attendance: loadLocalList<YouthDailyAttendance>(STORAGE_KEYS.YOUTH_ATTENDANCE, []),
  user_campaign_assignments: loadLocalList<any>(STORAGE_KEYS.USERS_CAMPAIGNS, [
    { user_id: 'agt-test-ba-herve-0821000001', campaign_id: 'camp-merchant-001', is_active: true },
    { user_id: 'agt-test-ba-herve-0821000001', campaign_id: 'camp-youth-001', is_active: true }
  ])
};

/**
 * File d'attente d'arrière-plan pour synchroniser avec Google Sheets
 */
let syncTimeout: any = null;
export function scheduleGoogleSheetSync(): void {
  if (typeof window === 'undefined' || !isAppScriptConfigured()) return;
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(async () => {
    try {
      await syncLocalDataToGoogleSheets({
        campaigns: memoryStore.campaigns,
        pointOfSale: memoryStore.point_of_sale,
        posVisits: memoryStore.ba_pos_visits,
        transactions: memoryStore.ba_transactions,
        fundRequests: memoryStore.merchant_fund_requests,
        pauses: memoryStore.campaign_pauses,
        youthUniversities: memoryStore.youth_universities,
        youthAssignments: memoryStore.youth_daily_assignments,
        youthAttendance: memoryStore.youth_daily_attendance
      });
    } catch (err) {
      console.warn('Sync Google Sheets différé échoué (sera réessayé):', err);
    }
  }, 2500);
}

/**
 * Charge l'ensemble des données depuis Google Sheets si configuré
 */
export async function reloadFromGoogleSheets(): Promise<boolean> {
  if (!isAppScriptConfigured()) return false;
  try {
    const all = await fetchAllFromGoogleSheets();
    if (all.point_of_sale && all.point_of_sale.length > 0) {
      memoryStore.point_of_sale = all.point_of_sale;
      saveLocalList(STORAGE_KEYS.MERCHANT_POS, memoryStore.point_of_sale);
    }
    if (all.ba_pos_visits && all.ba_pos_visits.length > 0) {
      memoryStore.ba_pos_visits = all.ba_pos_visits;
      saveLocalList(STORAGE_KEYS.MERCHANT_POS_VISITS, memoryStore.ba_pos_visits);
    }
    if (all.ba_transactions && all.ba_transactions.length > 0) {
      memoryStore.ba_transactions = all.ba_transactions;
      saveLocalList(STORAGE_KEYS.MERCHANT_TRANSACTIONS, memoryStore.ba_transactions);
    }
    if (all.merchant_fund_requests && all.merchant_fund_requests.length > 0) {
      memoryStore.merchant_fund_requests = all.merchant_fund_requests;
      saveLocalList(STORAGE_KEYS.MERCHANT_FUND_REQUESTS, memoryStore.merchant_fund_requests);
    }
    if (all.campaign_pauses && all.campaign_pauses.length > 0) {
      memoryStore.campaign_pauses = all.campaign_pauses;
      saveLocalList(STORAGE_KEYS.MERCHANT_PAUSES, memoryStore.campaign_pauses);
    }
    if (all.campaigns && all.campaigns.length > 0) {
      memoryStore.campaigns = all.campaigns;
      saveLocalList(STORAGE_KEYS.MERCHANT_CAMPAIGNS, memoryStore.campaigns);
    }
    return true;
  } catch (e) {
    console.warn("Échec rechargement Google Sheets:", e);
    return false;
  }
}

/**
 * Adaptateur de requête qui reproduit l'interface Supabase client
 * mais opère instantanément sur le store local & Google Sheets !
 */
class TableQueryBuilder {
  private tableName: string;
  private filters: Array<(row: any) => boolean> = [];
  private orderField: string | null = null;
  private orderAscending = true;
  private limitCount: number | null = null;
  private selectFields: string | null = null;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(fields = '*'): this {
    this.selectFields = fields;
    return this;
  }

  eq(column: string, value: any): this {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  neq(column: string, value: any): this {
    this.filters.push((row) => row[column] !== value);
    return this;
  }

  in(column: string, values: any[]): this {
    const set = new Set(values);
    this.filters.push((row) => set.has(row[column]));
    return this;
  }

  is(column: string, value: any): this {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  gte(column: string, value: any): this {
    this.filters.push((row) => row[column] >= value);
    return this;
  }

  lte(column: string, value: any): this {
    this.filters.push((row) => row[column] <= value);
    return this;
  }

  order(column: string, opts?: { ascending?: boolean }): this {
    this.orderField = column;
    this.orderAscending = opts?.ascending !== false;
    return this;
  }

  limit(count: number): this {
    this.limitCount = count;
    return this;
  }

  range(from: number, to: number): this {
    this.limitCount = (to - from) + 1;
    return this;
  }

  private getTableList(): any[] {
    const map = memoryStore as any;
    if (!map[this.tableName]) {
      map[this.tableName] = [];
    }
    return map[this.tableName];
  }

  private saveTableList(list: any[]): void {
    (memoryStore as any)[this.tableName] = list;
    const storageKey = (STORAGE_KEYS as any)[`MERCHANT_${this.tableName.toUpperCase()}`] ||
                       (STORAGE_KEYS as any)[`YOUTH_${this.tableName.toUpperCase()}`] ||
                       `btl_gs_${this.tableName}_v1`;
    saveLocalList(storageKey, list);
    scheduleGoogleSheetSync();
  }

  private executeQuery(): any[] {
    let rows = [...this.getTableList()];

    for (const f of this.filters) {
      rows = rows.filter(f);
    }

    if (this.orderField) {
      const field = this.orderField;
      const asc = this.orderAscending ? 1 : -1;
      rows.sort((a, b) => {
        const valA = a[field];
        const valB = b[field];
        if (valA === valB) return 0;
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        return valA > valB ? asc : -asc;
      });
    }

    if (this.limitCount !== null) {
      rows = rows.slice(0, this.limitCount);
    }

    // Joindre des relations courantes
    if (this.tableName === 'ba_pos_visits') {
      rows = rows.map((v) => ({
        ...v,
        point_of_sale: memoryStore.point_of_sale.find((p) => p.id === v.pos_id),
        transactions: memoryStore.ba_transactions.filter((t) => t.pos_visit_id === v.id)
      }));
    } else if (this.tableName === 'ba_daily_assignments') {
      rows = rows.map((a) => ({
        ...a,
        point_of_sale: memoryStore.point_of_sale.find((p) => p.id === a.pos_id)
      }));
    } else if (this.tableName === 'ba_transactions') {
      rows = rows.map((t) => ({
        ...t,
        point_of_sale: memoryStore.point_of_sale.find((p) => p.id === t.pos_id)
      }));
    } else if (this.tableName === 'merchant_fund_requests') {
      rows = rows.map((r) => ({
        ...r,
        point_of_sale: memoryStore.point_of_sale.find((p) => p.id === r.pos_id),
        ba: INITIAL_USERS.find((u) => u.id === r.ba_id),
        supervisor: INITIAL_USERS.find((u) => u.id === r.supervisor_id)
      }));
    } else if (this.tableName === 'youth_daily_assignments') {
      rows = rows.map((a) => ({
        ...a,
        university: memoryStore.youth_universities.find((u) => u.id === a.university_id)
      }));
    } else if (this.tableName === 'user_campaign_assignments') {
      rows = rows.map((a) => ({
        ...a,
        campaign: memoryStore.campaigns.find((c) => c.id === a.campaign_id)
      }));
    }

    return rows;
  }

  async insert(data: any | any[]): Promise<{ data: any; error: any }> {
    const list = this.getTableList();
    const items = Array.isArray(data) ? data : [data];
    const created: any[] = [];

    for (const item of items) {
      const obj = {
        ...item,
        id: item.id || `rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        created_at: item.created_at || new Date().toISOString()
      };
      list.push(obj);
      created.push(obj);
    }
    this.saveTableList(list);
    return { data: Array.isArray(data) ? created : created[0], error: null };
  }

  async upsert(data: any | any[], opts?: { onConflict?: string }): Promise<{ data: any; error: any }> {
    let list = this.getTableList();
    const items = Array.isArray(data) ? data : [data];
    const conflictField = opts?.onConflict || 'id';

    for (const item of items) {
      const conflictVal = item[conflictField];
      const existingIdx = list.findIndex((x) => x[conflictField] === conflictVal);
      if (existingIdx >= 0) {
        list[existingIdx] = { ...list[existingIdx], ...item };
      } else {
        list.push({
          ...item,
          id: item.id || `rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        });
      }
    }
    this.saveTableList(list);
    return { data, error: null };
  }

  async update(patch: any): Promise<{ data: any; error: any }> {
    let list = this.getTableList();
    const updated: any[] = [];

    for (let i = 0; i < list.length; i++) {
      let matches = true;
      for (const f of this.filters) {
        if (!f(list[i])) {
          matches = false;
          break;
        }
      }
      if (matches) {
        list[i] = { ...list[i], ...patch, updated_at: new Date().toISOString() };
        updated.push(list[i]);
      }
    }
    this.saveTableList(list);
    return { data: updated, error: null };
  }

  async delete(): Promise<{ data: any; error: any }> {
    let list = this.getTableList();
    const remaining = list.filter((item) => {
      for (const f of this.filters) {
        if (f(item)) return false;
      }
      return true;
    });
    this.saveTableList(remaining);
    return { data: null, error: null };
  }

  async single(): Promise<{ data: any; error: any }> {
    const results = this.executeQuery();
    if (!results.length) {
      return { data: null, error: new Error('Aucun enregistrement trouvé') };
    }
    return { data: results[0], error: null };
  }

  async maybeSingle(): Promise<{ data: any; error: any }> {
    const results = this.executeQuery();
    return { data: results[0] || null, error: null };
  }

  then(onfulfilled?: (value: { data: any; error: any }) => any, onrejected?: (reason: any) => any): Promise<any> {
    const result = { data: this.executeQuery(), error: null };
    return Promise.resolve(result).then(onfulfilled, onrejected);
  }
}

/**
 * Client Google Sheets qui fournit l'interface `.from(table)`
 */
export class GoogleSheetsDatabaseClient {
  from(tableName: string): TableQueryBuilder {
    return new TableQueryBuilder(tableName);
  }

  get storage() {
    return {
      from: (bucket: string) => ({
        upload: async (fileName: string, blob: Blob) => {
          return { data: { path: fileName }, error: null };
        },
        getPublicUrl: (fileName: string) => {
          return { data: { publicUrl: fileName } };
        }
      })
    };
  }

  get auth() {
    return {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      signOut: async () => ({ error: null })
    };
  }
}

export const sharedGoogleSheetsClient = new GoogleSheetsDatabaseClient();

export function getGoogleSheetsDatabaseClient(): GoogleSheetsDatabaseClient {
  return sharedGoogleSheetsClient;
}

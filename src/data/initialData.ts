import { User, Shop, Lead, DailyReport, NotificationItem, ChatMessage, Checkin } from '../types';

export const INITIAL_SHOPS: Shop[] = [
  { id: 'HUB-001', name: "Hub RIDA Carrefour Lubumbashi", city: "Lubumbashi", lat: -11.6608, long: 27.4794, type: 'Standard' },
  { id: 'HUB-002', name: "Hub RIDA Marché Kenya", city: "Lubumbashi", lat: -11.6853, long: 27.4642, type: 'Standard' },
  { id: 'HUB-003', name: "Hub RIDA Carrefour Bel-Air", city: "Lubumbashi", lat: -11.6412, long: 27.4931, type: 'Standard' },
  { id: 'HUB-004', name: "Hub RIDA Golf Météo / Carrefour Golf", city: "Lubumbashi", lat: -11.6325, long: 27.4418, type: 'Standard' },
  { id: 'HUB-005', name: "Hub RIDA Campus UNILU (Kassapa)", city: "Lubumbashi", lat: -11.6192, long: 27.4735, type: 'Standard' },
  { id: 'HUB-006', name: "Hub RIDA Centre-Ville (Kilela Balanda)", city: "Lubumbashi", lat: -11.6672, long: 27.4819, type: 'Standard' },
  { id: 'HUB-007', name: "Hub RIDA Carrefour Ruashi", city: "Lubumbashi", lat: -11.6258, long: 27.5312, type: 'Standard' },
  { id: 'HUB-008', name: "Hub RIDA Marché Central Mzée Kabila", city: "Lubumbashi", lat: -11.6631, long: 27.4767, type: 'Standard' },
  { id: 'HUB-009', name: "Hub RIDA Katuba (Stade / Carrefour)", city: "Lubumbashi", lat: -11.6981, long: 27.4523, type: 'Standard' },
  { id: 'HUB-010', name: "Hub RIDA Kamalondo / Gare SNCC", city: "Lubumbashi", lat: -11.6738, long: 27.4912, type: 'Standard' },
  { id: 'HUB-011', name: "Hub RIDA Aéroport International Luano", city: "Lubumbashi", lat: -11.5913, long: 27.5309, type: 'Airport' }
];

export const INITIAL_USERS: User[] = [
  { id: '0a6a2520-96bb-474d-87b6-b0eb8fc46cd6', phone: '0896332431', name: 'Eldo Bitulu', role: 'admin', permanentShopId: 'HUB-001' },
  { id: 'adm-0001-4a11-a881-100000000001', phone: '0816701000', name: 'Bradley Izamaboko', role: 'super_admin', permanentShopId: 'HUB-001' },
  { id: 'usr-8d3144f8', phone: '0810933351', name: 'Ruth Mafuta', role: 'admin', permanentShopId: 'HUB-001' },
  { id: 'sup-0001-4a11-a881-100000000001', phone: '0812923941', name: 'Hervé Ntalu (Sup. Carrefour)', role: 'supervisor', permanentShopId: 'HUB-001' },
  { id: 'sup-0002-4a11-a881-100000000002', phone: '0810000001', name: 'Superviseur Lubumbashi', role: 'supervisor', permanentShopId: 'HUB-002' },
  { id: 'arnold-koma-sub-admin', phone: '0823031980', name: 'Arnold Koma', role: 'sub_admin', userCategory: 'operations', password: 'test', permanentShopId: 'HUB-006' },
  { id: 'agt-test-ba-herve-0821000001', phone: '0821000001', name: 'Agent RIDA Lubumbashi', role: 'agent', userCategory: 'rida_agent', password: 'password', supervisorId: 'sup-0001-4a11-a881-100000000001', permanentShopId: 'HUB-001' },
  { id: 'agt-0001-4a11-a881-200000000002', phone: '0821000002', name: 'Patrick Ilunga', role: 'agent', supervisorId: 'sup-0002-4a11-a881-100000000002', permanentShopId: 'HUB-002' },
  { id: 'agt-0001-4a11-a881-200000000004', phone: '0827666847', name: 'Djenny Fondo', role: 'agent', supervisorId: 'sup-0001-4a11-a881-100000000001', permanentShopId: 'HUB-001' },
  { id: 'agt-0001-4a11-a881-200000000005', phone: '0824895691', name: 'Jonathan Mwamba', role: 'agent', supervisorId: 'sup-0001-4a11-a881-100000000001', permanentShopId: 'HUB-003' },
  { id: 'agt-0001-4a11-a881-200000000006', phone: '0818974304', name: 'Grâce Kalenga', role: 'agent', supervisorId: 'sup-0001-4a11-a881-100000000001', permanentShopId: 'HUB-004' },
  { id: 'agt-0001-4a11-a881-200000000007', phone: '0820877751', name: 'Christian Kyungu', role: 'agent', supervisorId: 'sup-0001-4a11-a881-100000000001', permanentShopId: 'HUB-005' },
  { id: 'agt-0001-4a11-a881-200000000008', phone: '0813122553', name: 'Deborah Kenkani', role: 'agent', supervisorId: 'sup-0001-4a11-a881-100000000001', permanentShopId: 'HUB-006' },
  { id: 'agt-0001-4a11-a881-200000000009', phone: '0994691450', name: 'Vanessa Mpununu', role: 'agent', supervisorId: 'sup-0001-4a11-a881-100000000001', permanentShopId: 'HUB-007' },
  { id: 'agt-0001-4a11-a881-200000000010', phone: '0859371721', name: 'Ruth Banze', role: 'agent', supervisorId: 'sup-0001-4a11-a881-100000000001', permanentShopId: 'HUB-008' },
  { id: 'agt-0001-4a11-a881-200000000011', phone: '0984991264', name: 'Eurêka Mukendi', role: 'agent', supervisorId: 'sup-0001-4a11-a881-100000000001', permanentShopId: 'HUB-009' },
  { id: 'agt-0001-4a11-a881-200000000012', phone: '0830035167', name: 'Christvie Lilenda', role: 'agent', supervisorId: 'sup-0001-4a11-a881-100000000001', permanentShopId: 'HUB-010' },
  { id: 'agt-0001-4a11-a881-200000000013', phone: '0990000036', name: 'Priskette Tshingila', role: 'agent', supervisorId: 'sup-0001-4a11-a881-100000000001', permanentShopId: 'HUB-011' }
];

export const INITIAL_CHECKINS: Checkin[] = [];
export const INITIAL_LEADS: Lead[] = [];
export const INITIAL_REPORTS: DailyReport[] = [];
export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];
export const INITIAL_CHAT: ChatMessage[] = [];

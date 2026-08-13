// src/types/family.types.ts

import { UUID } from './common.types';

export type UserRole = 'admin' | 'parent' | 'child' | 'guest' | 'babysitter';

// ─── Family ──────────────────────────────────────
export interface Family {
  id: UUID;
  name: string;
  created_at: string; // ISO 8601
}

export interface CreateFamilyInput {
  name: string;
  photo_url?: string;
}

// ─── Baby ────────────────────────────────────────
export type BabyGender = 'male' | 'female';

export interface Baby {
  id: UUID;
  family_id: UUID;
  name: string;
  birth_date: string; // YYYY-MM-DD
  sex: BabyGender;
  photo_url?: string;
  created_at: string; // ISO 8601
}

export interface CreateBabyInput {
  name: string;
  birth_date: string; // YYYY-MM-DD
  sex: BabyGender;
  photo_url?: string;
}

// ─── Baby Record ─────────────────────────────────
export type RecordType = 'feeding' | 'diaper' | 'sleep' | 'medication' | 'weight' | 'height' | 'temperature' | 'note';

export interface BabyRecord {
  id: UUID;
  baby_id: UUID;
  family_id: UUID;
  type: RecordType;
  started_at: string;       // ISO 8601
  ended_at?: string;        // ISO 8601
  // Feeding
  feeding_type?: 'breast_left' | 'breast_right' | 'bottle' | 'solid';
  feeding_amount_ml?: number;
  // Diaper
  diaper_type?: 'pee' | 'poo' | 'both';
  // Sleep
  sleep_type?: 'nap' | 'night';
  // Measurements
  weight_kg?: number;
  height_cm?: number;
  temperature_c?: number;
  // Medication
  medication_name?: string;
  medication_dose?: string;
  // Common
  notes?: string;
  created_by: UUID;
  created_at: string;
}

export interface CreateBabyRecordInput {
  type: RecordType;
  started_at: string;
  ended_at?: string;
  feeding_type?: BabyRecord['feeding_type'];
  feeding_amount_ml?: number;
  diaper_type?: BabyRecord['diaper_type'];
  sleep_type?: BabyRecord['sleep_type'];
  weight_kg?: number;
  height_cm?: number;
  temperature_c?: number;
  medication_name?: string;
  medication_dose?: string;
  notes?: string;
}

// ─── Profile (Member) ────────────────────────────
export interface Profile {
  id: UUID;
  user_id?: UUID;      // null para crianças sem conta Auth (role=child)
  family_id?: UUID;
  name: string;
  avatar_url?: string;
  role: UserRole;
  birth_date?: string; // YYYY-MM-DD — presente para crianças (role=child)
  pin_hash?: string;   // hash bcrypt do PIN de acesso da criança
  created_at: string;  // ISO 8601
}

// ─── Invite ──────────────────────────────────────
export interface GuestInvite {
  id: UUID;
  family_id: UUID;
  token: string;
  scope: UserRole; // Role que o convidado terá
  expires_at: string; // ISO 8601
  created_by: UUID;
  used_by?: UUID;
  revoked_at?: string; // ISO 8601 — preenchido quando admin revoga
  label?: string;     // nome legível do convidado (ex: "Vovó Maria")
  created_at: string; // ISO 8601
}

export interface InviteLink {
  token: string;
  link: string; // https://ninho.app/invite/[token]
  deeplink: string; // ninho://invite/[token]
  expires_at: string; // ISO 8601
}

/** Convite pendente (ainda não aceito) — exibido na lista de membros */
export interface PendingInvite {
  id: UUID;
  token: string;
  scope: UserRole;
  expires_at: string;   // ISO 8601
  created_at: string;   // ISO 8601
  revoked_at?: string;  // ISO 8601
  label?: string;
  /** Dias restantes (positivo) ou 0 se expirado */
  daysLeft: number;
}

// ─── Guest Shopping Link ──────────────────────────
// Link temporário que permite visualizar e marcar itens da lista
// sem exigir conta permanente (acesso via token no JWT claim).
export interface GuestShoppingLink {
  id: UUID;
  family_id: UUID;
  token: string;
  created_by: UUID;
  expires_at: string; // ISO 8601
  revoked_at?: string; // ISO 8601 — presente se revogado
  created_at: string; // ISO 8601
}

export interface GuestShoppingLinkResponse {
  token: string;
  family_id: UUID;
  expires_at: string; // ISO 8601
}

/** Estado de uma sessão de convidado (armazenado em memória / AsyncStorage) */
export interface GuestSession {
  token: string;
  family_id: UUID;
  expires_at: string; // ISO 8601
}

// ─── Context State ───────────────────────────────
export interface FamilyContextType {
  // State
  family: Family | null;
  babies: Baby[];
  members: Profile[];
  currentBaby: Baby | null;
  loading: boolean;
  error: string | null;

  // Actions
  createFamily: (input: CreateFamilyInput) => Promise<Family>;
  updateFamily: (id: UUID, updates: Partial<Family>) => Promise<Family>;
  addBaby: (input: CreateBabyInput) => Promise<Baby>;
  updateBaby: (id: UUID, updates: Partial<Baby>) => Promise<Baby>;
  deleteBaby: (id: UUID) => Promise<void>;
  setCurrentBaby: (baby: Baby | null) => void;
  joinFamilyByInvite: (token: string) => Promise<Family>;
  loadFamily: (familyId: UUID) => Promise<void>;
  clearError: () => void;
}

// ─── Response Types ──────────────────────────────
export interface FamilyResponse {
  family: Family;
  babies: Baby[];
  members: Profile[];
}

export interface InviteLinkResponse {
  token: string;
  link: string;
  deeplink: string;
  expires_at: string;
  /** Dias de validade selecionados ao gerar (1 | 7 | 30) */
  expiresInDays?: number;
}

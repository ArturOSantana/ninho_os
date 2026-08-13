import { supabase } from '@/lib/supabase';
import { Profile, Family, Baby } from '@/types';

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function signUpWithEmail(email: string, password: string, name: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) throw error;
  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) return null;
  return data;
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Family ───────────────────────────────────────────────────────────────────

export async function createFamily(name: string): Promise<Family> {
  // Usa RPC para criar família e vincular ao perfil atomicamente numa transação.
  // Isso evita o 401 da RLS: auth_family_id() só teria valor após o UPDATE do
  // profile, que agora acontece dentro da mesma função no banco.
  const { data, error } = await supabase.rpc('create_family_for_user', { family_name: name });
  if (error) throw error;
  return data as Family;
}

export async function getFamily(familyId: string): Promise<Family | null> {
  const { data, error } = await supabase
    .from('families')
    .select('*')
    .eq('id', familyId)
    .single();
  if (error) return null;
  return data;
}

export async function joinFamilyByInvite(token: string) {
  const { data, error } = await supabase.rpc('join_family_by_invite', { invite_token: token });
  if (error) throw error;
  return data;
}

export async function createFamilyInvite(familyId: string, scope: string, expiresInHours = 48) {
  const { data, error } = await supabase
    .from('guest_invites')
    .insert({
      family_id: familyId,
      scope,
      expires_at: new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Babies ───────────────────────────────────────────────────────────────────

export async function createBaby(
  familyId: string,
  payload: { name: string; birth_date: string; sex: 'male' | 'female'; photo_url?: string }
): Promise<Baby> {
  const { data, error } = await supabase
    .from('babies')
    .insert({ family_id: familyId, ...payload })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getBabies(familyId: string): Promise<Baby[]> {
  const { data, error } = await supabase
    .from('babies')
    .select('*')
    .eq('family_id', familyId)
    .order('birth_date', { ascending: true });
  if (error) return [];
  return data;
}

// ─── Baby Logs ────────────────────────────────────────────────────────────────

export async function createBabyRecord(record: {
  baby_id: string;
  family_id: string;
  created_by: string;
  type: string;
  started_at?: string;
  ended_at?: string;
  feeding_type?: string;
  feeding_amount_ml?: number;
  diaper_type?: string;
  sleep_type?: string;
  weight_kg?: number;
  height_cm?: number;
  temperature_c?: number;
  medication_name?: string;
  medication_dose?: string;
  notes?: string;
}) {
  const payload = {
    ...record,
    started_at: record.started_at ?? new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('baby_logs')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getBabyRecordsToday(babyId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { data, error } = await supabase
    .from('baby_logs')
    .select('*')
    .eq('baby_id', babyId)
    .gte('started_at', today.toISOString())
    .order('started_at', { ascending: false });
  if (error) return [];
  return data;
}

/** Retorna registros do bebê dos últimos N dias, ordenado mais recente primeiro */
export async function getBabyRecordsHistory(babyId: string, days = 7) {
  const from = new Date();
  from.setDate(from.getDate() - days);
  from.setHours(0, 0, 0, 0);
  const { data, error } = await supabase
    .from('baby_logs')
    .select('*')
    .eq('baby_id', babyId)
    .gte('started_at', from.toISOString())
    .order('started_at', { ascending: false });
  if (error) return [];
  return data;
}

export async function getLastBabyRecord(babyId: string, type: string) {
  const { data, error } = await supabase
    .from('baby_logs')
    .select('*')
    .eq('baby_id', babyId)
    .eq('type', type)
    .order('started_at', { ascending: false })
    .limit(1)
    .single();
  if (error) return null;
  return data;
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function getTasksToday(familyId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data, error } = await supabase
    .from('tasks')
    .select('*, assigned_profile:profiles(name)')
    .eq('family_id', familyId)
    .neq('status', 'done')
    .order('priority', { ascending: false });
  if (error) return [];
  return data;
}

export async function createTask(task: {
  family_id: string;
  title: string;
  description?: string;
  assigned_to?: string;
  priority?: string;
  due_date?: string;
  category?: string;
  created_by: string;
}) {
  const { data, error } = await supabase
    .from('tasks')
    .insert({ status: 'pending', points: 10, ...task })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function completeTask(taskId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .update({ status: 'done' })
    .eq('id', taskId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Events ───────────────────────────────────────────────────────────────────

export async function getNextEvent(familyId: string) {
  const { data, error } = await supabase
    .from('family_events')
    .select('*')
    .eq('family_id', familyId)
    .gte('start_at', new Date().toISOString())
    .order('start_at', { ascending: true })
    .limit(1)
    .single();
  if (error) return null;
  return data;
}

export async function createEvent(event: {
  family_id: string;
  title: string;
  description?: string;
  start_at: string;
  end_at?: string;
  all_day?: boolean;
  category?: string;
  created_by: string;
}) {
  const { data, error } = await supabase
    .from('family_events')
    .insert({ all_day: false, category: 'other', ...event })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Shopping ─────────────────────────────────────────────────────────────────

export async function getShoppingList(familyId: string) {
  const { data, error } = await supabase
    .from('shopping_items')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: true });
  if (error) return [];
  return data;
}

export async function addShoppingItem(item: {
  family_id: string;
  name: string;
  quantity?: number;
  unit?: string;
  category?: string;
  added_by: string;
}) {
  const { data, error } = await supabase
    .from('shopping_items')
    .insert({ checked: false, ...item })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function toggleShoppingItem(itemId: string, checked: boolean, checkedBy?: string) {
  const { data, error } = await supabase
    .from('shopping_items')
    .update({ checked, checked_by: checkedBy })
    .eq('id', itemId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

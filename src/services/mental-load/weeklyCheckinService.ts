// src/services/mental-load/weeklyCheckinService.ts
// UC030 — Check-in semanal guiado
// As respostas são visíveis apenas para os 2 adultos da família

import { supabase } from '@/lib/supabase';
import { UUID } from '@/types/common.types';

export interface WeeklyCheckinAnswer {
  question_index: number; // 0, 1 ou 2
  answer: string;
}

export interface WeeklyCheckin {
  id: UUID;
  family_id: UUID;
  week_start: string;      // YYYY-MM-DD (segunda-feira)
  answered_by: UUID;       // profiles.id
  answers: WeeklyCheckinAnswer[];
  created_at: string;
  updated_at: string;
}

export interface UpsertCheckinInput {
  family_id: UUID;
  week_start: string;
  answers: WeeklyCheckinAnswer[];
}

/** Calcula a data da segunda-feira da semana atual (YYYY-MM-DD) */
export function currentWeekStart(): string {
  const now  = new Date();
  const day  = now.getDay();               // 0=dom, 1=seg, …
  const diff = (day === 0 ? -6 : 1 - day); // desloca para segunda
  const mon  = new Date(now);
  mon.setDate(now.getDate() + diff);
  return mon.toISOString().substring(0, 10);
}

/** Retorna o profiles.id do usuário autenticado */
async function getProfileId(): Promise<UUID> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();
  if (error || !data) throw new Error('Perfil não encontrado');
  return data.id as UUID;
}

export const weeklyCheckinService = {
  /**
   * UC030 — Salvar (insert ou update) check-in da semana do usuário
   * answered_by é resolvido internamente pelo profile do usuário autenticado
   */
  async upsert(input: UpsertCheckinInput): Promise<WeeklyCheckin> {
    const profileId = await getProfileId();

    const { data, error } = await supabase
      .from('weekly_checkins')
      .upsert(
        {
          family_id:   input.family_id,
          week_start:  input.week_start,
          answered_by: profileId,
          answers:     input.answers,
          updated_at:  new Date().toISOString(),
        },
        { onConflict: 'family_id,week_start,answered_by' }
      )
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as WeeklyCheckin;
  },

  /**
   * UC030 — Buscar check-ins da semana atual para os membros da família
   * (visíveis apenas para os adultos da família — RLS garante o escopo)
   */
  async getWeekCheckins(familyId: UUID, weekStart?: string): Promise<WeeklyCheckin[]> {
    const week = weekStart ?? currentWeekStart();

    const { data, error } = await supabase
      .from('weekly_checkins')
      .select('*')
      .eq('family_id', familyId)
      .eq('week_start', week);

    if (error) throw new Error(error.message);
    return (data ?? []) as WeeklyCheckin[];
  },
};

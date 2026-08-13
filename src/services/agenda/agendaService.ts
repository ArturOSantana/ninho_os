// src/services/agenda/agendaService.ts

import { supabase } from '@/lib/supabase';
import {
  FamilyEvent,
  CreateEventInput,
  UpdateEventInput,
} from '@/types/productivity.types';
import { UUID } from '@/types';

/**
 * Agenda Service — gerencia family_events
 * UC016: Criar evento | UC017: Visualizar agenda
 */
export const agendaService = {
  /**
   * UC-Vacina: Buscar vacinas próximas (≤ 3 dias)
   * SELECT family_events WHERE family_id = ? AND category = 'vaccine'
   *   AND start_at >= now() AND start_at <= now() + 3 days
   */
  async listUpcomingVaccines(familyId: UUID): Promise<FamilyEvent[]> {
    const now  = new Date();
    const in3d = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('family_events')
      .select('*')
      .eq('family_id', familyId)
      .eq('category', 'vaccine')
      .gte('start_at', now.toISOString())
      .lte('start_at', in3d.toISOString())
      .order('start_at', { ascending: true });

    if (error) throw new Error(error.message);
    return (data || []) as FamilyEvent[];
  },

  /**
   * Listar eventos da família dentro de um período
   */
  async listEvents(familyId: UUID, from?: string, to?: string): Promise<FamilyEvent[]> {
    let query = supabase
      .from('family_events')
      .select('*')
      .eq('family_id', familyId)
      .order('start_at', { ascending: true });

    if (from) query = query.gte('start_at', from);
    if (to)   query = query.lte('start_at', to);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []) as FamilyEvent[];
  },

  /**
   * UC016 — Criar evento
   */
  async createEvent(familyId: UUID, input: CreateEventInput): Promise<FamilyEvent> {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id ?? '')
      .single();

    if (profileError || !profileData) throw new Error('Perfil não encontrado');

    const { data, error } = await supabase
      .from('family_events')
      .insert({
        family_id:   familyId,
        title:       input.title,
        description: input.description ?? null,
        start_at:    input.start_at,
        end_at:      input.end_at ?? null,
        all_day:     input.all_day,
        category:    input.category,
        created_by:  profileData.id,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as FamilyEvent;
  },

  /**
   * Atualizar evento
   */
  async updateEvent(id: UUID, input: UpdateEventInput): Promise<FamilyEvent> {
    const { data, error } = await supabase
      .from('family_events')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as FamilyEvent;
  },

  /**
   * Deletar evento
   */
  async deleteEvent(id: UUID): Promise<void> {
    const { error } = await supabase
      .from('family_events')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  },
};

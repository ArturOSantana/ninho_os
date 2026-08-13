// src/hooks/useAgenda.ts

import { useState, useCallback, useEffect } from 'react';
import { agendaService } from '@/services/agenda/agendaService';
import { FamilyEvent, CreateEventInput, UpdateEventInput } from '@/types/productivity.types';
import { UUID } from '@/types';

/** Retorna true quando o evento é uma vacina com start_at nos próximos 3 dias */
export function isVaccineAlert(event: FamilyEvent): boolean {
  if (event.category !== 'vaccine') return false;
  const diff = new Date(event.start_at).getTime() - Date.now();
  return diff >= 0 && diff <= 3 * 24 * 60 * 60 * 1000;
}

/**
 * Hook para gerenciar eventos da agenda
 * UC016: Criar evento | UC017: Visualizar agenda
 * UC-Vacina: destaque visual e alertas para vacinas em ≤ 3 dias
 */
export function useAgenda(familyId: UUID | null | undefined) {
  const [events, setEvents] = useState<FamilyEvent[]>([]);
  const [vaccineAlerts, setVaccineAlerts] = useState<FamilyEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!familyId) return;
    try {
      setLoading(true);
      setError(null);
      const [data, alerts] = await Promise.all([
        agendaService.listEvents(familyId),
        agendaService.listUpcomingVaccines(familyId),
      ]);
      setEvents(data);
      setVaccineAlerts(alerts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar agenda');
    } finally {
      setLoading(false);
    }
  }, [familyId]);

  useEffect(() => {
    load();
  }, [load]);

  const createEvent = useCallback(async (input: CreateEventInput) => {
    if (!familyId) throw new Error('Família não encontrada');
    try {
      setError(null);
      const event = await agendaService.createEvent(familyId, input);
      setEvents((prev) => [event, ...prev].sort(
        (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
      ));
      // Se for vacina em alerta, adiciona à lista de alertas
      if (isVaccineAlert(event)) {
        setVaccineAlerts((prev) => [event, ...prev].sort(
          (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
        ));
      }
      return event;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar evento';
      setError(msg);
      throw err;
    }
  }, [familyId]);

  const updateEvent = useCallback(async (id: UUID, input: UpdateEventInput): Promise<FamilyEvent> => {
    try {
      setError(null);
      const updated = await agendaService.updateEvent(id, input);
      setEvents((prev) =>
        prev
          .map((e) => (e.id === id ? updated : e))
          .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
      );
      // Atualiza a lista de alertas de vacina
      setVaccineAlerts((prev) => {
        const filtered = prev.filter((e) => e.id !== id);
        if (isVaccineAlert(updated)) {
          return [...filtered, updated].sort(
            (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
          );
        }
        return filtered;
      });
      return updated;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar evento';
      setError(msg);
      throw err;
    }
  }, []);

  const deleteEvent = useCallback(async (id: UUID) => {
    try {
      setError(null);
      await agendaService.deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      setVaccineAlerts((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir evento';
      setError(msg);
      throw err;
    }
  }, []);

  return { events, vaccineAlerts, loading, error, load, createEvent, updateEvent, deleteEvent };
}

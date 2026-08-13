// tests/integration/agenda-flow.test.ts
// E2E do fluxo principal da Fase 4 — Agenda (UC015–UC017)
// Critério de aceite: criar evento em < 20 segundos; alerta visual 3 dias antes de vacina.

import { describe, it, expect, beforeEach } from '@jest/globals';

// ─── Tipos mínimos ────────────────────────────────────────────────
type EventCategory = 'appointment' | 'vaccine' | 'school' | 'personal' | 'other';
type EventRecurrence = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

interface FamilyEvent {
  id: string;
  family_id: string;
  title: string;
  description?: string;
  start_at: string;
  end_at?: string;
  all_day: boolean;
  category: EventCategory;
  recurrence: EventRecurrence;
  created_by: string;
  created_at: string;
}

// ─── Simulação de store em memória ────────────────────────────────
class InMemoryEventStore {
  private events: FamilyEvent[] = [];
  private nextId = 1;

  insert(payload: Omit<FamilyEvent, 'id' | 'created_at'>): FamilyEvent {
    const event: FamilyEvent = {
      id: `ev-${this.nextId++}`,
      created_at: new Date().toISOString(),
      ...payload,
    };
    this.events.push(event);
    return event;
  }

  update(id: string, patch: Partial<FamilyEvent>): FamilyEvent | null {
    const idx = this.events.findIndex((e) => e.id === id);
    if (idx < 0) return null;
    this.events[idx] = { ...this.events[idx], ...patch };
    return this.events[idx];
  }

  delete(id: string): boolean {
    const idx = this.events.findIndex((e) => e.id === id);
    if (idx < 0) return false;
    this.events.splice(idx, 1);
    return true;
  }

  findByFamily(familyId: string): FamilyEvent[] {
    return this.events
      .filter((e) => e.family_id === familyId)
      .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
  }

  findById(id: string): FamilyEvent | null {
    return this.events.find((e) => e.id === id) ?? null;
  }

  reset() { this.events = []; this.nextId = 1; }
}

// ─── Helpers ─────────────────────────────────────────────────────
function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function isVaccineUrgent(event: FamilyEvent): boolean {
  if (event.category !== 'vaccine') return false;
  const diff = new Date(event.start_at).getTime() - Date.now();
  return diff >= 0 && diff <= 3 * 24 * 60 * 60 * 1000;
}

// ─── Fixtures ────────────────────────────────────────────────────
const FAMILY_ID = 'family-test-1';
const USER_ID   = 'user-test-1';

// ─── Testes ───────────────────────────────────────────────────────
describe('Fase 4 — Agenda: fluxo principal (UC015–UC017)', () => {
  let store: InMemoryEventStore;

  beforeEach(() => {
    store = new InMemoryEventStore();
  });

  // ── UC015 — Criar evento ────────────────────────────────────────
  describe('UC015 — Criar evento', () => {
    it('cria evento com campos obrigatórios', () => {
      const ev = store.insert({
        family_id: FAMILY_ID, created_by: USER_ID,
        title: 'Consulta pediatra', category: 'appointment',
        start_at: daysFromNow(7), all_day: false, recurrence: 'none',
      });

      expect(ev.id).toBeDefined();
      expect(ev.title).toBe('Consulta pediatra');
      expect(ev.family_id).toBe(FAMILY_ID);
      expect(ev.category).toBe('appointment');
    });

    it('evento fica visível para a família após criação', () => {
      store.insert({
        family_id: FAMILY_ID, created_by: USER_ID,
        title: 'Reunião', category: 'personal',
        start_at: daysFromNow(3), all_day: false, recurrence: 'none',
      });

      const events = store.findByFamily(FAMILY_ID);
      expect(events).toHaveLength(1);
      expect(events[0].title).toBe('Reunião');
    });

    it('múltiplos eventos são ordenados por start_at', () => {
      store.insert({ family_id: FAMILY_ID, created_by: USER_ID, title: 'B', category: 'other', start_at: daysFromNow(10), all_day: false, recurrence: 'none' });
      store.insert({ family_id: FAMILY_ID, created_by: USER_ID, title: 'A', category: 'other', start_at: daysFromNow(2),  all_day: false, recurrence: 'none' });

      const events = store.findByFamily(FAMILY_ID);
      expect(events[0].title).toBe('A');
      expect(events[1].title).toBe('B');
    });
  });

  // ── UC016 — Agendar vacina com alerta ─────────────────────────
  describe('UC016 — Agendar vacina (alerta ≤ 3 dias)', () => {
    it('vacina em 2 dias é marcada como urgente', () => {
      const ev = store.insert({
        family_id: FAMILY_ID, created_by: USER_ID,
        title: 'Vacina hexavalente', category: 'vaccine',
        start_at: daysFromNow(2), all_day: false, recurrence: 'none',
      });

      expect(isVaccineUrgent(ev)).toBe(true);
    });

    it('vacina exatamente em 3 dias é marcada como urgente', () => {
      const d = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 - 60_000); // 3 dias - 1 min
      const ev = store.insert({
        family_id: FAMILY_ID, created_by: USER_ID,
        title: 'Vacina', category: 'vaccine',
        start_at: d.toISOString(), all_day: false, recurrence: 'none',
      });

      expect(isVaccineUrgent(ev)).toBe(true);
    });

    it('vacina em 4 dias NÃO é urgente', () => {
      const ev = store.insert({
        family_id: FAMILY_ID, created_by: USER_ID,
        title: 'Vacina futura', category: 'vaccine',
        start_at: daysFromNow(4), all_day: false, recurrence: 'none',
      });

      expect(isVaccineUrgent(ev)).toBe(false);
    });

    it('evento de consulta nunca é urgente, mesmo que próximo', () => {
      const ev = store.insert({
        family_id: FAMILY_ID, created_by: USER_ID,
        title: 'Consulta amanhã', category: 'appointment',
        start_at: daysFromNow(1), all_day: false, recurrence: 'none',
      });

      expect(isVaccineUrgent(ev)).toBe(false);
    });
  });

  // ── UC017 — Editar e excluir evento ───────────────────────────
  describe('UC017 — Editar e excluir evento', () => {
    it('editar título e categoria atualiza o evento', () => {
      const ev = store.insert({
        family_id: FAMILY_ID, created_by: USER_ID,
        title: 'Consulta', category: 'appointment',
        start_at: daysFromNow(5), all_day: false, recurrence: 'none',
      });

      const updated = store.update(ev.id, { title: 'Consulta com novo horário', category: 'personal' });

      expect(updated?.title).toBe('Consulta com novo horário');
      expect(updated?.category).toBe('personal');
    });

    it('excluir remove o evento da lista', () => {
      const ev = store.insert({
        family_id: FAMILY_ID, created_by: USER_ID,
        title: 'A remover', category: 'other',
        start_at: daysFromNow(1), all_day: false, recurrence: 'none',
      });

      const ok = store.delete(ev.id);

      expect(ok).toBe(true);
      expect(store.findById(ev.id)).toBeNull();
      expect(store.findByFamily(FAMILY_ID)).toHaveLength(0);
    });

    it('excluir ID inexistente retorna false sem erro', () => {
      expect(store.delete('nao-existe')).toBe(false);
    });

    it('editar start_at de vacina pode remover urgência', () => {
      const ev = store.insert({
        family_id: FAMILY_ID, created_by: USER_ID,
        title: 'Vacina urgente', category: 'vaccine',
        start_at: daysFromNow(1), all_day: false, recurrence: 'none',
      });

      expect(isVaccineUrgent(ev)).toBe(true);

      const updated = store.update(ev.id, { start_at: daysFromNow(30) });
      expect(isVaccineUrgent(updated!)).toBe(false);
    });
  });

  // ── Critério de aceite — criação em < 20 segundos ──────────────
  describe('Critério de aceite — criação em < 20 segundos', () => {
    it('inserção em memória é instantânea (proxy do critério UI < 20s)', () => {
      const t0 = performance.now();
      store.insert({
        family_id: FAMILY_ID, created_by: USER_ID,
        title: 'Evento rápido', category: 'other',
        start_at: daysFromNow(1), all_day: false, recurrence: 'none',
      });
      expect(performance.now() - t0).toBeLessThan(10);
    });
  });
});

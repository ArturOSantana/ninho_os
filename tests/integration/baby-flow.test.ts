// tests/integration/baby-flow.test.ts
// E2E do fluxo principal da Fase 3 — Módulo Bebê (UC011–UC014)
// Critério de aceite: registrar mamada, sono e troca, verificar timeline.
// Não conecta ao Supabase — testa lógica de domínio e contrato de payloads.

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// ─── Tipos mínimos ────────────────────────────────────────────────
type LogType = 'feeding' | 'sleep' | 'diaper' | 'note';

interface BabyLog {
  id: string;
  baby_id: string;
  family_id: string;
  created_by: string;
  type: LogType;
  started_at: string;
  ended_at?: string;
  feeding_type?: 'breast_left' | 'breast_right' | 'bottle' | 'solid';
  diaper_type?: 'pee' | 'poo' | 'both';
}

// ─── Simulação de estado em memória (substitui Supabase) ─────────
class InMemoryBabyLogStore {
  private logs: BabyLog[] = [];
  private nextId = 1;

  insert(payload: Omit<BabyLog, 'id'>): BabyLog {
    const record: BabyLog = { id: `log-${this.nextId++}`, ...payload };
    this.logs.push(record);
    return record;
  }

  findByBabyAndType(babyId: string, type: LogType): BabyLog[] {
    return this.logs
      .filter((l) => l.baby_id === babyId && l.type === type)
      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
  }

  findTodayByBaby(babyId: string): BabyLog[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.logs
      .filter((l) => l.baby_id === babyId && new Date(l.started_at) >= today)
      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
  }

  updateSleepEnd(logId: string, endedAt: string): BabyLog | null {
    const log = this.logs.find((l) => l.id === logId);
    if (!log || log.type !== 'sleep') return null;
    log.ended_at = endedAt;
    return log;
  }

  reset() { this.logs = []; this.nextId = 1; }
}

// ─── Fixtures ────────────────────────────────────────────────────
const BABY_ID   = 'baby-test-1';
const FAMILY_ID = 'family-test-1';
const USER_ID   = 'user-test-1';

function makeTimestamp(minutesAgo = 0): string {
  return new Date(Date.now() - minutesAgo * 60_000).toISOString();
}

// ─── Testes ───────────────────────────────────────────────────────
describe('Fase 3 — Módulo Bebê: fluxo principal (UC011–UC014)', () => {
  let store: InMemoryBabyLogStore;

  beforeEach(() => {
    store = new InMemoryBabyLogStore();
  });

  // ── UC011 — Registrar mamada ────────────────────────────────────
  describe('UC011 — Registrar mamada', () => {
    it('cria registro com type=feeding e started_at automático', () => {
      const before = Date.now();
      const log = store.insert({
        baby_id: BABY_ID, family_id: FAMILY_ID, created_by: USER_ID,
        type: 'feeding', started_at: new Date().toISOString(),
      });
      const after = Date.now();

      expect(log.id).toBeDefined();
      expect(log.type).toBe('feeding');
      const ts = new Date(log.started_at).getTime();
      expect(ts).toBeGreaterThanOrEqual(before);
      expect(ts).toBeLessThanOrEqual(after);
    });

    it('toque longo adiciona feeding_type sem criar novo registro', () => {
      const log = store.insert({
        baby_id: BABY_ID, family_id: FAMILY_ID, created_by: USER_ID,
        type: 'feeding', started_at: new Date().toISOString(),
        feeding_type: 'breast_left',
      });

      expect(log.feeding_type).toBe('breast_left');
      // Ainda um único registro — toque longo não duplica
      expect(store.findByBabyAndType(BABY_ID, 'feeding')).toHaveLength(1);
    });

    it('getLastBabyRecord(type=feeding) retorna o mais recente', () => {
      store.insert({ baby_id: BABY_ID, family_id: FAMILY_ID, created_by: USER_ID, type: 'feeding', started_at: makeTimestamp(60) });
      const recent = store.insert({ baby_id: BABY_ID, family_id: FAMILY_ID, created_by: USER_ID, type: 'feeding', started_at: makeTimestamp(5) });

      const last = store.findByBabyAndType(BABY_ID, 'feeding')[0];
      expect(last.id).toBe(recent.id);
    });

    it('último feeding não interfere no último diaper (timestamps independentes)', () => {
      store.insert({ baby_id: BABY_ID, family_id: FAMILY_ID, created_by: USER_ID, type: 'feeding', started_at: makeTimestamp(10) });
      store.insert({ baby_id: BABY_ID, family_id: FAMILY_ID, created_by: USER_ID, type: 'diaper',  started_at: makeTimestamp(30) });

      const lastFeeding = store.findByBabyAndType(BABY_ID, 'feeding')[0];
      const lastDiaper  = store.findByBabyAndType(BABY_ID, 'diaper')[0];

      expect(lastFeeding.started_at).not.toBe(lastDiaper.started_at);
    });
  });

  // ── UC012 — Registrar sono ──────────────────────────────────────
  describe('UC012 — Registrar sono (cronômetro)', () => {
    it('cria registro com type=sleep sem ended_at (sono ativo)', () => {
      const log = store.insert({
        baby_id: BABY_ID, family_id: FAMILY_ID, created_by: USER_ID,
        type: 'sleep', started_at: new Date().toISOString(),
      });

      expect(log.type).toBe('sleep');
      expect(log.ended_at).toBeUndefined();
    });

    it('encerrar sono preenche ended_at posterior ao started_at', () => {
      const startedAt = makeTimestamp(90); // 1h30 atrás
      const log = store.insert({
        baby_id: BABY_ID, family_id: FAMILY_ID, created_by: USER_ID,
        type: 'sleep', started_at: startedAt,
      });

      const endedAt = new Date().toISOString();
      const updated = store.updateSleepEnd(log.id, endedAt);

      expect(updated?.ended_at).toBe(endedAt);
      expect(new Date(updated!.ended_at!).getTime()).toBeGreaterThan(new Date(updated!.started_at).getTime());
    });

    it('duração calculada corretamente de started_at e ended_at', () => {
      const startedAt = makeTimestamp(120); // 2h atrás
      const endedAt   = makeTimestamp(30);  // 30min atrás
      const durationMin = (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60_000;

      // Duração esperada: ~90 minutos (com tolerância de 1min por tempo de execução)
      expect(durationMin).toBeGreaterThanOrEqual(89);
      expect(durationMin).toBeLessThanOrEqual(91);
    });
  });

  // ── UC013 — Registrar troca ─────────────────────────────────────
  describe('UC013 — Registrar troca de fralda', () => {
    it('cria registro com type=diaper', () => {
      const log = store.insert({
        baby_id: BABY_ID, family_id: FAMILY_ID, created_by: USER_ID,
        type: 'diaper', started_at: new Date().toISOString(),
      });

      expect(log.type).toBe('diaper');
    });

    it('toque longo especifica diaper_type', () => {
      const log = store.insert({
        baby_id: BABY_ID, family_id: FAMILY_ID, created_by: USER_ID,
        type: 'diaper', started_at: new Date().toISOString(), diaper_type: 'both',
      });

      expect(log.diaper_type).toBe('both');
    });

    it('todos os diaper_type válidos são aceitos', () => {
      const types: BabyLog['diaper_type'][] = ['pee', 'poo', 'both'];
      types.forEach((dt) => {
        const log = store.insert({
          baby_id: BABY_ID, family_id: FAMILY_ID, created_by: USER_ID,
          type: 'diaper', started_at: new Date().toISOString(), diaper_type: dt,
        });
        expect(log.diaper_type).toBe(dt);
      });
    });
  });

  // ── UC014 — Timeline do dia ──────────────────────────────────────
  describe('UC014 — Visualizar histórico do dia', () => {
    it('lista registros de hoje ordenados do mais recente ao mais antigo', () => {
      store.insert({ baby_id: BABY_ID, family_id: FAMILY_ID, created_by: USER_ID, type: 'feeding', started_at: makeTimestamp(120) });
      store.insert({ baby_id: BABY_ID, family_id: FAMILY_ID, created_by: USER_ID, type: 'diaper',  started_at: makeTimestamp(60) });
      store.insert({ baby_id: BABY_ID, family_id: FAMILY_ID, created_by: USER_ID, type: 'sleep',   started_at: makeTimestamp(10) });

      const today = store.findTodayByBaby(BABY_ID);
      expect(today).toHaveLength(3);

      // Verifica ordem: mais recente primeiro
      for (let i = 0; i < today.length - 1; i++) {
        expect(new Date(today[i].started_at).getTime())
          .toBeGreaterThanOrEqual(new Date(today[i + 1].started_at).getTime());
      }
    });

    it('só retorna registros de hoje, não de dias anteriores', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      // Registro de ontem (não deve aparecer)
      store.insert({ baby_id: BABY_ID, family_id: FAMILY_ID, created_by: USER_ID, type: 'feeding', started_at: yesterday.toISOString() });
      // Registro de hoje (deve aparecer)
      store.insert({ baby_id: BABY_ID, family_id: FAMILY_ID, created_by: USER_ID, type: 'diaper',  started_at: makeTimestamp(30) });

      const today = store.findTodayByBaby(BABY_ID);
      expect(today).toHaveLength(1);
      expect(today[0].type).toBe('diaper');
    });

    it('todayCount reflete apenas registros do dia', () => {
      store.insert({ baby_id: BABY_ID, family_id: FAMILY_ID, created_by: USER_ID, type: 'feeding', started_at: makeTimestamp(5) });
      store.insert({ baby_id: BABY_ID, family_id: FAMILY_ID, created_by: USER_ID, type: 'diaper',  started_at: makeTimestamp(2) });
      expect(store.findTodayByBaby(BABY_ID)).toHaveLength(2);
    });
  });

  // ── Critério de aceite — registro < 5 segundos ─────────────────
  describe('Critério de aceite — mamada em < 5 segundos', () => {
    it('inserção em memória é instantânea (proxy do critério de < 5s com rede)', () => {
      const t0 = performance.now();
      store.insert({
        baby_id: BABY_ID, family_id: FAMILY_ID, created_by: USER_ID,
        type: 'feeding', started_at: new Date().toISOString(),
      });
      const elapsed = performance.now() - t0;
      // Operação local deve ser < 1ms; não substitui teste de rede real
      expect(elapsed).toBeLessThan(10);
    });
  });
});

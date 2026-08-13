// src/hooks/useBabyLogger.ts
// Lógica central do módulo bebê — Fase 3 (UC011–UC014)
//
// Responsabilidades:
//   • Registro rápido (toque simples): salva imediatamente com timestamp atual
//   • Debounce 800ms: segundo toque no mesmo tipo dentro da janela é ignorado
//   • Offline queue: se não tiver rede, persiste em AsyncStorage e sincroniza ao reconectar
//   • Cronômetro de sono: persiste start ISO no AsyncStorage; retoma ao reabrir
//   • Expõe todayRecords (timeline) e lastByType para o index

import { useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BabyRecord, RecordType } from '@/types';
import { createBabyRecord, getBabyRecordsToday } from '@/services/api';
import { useAuthStore } from '@/stores/auth.store';

// ─── Constantes ─────────────────────────────────────────────────
const SLEEP_KEY        = (babyId: string) => `ninho:sleep_start:${babyId}`;
const QUEUE_KEY        = (babyId: string) => `ninho:offline_queue:${babyId}`;
const DEBOUNCE_MS      = 800;
/** Sono com mais de 4h sem ended_at é considerado esquecido */
const STALE_SLEEP_MS   = 4 * 60 * 60 * 1000;

// ─── Tipos ──────────────────────────────────────────────────────
export interface LogOptions {
  feeding_type?: BabyRecord['feeding_type'];
  diaper_type?:  BabyRecord['diaper_type'];
  notes?:        string;
  /** Para sono: ISO do started_at customizado (normalmente omitido) */
  started_at?: string;
  /** Para sono: ISO do ended_at (encerra o sono em andamento) */
  ended_at?: string;
}

interface QueuedRecord {
  id: string; // uuid local para deduplicação
  payload: Parameters<typeof createBabyRecord>[0];
}

export interface UseBabyLoggerResult {
  /** Registros do dia ordenados do mais recente ao mais antigo */
  todayRecords:   BabyRecord[];
  /** Último registro por tipo */
  lastByType:     Partial<Record<RecordType, BabyRecord>>;
  /** Sono em andamento: ISO do started_at ou null */
  sleepStartedAt: string | null;
  /** Cronômetro formatado "HH:MM:SS" quando sono ativo */
  sleepTimer:     string;
  /** true quando o sono ativo tem mais de STALE_SLEEP_MS sem ser encerrado */
  staleSleep:     boolean;
  /** Itens aguardando sync (sem rede) */
  pendingCount:   number;
  loadingTypes:   Partial<Record<RecordType, boolean>>;
  /** Registra um tipo imediatamente (debounce aplicado) */
  log: (type: RecordType, opts?: LogOptions) => Promise<void>;
  /** Encerra o sono em andamento */
  endSleep: () => Promise<void>;
  /**
   * Encerra o sono esquecido com o horário informado pelo usuário.
   * Se wakeTime não for passado, usa o momento atual.
   */
  endStaleSleep: (wakeTime?: Date) => Promise<void>;
  reload: () => Promise<void>;
}

// ─── Helpers ────────────────────────────────────────────────────
function pad(n: number) { return String(n).padStart(2, '0'); }

function formatTimer(startIso: string): string {
  const sec = Math.floor((Date.now() - new Date(startIso).getTime()) / 1000);
  if (sec < 0) return '00:00:00';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function uuid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Hook ───────────────────────────────────────────────────────
export function useBabyLogger(
  babyId:   string | undefined,
  familyId: string | undefined,
): UseBabyLoggerResult {
  const profile = useAuthStore((s) => s.profile);

  const [todayRecords,   setTodayRecords]   = useState<BabyRecord[]>([]);
  const [sleepStartedAt, setSleepStartedAt] = useState<string | null>(null);
  const [sleepTimer,     setSleepTimer]     = useState('00:00:00');
  const [staleSleep,     setStaleSleep]     = useState(false);
  const [pendingCount,   setPendingCount]   = useState(0);
  const [loadingTypes,   setLoadingTypes]   = useState<Partial<Record<RecordType, boolean>>>({});

  // Último toque por tipo para debounce
  const lastTapRef = useRef<Partial<Record<RecordType, number>>>({});
  // Ref para o interval do cronômetro
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Últimos registros por tipo (derivado de todayRecords) ─────
  const lastByType = todayRecords.reduce<Partial<Record<RecordType, BabyRecord>>>(
    (acc, r) => {
      if (!acc[r.type]) acc[r.type] = r;
      return acc;
    },
    {}
  );

  // ── Carrega registros do dia ─────────────────────────────────
  const reload = useCallback(async () => {
    if (!babyId) return;
    const records = await getBabyRecordsToday(babyId);
    // A API já retorna ordenado por started_at DESC
    setTodayRecords(records as BabyRecord[]);
  }, [babyId]);

  // ── Carrega sono persistido no AsyncStorage ──────────────────
  const loadPersistedSleep = useCallback(async () => {
    if (!babyId) return;
    const stored = await AsyncStorage.getItem(SLEEP_KEY(babyId));
    if (stored) {
      setSleepStartedAt(stored);
      // Detecta imediatamente se o sono já está esquecido
      const elapsed = Date.now() - new Date(stored).getTime();
      setStaleSleep(elapsed >= STALE_SLEEP_MS);
    }
  }, [babyId]);

  // ── Carrega fila offline ─────────────────────────────────────
  const loadQueue = useCallback(async () => {
    if (!babyId) return;
    const raw = await AsyncStorage.getItem(QUEUE_KEY(babyId));
    const queue: QueuedRecord[] = raw ? JSON.parse(raw) : [];
    setPendingCount(queue.length);
  }, [babyId]);

  // ── Tenta sincronizar fila offline ──────────────────────────
  const flushQueue = useCallback(async () => {
    if (!babyId) return;
    const raw = await AsyncStorage.getItem(QUEUE_KEY(babyId));
    const queue: QueuedRecord[] = raw ? JSON.parse(raw) : [];
    if (queue.length === 0) return;

    const remaining: QueuedRecord[] = [];
    for (const item of queue) {
      try {
        const record = await createBabyRecord(item.payload);
        setTodayRecords((prev) => [record as BabyRecord, ...prev]);
      } catch {
        remaining.push(item);
      }
    }
    await AsyncStorage.setItem(QUEUE_KEY(babyId), JSON.stringify(remaining));
    setPendingCount(remaining.length);
  }, [babyId]);

  // ── Cronômetro de sono ────────────────────────────────────────
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!sleepStartedAt) {
      setSleepTimer('00:00:00');
      setStaleSleep(false);
      return;
    }
    setSleepTimer(formatTimer(sleepStartedAt));
    // Verifica estado "esquecido" a cada tick do cronômetro
    const tick = () => {
      setSleepTimer(formatTimer(sleepStartedAt));
      const elapsed = Date.now() - new Date(sleepStartedAt).getTime();
      setStaleSleep(elapsed >= STALE_SLEEP_MS);
    };
    timerRef.current = setInterval(tick, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [sleepStartedAt]);

  // ── Mount ─────────────────────────────────────────────────────
  useEffect(() => {
    reload();
    loadPersistedSleep();
    loadQueue();
    flushQueue();
  }, [reload, loadPersistedSleep, loadQueue, flushQueue]);

  // ── log: registra um tipo ────────────────────────────────────
  const log = useCallback(async (type: RecordType, opts: LogOptions = {}) => {
    if (!babyId || !familyId || !profile?.id) return;

    // Debounce: ignora segundo toque dentro de 800ms
    const now = Date.now();
    const last = lastTapRef.current[type] ?? 0;
    if (now - last < DEBOUNCE_MS) return;
    lastTapRef.current[type] = now;

    // Sono: se já há um ativo e o tipo é 'sleep', encerra em vez de criar novo
    if (type === 'sleep' && sleepStartedAt && !opts.ended_at) {
      await endSleep();
      return;
    }

    const payload: Parameters<typeof createBabyRecord>[0] = {
      baby_id:      babyId,
      family_id:    familyId,
      created_by:   profile.id,
      type,
      started_at:   opts.started_at ?? new Date().toISOString(),
      ended_at:     opts.ended_at,
      feeding_type: opts.feeding_type,
      diaper_type:  opts.diaper_type,
      notes:        opts.notes,
    };

    setLoadingTypes((prev) => ({ ...prev, [type]: true }));
    try {
      const record = await createBabyRecord(payload);
      const typed = record as BabyRecord;
      setTodayRecords((prev) => [typed, ...prev]);

      // Inicia cronômetro de sono
      if (type === 'sleep') {
        const startIso = payload.started_at!;
        await AsyncStorage.setItem(SLEEP_KEY(babyId), startIso);
        setSleepStartedAt(startIso);
      }
    } catch {
      // Offline: enfileira localmente
      const raw = await AsyncStorage.getItem(QUEUE_KEY(babyId));
      const queue: QueuedRecord[] = raw ? JSON.parse(raw) : [];
      queue.push({ id: uuid(), payload });
      await AsyncStorage.setItem(QUEUE_KEY(babyId), JSON.stringify(queue));
      setPendingCount(queue.length);
    } finally {
      setLoadingTypes((prev) => ({ ...prev, [type]: false }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [babyId, familyId, profile?.id, sleepStartedAt]);

  // ── endSleep: encerra o sono ativo ───────────────────────────
  const endSleep = useCallback(async () => {
    if (!babyId || !familyId || !profile?.id || !sleepStartedAt) return;

    const payload: Parameters<typeof createBabyRecord>[0] = {
      baby_id:    babyId,
      family_id:  familyId,
      created_by: profile.id,
      type:       'sleep',
      started_at: sleepStartedAt,
      ended_at:   new Date().toISOString(),
    };

    setLoadingTypes((prev) => ({ ...prev, sleep: true }));
    try {
      const record = await createBabyRecord(payload);
      setTodayRecords((prev) => {
        // Substitui o registro de início (sem ended_at) pelo finalizado
        const updated = (prev as BabyRecord[]).filter(
          (r) => !(r.type === 'sleep' && r.started_at === sleepStartedAt)
        );
        return [record as BabyRecord, ...updated];
      });
      await AsyncStorage.removeItem(SLEEP_KEY(babyId));
      setSleepStartedAt(null);
    } catch {
      // Offline: enfileira
      const raw = await AsyncStorage.getItem(QUEUE_KEY(babyId));
      const queue: QueuedRecord[] = raw ? JSON.parse(raw) : [];
      queue.push({ id: uuid(), payload });
      await AsyncStorage.setItem(QUEUE_KEY(babyId), JSON.stringify(queue));
      setPendingCount(queue.length);
      // Ainda remove do cronômetro local
      await AsyncStorage.removeItem(SLEEP_KEY(babyId));
      setSleepStartedAt(null);
    } finally {
      setLoadingTypes((prev) => ({ ...prev, sleep: false }));
    }
  }, [babyId, familyId, profile?.id, sleepStartedAt]);

  // ── endStaleSleep: encerra sono esquecido com hora corrigida ──
  const endStaleSleep = useCallback(async (wakeTime?: Date) => {
    if (!babyId || !familyId || !profile?.id || !sleepStartedAt) return;

    const endedAt = (wakeTime ?? new Date()).toISOString();

    const payload: Parameters<typeof createBabyRecord>[0] = {
      baby_id:    babyId,
      family_id:  familyId,
      created_by: profile.id,
      type:       'sleep',
      started_at: sleepStartedAt,
      ended_at:   endedAt,
      notes:      wakeTime ? 'horário de acordar corrigido manualmente' : undefined,
    };

    setLoadingTypes((prev) => ({ ...prev, sleep: true }));
    try {
      const record = await createBabyRecord(payload);
      setTodayRecords((prev) => {
        const updated = (prev as BabyRecord[]).filter(
          (r) => !(r.type === 'sleep' && r.started_at === sleepStartedAt)
        );
        return [record as BabyRecord, ...updated];
      });
      await AsyncStorage.removeItem(SLEEP_KEY(babyId));
      setSleepStartedAt(null);
      setStaleSleep(false);
    } catch {
      const raw = await AsyncStorage.getItem(QUEUE_KEY(babyId));
      const queue: QueuedRecord[] = raw ? JSON.parse(raw) : [];
      queue.push({ id: uuid(), payload });
      await AsyncStorage.setItem(QUEUE_KEY(babyId), JSON.stringify(queue));
      setPendingCount(queue.length);
      await AsyncStorage.removeItem(SLEEP_KEY(babyId));
      setSleepStartedAt(null);
      setStaleSleep(false);
    } finally {
      setLoadingTypes((prev) => ({ ...prev, sleep: false }));
    }
  }, [babyId, familyId, profile?.id, sleepStartedAt]);

  return {
    todayRecords,
    lastByType,
    sleepStartedAt,
    sleepTimer,
    staleSleep,
    pendingCount,
    loadingTypes,
    log,
    endSleep,
    endStaleSleep,
    reload,
  };
}

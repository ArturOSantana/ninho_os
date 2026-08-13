// tests/unit/notifications.test.ts
// Testes de lógica pura das funções auxiliares de notificações

import { describe, it, expect } from '@jest/globals';
import type { Notification, NotificationPreference, NotificationType } from '@/types/differential.types';

// ─── Funções extraídas do hook / telas para testar ────────────────

/** Conta notificações não lidas */
function countUnread(notifications: Notification[]): number {
  return notifications.filter(n => n.read_at === null).length;
}

/** Marca uma notificação como lida na lista local */
function markAsReadLocal(
  notifications: Notification[],
  id: string
): Notification[] {
  const readAt = '2024-06-01T10:00:00Z';
  return notifications.map(n =>
    n.id === id ? { ...n, read_at: readAt } : n
  );
}

/** Marca todas como lidas na lista local */
function markAllAsReadLocal(notifications: Notification[]): Notification[] {
  const readAt = '2024-06-01T10:00:00Z';
  return notifications.map(n => ({ ...n, read_at: n.read_at ?? readAt }));
}

/** Adiciona nova notificação ao topo (Realtime) */
function prependNotification(
  notifications: Notification[],
  incoming: Notification
): Notification[] {
  return [incoming, ...notifications];
}

/** Retorna preferência para um tipo, com defaults */
function getPreferenceParsed(
  preferences: NotificationPreference[],
  type: NotificationType
): { push_enabled: boolean; in_app_enabled: boolean } {
  const pref = preferences.find(p => p.type === type);
  return {
    push_enabled: pref?.push_enabled ?? true,
    in_app_enabled: pref?.in_app_enabled ?? true,
  };
}

/** Atualiza uma preferência na lista local */
function updatePreferenceLocal(
  preferences: NotificationPreference[],
  type: NotificationType,
  updated: NotificationPreference
): NotificationPreference[] {
  const exists = preferences.some(p => p.type === type);
  if (exists) {
    return preferences.map(p => (p.type === type ? updated : p));
  }
  return [...preferences, updated];
}

// ─── Fixtures ────────────────────────────────────────────────────

function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: 'notif-1',
    user_id: 'user-1',
    family_id: 'family-1',
    type: 'task_assigned',
    title: 'Nova tarefa',
    body: 'Uma tarefa foi atribuída a você',
    data: {},
    read_at: null,
    created_at: '2024-06-01T09:00:00Z',
    ...overrides,
  };
}

function makePreference(overrides: Partial<NotificationPreference> = {}): NotificationPreference {
  return {
    id: 'pref-1',
    user_id: 'user-1',
    type: 'task_assigned',
    push_enabled: true,
    in_app_enabled: true,
    updated_at: '2024-06-01T00:00:00Z',
    ...overrides,
  };
}

// ─── Testes: contagem de não lidas ───────────────────────────────

describe('countUnread', () => {
  it('retorna 0 quando lista está vazia', () => {
    expect(countUnread([])).toBe(0);
  });

  it('retorna 0 quando todas as notificações estão lidas', () => {
    const list = [
      makeNotification({ id: '1', read_at: '2024-06-01T10:00:00Z' }),
      makeNotification({ id: '2', read_at: '2024-06-01T11:00:00Z' }),
    ];
    expect(countUnread(list)).toBe(0);
  });

  it('conta apenas as não lidas', () => {
    const list = [
      makeNotification({ id: '1', read_at: null }),
      makeNotification({ id: '2', read_at: '2024-06-01T10:00:00Z' }),
      makeNotification({ id: '3', read_at: null }),
    ];
    expect(countUnread(list)).toBe(2);
  });

  it('retorna total quando todas são não lidas', () => {
    const list = [
      makeNotification({ id: '1', read_at: null }),
      makeNotification({ id: '2', read_at: null }),
      makeNotification({ id: '3', read_at: null }),
    ];
    expect(countUnread(list)).toBe(3);
  });
});

// ─── Testes: markAsReadLocal ──────────────────────────────────────

describe('markAsReadLocal', () => {
  it('marca a notificação correta como lida', () => {
    const list = [
      makeNotification({ id: '1', read_at: null }),
      makeNotification({ id: '2', read_at: null }),
    ];
    const result = markAsReadLocal(list, '1');
    expect(result[0].read_at).not.toBeNull();
    expect(result[1].read_at).toBeNull();
  });

  it('não altera notificações já lidas', () => {
    const existingReadAt = '2024-05-01T08:00:00Z';
    const list = [
      makeNotification({ id: '1', read_at: existingReadAt }),
    ];
    const result = markAsReadLocal(list, '2'); // id inexistente
    expect(result[0].read_at).toBe(existingReadAt);
  });

  it('não muta a lista original (imutável)', () => {
    const original = [makeNotification({ id: '1', read_at: null })];
    const result = markAsReadLocal(original, '1');
    expect(original[0].read_at).toBeNull();
    expect(result[0].read_at).not.toBeNull();
  });

  it('retorna lista com mesmo tamanho', () => {
    const list = [
      makeNotification({ id: '1' }),
      makeNotification({ id: '2' }),
    ];
    expect(markAsReadLocal(list, '1')).toHaveLength(2);
  });
});

// ─── Testes: markAllAsReadLocal ──────────────────────────────────

describe('markAllAsReadLocal', () => {
  it('marca todas as não lidas', () => {
    const list = [
      makeNotification({ id: '1', read_at: null }),
      makeNotification({ id: '2', read_at: null }),
    ];
    const result = markAllAsReadLocal(list);
    expect(result.every(n => n.read_at !== null)).toBe(true);
  });

  it('preserva o read_at original das que já estavam lidas', () => {
    const originalReadAt = '2024-05-01T08:00:00Z';
    const list = [
      makeNotification({ id: '1', read_at: originalReadAt }),
      makeNotification({ id: '2', read_at: null }),
    ];
    const result = markAllAsReadLocal(list);
    expect(result[0].read_at).toBe(originalReadAt);
    expect(result[1].read_at).not.toBeNull();
  });

  it('funciona corretamente em lista vazia', () => {
    expect(markAllAsReadLocal([])).toEqual([]);
  });
});

// ─── Testes: prependNotification ─────────────────────────────────

describe('prependNotification', () => {
  it('adiciona a nova notificação no índice 0', () => {
    const existing = [makeNotification({ id: 'old' })];
    const incoming = makeNotification({ id: 'new' });
    const result = prependNotification(existing, incoming);
    expect(result[0].id).toBe('new');
    expect(result[1].id).toBe('old');
  });

  it('tamanho aumenta em 1', () => {
    const existing = [makeNotification({ id: '1' }), makeNotification({ id: '2' })];
    const incoming = makeNotification({ id: '3' });
    expect(prependNotification(existing, incoming)).toHaveLength(3);
  });

  it('funciona em lista vazia', () => {
    const incoming = makeNotification({ id: 'first' });
    const result = prependNotification([], incoming);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('first');
  });
});

// ─── Testes: getPreferenceParsed ─────────────────────────────────

describe('getPreferenceParsed', () => {
  it('retorna defaults true quando tipo não existe na lista', () => {
    const result = getPreferenceParsed([], 'next_feeding');
    expect(result.push_enabled).toBe(true);
    expect(result.in_app_enabled).toBe(true);
  });

  it('retorna valores reais quando preferência existe', () => {
    const prefs = [
      makePreference({ type: 'next_feeding', push_enabled: false, in_app_enabled: true }),
    ];
    const result = getPreferenceParsed(prefs, 'next_feeding');
    expect(result.push_enabled).toBe(false);
    expect(result.in_app_enabled).toBe(true);
  });

  it('não confunde tipos diferentes', () => {
    const prefs = [
      makePreference({ type: 'next_feeding', push_enabled: false }),
      makePreference({ id: 'pref-2', type: 'family_invite', push_enabled: true }),
    ];
    expect(getPreferenceParsed(prefs, 'family_invite').push_enabled).toBe(true);
    expect(getPreferenceParsed(prefs, 'next_feeding').push_enabled).toBe(false);
  });
});

// ─── Testes: updatePreferenceLocal ───────────────────────────────

describe('updatePreferenceLocal', () => {
  it('substitui preferência existente pelo tipo', () => {
    const updated = makePreference({ type: 'task_assigned', push_enabled: false });
    const prefs = [makePreference({ type: 'task_assigned', push_enabled: true })];
    const result = updatePreferenceLocal(prefs, 'task_assigned', updated);
    expect(result[0].push_enabled).toBe(false);
    expect(result).toHaveLength(1);
  });

  it('adiciona no final quando tipo não existe', () => {
    const existing = [makePreference({ type: 'task_assigned' })];
    const newPref = makePreference({ id: 'pref-new', type: 'family_invite' });
    const result = updatePreferenceLocal(existing, 'family_invite', newPref);
    expect(result).toHaveLength(2);
    expect(result[1].type).toBe('family_invite');
  });

  it('não muta a lista original', () => {
    const prefs = [makePreference({ type: 'task_assigned' })];
    const updated = makePreference({ type: 'task_assigned', push_enabled: false });
    updatePreferenceLocal(prefs, 'task_assigned', updated);
    expect(prefs[0].push_enabled).toBe(true);
  });
});

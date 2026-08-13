// tests/unit/familyMembers.test.ts
// UC025: Convidar | UC026: Alterar permissão | UC027: Remover membro
// Testa lógica pura de gerenciamento de membros e regras de negócio:
//   • Não pode remover o único admin
//   • Não pode ter 0 admins após alterar role
//   • updateRole atualiza apenas o membro correto
//   • removeMember filtra o membro correto
//   • inviteMap popula corretamente daysLeft

import { describe, it, expect } from '@jest/globals';
import { UserRole } from '@/types';

// ─── Tipos locais (espelham Profile e PendingInvite) ──────────────────────────

interface MockProfile {
  id: string;
  user_id: string;
  family_id: string;
  name: string;
  role: UserRole;
}

interface MockInvite {
  id: string;
  family_id: string;
  accepted_by?: string | null; // profile_id
  expires_at: string;
  accepted_at?: string | null;
}

// ─── Funções puras replicadas de useFamilyMembers / familyService ─────────────

/**
 * UC027 — Remove membro da lista.
 * Lança erro se o membro for o último admin.
 */
function removerMembro(members: MockProfile[], memberId: string): MockProfile[] {
  const target = members.find((m) => m.id === memberId);
  if (!target) throw new Error('Membro não encontrado');

  if (target.role === 'admin') {
    const adminCount = members.filter((m) => m.role === 'admin').length;
    if (adminCount <= 1) throw new Error('Não é possível remover o único admin da família');
  }

  return members.filter((m) => m.id !== memberId);
}

/**
 * UC026 — Altera role de um membro.
 * Lança erro se a mudança resultaria em 0 admins.
 */
function alterarRole(
  members: MockProfile[],
  memberId: string,
  novoRole: UserRole,
): MockProfile[] {
  const target = members.find((m) => m.id === memberId);
  if (!target) throw new Error('Membro não encontrado');

  // Validação: não pode rebaixar o único admin
  if (target.role === 'admin' && novoRole !== 'admin') {
    const adminCount = members.filter((m) => m.role === 'admin').length;
    if (adminCount <= 1) throw new Error('Precisa promover outro membro a admin antes');
  }

  return members.map((m) =>
    m.id === memberId ? { ...m, role: novoRole } : m,
  );
}

/**
 * Monta o mapa profileId→daysLeft a partir de convites aceitos ainda vigentes.
 */
function buildAcceptedInviteMap(invites: MockInvite[]): Record<string, number> {
  const map: Record<string, number> = {};
  const now = Date.now();

  for (const inv of invites) {
    if (!inv.accepted_by) continue;
    const expiresMs = new Date(inv.expires_at).getTime();
    if (expiresMs <= now) continue; // expirado
    const daysLeft = Math.max(0, Math.ceil((expiresMs - now) / (1000 * 60 * 60 * 24)));
    map[inv.accepted_by] = daysLeft;
  }

  return map;
}

/** Verifica se o usuário corrente é admin */
function isCurrentUserAdmin(members: MockProfile[], currentUserId: string): boolean {
  const me = members.find((m) => m.user_id === currentUserId);
  return me?.role === 'admin';
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FAMILY = 'family-001';

function makeMember(overrides: Partial<MockProfile> = {}): MockProfile {
  return {
    id:       'prof-001',
    user_id:  'user-001',
    family_id: FAMILY,
    name:     'Joana',
    role:     'admin',
    ...overrides,
  };
}

function futureDate(daysFromNow: number): string {
  return new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000).toISOString();
}

function pastDate(daysAgo: number): string {
  return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
}

// ─── UC027 — removerMembro ────────────────────────────────────────────────────

describe('removerMembro — UC027', () => {
  it('remove membro não-admin sem erros', () => {
    const admin = makeMember({ id: 'p1' });
    const guest = makeMember({ id: 'p2', role: 'guest', name: 'Ana' });
    const result = removerMembro([admin, guest], 'p2');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('p1');
  });

  it('lança erro ao tentar remover o único admin', () => {
    const admin = makeMember({ id: 'p1', role: 'admin' });
    const guest = makeMember({ id: 'p2', role: 'parent' });
    expect(() => removerMembro([admin, guest], 'p1')).toThrow(
      'Não é possível remover o único admin da família',
    );
  });

  it('permite remover admin quando há outro admin', () => {
    const a1 = makeMember({ id: 'p1', role: 'admin' });
    const a2 = makeMember({ id: 'p2', role: 'admin', name: 'Marcos' });
    expect(() => removerMembro([a1, a2], 'p1')).not.toThrow();
    expect(removerMembro([a1, a2], 'p1')).toHaveLength(1);
  });

  it('lança erro para membro inexistente', () => {
    const admin = makeMember();
    expect(() => removerMembro([admin], 'nao-existe')).toThrow('Membro não encontrado');
  });
});

// ─── UC026 — alterarRole ──────────────────────────────────────────────────────

describe('alterarRole — UC026', () => {
  it('promove parent para admin', () => {
    const admin  = makeMember({ id: 'p1', role: 'admin' });
    const parent = makeMember({ id: 'p2', role: 'parent' });
    const result = alterarRole([admin, parent], 'p2', 'admin');
    expect(result.find((m) => m.id === 'p2')?.role).toBe('admin');
    expect(result.find((m) => m.id === 'p1')?.role).toBe('admin');
  });

  it('lança erro ao rebaixar o único admin', () => {
    const admin = makeMember({ id: 'p1', role: 'admin' });
    expect(() => alterarRole([admin], 'p1', 'parent')).toThrow(
      'Precisa promover outro membro a admin antes',
    );
  });

  it('pode rebaixar admin quando há outro admin', () => {
    const a1 = makeMember({ id: 'p1', role: 'admin' });
    const a2 = makeMember({ id: 'p2', role: 'admin' });
    const result = alterarRole([a1, a2], 'p1', 'parent');
    expect(result.find((m) => m.id === 'p1')?.role).toBe('parent');
  });

  it('não altera outros membros', () => {
    const admin  = makeMember({ id: 'p1', role: 'admin' });
    const parent = makeMember({ id: 'p2', role: 'parent' });
    const guest  = makeMember({ id: 'p3', role: 'guest' });
    const result = alterarRole([admin, parent, guest], 'p2', 'admin');
    expect(result.find((m) => m.id === 'p3')?.role).toBe('guest');
  });
});

// ─── buildAcceptedInviteMap ───────────────────────────────────────────────────

describe('buildAcceptedInviteMap', () => {
  it('inclui membro com convite aceito e vigente', () => {
    const inv: MockInvite = {
      id: 'inv-1',
      family_id: FAMILY,
      accepted_by: 'prof-002',
      expires_at: futureDate(3),
      accepted_at: new Date().toISOString(),
    };
    const map = buildAcceptedInviteMap([inv]);
    expect(map['prof-002']).toBeGreaterThan(0);
    expect(map['prof-002']).toBeLessThanOrEqual(3);
  });

  it('exclui convite expirado', () => {
    const inv: MockInvite = {
      id: 'inv-2',
      family_id: FAMILY,
      accepted_by: 'prof-003',
      expires_at: pastDate(1),
    };
    const map = buildAcceptedInviteMap([inv]);
    expect(map['prof-003']).toBeUndefined();
  });

  it('exclui convite sem accepted_by', () => {
    const inv: MockInvite = {
      id: 'inv-3',
      family_id: FAMILY,
      accepted_by: null,
      expires_at: futureDate(7),
    };
    const map = buildAcceptedInviteMap([inv]);
    expect(Object.keys(map)).toHaveLength(0);
  });
});

// ─── isCurrentUserAdmin ───────────────────────────────────────────────────────

describe('isCurrentUserAdmin', () => {
  it('retorna true quando usuário atual é admin', () => {
    const members = [makeMember({ user_id: 'uid-1', role: 'admin' })];
    expect(isCurrentUserAdmin(members, 'uid-1')).toBe(true);
  });

  it('retorna false quando usuário é parent', () => {
    const members = [makeMember({ user_id: 'uid-1', role: 'parent' })];
    expect(isCurrentUserAdmin(members, 'uid-1')).toBe(false);
  });

  it('retorna false quando usuário não está na lista', () => {
    const members = [makeMember({ user_id: 'uid-1' })];
    expect(isCurrentUserAdmin(members, 'uid-2')).toBe(false);
  });
});

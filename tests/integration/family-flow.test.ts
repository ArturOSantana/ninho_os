// tests/integration/family-flow.test.ts
// E2E do fluxo principal da Fase 7 — Família/Membros (UC024–UC027)
// Critério de aceite:
//   - Convidar membro gera link válido com role e prazo
//   - Link temporário expira automaticamente
//   - Sistema bloqueia remoção/rebaixamento se resultaria em 0 admins
//   - Membro removido perde acesso imediatamente

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';

// ─── Tipos mínimos ────────────────────────────────────────────────
type UserRole = 'admin' | 'parent' | 'child' | 'guest' | 'babysitter';

interface FamilyMember {
  id: string;
  family_id: string;
  name: string;
  role: UserRole;
  joined_at: string;
}

interface FamilyInvite {
  id: string;
  family_id: string;
  token: string;
  role: UserRole;
  expires_at: string;
  revoked_at: string | null;
  accepted_by: string | null;
  created_at: string;
}

// ─── Store em memória ─────────────────────────────────────────────
class InMemoryFamilyStore {
  private members: FamilyMember[] = [];
  private invites: FamilyInvite[] = [];
  private memberNextId = 1;
  private inviteNextId = 1;

  addMember(payload: Omit<FamilyMember, 'id' | 'joined_at'>): FamilyMember {
    const member: FamilyMember = {
      id: `member-${this.memberNextId++}`,
      joined_at: new Date().toISOString(),
      ...payload,
    };
    this.members.push(member);
    return member;
  }

  listMembers(familyId: string): FamilyMember[] {
    return this.members.filter((m) => m.family_id === familyId);
  }

  listAdmins(familyId: string): FamilyMember[] {
    return this.members.filter((m) => m.family_id === familyId && m.role === 'admin');
  }

  /** Retorna null se alterar resultaria em 0 admins */
  updateRole(memberId: string, newRole: UserRole): FamilyMember | null {
    const member = this.members.find((m) => m.id === memberId);
    if (!member) return null;

    // Bloqueia se é o último admin sendo rebaixado
    if (member.role === 'admin' && newRole !== 'admin') {
      const admins = this.listAdmins(member.family_id);
      if (admins.length <= 1) return null; // bloqueado
    }

    member.role = newRole;
    return { ...member };
  }

  /** Retorna false se resultaria em 0 admins */
  removeMember(memberId: string): boolean {
    const member = this.members.find((m) => m.id === memberId);
    if (!member) return false;

    if (member.role === 'admin') {
      const admins = this.listAdmins(member.family_id);
      if (admins.length <= 1) return false; // bloqueado
    }

    this.members = this.members.filter((m) => m.id !== memberId);
    return true;
  }

  createInvite(
    familyId: string,
    role: UserRole,
    expiresInDays: number
  ): FamilyInvite {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const invite: FamilyInvite = {
      id: `invite-${this.inviteNextId++}`,
      family_id: familyId,
      token: `tok-${Math.random().toString(36).substring(2, 10)}`,
      role,
      expires_at: expiresAt.toISOString(),
      revoked_at: null,
      accepted_by: null,
      created_at: new Date().toISOString(),
    };
    this.invites.push(invite);
    return invite;
  }

  acceptInvite(token: string, userId: string): FamilyInvite | null {
    const invite = this.invites.find(
      (i) =>
        i.token === token &&
        i.revoked_at === null &&
        new Date(i.expires_at) > new Date() &&
        i.accepted_by === null,
    );
    if (!invite) return null;
    invite.accepted_by = userId;
    return { ...invite };
  }

  revokeInvite(inviteId: string): boolean {
    const invite = this.invites.find((i) => i.id === inviteId);
    if (!invite || invite.revoked_at !== null) return false;
    invite.revoked_at = new Date().toISOString();
    return true;
  }

  listPendingInvites(familyId: string): FamilyInvite[] {
    return this.invites.filter(
      (i) =>
        i.family_id === familyId &&
        i.revoked_at === null &&
        i.accepted_by === null &&
        new Date(i.expires_at) > new Date(),
    );
  }

  isInviteValid(token: string): boolean {
    return this.invites.some(
      (i) =>
        i.token === token &&
        i.revoked_at === null &&
        i.accepted_by === null &&
        new Date(i.expires_at) > new Date(),
    );
  }

  daysUntilExpiry(inviteId: string): number {
    const invite = this.invites.find((i) => i.id === inviteId);
    if (!invite) return -1;
    const diff = new Date(invite.expires_at).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  reset() {
    this.members = [];
    this.invites = [];
    this.memberNextId = 1;
    this.inviteNextId = 1;
  }
}

// ─── Fixtures ────────────────────────────────────────────────────
const FAMILY_ID = 'family-test-1';

// ─── Testes ───────────────────────────────────────────────────────
describe('Fase 7 — Família/Membros: fluxo principal (UC024–UC027)', () => {
  let store: InMemoryFamilyStore;
  let admin: FamilyMember;

  beforeEach(() => {
    jest.useFakeTimers();
    store = new InMemoryFamilyStore();
    // Família já tem 1 admin (criado no UC001/UC004)
    admin = store.addMember({ family_id: FAMILY_ID, name: 'Ana', role: 'admin' });
  });

  afterEach(() => {
    jest.useRealTimers();
    store.reset();
  });

  // ── UC024 — Convidar membro permanente ─────────────────────────
  describe('UC024 — Convidar membro permanente', () => {
    it('gera convite com token único', () => {
      const inv1 = store.createInvite(FAMILY_ID, 'parent', 7);
      const inv2 = store.createInvite(FAMILY_ID, 'parent', 7);

      expect(inv1.token).toBeDefined();
      expect(inv2.token).toBeDefined();
      expect(inv1.token).not.toBe(inv2.token);
    });

    it('convite tem role e prazo corretos', () => {
      const invite = store.createInvite(FAMILY_ID, 'parent', 7);

      expect(invite.role).toBe('parent');
      expect(store.daysUntilExpiry(invite.id)).toBe(7);
    });

    it('aceitar convite válido vincula o userId', () => {
      const invite = store.createInvite(FAMILY_ID, 'parent', 7);
      const accepted = store.acceptInvite(invite.token, 'user-novo');

      expect(accepted?.accepted_by).toBe('user-novo');
    });

    it('listPendingInvites retorna apenas os não aceitos e não revogados', () => {
      const i1 = store.createInvite(FAMILY_ID, 'parent', 7);
      const i2 = store.createInvite(FAMILY_ID, 'guest', 1);

      store.acceptInvite(i1.token, 'user-novo');

      expect(store.listPendingInvites(FAMILY_ID)).toHaveLength(1);
      expect(store.listPendingInvites(FAMILY_ID)[0].id).toBe(i2.id);
    });
  });

  // ── UC025 — Convidar membro temporário (guest link) ────────────
  describe('UC025 — Convidar membro temporário', () => {
    it('convite com prazo 1 dia expira após 24h', () => {
      const invite = store.createInvite(FAMILY_ID, 'babysitter', 1);

      // Antes de expirar — ainda válido
      expect(store.isInviteValid(invite.token)).toBe(true);

      // Avança 25 horas (25 * 60 * 60 * 1000 ms)
      jest.advanceTimersByTime(25 * 60 * 60 * 1000);

      // Agora o Date.now() interno ainda está no "passado" no jest — forçamos via
      // mockSystemTime para alinhar com expires_at calculado no beforeEach
      const expiredDate = new Date(invite.expires_at);
      expiredDate.setHours(expiredDate.getHours() + 1);
      jest.setSystemTime(expiredDate);

      expect(store.isInviteValid(invite.token)).toBe(false);
    });

    it('exibição de contagem regressiva: 7 dias de prazo → daysUntilExpiry = 7', () => {
      const invite = store.createInvite(FAMILY_ID, 'guest', 7);
      expect(store.daysUntilExpiry(invite.id)).toBe(7);
    });

    it('revogar convite pendente invalida o token imediatamente', () => {
      const invite = store.createInvite(FAMILY_ID, 'babysitter', 7);
      store.revokeInvite(invite.id);

      expect(store.isInviteValid(invite.token)).toBe(false);
    });

    it('aceitar convite revogado retorna null', () => {
      const invite = store.createInvite(FAMILY_ID, 'guest', 7);
      store.revokeInvite(invite.id);

      expect(store.acceptInvite(invite.token, 'user-novo')).toBeNull();
    });
  });

  // ── UC026 — Alterar permissão de membro ────────────────────────
  describe('UC026 — Alterar permissão de membro', () => {
    it('admin pode rebaixar parent para guest', () => {
      const parent = store.addMember({ family_id: FAMILY_ID, name: 'Bob', role: 'parent' });
      const updated = store.updateRole(parent.id, 'guest');

      expect(updated?.role).toBe('guest');
    });

    it('bloqueia rebaixamento se resultaria em 0 admins', () => {
      // Família com 1 admin apenas (o criado no beforeEach)
      const result = store.updateRole(admin.id, 'parent');

      expect(result).toBeNull();
      // Role do admin não mudou
      expect(store.listAdmins(FAMILY_ID)).toHaveLength(1);
    });

    it('não bloqueia rebaixamento quando há 2 admins', () => {
      const admin2 = store.addMember({ family_id: FAMILY_ID, name: 'Carlos', role: 'admin' });
      const result = store.updateRole(admin.id, 'parent');

      expect(result?.role).toBe('parent');
      expect(store.listAdmins(FAMILY_ID)).toHaveLength(1);
      expect(store.listAdmins(FAMILY_ID)[0].id).toBe(admin2.id);
    });

    it('pode promover parent para admin', () => {
      const parent = store.addMember({ family_id: FAMILY_ID, name: 'Dona', role: 'parent' });
      const updated = store.updateRole(parent.id, 'admin');

      expect(updated?.role).toBe('admin');
      expect(store.listAdmins(FAMILY_ID)).toHaveLength(2);
    });
  });

  // ── UC027 — Remover membro ──────────────────────────────────────
  describe('UC027 — Remover membro', () => {
    it('remove membro não-admin com sucesso', () => {
      const parent = store.addMember({ family_id: FAMILY_ID, name: 'Eve', role: 'parent' });
      const removed = store.removeMember(parent.id);

      expect(removed).toBe(true);
      expect(store.listMembers(FAMILY_ID).find((m) => m.id === parent.id)).toBeUndefined();
    });

    it('membro removido perde acesso imediatamente (não aparece em listMembers)', () => {
      const guest = store.addMember({ family_id: FAMILY_ID, name: 'Fred', role: 'guest' });
      store.removeMember(guest.id);

      expect(store.listMembers(FAMILY_ID).map((m) => m.id)).not.toContain(guest.id);
    });

    it('bloqueia remoção do último admin', () => {
      const removed = store.removeMember(admin.id);

      expect(removed).toBe(false);
      expect(store.listMembers(FAMILY_ID)).toHaveLength(1);
    });

    it('com 2 admins, permite remover um deles', () => {
      store.addMember({ family_id: FAMILY_ID, name: 'Grace', role: 'admin' });
      const removed = store.removeMember(admin.id);

      expect(removed).toBe(true);
      expect(store.listAdmins(FAMILY_ID)).toHaveLength(1);
    });

    it('remover id inexistente retorna false', () => {
      expect(store.removeMember('nao-existe')).toBe(false);
    });
  });
});

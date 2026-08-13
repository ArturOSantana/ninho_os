// src/hooks/useFamilyMembers.ts
// Fase 5: Social — gerencia membros, roles e convites

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { familyService } from '@/services/family/familyService';
import { supabase } from '@/lib/supabase';
import { Profile, UserRole, PendingInvite, InviteLinkResponse, UUID } from '@/types';

interface FamilyMembersState {
  members: Profile[];
  pendingInvites: PendingInvite[];
  /** Mapa profileId → dias restantes para membros aceitos via convite ainda ativo */
  acceptedInviteMap: Record<string, number>;
  loading: boolean;
  error: string | null;
  inviteLink: InviteLinkResponse | null;
}

export function useFamilyMembers(familyId: UUID | null | undefined) {
  const [state, setState] = useState<FamilyMembersState>({
    members: [],
    pendingInvites: [],
    acceptedInviteMap: {},
    loading: false,
    error: null,
    inviteLink: null,
  });

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const setPartial = (partial: Partial<FamilyMembersState>) =>
    setState((prev) => ({ ...prev, ...partial }));

  /** UC027 — carrega lista de membros */
  const load = useCallback(async () => {
    if (!familyId) return;
    setPartial({ loading: true, error: null });
    try {
      const members = await familyService.listMembers(familyId);
      setPartial({ members });
    } catch (err) {
      setPartial({ error: err instanceof Error ? err.message : 'Erro ao carregar membros' });
    } finally {
      setPartial({ loading: false });
    }
  }, [familyId]);

  /** UC025 — carrega convites pendentes (não aceitos, não expirados) */
  const loadPendingInvites = useCallback(async () => {
    if (!familyId) return;
    try {
      const pendingInvites = await familyService.listPendingInvites(familyId);
      setPartial({ pendingInvites });
    } catch {
      // silencioso — não crítico para a tela principal
    }
  }, [familyId]);

  // Nome único por montagem para evitar reutilizar um canal já subscrito
  const channelName = useMemo(
    () => (familyId ? `profiles:family:${familyId}:${Date.now()}` : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [familyId]
  );

  // ── Realtime: ouve INSERT / UPDATE / DELETE em profiles da família ──
  useEffect(() => {
    if (!familyId || !channelName) return;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `family_id=eq.${familyId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMember = payload.new as Profile;
            setState((prev) => {
              if (prev.members.some((m) => m.id === newMember.id)) return prev;
              return { ...prev, members: [...prev.members, newMember] };
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Profile;
            setState((prev) => ({
              ...prev,
              members: prev.members.map((m) => (m.id === updated.id ? updated : m)),
            }));
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old as { id: string };
            setState((prev) => ({
              ...prev,
              members: prev.members.filter((m) => m.id !== deleted.id),
            }));
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [familyId, channelName]);

  /** UC025 — carrega mapa profileId→daysLeft de convites já aceitos mas ainda vigentes */
  const loadAcceptedInvites = useCallback(async () => {
    if (!familyId) return;
    try {
      const acceptedInviteMap = await familyService.listAcceptedInvites(familyId);
      setPartial({ acceptedInviteMap });
    } catch {
      // silencioso — não bloqueia a tela de membros
    }
  }, [familyId]);

  /** UC025 — gera link de convite com role e prazo definidos */
  const generateInvite = useCallback(
    async (
      role: UserRole = 'parent',
      expiresInDays: 1 | 7 | 30 = 7
    ): Promise<InviteLinkResponse | null> => {
      if (!familyId) return null;
      setPartial({ loading: true, error: null });
      try {
        const link = await familyService.createInviteWithRole(familyId, role, expiresInDays);
        setPartial({ inviteLink: link });
        // Atualiza lista de pendentes após gerar
        loadPendingInvites();
        return link;
      } catch (err) {
        setPartial({ error: err instanceof Error ? err.message : 'Erro ao gerar convite' });
        return null;
      } finally {
        setPartial({ loading: false });
      }
    },
    [familyId, loadPendingInvites]
  );

  /** UC025 — revoga convite antes de expirar */
  const revokeInvite = useCallback(async (inviteId: UUID): Promise<void> => {
    try {
      await familyService.revokeInvite(inviteId);
      setState((prev) => ({
        ...prev,
        pendingInvites: prev.pendingInvites.filter((i) => i.id !== inviteId),
      }));
    } catch (err) {
      setPartial({ error: err instanceof Error ? err.message : 'Erro ao revogar convite' });
      throw err;
    }
  }, []);

  /** UC026 — altera permissão de um membro (banco bloqueia se resultaria em 0 admins) */
  const updateRole = useCallback(
    async (memberId: UUID, role: UserRole): Promise<void> => {
      setPartial({ loading: true, error: null });
      try {
        const updated = await familyService.updateMemberRole(memberId, role);
        setState((prev) => ({
          ...prev,
          members: prev.members.map((m) => (m.id === memberId ? updated : m)),
        }));
      } catch (err) {
        setPartial({ error: err instanceof Error ? err.message : 'Erro ao alterar permissão' });
        throw err;
      } finally {
        setPartial({ loading: false });
      }
    },
    []
  );

  /** UC027 — remove membro da família (banco bloqueia se é o último admin) */
  const removeMember = useCallback(async (memberId: UUID): Promise<void> => {
    setPartial({ loading: true, error: null });
    try {
      await familyService.removeMember(memberId);
      setState((prev) => ({
        ...prev,
        members: prev.members.filter((m) => m.id !== memberId),
      }));
    } catch (err) {
      setPartial({ error: err instanceof Error ? err.message : 'Erro ao remover membro' });
      throw err;
    } finally {
      setPartial({ loading: false });
    }
  }, []);

  return {
    ...state,
    load,
    loadPendingInvites,
    loadAcceptedInvites,
    generateInvite,
    revokeInvite,
    updateRole,
    removeMember,
  };
}

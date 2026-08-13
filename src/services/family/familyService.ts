// src/services/family/familyService.ts

import { supabase } from '@/lib/supabase';
import {
  Family,
  Baby,
  Profile,
  UserRole,
  CreateFamilyInput,
  CreateBabyInput,
  GuestInvite,
  GuestShoppingLinkResponse,
  PendingInvite,
  InviteLinkResponse,
  UUID,
} from '@/types';

/**
 * Family Service - Gerencia operações relacionadas a famílias
 * Usa funções PL/pgSQL do Supabase para operações atômicas
 */
export const familyService = {
  /**
   * UC007 - Criar Família
   * Cria uma nova família e vincula o usuário autenticado como admin
   */
  async createFamily(input: CreateFamilyInput): Promise<Family> {
    try {
      const { data, error } = await supabase.rpc('create_family_for_user', {
        family_name: input.name,
      });

      if (error) throw new Error(error.message);
      if (!data) throw new Error('Falha ao criar família');

      // Upload foto se fornecida
      if (input.photo_url) {
        await familyService.uploadFamilyPhoto(data.id, input.photo_url);
      }

      return data as Family;
    } catch (err) {
      console.error('Erro ao criar família:', err);
      throw err;
    }
  },

  /**
   * Obter dados completos da família com bebês e membros
   */
  async getFamily(familyId: UUID): Promise<Family> {
    try {
      const { data, error } = await supabase
        .from('families')
        .select('*')
        .eq('id', familyId)
        .single();

      if (error) throw new Error(error.message);
      return data as Family;
    } catch (err) {
      console.error('Erro ao buscar família:', err);
      throw err;
    }
  },

  /**
   * Atualizar dados da família
   */
  async updateFamily(id: UUID, updates: Partial<Family>): Promise<Family> {
    try {
      const { data, error } = await supabase
        .from('families')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Family;
    } catch (err) {
      console.error('Erro ao atualizar família:', err);
      throw err;
    }
  },

  /**
   * UC008 - Adicionar Bebê
   */
  async createBaby(input: CreateBabyInput): Promise<Baby> {
    try {
      // Validar data de nascimento
      const birthDate = new Date(input.birth_date);
      if (birthDate > new Date()) {
        throw new Error('Data de nascimento não pode ser no futuro');
      }

      const { data: user } = await supabase.auth.getUser();
      if (!user.user?.id) throw new Error('Usuário não autenticado');

      // Buscar family_id do usuário
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('family_id')
        .eq('user_id', user.user.id)
        .single();

      if (profileError || !profile.family_id) {
        throw new Error('Família não encontrada');
      }

      const { data, error } = await supabase
        .from('babies')
        .insert({
          family_id: profile.family_id,
          name: input.name,
          birth_date: input.birth_date,
          sex: input.sex,
          photo_url: null, // Será preenchido após upload
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      // Upload foto se fornecida
      if (input.photo_url) {
        const photoUrl = await familyService.uploadBabyPhoto(
          data.id,
          input.photo_url
        );
        // Atualizar registro com URL da foto
        const { data: updated } = await supabase
          .from('babies')
          .update({ photo_url: photoUrl })
          .eq('id', data.id)
          .select()
          .single();
        return updated as Baby;
      }

      return data as Baby;
    } catch (err) {
      console.error('Erro ao criar bebê:', err);
      throw err;
    }
  },

  /**
   * Obter bebê por ID
   */
  async getBaby(id: UUID): Promise<Baby> {
    try {
      const { data, error } = await supabase
        .from('babies')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw new Error(error.message);
      return data as Baby;
    } catch (err) {
      console.error('Erro ao buscar bebê:', err);
      throw err;
    }
  },

  /**
   * Listar todos os bebês da família
   */
  async listBabies(familyId: UUID): Promise<Baby[]> {
    try {
      const { data, error } = await supabase
        .from('babies')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data || []) as Baby[];
    } catch (err) {
      console.error('Erro ao listar bebês:', err);
      throw err;
    }
  },

  /**
   * Atualizar dados do bebê
   */
  async updateBaby(id: UUID, updates: Partial<Baby>): Promise<Baby> {
    try {
      const { data, error } = await supabase
        .from('babies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Baby;
    } catch (err) {
      console.error('Erro ao atualizar bebê:', err);
      throw err;
    }
  },

  /**
   * UC009 - Gerar Link de Convite
   */
  async createInviteLink(familyId: UUID): Promise<InviteLinkResponse> {
    try {
      const { data, error } = await supabase.rpc('generate_invite_link', {
        family_id: familyId,
        role: 'parent',
      });

      if (error) throw new Error(error.message);
      return data as InviteLinkResponse;
    } catch (err) {
      console.error('Erro ao gerar convite:', err);
      throw err;
    }
  },

  /**
   * UC006 - Aceitar Convite (continuação)
   */
  async acceptInvite(token: string): Promise<Family> {
    try {
      const { data, error } = await supabase.rpc('join_family_by_invite', {
        invite_token: token,
      });

      if (error) throw new Error(error.message);
      return data as Family;
    } catch (err) {
      console.error('Erro ao aceitar convite:', err);
      throw err;
    }
  },

  /**
   * Validar token de convite
   */
  async validateInvite(token: string): Promise<GuestInvite | null> {
    try {
      const { data, error } = await supabase
        .from('guest_invites')
        .select('*')
        .eq('token', token)
        .gt('expires_at', new Date().toISOString())
        .is('used_by', null)
        .single();

      if (error && error.code === 'PGRST116') {
        // Não encontrado
        return null;
      }
      if (error) throw new Error(error.message);

      return data as GuestInvite;
    } catch (err) {
      console.error('Erro ao validar convite:', err);
      throw err;
    }
  },

  /**
   * Upload de foto do bebê
   * Comprime e armazena no Supabase Storage
   */
  async uploadBabyPhoto(babyId: UUID, photoFile: any): Promise<string> {
    try {
      // Validações básicas
      if (!photoFile.uri && !photoFile.path) {
        throw new Error('Arquivo de foto inválido');
      }

      // Extrair extensão
      const filename = photoFile.uri || photoFile.path;
      const ext = filename.split('.').pop() || 'jpg';
      const timestamp = Date.now();

      // Path: baby-photos/[baby-id]/[timestamp].[ext]
      const path = `baby-photos/${babyId}/${timestamp}.${ext}`;

      // Fazer upload usando FormData
      const response = await fetch(photoFile.uri || photoFile.path);
      const blob = await response.blob();

      const { data, error } = await supabase.storage
        .from('ninho-storage')
        .upload(path, blob, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw new Error(error.message);

      // Retornar URL pública
      const {
        data: { publicUrl },
      } = supabase.storage.from('ninho-storage').getPublicUrl(path);

      return publicUrl;
    } catch (err) {
      console.error('Erro ao fazer upload de foto:', err);
      throw err;
    }
  },

  /**
   * Upload de foto da família
   */
  async uploadFamilyPhoto(familyId: UUID, photoFile: any): Promise<string> {
    try {
      const filename = photoFile.uri || photoFile.path;
      const ext = filename.split('.').pop() || 'jpg';
      const timestamp = Date.now();

      const path = `family-photos/${familyId}/${timestamp}.${ext}`;

      const response = await fetch(filename);
      const blob = await response.blob();

      const { data, error } = await supabase.storage
        .from('ninho-storage')
        .upload(path, blob, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) throw new Error(error.message);

      const {
        data: { publicUrl },
      } = supabase.storage.from('ninho-storage').getPublicUrl(path);

      return publicUrl;
    } catch (err) {
      console.error('Erro ao fazer upload de foto da família:', err);
      throw err;
    }
  },

  // ─── Fase 5: Membros ──────────────────────────────────────────

  /**
   * UC027 - Listar membros da família
   */
  async listMembers(familyId: UUID): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []) as Profile[];
  },

  /**
   * UC026 - Alterar permissão (role) de um membro
   * Usa a função safe_update_member_role que bloqueia se resultaria
   * em zero admins na família.
   */
  async updateMemberRole(memberId: UUID, role: UserRole): Promise<Profile> {
    const { data, error } = await supabase.rpc('safe_update_member_role', {
      p_member_id: memberId,
      p_new_role: role,
    });

    if (error) throw new Error(error.message);
    return data as Profile;
  },

  /**
   * UC027 - Remover membro da família
   * Usa a função safe_remove_member que bloqueia se é o último admin.
   */
  async removeMember(memberId: UUID): Promise<void> {
    const { error } = await supabase.rpc('safe_remove_member', {
      p_member_id: memberId,
    });

    if (error) throw new Error(error.message);
  },

  /**
   * UC025 - Gerar convite guest com prazo customizável
   * expiresInDays: 1 | 7 | 30 (padrão: 7)
   */
  async createInviteWithRole(
    familyId: UUID,
    role: UserRole,
    expiresInDays: 1 | 7 | 30 = 7
  ): Promise<InviteLinkResponse> {
    const { data, error } = await supabase.rpc('generate_invite_link', {
      family_id: familyId,
      role,
      expires_in_days: expiresInDays,
    });

    if (error) throw new Error(error.message);
    return { ...(data as InviteLinkResponse), expiresInDays };
  },

  /**
   * UC025 - Listar convites pendentes (não usados e não expirados)
   * Retorna convites com contagem de dias restantes.
   */
  async listPendingInvites(familyId: UUID): Promise<PendingInvite[]> {
    const { data, error } = await supabase
      .from('guest_invites')
      .select('id, token, scope, expires_at, created_at, revoked_at, label')
      .eq('family_id', familyId)
      .is('used_by', null)
      .is('revoked_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    const now = Date.now();
    return ((data ?? []) as Omit<PendingInvite, 'daysLeft'>[]).map((inv) => ({
      ...inv,
      daysLeft: Math.max(
        0,
        Math.ceil((new Date(inv.expires_at).getTime() - now) / 86_400_000)
      ),
    }));
  },

  /**
   * UC025 - Listar convites já aceitos cujo prazo ainda não expirou
   * Retorna um mapa profileId → daysLeft para exibir badge nos MemberCards.
   */
  async listAcceptedInvites(familyId: UUID): Promise<Record<UUID, number>> {
    const { data, error } = await supabase
      .from('guest_invites')
      .select('used_by, expires_at')
      .eq('family_id', familyId)
      .not('used_by', 'is', null)
      .is('revoked_at', null)
      .gt('expires_at', new Date().toISOString());

    if (error) throw new Error(error.message);

    const now = Date.now();
    const map: Record<UUID, number> = {};
    for (const row of data ?? []) {
      if (!row.used_by) continue;
      map[row.used_by as UUID] = Math.max(
        0,
        Math.ceil((new Date(row.expires_at).getTime() - now) / 86_400_000)
      );
    }
    return map;
  },

  /**
   * UC025 - Revogar convite ativo antes de expirar
   */
  async revokeInvite(inviteId: UUID): Promise<void> {
    const { error } = await supabase
      .from('guest_invites')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', inviteId);

    if (error) throw new Error(error.message);
  },

  // ─── Guest Shopping Link ──────────────────────────────────

  /**
   * Cria um link temporário de convidado para a lista de compras.
   * Válido por `hours` horas (padrão 48). Requer role admin/parent.
   */
  async createGuestShoppingLink(
    familyId: UUID,
    hours = 48
  ): Promise<GuestShoppingLinkResponse> {
    const { data, error } = await supabase.rpc('create_guest_shopping_link', {
      p_family_id: familyId,
      p_hours:     hours,
    });

    if (error) throw new Error(error.message);
    return data as GuestShoppingLinkResponse;
  },

  /**
   * Revoga um link de convidado antes do prazo de expiração.
   */
  async revokeGuestShoppingLink(token: string): Promise<void> {
    const { error } = await supabase.rpc('revoke_guest_shopping_link', {
      p_token: token,
    });

    if (error) throw new Error(error.message);
  },

  /**
   * UC043 — Criar perfil de criança/adolescente (role=child)
   * Insere diretamente na tabela `profiles` com role='child'.
   * Não requer user_id (crianças não têm conta própria) — o backend
   * deve aceitar null para user_id em registros role=child.
   */
  async createChildProfile(
    familyId: UUID,
    name: string,
    birthDate: string, // YYYY-MM-DD
  ): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        family_id:  familyId,
        name,
        birth_date: birthDate,
        role:       'child' as UserRole,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Profile;
  },

  /**
   * Atualiza perfil de criança/adolescente (role=child).
   */
  async updateChildProfile(
    id: UUID,
    name: string,
    birthDate: string, // YYYY-MM-DD
  ): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        name,
        birth_date: birthDate,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Profile;
  },
};

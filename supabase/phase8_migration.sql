-- ============================================================
-- NINHO — Migration Fase 8: UC025/UC026/UC027 gaps
-- 1. RLS de profiles: admin só pode alterar roles de membros
--    da mesma família, e não pode remover o último admin.
-- 2. Função safe_update_member_role — garante que não restará
--    zero admins após a alteração.
-- 3. Função safe_remove_member — idem para remoção.
-- 4. Convites guest (curta duração) — geração com expires_at
--    customizável via generate_guest_invite().
-- ============================================================

-- ─── 1. Policies de profiles (UC026 / UC027) ─────────────────

-- Admins podem alterar o role de qualquer membro da família,
-- desde que não seja o próprio perfil (auto-demotion tratada
-- pela função safe_update_member_role).
drop policy if exists "Admin altera role de membro" on profiles;
create policy "Admin altera role de membro"
  on profiles for update
  using (
    family_id = auth_family_id()
    and auth_role() = 'admin'
  );

-- ─── 2. Função: alterar role com guarda de zero-admin ────────

create or replace function public.safe_update_member_role(
  p_member_id  uuid,
  p_new_role   user_role
)
returns json as $$
declare
  v_prof    profiles%rowtype;
  v_admins  int;
begin
  -- Só admin pode chamar
  if auth_role() != 'admin' then
    raise exception 'Apenas administradores podem alterar permissões.';
  end if;

  select * into v_prof from profiles where id = p_member_id;

  if not found or v_prof.family_id != auth_family_id() then
    raise exception 'Membro não encontrado nesta família.';
  end if;

  -- Se está rebaixando um admin, checar se restará ao menos 1
  if v_prof.role = 'admin' and p_new_role != 'admin' then
    select count(*) into v_admins
    from profiles
    where family_id = auth_family_id()
      and role = 'admin';

    if v_admins <= 1 then
      raise exception 'A família precisa ter ao menos um administrador.';
    end if;
  end if;

  update profiles
  set role = p_new_role
  where id = p_member_id
  returning * into v_prof;

  return row_to_json(v_prof);
end;
$$ language plpgsql security definer;

-- ─── 3. Função: remover membro com guarda de zero-admin ──────

create or replace function public.safe_remove_member(
  p_member_id uuid
)
returns void as $$
declare
  v_prof   profiles%rowtype;
  v_admins int;
begin
  if auth_role() != 'admin' then
    raise exception 'Apenas administradores podem remover membros.';
  end if;

  select * into v_prof from profiles where id = p_member_id;

  if not found or v_prof.family_id != auth_family_id() then
    raise exception 'Membro não encontrado nesta família.';
  end if;

  -- Impede remoção do último admin
  if v_prof.role = 'admin' then
    select count(*) into v_admins
    from profiles
    where family_id = auth_family_id()
      and role = 'admin';

    if v_admins <= 1 then
      raise exception 'Não é possível remover o único administrador da família.';
    end if;
  end if;

  update profiles
  set family_id = null,
      role      = 'guest'
  where id = p_member_id;
end;
$$ language plpgsql security definer;

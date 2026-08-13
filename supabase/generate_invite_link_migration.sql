-- ============================================================
-- NINHO — Migration: generate_invite_link RPC
-- Cria a função RPC que gera convites de família com role e prazo
-- configuráveis. Chamada por familyService.createInviteLink e
-- familyService.createInviteWithRole.
-- ============================================================

-- Parâmetros:
--   family_id      — UUID da família (deve pertencer ao usuário autenticado)
--   role           — user_role do convidado (padrão: 'parent')
--   expires_in_days — prazo em dias: 1, 7 ou 30 (padrão: 7)
--
-- Retorna JSON com: token, link, deeplink, expires_at

create or replace function public.generate_invite_link(
  family_id      uuid,
  role           user_role  default 'parent',
  expires_in_days int       default 7
)
returns json as $$
declare
  v_invite  guest_invites%rowtype;
  v_token   text;
  v_expires timestamptz;
  v_link    text;
begin
  -- Apenas admin ou parent podem gerar convites
  if auth_role() not in ('admin', 'parent') then
    raise exception 'Apenas admin ou parent podem gerar convites.';
  end if;

  -- Família deve ser a do usuário autenticado
  if family_id != auth_family_id() then
    raise exception 'Família não encontrada.';
  end if;

  -- Calcula expiração
  v_expires := now() + (expires_in_days || ' days')::interval;

  -- Insere convite e recupera o token gerado pelo default
  insert into guest_invites (family_id, scope, expires_at, created_by)
  values (
    family_id,
    role,
    v_expires,
    (select id from profiles where user_id = auth.uid() limit 1)
  )
  returning * into v_invite;

  v_token := v_invite.token;
  v_link  := 'https://ninho.app/invite/' || v_token;

  return json_build_object(
    'token',      v_token,
    'link',       v_link,
    'deeplink',   'ninho://invite/' || v_token,
    'expires_at', v_expires
  );
end;
$$ language plpgsql security definer;

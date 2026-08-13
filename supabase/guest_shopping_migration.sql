-- ============================================================
-- NINHO — Migration: Acesso de Convidado Temporário à Lista
-- Feature: guest_link para shopping_items (SELECT + UPDATE)
-- RLS valida family_id do perfil guest + expiração automática
-- ============================================================

-- ─── 1. Garantir que o enum já possui 'guest' (schema base) ──
-- Já existe: user_role enum ('admin','parent','child','guest')

-- ─── 2. Tabela guest_shopping_links ──────────────────────────
-- Link de curta duração que não requer conta permanente.
-- Diferente do guest_invites (que promove o usuário à família),
-- este link permite acesso temporário somente a shopping_items.

create table if not exists guest_shopping_links (
  id          uuid primary key default uuid_generate_v4(),
  family_id   uuid not null references families(id) on delete cascade,
  token       text not null unique default encode(gen_random_bytes(24), 'hex'),
  -- quem gerou
  created_by  uuid not null references profiles(id) on delete cascade,
  -- validade máxima configurável (padrão 48 h)
  expires_at  timestamptz not null default (now() + interval '48 hours'),
  -- revogação manual antes do prazo
  revoked_at  timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists guest_shopping_links_token_idx
  on guest_shopping_links(token);

create index if not exists guest_shopping_links_family_id_idx
  on guest_shopping_links(family_id);

-- ─── 3. RLS na nova tabela ────────────────────────────────────
alter table guest_shopping_links enable row level security;

-- Admin/parent da família podem criar links de convidado
create policy "Admin/parent criam guest_shopping_link"
  on guest_shopping_links for insert
  with check (
    family_id = auth_family_id()
    and auth_role() in ('admin', 'parent')
  );

-- Membros da família veem os links da família
create policy "Membros veem guest_shopping_links da família"
  on guest_shopping_links for select
  using (family_id = auth_family_id());

-- Quem criou ou admin pode revogar (UPDATE revoked_at)
create policy "Criador ou admin podem revogar link"
  on guest_shopping_links for update
  using (
    family_id = auth_family_id()
    and (
      created_by in (select id from profiles where user_id = auth.uid())
      or auth_role() = 'admin'
    )
  );

-- ─── 4. Função: validate_guest_shopping_token ─────────────────
-- Retorna o family_id se o token for válido; NULL caso contrário.
-- Usada nas políticas RLS via SECURITY DEFINER (sem expor a tabela
-- inteira ao chamador não autenticado).

create or replace function public.validate_guest_shopping_token(p_token text)
returns uuid as $$
  select family_id
  from guest_shopping_links
  where token      = p_token
    and expires_at > now()
    and revoked_at is null
  limit 1;
$$ language sql stable security definer;

-- ─── 5. Políticas adicionais em shopping_items para guest_link ─
-- Convidados com token válido podem SELECT e UPDATE (marcar item).
-- INSERT e DELETE continuam restritos a membros autenticados.

-- SELECT via token (para usuários não autenticados também)
create policy "Guest com token válido vê lista"
  on shopping_items for select
  using (
    family_id = public.validate_guest_shopping_token(
      -- o token é passado como claim customizado no JWT *ou*
      -- via parâmetro de request header (x-guest-token).
      -- Aqui lemos do claim 'guest_token' do JWT anônimo.
      coalesce(
        current_setting('request.jwt.claims', true)::jsonb ->> 'guest_token',
        ''
      )
    )
  );

-- UPDATE via token (marcar/desmarcar item)
create policy "Guest com token válido marca item"
  on shopping_items for update
  using (
    family_id = public.validate_guest_shopping_token(
      coalesce(
        current_setting('request.jwt.claims', true)::jsonb ->> 'guest_token',
        ''
      )
    )
  );

-- ─── 6. Função RPC: create_guest_shopping_link ───────────────
-- Cria um link de convidado e retorna o token e dados de validade.

create or replace function public.create_guest_shopping_link(
  p_family_id uuid,
  p_hours     int default 48
) returns json as $$
declare
  v_profile profiles%rowtype;
  v_link    guest_shopping_links%rowtype;
begin
  -- Verificar que o chamador é membro admin/parent da família
  select * into v_profile
  from profiles
  where user_id = auth.uid()
    and family_id = p_family_id
    and role in ('admin', 'parent')
  limit 1;

  if not found then
    raise exception 'Permissão negada: apenas admin ou parent podem gerar links de convidado.';
  end if;

  insert into guest_shopping_links (family_id, created_by, expires_at)
  values (p_family_id, v_profile.id, now() + (p_hours || ' hours')::interval)
  returning * into v_link;

  return json_build_object(
    'token',      v_link.token,
    'family_id',  v_link.family_id,
    'expires_at', v_link.expires_at
  );
end;
$$ language plpgsql security definer;

-- ─── 7. Função RPC: revoke_guest_shopping_link ───────────────
create or replace function public.revoke_guest_shopping_link(p_token text)
returns void as $$
begin
  update guest_shopping_links
  set revoked_at = now()
  where token = p_token
    and family_id = auth_family_id()
    and revoked_at is null;
end;
$$ language plpgsql security definer;

-- ─── 8. RPC guest-safe: list_guest_shopping_items ────────────
-- Retorna itens da lista para um token válido.
-- Não requer autenticação de usuário (pode ser chamado com anon key).

create or replace function public.list_guest_shopping_items(p_token text)
returns setof shopping_items as $$
declare
  v_family_id uuid;
begin
  v_family_id := public.validate_guest_shopping_token(p_token);

  if v_family_id is null then
    raise exception 'Token inválido ou expirado.';
  end if;

  return query
    select * from shopping_items
    where family_id = v_family_id
    order by created_at desc;
end;
$$ language plpgsql security definer;

-- ─── 9. RPC guest-safe: check_guest_shopping_item ────────────
-- Marca um item como comprado para um token válido.

create or replace function public.check_guest_shopping_item(
  p_token   text,
  p_item_id uuid
) returns void as $$
declare
  v_family_id uuid;
begin
  v_family_id := public.validate_guest_shopping_token(p_token);

  if v_family_id is null then
    raise exception 'Token inválido ou expirado.';
  end if;

  update shopping_items
  set checked = true
  where id        = p_item_id
    and family_id = v_family_id;
end;
$$ language plpgsql security definer;

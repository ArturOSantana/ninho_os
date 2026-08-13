-- ============================================================
-- NINHO — Migration MVP Gaps
-- Consolida 4 gaps de schema identificados para o MVP:
--
--   1. tasks        → completed_by, completed_at       (UC019, UC028)
--   2. guest_invites → revoked_at, label               (UC025)
--   3. weekly_checkins (NOVA tabela)                   (UC030)
--   4. family_events → updated_at, updated_by          (UC017)
--
-- Idempotente: usa ADD COLUMN IF NOT EXISTS e CREATE TABLE IF NOT EXISTS.
-- ============================================================

-- ─── 1. tasks: rastreamento de conclusão ─────────────────────
-- completed_by → quem concluiu a tarefa   (blocker UC019, UC028)
-- completed_at → quando foi concluída     (blocker UC019, UC028)
--
-- Nota: se a migration uc019_migration.sql já foi aplicada, os
-- "IF NOT EXISTS" garantem idempotência sem erro.

alter table tasks
  add column if not exists completed_by uuid references profiles(id) on delete set null,
  add column if not exists completed_at timestamptz;

-- Índice composto para cálculos de carga mental por período (UC028)
create index if not exists tasks_completed_by_completed_at_idx
  on tasks(completed_by, completed_at)
  where status = 'done';

-- ─── 2. guest_invites: revogação manual + apelido ─────────────
-- revoked_at → permite revogar o convite antes de expirar (UC025)
-- label      → apelido/nome do convidado para identificação (UC025)

alter table guest_invites
  add column if not exists revoked_at timestamptz,
  add column if not exists label      text;

-- Índice para consultas de convites ativos sem precisar ler todos
create index if not exists guest_invites_family_id_active_idx
  on guest_invites(family_id, expires_at)
  where revoked_at is null and used_by is null;

-- Atualizar função join_family_by_invite para respeitar revogação
create or replace function public.join_family_by_invite(invite_token text)
returns json as $$
declare
  invite guest_invites%rowtype;
  fam    families%rowtype;
  prof   profiles%rowtype;
begin
  -- Busca convite válido: não expirado, não usado, não revogado
  select * into invite
  from guest_invites
  where token      = invite_token
    and expires_at > now()
    and used_by    is null
    and revoked_at is null;   -- ← nova guarda UC025

  if not found then
    raise exception 'Convite inválido, expirado ou revogado.';
  end if;

  select * into fam from families where id = invite.family_id;

  update profiles
  set family_id = invite.family_id,
      role      = invite.scope
  where user_id = auth.uid()
  returning * into prof;

  update guest_invites set used_by = prof.id where id = invite.id;

  return row_to_json(fam);
end;
$$ language plpgsql security definer;

-- RPC: revogar convite manualmente (admin/parent da família)
create or replace function public.revoke_guest_invite(p_invite_id uuid)
returns void as $$
begin
  if auth_role() not in ('admin', 'parent') then
    raise exception 'Apenas admin ou parent podem revogar convites.';
  end if;

  update guest_invites
  set revoked_at = now()
  where id        = p_invite_id
    and family_id = auth_family_id()
    and revoked_at is null;

  if not found then
    raise exception 'Convite não encontrado ou já revogado.';
  end if;
end;
$$ language plpgsql security definer;

-- ─── 3. weekly_checkins (NOVA tabela) ────────────────────────
-- Registra o check-in semanal de bem-estar de cada membro (UC030).
-- week_start = segunda-feira da semana (normalizado pela aplicação).
-- answers    = respostas às perguntas do check-in em formato JSONB.

create table if not exists weekly_checkins (
  id         uuid        primary key default uuid_generate_v4(),
  family_id  uuid        not null references families(id) on delete cascade,
  member_id  uuid        not null references profiles(id) on delete cascade,
  week_start date        not null,
  answers    jsonb       not null default '{}',
  created_at timestamptz not null default now(),
  -- um membro faz apenas um check-in por semana
  unique(member_id, week_start)
);

-- Índices de leitura frequente
create index if not exists weekly_checkins_family_week_idx
  on weekly_checkins(family_id, week_start desc);

create index if not exists weekly_checkins_member_week_idx
  on weekly_checkins(member_id, week_start desc);

-- RLS
alter table weekly_checkins enable row level security;

-- Membro vê apenas seus próprios check-ins
create policy "Membro vê próprios check-ins"
  on weekly_checkins for select
  using (
    member_id in (select id from profiles where user_id = auth.uid())
  );

-- Admin/parent da família veem todos os check-ins da família
create policy "Admin/parent veem check-ins da família"
  on weekly_checkins for select
  using (
    family_id = auth_family_id()
    and auth_role() in ('admin', 'parent')
  );

-- Membro cria/atualiza apenas o próprio check-in na própria família
create policy "Membro cria check-in próprio"
  on weekly_checkins for insert
  with check (
    family_id = auth_family_id()
    and member_id in (select id from profiles where user_id = auth.uid())
  );

create policy "Membro atualiza check-in próprio"
  on weekly_checkins for update
  using (
    member_id in (select id from profiles where user_id = auth.uid())
  );

-- Realtime para o dashboard de bem-estar da família
alter publication supabase_realtime add table weekly_checkins;

-- ─── 4. family_events: auditoria de edição ───────────────────
-- updated_at → timestamp da última edição             (UC017)
-- updated_by → quem editou pela última vez            (UC017)

alter table family_events
  add column if not exists updated_at timestamptz,
  add column if not exists updated_by uuid references profiles(id) on delete set null;

-- Trigger: mantém updated_at sincronizado automaticamente
create or replace function public.touch_family_event()
returns trigger as $$
begin
  new.updated_at = now();
  -- updated_by é preenchido pela aplicação (passado no UPDATE)
  return new;
end;
$$ language plpgsql;

drop trigger if exists family_events_updated_at on family_events;

create trigger family_events_updated_at
  before update on family_events
  for each row execute procedure public.touch_family_event();

-- Índice para auditoria: quem editou o quê mais recentemente
create index if not exists family_events_updated_by_idx
  on family_events(family_id, updated_by)
  where updated_by is not null;

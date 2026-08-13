-- ============================================================
-- NINHO — Migration Fase 7: Gaps de MVP
-- 1. tasks        — adiciona completed_by / completed_at
-- 2. guest_invites — adiciona revoked_at / label
-- 3. weekly_checkins — nova tabela (UC030)
-- 4. RLS de expiração de guest link (UC025)
-- ============================================================

-- ─── 1. tasks: campos de conclusão ───────────────────────────
-- Necessário para UC019 (completed_by/at) e UC028/029 (carga mental)

alter table tasks
  add column if not exists completed_by uuid references profiles(id) on delete set null,
  add column if not exists completed_at timestamptz;

-- Índice para queries de carga mental (filtro por membro + período)
create index if not exists tasks_completed_by_at_idx
  on tasks(family_id, completed_by, completed_at)
  where completed_at is not null;

-- ─── 2. guest_invites: campos de gestão ──────────────────────
-- revoked_at: admin pode revogar antes de expirar (UC027)
-- label:      nome legível do convidado na lista de membros (UC025)

alter table guest_invites
  add column if not exists revoked_at timestamptz,
  add column if not exists label      text;

-- ─── 3. weekly_checkins ──────────────────────────────────────
-- Armazena as respostas do check-in semanal do casal (UC030)
-- Visível apenas para membros adultos da mesma família.

create table if not exists weekly_checkins (
  id          uuid primary key default uuid_generate_v4(),
  family_id   uuid not null references families(id) on delete cascade,
  member_id   uuid not null references profiles(id) on delete cascade,
  week_start  date not null,           -- segunda-feira da semana (YYYY-MM-DD)
  answers     jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (family_id, member_id, week_start)
);

create index if not exists weekly_checkins_family_week_idx
  on weekly_checkins(family_id, week_start desc);

-- RLS
alter table weekly_checkins enable row level security;

-- Apenas membros adultos (admin/parent) da mesma família lêem check-ins
create policy "Membros adultos veem check-ins da família"
  on weekly_checkins for select
  using (
    family_id = auth_family_id()
    and auth_role() in ('admin', 'parent')
  );

create policy "Membro cria o próprio check-in"
  on weekly_checkins for insert
  with check (
    family_id = auth_family_id()
    and auth_role() in ('admin', 'parent')
    and member_id in (select id from profiles where user_id = auth.uid())
  );

create policy "Membro atualiza o próprio check-in"
  on weekly_checkins for update
  using (
    member_id in (select id from profiles where user_id = auth.uid())
  );

-- Trigger para manter updated_at
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger weekly_checkins_updated_at
  before update on weekly_checkins
  for each row execute procedure set_updated_at();

-- ─── 4. RLS: validar expiração/revogação do guest link ────────
-- Substitui a policy existente de guest_invites que não checava revoked_at.
-- Convidados com token expirado ou revogado perdem acesso em nível de query.

-- Remove a policy de select anterior (sem validação de expiração)
drop policy if exists "Membros veem convites da família" on guest_invites;

-- Nova policy: admin/parent veem todos; guest só vê convite ativo vinculado a si
create policy "Membros veem convites da família"
  on guest_invites for select
  using (
    family_id = auth_family_id()
    and (
      -- admin/parent veem qualquer convite da família
      auth_role() in ('admin', 'parent')
      -- guest só enxerga o próprio convite se ainda estiver válido
      or (
        used_by in (select id from profiles where user_id = auth.uid())
        and expires_at > now()
        and revoked_at is null
      )
    )
  );

-- Função auxiliar reutilizável: verifica se o usuário atual
-- tem um guest_invite ativo (usado por outras policies futuras)
create or replace function auth_has_valid_invite()
returns boolean as $$
  select exists (
    select 1
    from guest_invites gi
    join profiles p on p.id = gi.used_by
    where p.user_id  = auth.uid()
      and gi.expires_at > now()
      and gi.revoked_at is null
  );
$$ language sql stable security definer;

-- ─── Realtime ────────────────────────────────────────────────
alter publication supabase_realtime add table weekly_checkins;

-- ============================================================
-- NINHO — Migration Fase 9: UC028, UC029, UC030
-- ============================================================
-- Blocker UC028: adiciona completed_by e completed_at à tabela tasks
-- UC029: índice para histórico cronológico
-- UC030: tabela weekly_checkins para check-in semanal guiado
-- ============================================================

-- ─── UC028 / UC019 — blocker ──────────────────────────────────────
-- Adiciona campos para rastrear QUEM concluiu e QUANDO
-- completed_by: profiles.id de quem marcou como done
-- completed_at: timestamp exato da conclusão

alter table tasks
  add column if not exists completed_by  uuid references profiles(id) on delete set null,
  add column if not exists completed_at  timestamptz;

-- Índice para queries de carga mental por período
create index if not exists tasks_family_id_completed_at_idx
  on tasks(family_id, completed_at)
  where status = 'done';

-- ─── UC028 / UC019 — Trigger: preenche completed_by e completed_at automaticamente ──

create or replace function set_task_completed_fields()
returns trigger as $$
begin
  -- Ao marcar como done: registrar quem concluiu e quando
  if new.status = 'done' and (old.status is distinct from 'done') then
    new.completed_at := now();
    -- Busca o profile_id do usuário autenticado
    select id into new.completed_by
      from profiles
      where user_id = auth.uid()
      limit 1;
  end if;

  -- Ao reverter para pending/in_progress: limpar os campos
  if new.status != 'done' and old.status = 'done' then
    new.completed_at := null;
    new.completed_by := null;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_task_status_change on tasks;
create trigger on_task_status_change
  before update of status on tasks
  for each row execute procedure set_task_completed_fields();

-- ─── UC030 — weekly_checkins: renomeia member_id → answered_by ───
-- A tabela já existe (criada em phase7/mvp_gaps) com member_id.
-- Renomeamos para answered_by para alinhar com a nomenclatura da fase 9.

-- 1. Dropar policies antigas que referenciam member_id
drop policy if exists "Membros adultos veem check-ins da família" on weekly_checkins;
drop policy if exists "Membro cria o próprio check-in"            on weekly_checkins;
drop policy if exists "Membro atualiza o próprio check-in"        on weekly_checkins;
drop policy if exists "Membro vê próprios check-ins"              on weekly_checkins;
drop policy if exists "Admin/parent veem check-ins da família"    on weekly_checkins;
drop policy if exists "Membro cria check-in próprio"              on weekly_checkins;
drop policy if exists "Membro atualiza check-in próprio"          on weekly_checkins;
-- Fase 9 (idempotência: remove versão anterior se migration for re-executada)
drop policy if exists "Adultos da família veem check-ins"         on weekly_checkins;
drop policy if exists "Usuário cria seu check-in"                 on weekly_checkins;
drop policy if exists "Usuário atualiza seu check-in"             on weekly_checkins;

-- 2. Renomear coluna (só executa se ainda existir como member_id)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'weekly_checkins'
      and column_name = 'member_id'
  ) then
    alter table weekly_checkins rename column member_id to answered_by;
  end if;
end;
$$;

-- 3. Recriar constraint unique com o novo nome de coluna (idempotente)
alter table weekly_checkins
  drop constraint if exists weekly_checkins_family_member_id_week_start_key,
  drop constraint if exists weekly_checkins_member_id_week_start_key,
  drop constraint if exists weekly_checkins_family_id_member_id_week_start_key;

-- Adiciona a constraint correta se ainda não existir
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'weekly_checkins'::regclass
      and conname = 'weekly_checkins_family_id_week_start_answered_by_key'
  ) then
    alter table weekly_checkins
      add constraint weekly_checkins_family_id_week_start_answered_by_key
      unique (family_id, week_start, answered_by);
  end if;
end;
$$;

-- 4. Índice para busca por família e semana (já pode existir — idempotente)
create index if not exists weekly_checkins_family_week_idx
  on weekly_checkins(family_id, week_start desc);

-- ─── RLS para weekly_checkins ─────────────────────────────────────
-- Respostas visíveis apenas para membros adultos da mesma família (UC030)

alter table weekly_checkins enable row level security;

-- Somente membros adultos (admin/parent) da mesma família podem ler
create policy "Adultos da família veem check-ins"
  on weekly_checkins for select
  using (
    family_id = auth_family_id()
    and auth_role() in ('admin', 'parent')
  );

-- Apenas o próprio usuário pode inserir/atualizar seu check-in
create policy "Usuário cria seu check-in"
  on weekly_checkins for insert
  with check (
    family_id = auth_family_id()
    and answered_by in (select id from profiles where user_id = auth.uid())
    and auth_role() in ('admin', 'parent')
  );

create policy "Usuário atualiza seu check-in"
  on weekly_checkins for update
  using (
    answered_by in (select id from profiles where user_id = auth.uid())
  )
  with check (
    answered_by in (select id from profiles where user_id = auth.uid())
  );

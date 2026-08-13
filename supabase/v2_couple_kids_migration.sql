-- ============================================================
-- NINHO — Migration V2: Módulos Casal (UC031–034) e Filhos (UC035–040)
-- Pós-validação MVP — só aplicar após phase7_migration.sql
-- ============================================================

-- ─── MÓDULO CASAL ────────────────────────────────────────────

-- UC031: Apreciação rápida entre parceiros
-- Cada membro pode mandar um "elogio do dia" para o parceiro.
create table if not exists couple_appreciations (
  id          uuid primary key default uuid_generate_v4(),
  family_id   uuid not null references families(id) on delete cascade,
  from_member uuid not null references profiles(id) on delete cascade,
  to_member   uuid not null references profiles(id) on delete cascade,
  message     text not null check (char_length(message) <= 280),
  emoji       text,                        -- emoji opcional de suporte
  created_at  timestamptz not null default now()
);

create index if not exists couple_appreciations_family_idx
  on couple_appreciations(family_id, created_at desc);

-- RLS
alter table couple_appreciations enable row level security;

create policy "Membros adultos veem apreciações da família"
  on couple_appreciations for select
  using (
    family_id = auth_family_id()
    and auth_role() in ('admin', 'parent')
  );

create policy "Membro adulto cria apreciação"
  on couple_appreciations for insert
  with check (
    family_id = auth_family_id()
    and auth_role() in ('admin', 'parent')
    and from_member in (select id from profiles where user_id = auth.uid())
  );

-- UC032: Check-in emocional do casal
-- Separado do weekly_checkin (UC030) — mais simples, foco no estado emocional do dia.
do $$ begin
  create type mood_level as enum ('terrible', 'bad', 'ok', 'good', 'great');
exception
  when duplicate_object then null;
end $$;

create table if not exists couple_checkins (
  id          uuid primary key default uuid_generate_v4(),
  family_id   uuid not null references families(id) on delete cascade,
  member_id   uuid not null references profiles(id) on delete cascade,
  mood        mood_level not null,
  note        text check (char_length(note) <= 500),
  checked_at  date not null default current_date,  -- um por dia por membro
  created_at  timestamptz not null default now(),
  unique (family_id, member_id, checked_at)
);

create index if not exists couple_checkins_family_idx
  on couple_checkins(family_id, checked_at desc);

-- RLS
alter table couple_checkins enable row level security;

create policy "Membros adultos veem check-ins emocionais"
  on couple_checkins for select
  using (
    family_id = auth_family_id()
    and auth_role() in ('admin', 'parent')
  );

create policy "Membro adulto cria check-in emocional"
  on couple_checkins for insert
  with check (
    family_id = auth_family_id()
    and auth_role() in ('admin', 'parent')
    and member_id in (select id from profiles where user_id = auth.uid())
  );

create policy "Membro atualiza próprio check-in emocional"
  on couple_checkins for update
  using (
    member_id in (select id from profiles where user_id = auth.uid())
  );

-- UC033: Sugestão de janela livre (não precisa de tabela — é calculado em runtime)
-- Registramos apenas a janela "confirmada" quando o casal agenda algo intencionalmente.
-- Reutiliza family_events com category='personal' — sem tabela nova.

-- UC034: Divisão de gastos do casal
create type if not exists expense_split as enum ('equal', 'custom', 'one_pays');

create table if not exists couple_expenses (
  id               uuid primary key default uuid_generate_v4(),
  family_id        uuid not null references families(id) on delete cascade,
  title            text not null,
  amount_cents     int not null check (amount_cents > 0),  -- valor em centavos
  category         text not null default 'other',
  paid_by          uuid not null references profiles(id) on delete set null,
  split_mode       expense_split not null default 'equal',
  -- Quando split_mode = 'custom': percentual de quem pagou (0–100)
  paid_by_pct      numeric(5,2) check (paid_by_pct between 0 and 100),
  notes            text,
  expense_date     date not null default current_date,
  settled          boolean not null default false,
  created_at       timestamptz not null default now()
);

create index if not exists couple_expenses_family_idx
  on couple_expenses(family_id, expense_date desc);
create index if not exists couple_expenses_settled_idx
  on couple_expenses(family_id, settled) where settled = false;

-- RLS
alter table couple_expenses enable row level security;

create policy "Membros adultos veem gastos do casal"
  on couple_expenses for select
  using (
    family_id = auth_family_id()
    and auth_role() in ('admin', 'parent')
  );

create policy "Membros adultos registram gastos"
  on couple_expenses for insert
  with check (
    family_id = auth_family_id()
    and auth_role() in ('admin', 'parent')
  );

create policy "Membros adultos atualizam gastos"
  on couple_expenses for update
  using (
    family_id = auth_family_id()
    and auth_role() in ('admin', 'parent')
  );

create policy "Membros adultos removem gastos"
  on couple_expenses for delete
  using (
    family_id = auth_family_id()
    and auth_role() in ('admin', 'parent')
  );

-- ─── MÓDULO FILHOS ───────────────────────────────────────────
-- Nota: tarefas das crianças reutilizam a tabela `tasks` com
-- assigned_to = profile.id onde role = 'child'.
-- Mesada é calculada a partir dos pontos acumulados em tasks concluídas.

-- UC036/UC037: Conquistas das crianças (badges por pontos/tarefas)
create table if not exists child_achievements (
  id          uuid primary key default uuid_generate_v4(),
  family_id   uuid not null references families(id) on delete cascade,
  child_id    uuid not null references profiles(id) on delete cascade,
  title       text not null,
  description text,
  badge_icon text not null default 'star',
  points_at   int  not null,   -- total de pontos quando a conquista foi desbloqueada
  awarded_at  timestamptz not null default now()
);

create index if not exists child_achievements_child_idx
  on child_achievements(family_id, child_id, awarded_at desc);

-- RLS
alter table child_achievements enable row level security;

create policy "Família vê conquistas"
  on child_achievements for select
  using (family_id = auth_family_id());

create policy "Adultos concedem conquistas"
  on child_achievements for insert
  with check (
    family_id = auth_family_id()
    and auth_role() in ('admin', 'parent')
  );

-- UC038: Agenda escolar — extensão de family_events com child_id e school_type
-- Adicionamos dois campos à tabela family_events via ALTER TABLE para não
-- criar tabela separada (agenda escolar É um evento familiar).
alter table family_events
  add column if not exists child_id    uuid references profiles(id) on delete set null,
  add column if not exists school_type text;   -- 'homework' | 'test' | 'meeting' | 'trip' | null

-- Índice para filtrar eventos escolares por criança
create index if not exists family_events_child_idx
  on family_events(family_id, child_id)
  where child_id is not null;

-- UC039: Registro de tempo de tela
create table if not exists screen_time_logs (
  id           uuid primary key default uuid_generate_v4(),
  family_id    uuid not null references families(id) on delete cascade,
  child_id     uuid not null references profiles(id) on delete cascade,
  date         date not null default current_date,
  allowed_min  int  not null default 60,    -- minutos permitidos no dia
  used_min     int  not null default 0 check (used_min >= 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (family_id, child_id, date)
);

create index if not exists screen_time_logs_child_idx
  on screen_time_logs(family_id, child_id, date desc);

-- RLS
alter table screen_time_logs enable row level security;

create policy "Família vê registros de tempo de tela"
  on screen_time_logs for select
  using (family_id = auth_family_id());

create policy "Adultos gerenciam tempo de tela"
  on screen_time_logs for all
  using (
    family_id = auth_family_id()
    and auth_role() in ('admin', 'parent')
  )
  with check (
    family_id = auth_family_id()
    and auth_role() in ('admin', 'parent')
  );

-- Trigger updated_at (reutiliza função criada na phase7)
create trigger screen_time_logs_updated_at
  before update on screen_time_logs
  for each row execute procedure set_updated_at();

-- UC040: Login por PIN para crianças
-- O PIN é armazenado no campo pin_hash do profile da criança.
-- Usamos pgcrypto (já habilitado no schema.sql) para hash.
alter table profiles
  add column if not exists pin_hash text,   -- bcrypt hash do PIN de 4-6 dígitos
  add column if not exists role_child_age int; -- idade aprox. da criança (ajuda UX)

-- ─── REALTIME ────────────────────────────────────────────────
alter publication supabase_realtime add table couple_appreciations;
alter publication supabase_realtime add table couple_checkins;
alter publication supabase_realtime add table couple_expenses;
alter publication supabase_realtime add table screen_time_logs;

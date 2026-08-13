-- ============================================================
-- NINHO — Migration V3: Alimentação e Deveres das Crianças
-- Aplique após v2_couple_kids_migration.sql
-- ============================================================

-- ─── UC041: Alimentação diária da criança ────────────────────
-- Registra as refeições do dia para crianças (não bebês).
-- Diferente de activities_feeding, este modelo é por refeição do dia,
-- não por mamada: café, almoço, lanche, janta.

do $$ begin
  create type meal_slot as enum ('breakfast', 'lunch', 'snack', 'dinner', 'other');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type meal_rating as enum ('great', 'ok', 'refused');
exception
  when duplicate_object then null;
end $$;

create table if not exists child_meals (
  id           uuid primary key default uuid_generate_v4(),
  family_id    uuid not null references families(id) on delete cascade,
  child_id     uuid not null references profiles(id) on delete cascade,
  date         date not null default current_date,
  slot         meal_slot not null,
  description  text,                       -- "arroz, feijão, frango"
  rating       meal_rating not null default 'ok',
  notes        text check (char_length(notes) <= 500),
  logged_by    uuid references profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  -- Uma refeição por slot por dia por criança
  unique (family_id, child_id, date, slot)
);

create index if not exists child_meals_child_date_idx
  on child_meals(family_id, child_id, date desc);

-- RLS
alter table child_meals enable row level security;

create policy "Família vê refeições da criança"
  on child_meals for select
  using (family_id = auth_family_id());

create policy "Adultos registram refeições"
  on child_meals for insert
  with check (
    family_id = auth_family_id()
    and auth_role() in ('admin', 'parent')
  );

create policy "Adultos atualizam refeições"
  on child_meals for update
  using (
    family_id = auth_family_id()
    and auth_role() in ('admin', 'parent')
  );

create policy "Adultos removem refeições"
  on child_meals for delete
  using (
    family_id = auth_family_id()
    and auth_role() in ('admin', 'parent')
  );

-- ─── UC042: Deveres e tarefas de casa da criança ─────────────
-- Checklist de deveres por dia e matéria.
-- Separado de `tasks` (que tem gamificação/pontos) porque deveres
-- têm contexto escolar: matéria, data de entrega, status de revisão.

create table if not exists child_homework (
  id           uuid primary key default uuid_generate_v4(),
  family_id    uuid not null references families(id) on delete cascade,
  child_id     uuid not null references profiles(id) on delete cascade,
  subject      text not null,              -- "Matemática", "Português"...
  description  text,                       -- enunciado ou detalhes
  due_date     date not null default current_date,
  done         boolean not null default false,
  done_at      timestamptz,               -- preenchido ao marcar done
  reviewed_by  uuid references profiles(id) on delete set null, -- pai/mãe revisou?
  reviewed_at  timestamptz,
  created_by   uuid references profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists child_homework_child_due_idx
  on child_homework(family_id, child_id, due_date desc);

create index if not exists child_homework_pending_idx
  on child_homework(family_id, child_id, done)
  where done = false;

-- RLS
alter table child_homework enable row level security;

create policy "Família vê deveres da criança"
  on child_homework for select
  using (family_id = auth_family_id());

create policy "Adultos e a própria criança criam deveres"
  on child_homework for insert
  with check (family_id = auth_family_id());

create policy "Adultos e a própria criança atualizam deveres"
  on child_homework for update
  using (family_id = auth_family_id());

create policy "Adultos removem deveres"
  on child_homework for delete
  using (
    family_id = auth_family_id()
    and auth_role() in ('admin', 'parent')
  );

-- Trigger updated_at (reutiliza função set_updated_at criada na phase7)
create trigger child_homework_updated_at
  before update on child_homework
  for each row execute procedure set_updated_at();

-- ─── REALTIME ────────────────────────────────────────────────
alter publication supabase_realtime add table child_meals;
alter publication supabase_realtime add table child_homework;

-- ============================================================
-- NINHO — Schema Supabase (PostgreSQL + Row Level Security)
-- Fase 0: Fundação
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ─── Enums ───────────────────────────────────────────────────
create type user_role as enum ('admin', 'parent', 'child', 'guest');
create type baby_log_type as enum ('feeding','diaper','sleep','medication','weight','height','temperature','note');
create type diaper_type as enum ('pee','poo','both');
create type feeding_type as enum ('breast_left','breast_right','bottle','solid');
create type sleep_type as enum ('nap','night');
create type task_status as enum ('pending','in_progress','done');
create type task_priority as enum ('low','medium','high');
create type event_category as enum ('appointment','vaccine','school','personal','other');

-- ============================================================
-- TABELAS
-- ============================================================

-- ─── Families ────────────────────────────────────────────────
create table families (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  created_at timestamptz not null default now()
);

-- ─── Profiles ────────────────────────────────────────────────
-- Estende auth.users do Supabase. 1 perfil por usuário por família.
create table profiles (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  family_id  uuid references families(id) on delete set null,
  name       text not null,
  avatar_url text,
  role       user_role not null default 'parent',
  created_at timestamptz not null default now(),
  unique(user_id)
);

-- Cria perfil automaticamente ao criar usuário no Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Babies ──────────────────────────────────────────────────
create table babies (
  id          uuid primary key default uuid_generate_v4(),
  family_id   uuid not null references families(id) on delete cascade,
  name        text not null,
  birth_date  date not null,
  sex         text not null check (sex in ('male','female')),
  photo_url   text,
  created_at  timestamptz not null default now()
);

-- ─── Baby Logs ────────────────────────────────────────────────
create table baby_logs (
  id                  uuid primary key default uuid_generate_v4(),
  baby_id             uuid not null references babies(id) on delete cascade,
  family_id           uuid not null references families(id) on delete cascade,
  created_by          uuid not null references profiles(id) on delete set null,
  type                baby_log_type not null,
  started_at          timestamptz not null default now(),
  ended_at            timestamptz,
  -- feeding
  feeding_type        feeding_type,
  feeding_amount_ml   int,
  -- diaper
  diaper_type         diaper_type,
  -- sleep
  sleep_type          sleep_type,
  -- measurements
  weight_kg           numeric(5,3),
  height_cm           numeric(5,1),
  temperature_c       numeric(4,1),
  -- medication
  medication_name     text,
  medication_dose     text,
  -- notes
  notes               text,
  created_at          timestamptz not null default now()
);
create index baby_logs_baby_id_started_at_idx on baby_logs(baby_id, started_at desc);

-- ─── Family Events ────────────────────────────────────────────
create table family_events (
  id          uuid primary key default uuid_generate_v4(),
  family_id   uuid not null references families(id) on delete cascade,
  title       text not null,
  description text,
  start_at    timestamptz not null,
  end_at      timestamptz,
  all_day     boolean not null default false,
  category    event_category not null default 'other',
  created_by  uuid not null references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index family_events_family_id_start_at_idx on family_events(family_id, start_at);

-- ─── Tasks ────────────────────────────────────────────────────
create table tasks (
  id          uuid primary key default uuid_generate_v4(),
  family_id   uuid not null references families(id) on delete cascade,
  title       text not null,
  description text,
  assigned_to uuid references profiles(id) on delete set null,
  status      task_status not null default 'pending',
  priority    task_priority not null default 'medium',
  due_date    timestamptz,
  points      int not null default 10,
  category    text not null default 'other',
  created_by  uuid not null references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index tasks_family_id_status_idx on tasks(family_id, status);

-- ─── Shopping Items ───────────────────────────────────────────
create table shopping_items (
  id          uuid primary key default uuid_generate_v4(),
  family_id   uuid not null references families(id) on delete cascade,
  name        text not null,
  quantity    numeric(8,2),
  unit        text,
  category    text,
  checked     boolean not null default false,
  added_by    uuid not null references profiles(id) on delete set null,
  checked_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index shopping_items_family_id_idx on shopping_items(family_id);

-- ─── Guest Invites ────────────────────────────────────────────
create table guest_invites (
  id          uuid primary key default uuid_generate_v4(),
  family_id   uuid not null references families(id) on delete cascade,
  token       text not null unique default encode(gen_random_bytes(16), 'hex'),
  scope       user_role not null default 'guest',
  expires_at  timestamptz not null,
  created_by  uuid not null references profiles(id) on delete set null,
  used_by     uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- Função para criar família e vincular ao perfil do criador atomicamente
create or replace function public.create_family_for_user(family_name text)
returns json as $$
declare
  fam families%rowtype;
begin
  -- Cria a família
  insert into families (name)
  values (family_name)
  returning * into fam;

  -- Vincula o perfil do usuário autenticado como admin
  update profiles
  set family_id = fam.id,
      role      = 'admin'
  where user_id = auth.uid();

  return row_to_json(fam);
end;
$$ language plpgsql security definer;

-- Função para entrar em família por convite
create or replace function public.join_family_by_invite(invite_token text)
returns json as $$
declare
  invite guest_invites%rowtype;
  fam    families%rowtype;
  prof   profiles%rowtype;
begin
  -- Busca convite válido
  select * into invite
  from guest_invites
  where token = invite_token
    and expires_at > now()
    and used_by is null;

  if not found then
    raise exception 'Convite inválido ou expirado.';
  end if;

  -- Busca família
  select * into fam from families where id = invite.family_id;

  -- Atualiza perfil do usuário atual
  update profiles
  set family_id = invite.family_id,
      role      = invite.scope
  where user_id = auth.uid()
  returning * into prof;

  -- Marca convite como usado
  update guest_invites set used_by = prof.id where id = invite.id;

  return row_to_json(fam);
end;
$$ language plpgsql security definer;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Habilita RLS em todas as tabelas
alter table families       enable row level security;
alter table profiles       enable row level security;
alter table babies         enable row level security;
alter table baby_logs      enable row level security;
alter table family_events  enable row level security;
alter table tasks          enable row level security;
alter table shopping_items enable row level security;
alter table guest_invites  enable row level security;

-- ─── Helpers ─────────────────────────────────────────────────
-- Retorna o family_id do usuário autenticado
create or replace function auth_family_id()
returns uuid as $$
  select family_id from profiles where user_id = auth.uid() limit 1;
$$ language sql stable security definer;

-- Retorna o role do usuário autenticado
create or replace function auth_role()
returns user_role as $$
  select role from profiles where user_id = auth.uid() limit 1;
$$ language sql stable security definer;

-- ─── families ────────────────────────────────────────────────
create policy "Membros veem sua família"
  on families for select using (id = auth_family_id());

create policy "Qualquer autenticado pode criar família"
  on families for insert with check (auth.uid() is not null);

create policy "Admin pode atualizar família"
  on families for update using (
    id = auth_family_id() and auth_role() = 'admin'
  );

-- ─── profiles ────────────────────────────────────────────────
create policy "Usuário vê próprio perfil"
  on profiles for select using (user_id = auth.uid());

create policy "Membros da família veem perfis"
  on profiles for select using (family_id = auth_family_id());

create policy "Usuário atualiza próprio perfil"
  on profiles for update using (user_id = auth.uid());

-- ─── babies ──────────────────────────────────────────────────
create policy "Membros veem bebês da família"
  on babies for select using (family_id = auth_family_id());

create policy "Admin/parent podem criar bebê"
  on babies for insert with check (
    family_id = auth_family_id()
    and auth_role() in ('admin','parent')
  );

create policy "Admin/parent podem atualizar bebê"
  on babies for update using (
    family_id = auth_family_id()
    and auth_role() in ('admin','parent')
  );

-- ─── baby_logs ────────────────────────────────────────────────
create policy "Membros veem registros da família"
  on baby_logs for select using (family_id = auth_family_id());

create policy "Membros podem criar registros"
  on baby_logs for insert with check (family_id = auth_family_id());

create policy "Membros podem atualizar próprios registros"
  on baby_logs for update using (
    family_id = auth_family_id()
    and (created_by in (select id from profiles where user_id = auth.uid())
         or auth_role() in ('admin','parent'))
  );

-- ─── family_events ────────────────────────────────────────────
create policy "Membros veem eventos da família"
  on family_events for select using (family_id = auth_family_id());

create policy "Membros podem criar eventos"
  on family_events for insert with check (family_id = auth_family_id());

create policy "Quem criou ou admin pode editar evento"
  on family_events for update using (
    family_id = auth_family_id()
    and (created_by in (select id from profiles where user_id = auth.uid())
         or auth_role() = 'admin')
  );

-- ─── tasks ────────────────────────────────────────────────────
create policy "Membros veem tarefas da família"
  on tasks for select using (family_id = auth_family_id());

create policy "Membros podem criar tarefas"
  on tasks for insert with check (family_id = auth_family_id());

create policy "Membros podem atualizar tarefas"
  on tasks for update using (family_id = auth_family_id());

-- ─── shopping_items ───────────────────────────────────────────
create policy "Membros veem lista de compras"
  on shopping_items for select using (family_id = auth_family_id());

create policy "Membros podem adicionar itens"
  on shopping_items for insert with check (family_id = auth_family_id());

create policy "Membros podem marcar itens"
  on shopping_items for update using (family_id = auth_family_id());

create policy "Membros podem remover itens"
  on shopping_items for delete using (family_id = auth_family_id());

-- ─── guest_invites ────────────────────────────────────────────
create policy "Admin/parent podem criar convites"
  on guest_invites for insert with check (
    family_id = auth_family_id()
    and auth_role() in ('admin','parent')
  );

create policy "Membros veem convites da família"
  on guest_invites for select using (family_id = auth_family_id());

-- ============================================================
-- REALTIME
-- ============================================================
-- Habilita realtime nas tabelas que precisam de sync ao vivo
alter publication supabase_realtime add table shopping_items;
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table baby_logs;

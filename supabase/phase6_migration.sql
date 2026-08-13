-- ============================================================
-- NINHO — Migration Fase 6: Diferencial
-- Tabelas: notifications, push_tokens, notification_preferences
-- ============================================================

-- ─── Enums adicionais ────────────────────────────────────────

create type notification_type as enum (
  'next_feeding',
  'vaccine_reminder',
  'task_assigned',
  'family_invite',
  'mental_load_alert',
  'event_reminder',
  'shopping_added',
  'system'
);

-- ─── Push Tokens ──────────────────────────────────────────────
-- Armazena o token Expo Push de cada dispositivo do usuário

create table push_tokens (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  token       text not null,
  platform    text not null check (platform in ('ios', 'android')),
  updated_at  timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  unique(user_id, token)
);

create index push_tokens_user_id_idx on push_tokens(user_id);

-- ─── Notifications ────────────────────────────────────────────
-- Notificações in-app persistidas por usuário

create table notifications (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  family_id   uuid not null references families(id) on delete cascade,
  type        notification_type not null,
  title       text not null,
  body        text not null,
  data        jsonb,           -- payload extra para deep link (ex: {"task_id": "..."})
  read_at     timestamptz,     -- null = não lida
  created_at  timestamptz not null default now()
);

create index notifications_user_id_created_at_idx on notifications(user_id, created_at desc);
create index notifications_user_id_read_at_idx    on notifications(user_id, read_at) where read_at is null;

-- ─── Notification Preferences ─────────────────────────────────
-- Preferências por tipo de notificação, por usuário

create table notification_preferences (
  id                 uuid primary key default uuid_generate_v4(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  type               notification_type not null,
  push_enabled       boolean not null default true,
  in_app_enabled     boolean not null default true,
  quiet_hours_start  time,    -- ex: '22:00'
  quiet_hours_end    time,    -- ex: '07:00'
  updated_at         timestamptz not null default now(),
  unique(user_id, type)
);

create index notification_preferences_user_id_idx on notification_preferences(user_id);

-- ─── Row Level Security ───────────────────────────────────────

alter table push_tokens                enable row level security;
alter table notifications              enable row level security;
alter table notification_preferences   enable row level security;

-- push_tokens: somente o próprio usuário
create policy "Usuário gerencia seus push tokens"
  on push_tokens for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- notifications: somente o destinatário lê; inserção por sistema (service role) ou Edge Function
create policy "Usuário lê suas notificações"
  on notifications for select
  using (user_id = auth.uid());

create policy "Usuário atualiza suas notificações (marcar como lida)"
  on notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- notification_preferences: somente o próprio usuário
create policy "Usuário gerencia suas preferências"
  on notification_preferences for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── Realtime ─────────────────────────────────────────────────
-- Habilita Realtime para notificações (novas chegam em tempo real)

alter publication supabase_realtime add table notifications;

-- ─── Função: Criar notificação para todos os membros da família ──
-- Usada por triggers e Edge Functions

create or replace function notify_family_members(
  p_family_id    uuid,
  p_exclude_user uuid,   -- não notificar quem disparou a ação
  p_type         notification_type,
  p_title        text,
  p_body         text,
  p_data         jsonb default null
) returns void as $$
begin
  insert into notifications (user_id, family_id, type, title, body, data)
  select p.user_id, p_family_id, p_type, p_title, p_body, p_data
  from profiles p
  where p.family_id = p_family_id
    and p.user_id != p_exclude_user;
end;
$$ language plpgsql security definer;

-- ─── Trigger: Notificar quando tarefa for atribuída ──────────────

create or replace function notify_task_assigned()
returns trigger as $$
declare
  v_assigner_name text;
  v_task_title    text;
begin
  -- Só dispara quando assigned_to mudar
  if new.assigned_to is null then
    return new;
  end if;
  if old.assigned_to is not distinct from new.assigned_to then
    return new;
  end if;

  select name into v_assigner_name from profiles where user_id = auth.uid() limit 1;
  v_task_title := new.title;

  insert into notifications (user_id, family_id, type, title, body, data)
  select
    p.user_id,
    new.family_id,
    'task_assigned',
    'Nova tarefa para você',
    v_assigner_name || ' atribuiu "' || v_task_title || '" para você.',
    jsonb_build_object('task_id', new.id::text)
  from profiles p
  where p.user_id = new.assigned_to
    and p.family_id = new.family_id;

  return new;
end;
$$ language plpgsql security definer;

create trigger on_task_assigned
  after insert or update of assigned_to on tasks
  for each row execute procedure notify_task_assigned();

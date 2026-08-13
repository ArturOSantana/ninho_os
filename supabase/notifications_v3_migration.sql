-- ============================================================
-- NINHO — Migration v3: Notificações expandidas
-- Bebê, criança, adolescente, casal, saúde
-- ============================================================

-- ─── Novos valores no enum notification_type ─────────────────

-- Bebê recém-nascido
alter type notification_type add value if not exists 'medication_reminder';
alter type notification_type add value if not exists 'growth_checkup';
alter type notification_type add value if not exists 'bath_reminder';
alter type notification_type add value if not exists 'tummy_time_reminder';

-- Criança (2-12 anos)
alter type notification_type add value if not exists 'kids_medication';
alter type notification_type add value if not exists 'kids_activity_reminder';
alter type notification_type add value if not exists 'kids_sleep_time';
alter type notification_type add value if not exists 'kids_meal_time';

-- Adolescente (13+)
alter type notification_type add value if not exists 'teen_curfew_alert';
alter type notification_type add value if not exists 'teen_sleep_alert';
alter type notification_type add value if not exists 'teen_screen_limit';
alter type notification_type add value if not exists 'teen_appointment';
alter type notification_type add value if not exists 'teen_exam_reminder';

-- Casal
alter type notification_type add value if not exists 'couple_date_reminder';

-- Família
alter type notification_type add value if not exists 'task_overdue';
alter type notification_type add value if not exists 'shopping_list_ready';

-- Saúde & bem-estar
alter type notification_type add value if not exists 'parent_self_care';
alter type notification_type add value if not exists 'hydration_reminder';
alter type notification_type add value if not exists 'postnatal_checkup';

-- ─── Trigger: tarefa atrasada ────────────────────────────────
-- Notifica membros da família quando uma tarefa passa da data sem conclusão

create or replace function notify_task_overdue()
returns trigger as $$
declare
  v_title text;
begin
  -- Só dispara quando due_date for passada e status != 'done'
  if new.due_date is null then return new; end if;
  if new.due_date >= now() then return new; end if;
  if new.status = 'done' then return new; end if;
  -- Evita enviar múltiplas vezes (só na primeira vez que fica atrasada)
  if old.due_date = new.due_date and old.status = new.status then return new; end if;

  v_title := new.title;

  insert into notifications (user_id, family_id, type, title, body, data)
  select
    p.user_id,
    new.family_id,
    'task_overdue',
    '⚠️ Tarefa atrasada',
    '"' || v_title || '" está atrasada. Alguém pode assumir?',
    jsonb_build_object('task_id', new.id::text)
  from profiles p
  where p.family_id = new.family_id;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_task_overdue on tasks;
create trigger on_task_overdue
  after update of due_date, status on tasks
  for each row execute procedure notify_task_overdue();

-- ─── Trigger: consulta de crescimento agendada ───────────────

create or replace function notify_growth_checkup_booked()
returns trigger as $$
declare
  v_baby_name text;
begin
  -- Dispara quando um evento do tipo 'appointment' é criado com menos de 3 dias de antecedência
  if new.category != 'appointment' then return new; end if;
  if new.starts_at > now() + interval '3 days' then return new; end if;

  select name into v_baby_name
  from babies
  where family_id = new.family_id
  order by birth_date desc
  limit 1;

  insert into notifications (user_id, family_id, type, title, body, data)
  select
    p.user_id,
    new.family_id,
    'growth_checkup',
    '📅 Consulta de crescimento em breve',
    coalesce(new.title, 'Consulta') || ' está agendada para ' ||
    to_char(new.starts_at at time zone 'America/Sao_Paulo', 'DD/MM às HH24:MI') || '.',
    jsonb_build_object('event_id', new.id::text)
  from profiles p
  where p.family_id = new.family_id;

  return new;
end;
$$ language plpgsql security definer;

do $$
begin
  if exists (
    select 1 from information_schema.tables where table_name = 'events'
  ) then
    execute $t$
      drop trigger if exists on_growth_checkup_booked on events;
      create trigger on_growth_checkup_booked
        after insert on events
        for each row execute procedure notify_growth_checkup_agendada();
    $t$;
  end if;
end;
$$;

-- ─── Trigger: consulta pós-natal ─────────────────────────────

create or replace function notify_postnatal_checkup()
returns trigger as $$
begin
  if new.category != 'appointment' then return new; end if;
  if new.starts_at > now() + interval '2 days' then return new; end if;
  if new.title not ilike '%pós-natal%'
     and new.title not ilike '%postnatal%'
     and new.title not ilike '%maternidade%' then
    return new;
  end if;

  insert into notifications (user_id, family_id, type, title, body, data)
  select
    p.user_id,
    new.family_id,
    'postnatal_checkup',
    '🏥 Consulta pós-natal em breve',
    'Sua consulta de pós-natal está agendada para ' ||
    to_char(new.starts_at at time zone 'America/Sao_Paulo', 'DD/MM às HH24:MI') || '. Prepare suas dúvidas!',
    jsonb_build_object('event_id', new.id::text)
  from profiles p
  where p.family_id = new.family_id;

  return new;
end;
$$ language plpgsql security definer;

-- ─── Função: Alerta de lista de compras pronta ───────────────

create or replace function notify_shopping_list_ready(p_family_id uuid)
returns void as $$
begin
  insert into notifications (user_id, family_id, type, title, body)
  select
    p.user_id,
    p_family_id,
    'shopping_list_ready',
    '🛒 Lista de compras confirmada',
    'A lista de compras foi revisada e está pronta. Hora de ir ao mercado!'
  from profiles p
  where p.family_id = p_family_id;
end;
$$ language plpgsql security definer;

-- ─── Função: Lembrete de evento escolar ──────────────────────

create or replace function notify_school_event_tomorrow(p_family_id uuid, p_event_title text)
returns void as $$
begin
  insert into notifications (user_id, family_id, type, title, body)
  select
    p.user_id,
    p_family_id,
    'school_event',
    '🏫 Evento escolar amanhã',
    'Não esqueça: "' || p_event_title || '" é amanhã. Prepare o necessário!'
  from profiles p
  where p.family_id = p_family_id;
end;
$$ language plpgsql security definer;

-- ─── Função: Alerta de conquista do filho ────────────────────

create or replace function notify_kids_milestone(
  p_family_id uuid,
  p_kid_name  text,
  p_points    integer
)
returns void as $$
begin
  insert into notifications (user_id, family_id, type, title, body)
  select
    p.user_id,
    p_family_id,
    'kids_points_milestone',
    '🏆 ' || p_kid_name || ' atingiu uma nova marca!',
    p_kid_name || ' acumulou ' || p_points || ' pontos. Que tal comemorar?'
  from profiles p
  where p.family_id = p_family_id;
end;
$$ language plpgsql security definer;

-- ─── Comentários ─────────────────────────────────────────────

comment on function notify_shopping_list_ready(uuid)   is 'Notifica família que a lista de compras está pronta.';
comment on function notify_school_event_tomorrow(uuid, text) is 'Notifica evento escolar no dia seguinte.';
comment on function notify_kids_milestone(uuid, text, integer) is 'Notifica conquista de pontos de um filho.';

-- ============================================================
-- NINHO — Migration: Expandir notification_type enum
-- Adiciona novos tipos de notificação para bebê, casal e filhos
-- ============================================================

-- ─── Adicionar novos valores ao enum notification_type ───────

-- Bebê
alter type notification_type add value if not exists 'long_sleep_alert';
alter type notification_type add value if not exists 'diaper_overdue';

-- Casal
alter type notification_type add value if not exists 'couple_checkin_due';
alter type notification_type add value if not exists 'appreciation_received';
alter type notification_type add value if not exists 'partner_task_done';

-- Filhos
alter type notification_type add value if not exists 'homework_due';
alter type notification_type add value if not exists 'screen_time_limit';
alter type notification_type add value if not exists 'school_event';
alter type notification_type add value if not exists 'kids_points_milestone';

-- ─── Adicionar coluna interval_minutes em notification_preferences ──

alter table notification_preferences
  add column if not exists interval_minutes integer;

comment on column notification_preferences.interval_minutes is
  'Intervalo configurável em minutos para alertas baseados em tempo (ex: mamada a cada 180 min). NULL = usa padrão do sistema.';

-- ─── Trigger: Notificar apreciação recebida ──────────────────

create or replace function notify_appreciation_received()
returns trigger as $$
declare
  v_sender_name text;
begin
  -- Busca o nome de quem enviou
  select name into v_sender_name
  from profiles
  where user_id = new.created_by
  limit 1;

  -- Notifica o parceiro
  insert into notifications (user_id, family_id, type, title, body, data)
  select
    p.user_id,
    new.family_id,
    'appreciation_received',
    v_sender_name || ' te enviou um carinho 💛',
    coalesce(new.message, 'Você recebeu uma mensagem especial do seu(sua) parceiro(a).'),
    jsonb_build_object('appreciation_id', new.id::text)
  from profiles p
  where p.family_id = new.family_id
    and p.user_id != new.created_by;

  return new;
end;
$$ language plpgsql security definer;

-- Trigger só é criado se a tabela couple_appreciations existir
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_name = 'couple_appreciations'
  ) then
    execute $t$
      drop trigger if exists on_appreciation_created on couple_appreciations;
      create trigger on_appreciation_created
        after insert on couple_appreciations
        for each row execute procedure notify_appreciation_received();
    $t$;
  end if;
end;
$$;

-- ─── Trigger: Notificar conclusão de tarefa pelo parceiro ─────

create or replace function notify_partner_task_done()
returns trigger as $$
declare
  v_doer_name  text;
  v_task_title text;
begin
  -- Só dispara quando o status mudar para 'done'
  if new.status is distinct from 'done' then
    return new;
  end if;
  if old.status = 'done' then
    return new;
  end if;
  -- Só notifica se houver um criador diferente de quem concluiu
  if new.created_by is null or new.created_by = new.completed_by then
    return new;
  end if;

  select name into v_doer_name
  from profiles where user_id = new.completed_by limit 1;
  v_task_title := new.title;

  insert into notifications (user_id, family_id, type, title, body, data)
  select
    p.user_id,
    new.family_id,
    'partner_task_done',
    v_doer_name || ' concluiu uma tarefa ✅',
    '"' || v_task_title || '" foi marcada como concluída.',
    jsonb_build_object('task_id', new.id::text)
  from profiles p
  where p.user_id = new.created_by
    and p.family_id = new.family_id;

  return new;
end;
$$ language plpgsql security definer;

-- Trigger na tabela tasks (se completed_by existir)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'tasks' and column_name = 'completed_by'
  ) then
    execute $t$
      drop trigger if exists on_task_completed_notify_partner on tasks;
      create trigger on_task_completed_notify_partner
        after update of status on tasks
        for each row execute procedure notify_partner_task_done();
    $t$;
  end if;
end;
$$;

-- ─── Trigger: Notificar check-in semanal do casal ─────────────
-- Dispara via pg_cron (se disponível) ou pode ser chamado manualmente

create or replace function trigger_couple_checkin_reminder(p_family_id uuid)
returns void as $$
begin
  insert into notifications (user_id, family_id, type, title, body)
  select
    p.user_id,
    p_family_id,
    'couple_checkin_due',
    'Check-in do casal 💑',
    'Que tal reservar um momento especial com seu(sua) parceiro(a) hoje?'
  from profiles p
  where p.family_id = p_family_id;
end;
$$ language plpgsql security definer;

-- ─── Comentários ─────────────────────────────────────────────

comment on function trigger_couple_checkin_reminder(uuid) is
  'Envia notificação de check-in do casal para todos os membros da família. Pode ser agendado via pg_cron.';

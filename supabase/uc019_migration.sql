-- ============================================================
-- NINHO — Migration UC019: completed_by / completed_at em tasks
-- Resolve schema gap para UC019 (Concluir tarefa) e UC028 (Carga mental)
-- ============================================================

alter table tasks
  add column if not exists completed_by uuid references profiles(id) on delete set null,
  add column if not exists completed_at timestamptz;

-- Índice para consultas de carga mental por membro no período
create index if not exists tasks_completed_by_completed_at_idx
  on tasks(completed_by, completed_at)
  where status = 'done';

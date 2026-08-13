-- Migration: adiciona campo recurrence na tabela tasks
-- Permite tarefas recorrentes (diária, semanal, mensal, anual)
-- Aplique após uc019_migration.sql que já adicionou completed_by e completed_at.

-- Tipo enum de recorrência (alinhado com family_events.recurrence)
DO $$ BEGIN
  CREATE TYPE task_recurrence AS ENUM ('none', 'daily', 'weekly', 'monthly', 'yearly');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Coluna recurrence: NULL = não recorrente
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS recurrence task_recurrence DEFAULT NULL;

-- Índice para listar tarefas recorrentes rapidamente
CREATE INDEX IF NOT EXISTS tasks_family_id_recurrence_idx
  ON tasks(family_id, recurrence)
  WHERE recurrence IS NOT NULL;

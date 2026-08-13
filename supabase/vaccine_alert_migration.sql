-- supabase/vaccine_alert_migration.sql
-- UC-Vacina: índice parcial para acelerar a query de vacinas nos próximos 3 dias
-- SELECT family_events WHERE category = 'vaccine' AND start_at BETWEEN now() AND now() + 3d
--
-- Aplique via: supabase db push  OU  psql -f vaccine_alert_migration.sql

-- Índice parcial: cobre apenas eventos do tipo 'vaccine', que são minoria na tabela.
-- Combinado com o índice existente family_events_family_id_start_at_idx (family_id, start_at),
-- o planner usa este para filtrar category='vaccine' de forma eficiente.
create index if not exists family_events_vaccine_start_at_idx
  on family_events (family_id, start_at)
  where category = 'vaccine';

-- Comentário de auditoria
comment on index family_events_vaccine_start_at_idx is
  'Índice parcial para a query UC-Vacina: lista vacinas próximas (category=vaccine, start_at entre now e now+3d).';

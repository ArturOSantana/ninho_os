-- ============================================================
-- NINHO — Migration Fase 12: Módulo Assinaturas
-- 1. families — adiciona plan e premium_until
-- 2. RLS de families atualizado para planos
-- ============================================================

-- ─── 1. families: Campos de Plano ─────────────────────────────
alter table families
  add column if not exists plan text not null default 'free' check (plan in ('free', 'premium')),
  add column if not exists premium_until timestamptz;

-- Índice para busca rápida de validade de plano premium
create index if not exists families_plan_premium_until_idx
  on families(plan, premium_until)
  where plan = 'premium';

-- ─── 2. RLS: Apenas membros da família lêem os dados de plano ───
-- As políticas gerais de families já cobrem SELECT e UPDATE comuns.
-- Garantimos que somente membros adultos possam fazer upgrade (se feito via RPC ou update direto).

create or replace function public.upgrade_family_to_premium(p_family_id uuid, p_duration_days int default 30)
returns void as $$
begin
  -- Verifica se quem chama é admin ou parent da mesma família
  if auth_role() not in ('admin', 'parent') or auth_family_id() != p_family_id then
    raise exception 'Apenas administradores ou responsáveis podem gerenciar a assinatura da família.';
  end if;

  update families
  set plan = 'premium',
      premium_until = now() + (p_duration_days || ' days')::interval
  where id = p_family_id;
end;
$$ language plpgsql security definer;

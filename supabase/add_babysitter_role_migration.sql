-- ============================================================
-- NINHO — Migration: Adicionar 'babysitter' ao enum user_role
--
-- O TypeScript define UserRole com 'babysitter', mas o enum do
-- banco foi criado sem esse valor. Isso causaria um erro de banco
-- ao gerar um convite com role='babysitter' ou ao aceitar um.
--
-- Idempotente: a condição DO $$ ... $$ verifica se já existe.
-- ============================================================

DO $$
BEGIN
  -- Adiciona 'babysitter' ao enum apenas se ainda não existir
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = 'user_role'::regtype
      AND enumlabel = 'babysitter'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'babysitter';
  END IF;
END;
$$;

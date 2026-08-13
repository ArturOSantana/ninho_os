// src/hooks/useAuth.ts

import { useAuth as useAuthContext } from '@/context/AuthContext';

/**
 * Hook custom para usar AuthContext
 * Wrapper para permitir adicionar lógica depois
 */
export const useAuth = useAuthContext;

/**
 * Hook para verificar se usuário está autenticado
 */
export const useIsAuthenticated = () => {
  const { user, loading } = useAuth();
  return {
    isAuthenticated: !!user,
    loading,
  };
};

/**
 * Hook para obter ID do usuário
 */
export const useUserId = () => {
  const { user } = useAuth();
  return user?.id || null;
};

/**
 * Hook para obter email do usuário
 */
export const useUserEmail = () => {
  const { user } = useAuth();
  return user?.email || null;
};

// src/context/FamilyContext.tsx

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { familyService } from '@/services/family/familyService';
import {
  Family,
  Baby,
  CreateFamilyInput,
  CreateBabyInput,
  FamilyContextType,
  UUID,
} from '@/types';
import { useAuthStore } from '@/stores/auth.store';

/**
 * FamilyContext - Gerencia estado da família e bebês
 * Responsável por: family, babies, members, loading, error
 * Ações: createFamily, addBaby, joinFamily, etc
 */
const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export const FamilyProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [family, setFamily] = useState<Family | null>(null);
  const [babies, setBabies] = useState<Baby[]>([]);
  const [currentBaby, setCurrentBaby] = useState<Baby | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sincroniza com o AuthStore quando ele termina de carregar os dados
  const storeFamily  = useAuthStore((s) => s.family);
  const storeBabies  = useAuthStore((s) => s.babies);
  const storeLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    // Aguarda o AuthStore terminar de carregar antes de sincronizar
    if (storeLoading) return;

    if (storeFamily && !family) {
      setFamily(storeFamily);
    }
    if (storeBabies.length > 0 && babies.length === 0) {
      setBabies(storeBabies);
      setCurrentBaby((prev) => prev ?? storeBabies[0]);
    }
  // Só roda quando o store termina de carregar ou a família muda
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeLoading, storeFamily, storeBabies]);

  /**
   * UC007 - Criar Família
   */
  const createFamily = useCallback(async (input: CreateFamilyInput) => {
    try {
      setLoading(true);
      setError(null);

      const newFamily = await familyService.createFamily(input);
      setFamily(newFamily);
      setBabies([]);
      setCurrentBaby(null);
      // Mantém AuthStore sincronizado
      useAuthStore.getState().setFamily(newFamily);
      useAuthStore.getState().setBabies([]);
      useAuthStore.getState().setIsOnboarded(false);

      return newFamily;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao criar família';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Atualizar família
   */
  const updateFamily = useCallback(
    async (id: UUID, updates: Partial<Family>) => {
      try {
        setLoading(true);
        setError(null);

        const updated = await familyService.updateFamily(id, updates);
        setFamily(updated);

        return updated;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Erro ao atualizar família';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * UC008 - Adicionar Bebê
   */
  const addBaby = useCallback(async (input: CreateBabyInput) => {
    try {
      setLoading(true);
      setError(null);

      const newBaby = await familyService.createBaby(input);
      setBabies((prev) => {
        const updated = [newBaby, ...prev];
        // Mantém AuthStore sincronizado para que useBabyLogger tenha babyId
        useAuthStore.getState().setBabies(updated);
        return updated;
      });
      setCurrentBaby(newBaby); // Novo bebê vira o atual

      return newBaby;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao adicionar bebê';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Atualizar bebê
   */
  const updateBaby = useCallback(
    async (id: UUID, updates: Partial<Baby>) => {
      try {
        setLoading(true);
        setError(null);

        const updated = await familyService.updateBaby(id, updates);

        // Atualizar na lista
        setBabies((prev) =>
          prev.map((b) => (b.id === id ? updated : b))
        );

        // Se é o bebê atual, atualizar
        if (currentBaby?.id === id) {
          setCurrentBaby(updated);
        }

        return updated;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Erro ao atualizar bebê';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [currentBaby?.id]
  );

  /**
   * Deletar bebê
   */
  const deleteBaby = useCallback(async (id: UUID) => {
    try {
      setLoading(true);
      setError(null);

      // Nota: familyService não tem deleteBaby, adicionar depois
      // await familyService.deleteBaby(id);

      // Remover da lista
      setBabies((prev) => prev.filter((b) => b.id !== id));

      // Se é o bebê atual, limpar
      if (currentBaby?.id === id) {
        setCurrentBaby(null);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao deletar bebê';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentBaby?.id]);

  /**
   * Mudar bebê atual
   */
  const handleSetCurrentBaby = useCallback((baby: Baby | null) => {
    setCurrentBaby(baby);
  }, []);

  /**
   * UC006 - Aceitar Convite
   */
  const joinFamilyByInvite = useCallback(async (token: string) => {
    try {
      setLoading(true);
      setError(null);

      // A RPC join_family_by_invite já valida token, expiração e revogação.
      // Não é necessário chamar validateInvite antes (evita round-trip extra).
      const joinedFamily = await familyService.acceptInvite(token);
      setFamily(joinedFamily);
      useAuthStore.getState().setFamily(joinedFamily);

      // Carregar bebês da família
      const familyBabies = await familyService.listBabies(joinedFamily.id);
      setBabies(familyBabies);
      useAuthStore.getState().setBabies(familyBabies);

      if (familyBabies.length > 0) {
        setCurrentBaby(familyBabies[0]);
      }

      return joinedFamily;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao aceitar convite';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Carregar família e bebês
   */
  const loadFamily = useCallback(async (familyId: UUID) => {
    try {
      setLoading(true);
      setError(null);

      const loadedFamily = await familyService.getFamily(familyId);
      setFamily(loadedFamily);

      const familyBabies = await familyService.listBabies(familyId);
      setBabies(familyBabies);

      if (familyBabies.length > 0) {
        setCurrentBaby(familyBabies[0]);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao carregar família';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Limpar erro
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: FamilyContextType = {
    // State
    family,
    babies,
    members: [], // TODO: Implementar na Fase 5
    currentBaby,
    loading,
    error,

    // Actions
    createFamily,
    updateFamily,
    addBaby,
    updateBaby,
    deleteBaby,
    setCurrentBaby: handleSetCurrentBaby,
    joinFamilyByInvite,
    loadFamily,
    clearError,
  };

  return (
    <FamilyContext.Provider value={value}>
      {children}
    </FamilyContext.Provider>
  );
};

/**
 * Hook para usar FamilyContext
 */
export const useFamily = (): FamilyContextType => {
  const context = useContext(FamilyContext);

  if (context === undefined) {
    throw new Error(
      'useFamily deve ser usado dentro de um FamilyProvider'
    );
  }

  return context;
};

// src/hooks/useFamily.ts

import { useFamily as useFamilyContext } from '@/context/FamilyContext';

/**
 * Hook custom para usar FamilyContext
 * Wrapper do useContext para permitir adicionar lógica customizada depois
 */
export const useFamily = useFamilyContext;

/**
 * Hook para validar se usuário está em uma família
 */
export const useFamilyValidation = () => {
  const { family, loading, error } = useFamily();

  return {
    isInFamily: !!family,
    familyId: family?.id,
    hasFamily: !!family,
    loading,
    error,
  };
};

/**
 * Hook para gerenciar bebé atual
 */
export const useCurrentBaby = () => {
  const { currentBaby, babies, setCurrentBaby } = useFamily();

  return {
    baby: currentBaby,
    babies,
    setBaby: setCurrentBaby,
    babyCount: babies.length,
    hasBabies: babies.length > 0,
    goToNextBaby: () => {
      if (!currentBaby) return;
      const currentIndex = babies.findIndex(b => b.id === currentBaby.id);
      if (currentIndex < babies.length - 1) {
        setCurrentBaby(babies[currentIndex + 1]);
      }
    },
    goToPreviousBaby: () => {
      if (!currentBaby) return;
      const currentIndex = babies.findIndex(b => b.id === currentBaby.id);
      if (currentIndex > 0) {
        setCurrentBaby(babies[currentIndex - 1]);
      }
    },
  };
};

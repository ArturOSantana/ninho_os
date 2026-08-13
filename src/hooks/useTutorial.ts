// src/hooks/useTutorial.ts
// Controla se o tutorial de onboarding de cada tela já foi exibido.
// Persiste via AsyncStorage: a chave é `tutorial_seen_<screenKey>`.

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'tutorial_seen_';

export type TutorialScreenKey =
  | 'dashboard'
  | 'baby'
  | 'kids'
  | 'tasks'
  | 'shopping'
  | 'agenda';

/**
 * Retorna `{ visible, dismiss }`.
 * - `visible` começa `false` enquanto verifica o storage; vira `true` se nunca viu.
 * - `dismiss()` marca como visto e fecha o overlay.
 */
export function useTutorial(screenKey: TutorialScreenKey) {
  const [visible, setVisible] = useState(false);
  const storageKey = PREFIX + screenKey;

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(storageKey).then((value) => {
      if (!cancelled && value === null) {
        setVisible(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  const dismiss = useCallback(() => {
    setVisible(false);
    AsyncStorage.setItem(storageKey, '1');
  }, [storageKey]);

  /** Permite re-abrir o tutorial manualmente (ex.: botão "ajuda") */
  const reopen = useCallback(() => {
    setVisible(true);
  }, []);

  return { visible, dismiss, reopen };
}

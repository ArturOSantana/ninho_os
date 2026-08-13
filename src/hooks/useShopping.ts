// src/hooks/useShopping.ts
// UC021: Criar lista | UC022: Comprar item | UC023: Compartilhar lista
// Realtime: subscription Supabase para sincronizar INSERT/UPDATE/DELETE
// entre todos os membros da família conectados.

import { useState, useCallback, useEffect, useRef } from 'react';
import { shoppingService } from '@/services/shopping/shoppingService';
import { supabase } from '@/lib/supabase';
import { ShoppingItem, CreateShoppingItemInput } from '@/types';

interface ShoppingState {
  items:     ShoppingItem[];
  loading:   boolean;
  error:     string | null;
  /** IDs de itens inseridos remotamente (outro membro) nos últimos 600ms */
  newItemIds: Set<string>;
}

/**
 * Hook para gerenciar lista de compras familiar
 * UC021: Criar lista | UC022: Comprar item | UC023: Compartilhar lista
 *
 * Realtime: mantém subscription ativa para INSERT/UPDATE/DELETE enquanto a
 * tela estiver montada. Itens inseridos por outro membro são marcados em
 * `newItemIds` por 600ms para que a UI possa exibir o destaque visual.
 *
 * Documentação Platform.select: o comportamento de animação é idêntico em
 * iOS, Android e Web — usa Animated.timing que roda na thread JS em todos
 * os casos.
 */
export const useShopping = (familyId: string) => {
  const [state, setState] = useState<ShoppingState>({
    items:      [],
    loading:    false,
    error:      null,
    newItemIds: new Set<string>(),
  });

  // Ref para timers de limpeza dos newItemIds — evita leak de memória
  const newItemTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // ── helpers de estado ───────────────────────────────────────────────
  const setLoading = (loading: boolean) =>
    setState((prev) => ({ ...prev, loading }));

  const setError = (error: string | null) =>
    setState((prev) => ({ ...prev, error }));

  // ── Marca item como "novo" por 600ms e depois remove o destaque ─────
  const markAsNew = useCallback((id: string) => {
    setState((prev) => {
      const next = new Set(prev.newItemIds);
      next.add(id);
      return { ...prev, newItemIds: next };
    });

    // Remove o destaque após 600ms — conforme handoff: "fundo pisca por 600ms"
    if (newItemTimers.current.has(id)) {
      clearTimeout(newItemTimers.current.get(id)!);
    }
    const timer = setTimeout(() => {
      setState((prev) => {
        const next = new Set(prev.newItemIds);
        next.delete(id);
        return { ...prev, newItemIds: next };
      });
      newItemTimers.current.delete(id);
    }, 600);
    newItemTimers.current.set(id, timer);
  }, []);

  // ── loadItems ───────────────────────────────────────────────────────
  const loadItems = useCallback(
    async (onlyPending = false) => {
      try {
        setLoading(true);
        setError(null);
        const items = await shoppingService.listItems(familyId, onlyPending);
        setState((prev) => ({ ...prev, items, loading: false }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao carregar lista';
        setState((prev) => ({ ...prev, error: message, loading: false }));
      }
    },
    [familyId]
  );

  // ── Realtime subscription ───────────────────────────────────────────
  // Escuta postgres_changes em shopping_items para o family_id atual.
  // Separado do loadItems: a subscription é mantida durante toda a vida
  // do hook, independente de refreshes manuais.
  useEffect(() => {
    if (!familyId) return;

    const channelId = `shopping:${familyId}:${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event:  '*',
          schema: 'public',
          table:  'shopping_items',
          filter: `family_id=eq.${familyId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newItem = payload.new as ShoppingItem;
            setState((prev) => {
              // Evita duplicata: se o item já existe (inserido pelo próprio usuário
              // via addItem), apenas ignora o evento remoto.
              const already = prev.items.some((i) => i.id === newItem.id);
              if (already) return prev;
              return { ...prev, items: [newItem, ...prev.items] };
            });
            // Sinaliza como "novo" para animação de destaque
            markAsNew(newItem.id);
          }

          if (payload.eventType === 'UPDATE') {
            const updated = payload.new as ShoppingItem;
            setState((prev) => ({
              ...prev,
              items: prev.items.map((i) => (i.id === updated.id ? updated : i)),
            }));
          }

          if (payload.eventType === 'DELETE') {
            const deleted = payload.old as { id: string };
            setState((prev) => ({
              ...prev,
              items: prev.items.filter((i) => i.id !== deleted.id),
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      // Limpa timers de newItemIds ao desmontar
      newItemTimers.current.forEach((t) => clearTimeout(t));
      newItemTimers.current.clear();
    };
  }, [familyId, markAsNew]);

  // ── addItem ─────────────────────────────────────────────────────────
  const addItem = useCallback(
    async (input: CreateShoppingItemInput) => {
      try {
        setLoading(true);
        setError(null);
        const newItem = await shoppingService.addItem(familyId, input);
        // Insere localmente de imediato (antes do evento Realtime chegar)
        setState((prev) => ({
          ...prev,
          items: [newItem, ...prev.items],
          loading: false,
        }));
        return newItem;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao adicionar item';
        setState((prev) => ({ ...prev, error: message, loading: false }));
        throw err;
      }
    },
    [familyId]
  );

  // ── checkItem ───────────────────────────────────────────────────────
  const checkItem = useCallback(async (id: string) => {
    // Optimistic: marca localmente antes de aguardar o servidor
    setState((prev) => ({
      ...prev,
      items: prev.items.map((i) => i.id === id ? { ...i, checked: true } : i),
    }));
    try {
      const updated = await shoppingService.checkItem(id);
      // Evento Realtime (UPDATE) vai cheguar; a substituição local garante
      // consistência imediata caso o evento demore.
      setState((prev) => ({
        ...prev,
        items: prev.items.map((i) => (i.id === id ? updated : i)),
        loading: false,
      }));
    } catch (err) {
      // Reverter optimistic em caso de falha
      setState((prev) => ({
        ...prev,
        items: prev.items.map((i) => i.id === id ? { ...i, checked: false } : i),
        error: err instanceof Error ? err.message : 'Erro ao marcar item',
        loading: false,
      }));
      throw err;
    }
  }, []);

  // ── deleteItem ──────────────────────────────────────────────────────
  const deleteItem = useCallback(async (id: string) => {
    // Optimistic: remove da lista imediatamente
    setState((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.id !== id),
    }));
    try {
      await shoppingService.deleteItem(id);
    } catch (err) {
      // Não reverter delete otimista — o usuário pediu remover, erro é raro
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Erro ao excluir item',
      }));
      throw err;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    items:        state.items,
    loading:      state.loading,
    error:        state.error,
    newItemIds:   state.newItemIds,
    pendingItems: state.items.filter((i) => !i.checked),
    checkedItems: state.items.filter((i) => i.checked),
    loadItems,
    addItem,
    checkItem,
    deleteItem,
    clearError,
  };
};

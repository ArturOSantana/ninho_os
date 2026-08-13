// src/hooks/useGuestShopping.ts
// Gerencia a sessão de convidado temporário para a lista de compras.
// O token é carregado via deep-link (?token=...) e validado contra
// o Supabase. Enquanto válido, acessa shopping_items via RLS guest.

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { GuestSession, ShoppingItem } from '@/types';

// Mensagens do banco que indicam token expirado/revogado (PL/pgSQL RAISE)
const TOKEN_INVALID_PATTERNS = [
  'token inválido',
  'token invalido',
  'token inválido ou expirado',
  'token invalido ou expirado',
];

function isTokenExpiredError(message: string): boolean {
  const lower = message.toLowerCase();
  return TOKEN_INVALID_PATTERNS.some((p) => lower.includes(p));
}

interface GuestShoppingState {
  session: GuestSession | null;
  items: ShoppingItem[];
  loading: boolean;
  error: string | null;
  expired: boolean;
}

/**
 * Hook para sessão de convidado temporário (guest_shopping_link).
 *
 * Uso:
 *   const { session, items, loading, error, expired,
 *           initSession, loadItems, checkItem } = useGuestShopping();
 *
 * 1. Chame initSession(token) com o token extraído da URL.
 * 2. Se válido, session fica preenchido e items pode ser carregado.
 * 3. checkItem(session, id) marca o item como comprado via UPDATE.
 * 4. expired = true quando a data expires_at for atingida **ou** quando
 *    o link for revogado remotamente — detectado via polling passivo e
 *    por leitura do erro retornado pelos RPCs.
 */
export function useGuestShopping() {
  const [state, setState] = useState<GuestShoppingState>({
    session: null,
    items: [],
    loading: false,
    error: null,
    expired: false,
  });

  const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setPartial = (partial: Partial<GuestShoppingState>) =>
    setState((prev) => ({ ...prev, ...partial }));

  // ─── Timer de expiração local ─────────────────────────────────
  // Quando a session é estabelecida, agenda uma transição automática
  // para expired=true no momento exato de expires_at (até 48 h no futuro).
  // Isso garante que a tela bloqueie mesmo se o usuário a deixar aberta.
  const scheduleExpiryTimer = useCallback((session: GuestSession) => {
    if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);

    const msUntilExpiry = new Date(session.expires_at).getTime() - Date.now();
    if (msUntilExpiry <= 0) {
      // Já expirou — sinalizar imediatamente
      setState((prev) => ({ ...prev, expired: true, session: null, items: [] }));
      return;
    }

    // setTimeout aceita até ~24.8 dias (Int32 max); cobre o padrão de 48 h
    expiryTimerRef.current = setTimeout(() => {
      setState((prev) => ({ ...prev, expired: true, session: null, items: [] }));
    }, msUntilExpiry);
  }, []);

  // Limpar timer ao desmontar
  useEffect(() => {
    return () => {
      if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);
    };
  }, []);

  /**
   * Valida o token via RPC validate_guest_shopping_token e
   * monta a GuestSession local.
   *
   * Garante que qualquer falha (token inválido, rede, RLS) seja
   * traduzida corretamente em `expired: true` ou `error`.
   */
  const initSession = useCallback(async (token: string) => {
    setPartial({ loading: true, error: null, expired: false });
    try {
      // Chama a função SQL que retorna family_id ou null
      const { data: familyId, error: rpcError } = await supabase.rpc(
        'validate_guest_shopping_token',
        { p_token: token }
      );

      if (rpcError) throw new Error(rpcError.message);

      if (!familyId) {
        // Token expirado, revogado ou inexistente — não é erro técnico
        setPartial({ session: null, expired: true, loading: false });
        return null;
      }

      // Buscar expires_at para exibição e para agendamento do timer local.
      // Se esta query falhar (ex: token não satisfaz RLS de SELECT),
      // tratar como token inválido em vez de erro genérico.
      const { data: linkRow, error: linkError } = await supabase
        .from('guest_shopping_links')
        .select('expires_at, revoked_at')
        .eq('token', token)
        .single();

      if (linkError) {
        // Falha de acesso: interpretar como token não autorizado
        setPartial({ session: null, expired: true, loading: false });
        return null;
      }

      if (linkRow.revoked_at || new Date(linkRow.expires_at) <= new Date()) {
        setPartial({ session: null, expired: true, loading: false });
        return null;
      }

      const session: GuestSession = {
        token,
        family_id: familyId as string,
        expires_at: linkRow.expires_at,
      };

      setPartial({ session, loading: false });
      scheduleExpiryTimer(session);
      return session;
    } catch (err) {
      setPartial({
        error: err instanceof Error ? err.message : 'Token inválido',
        loading: false,
      });
      return null;
    }
  }, [scheduleExpiryTimer]);

  /**
   * Carrega itens usando o token como parâmetro do RPC guest-safe.
   * Se o banco responder com erro de token inválido/expirado, transiciona
   * para expired=true em vez de exibir um erro genérico.
   */
  const loadItems = useCallback(
    async (session: GuestSession) => {
      if (!session) return;

      // Verificar expiração local antes de ir ao banco
      if (new Date(session.expires_at) <= new Date()) {
        setPartial({ expired: true, session: null, items: [] });
        return;
      }

      setPartial({ loading: true, error: null });
      try {
        const { data, error } = await supabase.rpc('list_guest_shopping_items', {
          p_token: session.token,
        });

        if (error) {
          if (isTokenExpiredError(error.message)) {
            setState((prev) => ({
              ...prev,
              expired: true,
              session: null,
              items: [],
              loading: false,
              error: null,
            }));
          } else {
            throw new Error(error.message);
          }
          return;
        }

        setPartial({ items: (data ?? []) as ShoppingItem[], loading: false });
      } catch (err) {
        setPartial({
          error: err instanceof Error ? err.message : 'Erro ao carregar lista',
          loading: false,
        });
      }
    },
    []
  );

  /**
   * Marca item como comprado via RPC guest-safe.
   * Erros de token inválido/revogado transitam para expired=true.
   */
  const checkItem = useCallback(
    async (session: GuestSession, itemId: string) => {
      if (!session) return;

      if (new Date(session.expires_at) <= new Date()) {
        setPartial({ expired: true, session: null });
        return;
      }

      // Otimistic UI
      setState((prev) => ({
        ...prev,
        items: prev.items.map((i) =>
          i.id === itemId ? { ...i, checked: true } : i
        ),
      }));

      try {
        const { error } = await supabase.rpc('check_guest_shopping_item', {
          p_token:   session.token,
          p_item_id: itemId,
        });

        if (error) {
          if (isTokenExpiredError(error.message)) {
            // Token revogado enquanto o usuário usava a tela
            setState((prev) => ({
              ...prev,
              expired: true,
              session: null,
              items: [],
              loading: false,
              error: null,
            }));
          } else {
            // Reverter item e mostrar erro técnico
            setState((prev) => ({
              ...prev,
              items: prev.items.map((i) =>
                i.id === itemId ? { ...i, checked: false } : i
              ),
              error: error.message,
            }));
          }
        }
      } catch (err) {
        setState((prev) => ({
          ...prev,
          items: prev.items.map((i) =>
            i.id === itemId ? { ...i, checked: false } : i
          ),
          error: err instanceof Error ? err.message : 'Erro ao marcar item',
        }));
      }
    },
    []
  );

  const clearError = useCallback(() => setPartial({ error: null }), []);

  return {
    session:      state.session,
    items:        state.items,
    loading:      state.loading,
    error:        state.error,
    expired:      state.expired,
    pendingItems: state.items.filter((i) => !i.checked),
    checkedItems: state.items.filter((i) => i.checked),
    initSession,
    loadItems,
    checkItem,
    clearError,
  };
}

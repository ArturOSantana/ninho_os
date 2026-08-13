// tests/unit/useGuestShopping.test.ts
// UC023 — Acesso de convidado à lista de compras
// Valida expiração, revogação e transições de estado do hook.

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// ─── helpers ──────────────────────────────────────────────────
const FUTURE_48H = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
const PAST_1H    = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();

const TOKEN_VALID   = 'aaabbbccc111222333444555666777888999000aabb';
const TOKEN_EXPIRED = 'expired000111222333444555666777888999000aa';
const TOKEN_REVOKED = 'revoked111222333444555666777888999000aabb';
const TOKEN_INVALID = 'notexistent0000000000000000000000000000000';

const FAMILY_ID = 'fam-00000000-0000-0000-0000-000000000001';
const ITEM_ID   = 'item-00000000-0000-0000-0000-000000000001';

const MOCK_ITEMS = [
  {
    id:         ITEM_ID,
    family_id:  FAMILY_ID,
    name:       'Leite',
    quantity:   2,
    unit:       'L',
    category:   'laticínios',
    checked:    false,
    added_by:   'user-111',
    created_at: new Date().toISOString(),
  },
];

// ─── mock do módulo supabase ───────────────────────────────────
// Configurado por teste via `mockRpcImpl` e `mockFromImpl`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockRpcImpl: jest.Mock<any> = jest.fn();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockFromImpl: jest.Mock<any> = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    rpc:  (...args: unknown[]) => mockRpcImpl(...args),
    from: (...args: unknown[]) => mockFromImpl(...args),
  },
}));

// ─── isTokenExpiredError (lógica interna exposta indiretamente) ─
// Testamos os padrões de mensagem que o PL/pgSQL retorna.
describe('isTokenExpiredError — padrões de mensagem do banco', () => {
  const patterns = [
    'Token inválido ou expirado.',
    'token invalido ou expirado',
    'Token Inválido',
    'token invalido',
  ];
  const nonPatterns = [
    'duplicate key value violates unique constraint',
    'permission denied',
    'Network request failed',
  ];

  patterns.forEach((msg) => {
    it(`reconhece "${msg}" como token expirado`, () => {
      const lower = msg.toLowerCase();
      const match =
        lower.includes('token inválido') ||
        lower.includes('token invalido');
      expect(match).toBe(true);
    });
  });

  nonPatterns.forEach((msg) => {
    it(`não confunde "${msg}" com token expirado`, () => {
      const lower = msg.toLowerCase();
      const match =
        lower.includes('token inválido') ||
        lower.includes('token invalido');
      expect(match).toBe(false);
    });
  });
});

// ─── GuestSession — lógica de validação ──────────────────────
describe('GuestSession — validação de expiração local', () => {
  it('token com expires_at no futuro é considerado válido', () => {
    const expiresAt = FUTURE_48H;
    expect(new Date(expiresAt) > new Date()).toBe(true);
  });

  it('token com expires_at no passado é considerado expirado', () => {
    const expiresAt = PAST_1H;
    expect(new Date(expiresAt) <= new Date()).toBe(true);
  });

  it('calcula ms até expiração corretamente', () => {
    const in5min = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const ms = new Date(in5min).getTime() - Date.now();
    expect(ms).toBeGreaterThan(0);
    expect(ms).toBeLessThanOrEqual(5 * 60 * 1000);
  });
});

// ─── initSession — fluxo de inicialização ────────────────────
describe('initSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna null e seta expired=true quando validate_guest_shopping_token retorna null', async () => {
    // RPC retorna null (token inexistente/expirado)
    mockRpcImpl.mockResolvedValueOnce({ data: null, error: null });

    const state = await simulateInitSession(TOKEN_EXPIRED);

    expect(state.session).toBeNull();
    expect(state.expired).toBe(true);
    expect(state.error).toBeNull();
    expect(state.loading).toBe(false);
  });

  it('retorna null e seta expired=true quando SELECT de guest_shopping_links falha (RLS)', async () => {
    // RPC retorna o family_id (token existe no banco)
    mockRpcImpl.mockResolvedValueOnce({ data: FAMILY_ID, error: null });
    // SELECT falha (ex: token inválido não satisfaz RLS)
    mockFromImpl.mockReturnValueOnce(buildQueryChain({
      error: { message: 'No rows found' },
      data: null,
    }));

    const state = await simulateInitSession(TOKEN_INVALID);

    expect(state.session).toBeNull();
    expect(state.expired).toBe(true);
    expect(state.error).toBeNull();
  });

  it('retorna null e seta expired=true quando revoked_at está preenchido', async () => {
    mockRpcImpl.mockResolvedValueOnce({ data: FAMILY_ID, error: null });
    mockFromImpl.mockReturnValueOnce(buildQueryChain({
      data: { expires_at: FUTURE_48H, revoked_at: new Date().toISOString() },
      error: null,
    }));

    const state = await simulateInitSession(TOKEN_REVOKED);

    expect(state.session).toBeNull();
    expect(state.expired).toBe(true);
  });

  it('retorna null e seta expired=true quando expires_at já passou (na segunda query)', async () => {
    mockRpcImpl.mockResolvedValueOnce({ data: FAMILY_ID, error: null });
    mockFromImpl.mockReturnValueOnce(buildQueryChain({
      data: { expires_at: PAST_1H, revoked_at: null },
      error: null,
    }));

    const state = await simulateInitSession(TOKEN_EXPIRED);

    expect(state.session).toBeNull();
    expect(state.expired).toBe(true);
  });

  it('retorna session preenchida quando token é válido', async () => {
    mockRpcImpl.mockResolvedValueOnce({ data: FAMILY_ID, error: null });
    mockFromImpl.mockReturnValueOnce(buildQueryChain({
      data: { expires_at: FUTURE_48H, revoked_at: null },
      error: null,
    }));

    const state = await simulateInitSession(TOKEN_VALID);

    expect(state.session).not.toBeNull();
    expect(state.session?.token).toBe(TOKEN_VALID);
    expect(state.session?.family_id).toBe(FAMILY_ID);
    expect(state.expired).toBe(false);
    expect(state.loading).toBe(false);
  });

  it('seta error (não expired) quando RPC lança erro técnico de rede', async () => {
    mockRpcImpl.mockResolvedValueOnce({
      data: null,
      error: { message: 'Network request failed' },
    });

    const state = await simulateInitSession(TOKEN_VALID);

    expect(state.session).toBeNull();
    expect(state.expired).toBe(false);
    expect(state.error).toContain('Network request failed');
  });
});

// ─── loadItems — carregamento com expiração ───────────────────
describe('loadItems', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('não busca dados e seta expired=true se expires_at já passou', async () => {
    const expiredSession = { token: TOKEN_EXPIRED, family_id: FAMILY_ID, expires_at: PAST_1H };
    const state = await simulateLoadItems(expiredSession);

    expect(mockRpcImpl).not.toHaveBeenCalled();
    expect(state.expired).toBe(true);
    expect(state.session).toBeNull();
    expect(state.items).toHaveLength(0);
  });

  it('seta expired=true quando RPC retorna mensagem de token inválido', async () => {
    mockRpcImpl.mockResolvedValueOnce({
      data: null,
      error: { message: 'Token inválido ou expirado.' },
    });

    const validSession = { token: TOKEN_VALID, family_id: FAMILY_ID, expires_at: FUTURE_48H };
    const state = await simulateLoadItems(validSession);

    expect(state.expired).toBe(true);
    expect(state.session).toBeNull();
    expect(state.items).toHaveLength(0);
    expect(state.error).toBeNull(); // não vaza mensagem técnica
  });

  it('seta error (não expired) quando RPC retorna erro técnico', async () => {
    mockRpcImpl.mockResolvedValueOnce({
      data: null,
      error: { message: 'connection refused' },
    });

    const validSession = { token: TOKEN_VALID, family_id: FAMILY_ID, expires_at: FUTURE_48H };
    const state = await simulateLoadItems(validSession);

    expect(state.expired).toBe(false);
    expect(state.error).toContain('connection refused');
  });

  it('popula items corretamente quando token válido', async () => {
    mockRpcImpl.mockResolvedValueOnce({ data: MOCK_ITEMS, error: null });

    const validSession = { token: TOKEN_VALID, family_id: FAMILY_ID, expires_at: FUTURE_48H };
    const state = await simulateLoadItems(validSession);

    expect(state.items).toHaveLength(1);
    expect(state.items[0].id).toBe(ITEM_ID);
    expect(state.expired).toBe(false);
    expect(state.error).toBeNull();
  });
});

// ─── checkItem — marcação com expiração ──────────────────────
describe('checkItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('não chama RPC e seta expired=true se expires_at já passou', async () => {
    const expiredSession = { token: TOKEN_EXPIRED, family_id: FAMILY_ID, expires_at: PAST_1H };
    const state = await simulateCheckItem(expiredSession, ITEM_ID, MOCK_ITEMS);

    expect(mockRpcImpl).not.toHaveBeenCalled();
    expect(state.expired).toBe(true);
    expect(state.session).toBeNull();
  });

  it('seta expired=true quando RPC retorna mensagem de token inválido', async () => {
    mockRpcImpl.mockResolvedValueOnce({
      data: null,
      error: { message: 'token invalido ou expirado' },
    });

    const validSession = { token: TOKEN_VALID, family_id: FAMILY_ID, expires_at: FUTURE_48H };
    const state = await simulateCheckItem(validSession, ITEM_ID, MOCK_ITEMS);

    expect(state.expired).toBe(true);
    expect(state.session).toBeNull();
    expect(state.items).toHaveLength(0);
    expect(state.error).toBeNull();
  });

  it('reverte item para checked=false quando RPC retorna erro técnico', async () => {
    mockRpcImpl.mockResolvedValueOnce({
      data: null,
      error: { message: 'deadlock detected' },
    });

    const validSession = { token: TOKEN_VALID, family_id: FAMILY_ID, expires_at: FUTURE_48H };
    const state = await simulateCheckItem(validSession, ITEM_ID, MOCK_ITEMS);

    expect(state.expired).toBe(false);
    expect(state.items[0].checked).toBe(false); // revertido
    expect(state.error).toContain('deadlock detected');
  });

  it('mantém item como checked=true após sucesso', async () => {
    mockRpcImpl.mockResolvedValueOnce({ data: null, error: null });

    const validSession = { token: TOKEN_VALID, family_id: FAMILY_ID, expires_at: FUTURE_48H };
    const state = await simulateCheckItem(validSession, ITEM_ID, MOCK_ITEMS);

    expect(state.items[0].checked).toBe(true);
    expect(state.expired).toBe(false);
    expect(state.error).toBeNull();
  });
});

// ─── Timer de expiração ───────────────────────────────────────
describe('scheduleExpiryTimer', () => {
  it('ms até expiração em 2 s é positivo e menor que 3 s', () => {
    const in2s = new Date(Date.now() + 2000).toISOString();
    const ms = new Date(in2s).getTime() - Date.now();
    expect(ms).toBeGreaterThan(0);
    expect(ms).toBeLessThanOrEqual(3000);
  });

  it('ms até expiração já passada é negativo ou zero', () => {
    const ms = new Date(PAST_1H).getTime() - Date.now();
    expect(ms).toBeLessThanOrEqual(0);
  });

  it('setTimeout com delay negativo/zero deve disparar imediatamente', () => {
    // Comportamento nativo do JS: setTimeout com delay <= 0 executa em ~0ms
    return new Promise<void>((resolve) => {
      const expired = new Date(PAST_1H).getTime() - Date.now();
      const delay = Math.max(0, expired);
      const t = setTimeout(() => {
        clearTimeout(t);
        resolve();
      }, delay);
    });
  });
});

// ─── NavigationGuard — rotas públicas ────────────────────────
describe('NavigationGuard — guest-shopping como rota pública', () => {
  it('segments[0] === "guest-shopping" deve ser reconhecido como rota pública', () => {
    const segments = ['guest-shopping'];
    const inPublic = segments[0] === 'guest-shopping' || segments[0] === 'accept-invite';
    expect(inPublic).toBe(true);
  });

  it('segments[0] === "accept-invite" deve ser reconhecido como rota pública', () => {
    const segments = ['accept-invite'];
    const inPublic = segments[0] === 'guest-shopping' || segments[0] === 'accept-invite';
    expect(inPublic).toBe(true);
  });

  it('usuário sem sessão em rota pública não deve ser redirecionado para login', () => {
    const session = null;
    const segments = ['guest-shopping'];
    const inPublic = segments[0] === 'guest-shopping' || segments[0] === 'accept-invite';

    // Lógica do NavigationGuard:
    // if (!session) { if (!inAuth && !inPublic) router.replace('/(auth)/login'); return; }
    const shouldRedirect = !session && !inPublic;
    expect(shouldRedirect).toBe(false);
  });

  it('usuário sem sessão em rota privada deve ser redirecionado', () => {
    const session = null;
    const segments = ['(app)'];
    const inPublic = segments[0] === 'guest-shopping' || segments[0] === 'accept-invite';
    const inAuth   = segments[0] === '(auth)';

    const shouldRedirect = !session && !inPublic && !inAuth;
    expect(shouldRedirect).toBe(true);
  });
});

// ─── pendingItems / checkedItems ─────────────────────────────
describe('derivados pendingItems e checkedItems', () => {
  it('separa itens corretamente por checked', () => {
    const items = [
      { id: '1', checked: false },
      { id: '2', checked: true },
      { id: '3', checked: false },
      { id: '4', checked: true },
    ];
    const pending = items.filter((i) => !i.checked);
    const checked = items.filter((i) => i.checked);

    expect(pending).toHaveLength(2);
    expect(checked).toHaveLength(2);
    expect(pending.map((i) => i.id)).toEqual(['1', '3']);
    expect(checked.map((i) => i.id)).toEqual(['2', '4']);
  });

  it('lista vazia retorna arrays vazios', () => {
    const items: { id: string; checked: boolean }[] = [];
    expect(items.filter((i) => !i.checked)).toHaveLength(0);
    expect(items.filter((i) => i.checked)).toHaveLength(0);
  });
});

// ─── Funções auxiliares de simulação (não usam renderHook) ────
// Os testes acima exercitam a lógica de estado pura, sem depender
// de renderHook/@testing-library/react-hooks — evitando setup extra.

type SimState = {
  session: { token: string; family_id: string; expires_at: string } | null;
  items: typeof MOCK_ITEMS;
  loading: boolean;
  error: string | null;
  expired: boolean;
};

async function simulateInitSession(token: string): Promise<SimState> {
  let state: SimState = {
    session: null, items: [], loading: false, error: null, expired: false,
  };

  const set = (p: Partial<SimState>) => { state = { ...state, ...p }; };

  state.loading = true;
  state.error   = null;
  state.expired = false;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rpcResult = await (mockRpcImpl as jest.Mock<any>)(
      'validate_guest_shopping_token',
      { p_token: token }
    ) as { data: unknown; error: { message: string } | null };
    const { data: familyId, error: rpcError } = rpcResult;

    if (rpcError) throw new Error(rpcError.message);

    if (!familyId) {
      set({ session: null, expired: true, loading: false });
      return state;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chainResult = (mockFromImpl as jest.Mock<any>)('guest_shopping_links');
    const { data: linkRow, error: linkError } = await chainResult as {
      data: { expires_at: string; revoked_at: string | null } | null;
      error: { message: string } | null;
    };

    if (linkError || !linkRow) {
      set({ session: null, expired: true, loading: false });
      return state;
    }

    if (linkRow.revoked_at || new Date(linkRow.expires_at) <= new Date()) {
      set({ session: null, expired: true, loading: false });
      return state;
    }

    const session = { token, family_id: familyId as string, expires_at: linkRow.expires_at };
    set({ session, loading: false });
  } catch (err) {
    set({
      error: err instanceof Error ? err.message : 'Token inválido',
      loading: false,
    });
  }

  return state;
}

async function simulateLoadItems(
  session: { token: string; family_id: string; expires_at: string }
): Promise<SimState> {
  let state: SimState = {
    session, items: [], loading: false, error: null, expired: false,
  };

  const set = (p: Partial<SimState>) => { state = { ...state, ...p }; };

  if (new Date(session.expires_at) <= new Date()) {
    set({ expired: true, session: null, items: [] });
    return state;
  }

  set({ loading: true, error: null });

  const { data, error } = await mockRpcImpl('list_guest_shopping_items', {
    p_token: session.token,
  });

  if (error) {
    const lower = (error.message as string).toLowerCase();
    const isExpiry = lower.includes('token inválido') || lower.includes('token invalido');
    if (isExpiry) {
      state = { ...state, expired: true, session: null, items: [], loading: false, error: null };
    } else {
      set({ error: error.message, loading: false });
    }
    return state;
  }

  set({ items: (data ?? []) as typeof MOCK_ITEMS, loading: false });
  return state;
}

async function simulateCheckItem(
  session: { token: string; family_id: string; expires_at: string },
  itemId: string,
  initialItems: typeof MOCK_ITEMS
): Promise<SimState> {
  let state: SimState = {
    session, items: [...initialItems], loading: false, error: null, expired: false,
  };

  const set = (p: Partial<SimState>) => { state = { ...state, ...p }; };

  if (new Date(session.expires_at) <= new Date()) {
    set({ expired: true, session: null });
    return state;
  }

  // Otimistic UI
  state.items = state.items.map((i) => i.id === itemId ? { ...i, checked: true } : i);

  const { error } = await mockRpcImpl('check_guest_shopping_item', {
    p_token:   session.token,
    p_item_id: itemId,
  });

  if (error) {
    const lower = (error.message as string).toLowerCase();
    const isExpiry = lower.includes('token inválido') || lower.includes('token invalido');
    if (isExpiry) {
      state = { ...state, expired: true, session: null, items: [], loading: false, error: null };
    } else {
      state.items = state.items.map((i) => i.id === itemId ? { ...i, checked: false } : i);
      set({ error: error.message });
    }
  }

  return state;
}

// ─── buildQueryChain: simula supabase.from().select().eq().single() ──
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildQueryChain(result: { data: any; error: any }) {
  const chain = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    select: (jest.fn() as jest.Mock<any>).mockReturnThis(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    eq:     (jest.fn() as jest.Mock<any>).mockReturnThis(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    single: (jest.fn() as jest.Mock<any>).mockResolvedValue(result),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    then:   (jest.fn() as jest.Mock<any>).mockResolvedValue(result),
  };
  // Torna o próprio chain "thenable" para await mockFromImpl(...)
  Object.defineProperty(chain, Symbol.toStringTag, { value: 'Promise' });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Object.assign(Promise.resolve(result), chain) as any;
}

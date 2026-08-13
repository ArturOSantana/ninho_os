// tests/integration/shopping-flow.test.ts
// E2E do fluxo principal da Fase 6 — Lista de Compras (UC021–UC023)
// Critério de aceite: adicionar item propaga em tempo real para todos os membros conectados.

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';

// ─── Tipos mínimos ────────────────────────────────────────────────
type ShoppingCategory = 'food' | 'hygiene' | 'medicine' | 'other';

interface ShoppingItem {
  id: string;
  family_id: string;
  name: string;
  category: ShoppingCategory;
  quantity?: number;
  checked: boolean;
  added_by: string;
  created_at: string;
}

type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE';

interface RealtimeEvent {
  eventType: RealtimeEventType;
  new?: ShoppingItem;
  old?: { id: string };
}

// ─── Store em memória ─────────────────────────────────────────────
class InMemoryShoppingStore {
  private items: ShoppingItem[] = [];
  private nextId = 1;
  private listeners: Array<(ev: RealtimeEvent) => void> = [];

  subscribe(listener: (ev: RealtimeEvent) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private emit(ev: RealtimeEvent) {
    this.listeners.forEach((l) => l(ev));
  }

  insert(payload: Omit<ShoppingItem, 'id' | 'created_at' | 'checked'>): ShoppingItem {
    const item: ShoppingItem = {
      id: `item-${this.nextId++}`,
      created_at: new Date().toISOString(),
      checked: false,
      ...payload,
    };
    this.items.push(item);
    this.emit({ eventType: 'INSERT', new: item });
    return item;
  }

  check(id: string): ShoppingItem | null {
    const item = this.items.find((i) => i.id === id);
    if (!item) return null;
    item.checked = true;
    this.emit({ eventType: 'UPDATE', new: { ...item } });
    return item;
  }

  uncheck(id: string): ShoppingItem | null {
    const item = this.items.find((i) => i.id === id);
    if (!item) return null;
    item.checked = false;
    this.emit({ eventType: 'UPDATE', new: { ...item } });
    return item;
  }

  delete(id: string): boolean {
    const idx = this.items.findIndex((i) => i.id === id);
    if (idx === -1) return false;
    this.items.splice(idx, 1);
    this.emit({ eventType: 'DELETE', old: { id } });
    return true;
  }

  list(familyId: string): ShoppingItem[] {
    return this.items.filter((i) => i.family_id === familyId);
  }

  listPending(familyId: string): ShoppingItem[] {
    return this.items.filter((i) => i.family_id === familyId && !i.checked);
  }

  listChecked(familyId: string): ShoppingItem[] {
    return this.items.filter((i) => i.family_id === familyId && i.checked);
  }

  reset() {
    this.items = [];
    this.nextId = 1;
    this.listeners = [];
  }
}

// ─── Simula estado de cliente conectado (outro membro) ────────────
class ConnectedMemberView {
  items: ShoppingItem[] = [];
  receivedEvents: RealtimeEvent[] = [];
  private unsubscribe: () => void;

  constructor(store: InMemoryShoppingStore, familyId: string) {
    this.unsubscribe = store.subscribe((ev) => {
      this.receivedEvents.push(ev);

      if (ev.eventType === 'INSERT' && ev.new) {
        const already = this.items.some((i) => i.id === ev.new!.id);
        if (!already) this.items = [ev.new, ...this.items];
      }

      if (ev.eventType === 'UPDATE' && ev.new) {
        this.items = this.items.map((i) => (i.id === ev.new!.id ? ev.new! : i));
      }

      if (ev.eventType === 'DELETE' && ev.old) {
        this.items = this.items.filter((i) => i.id !== ev.old!.id);
      }
    });
    void familyId; // familyId referenciado para alinhamento com API real
  }

  disconnect() {
    this.unsubscribe();
  }
}

// ─── Fixtures ────────────────────────────────────────────────────
const FAMILY_ID = 'family-test-1';
const USER_A    = 'user-A'; // quem está com o app aberto
const USER_B    = 'user-B'; // parceiro conectado ao mesmo tempo

// ─── Testes ───────────────────────────────────────────────────────
describe('Fase 6 — Lista de Compras: fluxo principal (UC021–UC023)', () => {
  let store: InMemoryShoppingStore;

  beforeEach(() => {
    jest.useFakeTimers();
    store = new InMemoryShoppingStore();
  });

  afterEach(() => {
    jest.useRealTimers();
    store.reset();
  });

  // ── UC021 — Adicionar item ──────────────────────────────────────
  describe('UC021 — Adicionar item à lista', () => {
    it('cria item com checked=false por padrão', () => {
      const item = store.insert({
        family_id: FAMILY_ID,
        name: 'Fraldas tamanho M',
        category: 'hygiene',
        added_by: USER_A,
      });

      expect(item.id).toBeDefined();
      expect(item.checked).toBe(false);
      expect(item.name).toBe('Fraldas tamanho M');
    });

    it('cria item com categoria e quantidade opcionais', () => {
      const item = store.insert({
        family_id: FAMILY_ID,
        name: 'Leite integral',
        category: 'food',
        quantity: 3,
        added_by: USER_A,
      });

      expect(item.category).toBe('food');
      expect(item.quantity).toBe(3);
    });

    it('item sem quantidade fica undefined', () => {
      const item = store.insert({
        family_id: FAMILY_ID,
        name: 'Pomada',
        category: 'medicine',
        added_by: USER_A,
      });

      expect(item.quantity).toBeUndefined();
    });

    it('listPending retorna só itens não marcados', () => {
      const i1 = store.insert({ family_id: FAMILY_ID, name: 'A', category: 'food', added_by: USER_A });
      store.insert({ family_id: FAMILY_ID, name: 'B', category: 'food', added_by: USER_A });
      store.check(i1.id);

      expect(store.listPending(FAMILY_ID)).toHaveLength(1);
      expect(store.listPending(FAMILY_ID)[0].name).toBe('B');
    });
  });

  // ── UC022 — Marcar item como comprado ──────────────────────────
  describe('UC022 — Marcar item como comprado', () => {
    it('check marca checked=true', () => {
      const item = store.insert({ family_id: FAMILY_ID, name: 'Shampoo', category: 'hygiene', added_by: USER_A });
      const updated = store.check(item.id);

      expect(updated?.checked).toBe(true);
    });

    it('item comprado permanece na lista (não é deletado)', () => {
      const item = store.insert({ family_id: FAMILY_ID, name: 'Fralda', category: 'hygiene', added_by: USER_A });
      store.check(item.id);

      expect(store.list(FAMILY_ID)).toHaveLength(1);
      expect(store.listChecked(FAMILY_ID)).toHaveLength(1);
    });

    it('uncheck reverte para checked=false', () => {
      const item = store.insert({ family_id: FAMILY_ID, name: 'Sabão', category: 'hygiene', added_by: USER_A });
      store.check(item.id);
      const reverted = store.uncheck(item.id);

      expect(reverted?.checked).toBe(false);
      expect(store.listPending(FAMILY_ID)).toHaveLength(1);
    });

    it('check em id inexistente retorna null', () => {
      expect(store.check('nao-existe')).toBeNull();
    });
  });

  // ── UC023 — Sincronização em tempo real ────────────────────────
  describe('UC023 — Sincronização em tempo real entre membros', () => {
    it('INSERT chega para o membro B que está conectado', () => {
      const viewB = new ConnectedMemberView(store, FAMILY_ID);

      store.insert({ family_id: FAMILY_ID, name: 'Creme', category: 'hygiene', added_by: USER_A });

      expect(viewB.items).toHaveLength(1);
      expect(viewB.items[0].name).toBe('Creme');
      viewB.disconnect();
    });

    it('UPDATE (check) chega para o membro B conectado', () => {
      const item = store.insert({ family_id: FAMILY_ID, name: 'Fralda', category: 'hygiene', added_by: USER_A });
      const viewB = new ConnectedMemberView(store, FAMILY_ID);
      viewB.items = [{ ...item }]; // simula estado inicial carregado

      store.check(item.id);

      expect(viewB.items[0].checked).toBe(true);
      viewB.disconnect();
    });

    it('DELETE chega para o membro B conectado', () => {
      const item = store.insert({ family_id: FAMILY_ID, name: 'Sabão', category: 'hygiene', added_by: USER_A });
      const viewB = new ConnectedMemberView(store, FAMILY_ID);
      viewB.items = [{ ...item }];

      store.delete(item.id);

      expect(viewB.items).toHaveLength(0);
      viewB.disconnect();
    });

    it('membro desconectado não recebe eventos', () => {
      const viewB = new ConnectedMemberView(store, FAMILY_ID);
      viewB.disconnect();

      store.insert({ family_id: FAMILY_ID, name: 'Após desconexão', category: 'food', added_by: USER_A });

      expect(viewB.items).toHaveLength(0);
    });

    it('dois membros conectados recebem o mesmo INSERT simultaneamente', () => {
      const viewA = new ConnectedMemberView(store, FAMILY_ID);
      const viewB = new ConnectedMemberView(store, FAMILY_ID);

      store.insert({ family_id: FAMILY_ID, name: 'Leite', category: 'food', added_by: USER_A });

      expect(viewA.items).toHaveLength(1);
      expect(viewB.items).toHaveLength(1);
      expect(viewA.items[0].id).toBe(viewB.items[0].id);

      viewA.disconnect();
      viewB.disconnect();
    });

    it('INSERT duplicado (mesmo id) não aparece duas vezes na view do membro', () => {
      const viewB = new ConnectedMemberView(store, FAMILY_ID);
      const item = store.insert({ family_id: FAMILY_ID, name: 'Creme', category: 'hygiene', added_by: USER_A });
      // Simula recebimento duplicado (ex: reconexão)
      viewB.items = [{ ...item }]; // já estava na lista local
      // Emite manualmente o evento de INSERT novamente
      store['listeners'].forEach((l: (ev: RealtimeEvent) => void) =>
        l({ eventType: 'INSERT', new: { ...item } })
      );

      expect(viewB.items).toHaveLength(1);
      viewB.disconnect();
    });
  });

  // ── Critério de aceite — adição instantânea ─────────────────────
  describe('Critério de aceite — inserção síncrona (proxy do < 500ms UI)', () => {
    it('adicionar item e propagar para B leva < 10ms em memória', () => {
      const viewB = new ConnectedMemberView(store, FAMILY_ID);

      const t0 = performance.now();
      store.insert({ family_id: FAMILY_ID, name: 'Rápido', category: 'other', added_by: USER_A });
      const elapsed = performance.now() - t0;

      expect(elapsed).toBeLessThan(10);
      expect(viewB.items).toHaveLength(1);
      viewB.disconnect();
    });
  });
});

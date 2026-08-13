import { describe, it, expect } from '@jest/globals';

// ─── tipos locais ────────────────────────────────────────────────────────────

interface MockItem {
  id: string;
  name: string;
  checked: boolean;
  category?: string;
  quantity?: number;
  unit?: string;
}

// ─── funções puras replicadas ────────────────────────────────────────────────

function agruparPorCategoria(
  items: MockItem[],
): Record<string, MockItem[]> {
  return items.reduce<Record<string, MockItem[]>>((acc, item) => {
    const cat = item.category ?? 'geral';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});
}

function separar(items: MockItem[]) {
  return {
    pending: items.filter(i => !i.checked),
    checked: items.filter(i => i.checked),
  };
}

function formatarQuantidade(item: {
  name: string;
  quantity?: number;
  unit?: string;
}): string {
  return item.quantity
    ? `${item.name} (${item.quantity}${item.unit ? ' ' + item.unit : ''})`
    : item.name;
}

// ─── fixtures ────────────────────────────────────────────────────────────────

const hortifruti1: MockItem = { id: '1', name: 'Banana', checked: false, category: 'hortifruti' };
const hortifruti2: MockItem = { id: '2', name: 'Maçã', checked: false, category: 'hortifruti' };
const laticinios1: MockItem = { id: '3', name: 'Leite', checked: false, category: 'laticínios', quantity: 2, unit: 'L' };
const laticinios2: MockItem = { id: '4', name: 'Queijo', checked: true, category: 'laticínios' };
const semCategoria: MockItem = { id: '5', name: 'Sal', checked: false };
const comprado: MockItem = { id: '6', name: 'Arroz', checked: true, category: 'grãos', quantity: 3 };

// ─── testes ──────────────────────────────────────────────────────────────────

describe('agruparPorCategoria', () => {
  it('agrupa corretamente 2 categorias distintas', () => {
    const items = [hortifruti1, hortifruti2, laticinios1];
    const result = agruparPorCategoria(items);
    expect(Object.keys(result)).toHaveLength(2);
    expect(result['hortifruti']).toHaveLength(2);
    expect(result['laticínios']).toHaveLength(1);
  });

  it('itens sem categoria vão para "geral"', () => {
    const items = [semCategoria];
    const result = agruparPorCategoria(items);
    expect(result['geral']).toHaveLength(1);
    expect(result['geral'][0].id).toBe('5');
  });

  it('lista vazia retorna objeto vazio', () => {
    expect(agruparPorCategoria([])).toEqual({});
  });

  it('itens da mesma categoria ficam no mesmo grupo', () => {
    const items = [hortifruti1, hortifruti2];
    const result = agruparPorCategoria(items);
    expect(result['hortifruti']).toHaveLength(2);
    expect(result['hortifruti'].map(i => i.id)).toEqual(['1', '2']);
  });
});

describe('separar (pendentes vs comprados)', () => {
  it('lista mista retorna pendentes e comprados corretos', () => {
    const items = [hortifruti1, laticinios2, semCategoria, comprado];
    const { pending, checked } = separar(items);
    expect(pending).toHaveLength(2);
    expect(checked).toHaveLength(2);
    expect(pending.every(i => !i.checked)).toBe(true);
    expect(checked.every(i => i.checked)).toBe(true);
  });

  it('todos pendentes → checked = []', () => {
    const items = [hortifruti1, hortifruti2, semCategoria];
    const { pending, checked } = separar(items);
    expect(pending).toHaveLength(3);
    expect(checked).toHaveLength(0);
  });

  it('todos comprados → pending = []', () => {
    const items = [laticinios2, comprado];
    const { pending, checked } = separar(items);
    expect(pending).toHaveLength(0);
    expect(checked).toHaveLength(2);
  });
});

describe('formatarQuantidade', () => {
  it('sem quantity retorna só o nome', () => {
    expect(formatarQuantidade({ name: 'Sal' })).toBe('Sal');
  });

  it('com quantity e unit retorna "Leite (2 L)"', () => {
    expect(formatarQuantidade({ name: 'Leite', quantity: 2, unit: 'L' })).toBe('Leite (2 L)');
  });

  it('com quantity sem unit retorna "Arroz (3)"', () => {
    expect(formatarQuantidade({ name: 'Arroz', quantity: 3 })).toBe('Arroz (3)');
  });
});

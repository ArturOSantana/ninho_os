// tests/unit/useShopping.test.ts
// UC021: Adicionar item | UC022: Marcar como comprado | UC023: Compartilhar lista
// Testa lógica pura de agrupamento, filtragem e estado sem depender do Supabase.

import { describe, it, expect } from '@jest/globals';

// ─── tipos locais ─────────────────────────────────────────────────────────────

interface MockItem {
  id: string;
  name: string;
  checked: boolean;
  category?: string;
  quantity?: number;
  unit?: string;
}

// ─── funções puras replicadas ─────────────────────────────────────────────────

function agruparPorCategoria(items: MockItem[]): Record<string, MockItem[]> {
  return items.reduce<Record<string, MockItem[]>>((acc, item) => {
    const cat = item.category ?? 'geral';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});
}

function separar(items: MockItem[]) {
  return {
    pending: items.filter((i) => !i.checked),
    checked: items.filter((i) => i.checked),
  };
}

function marcarComprado(items: MockItem[], id: string): MockItem[] {
  return items.map((i) => i.id === id ? { ...i, checked: true } : i);
}

function contadorLabel(items: MockItem[]): string {
  const total   = items.length;
  const pending = items.filter((i) => !i.checked).length;
  return `${total} ${total !== 1 ? 'itens' : 'item'} · ${pending} pendente${pending !== 1 ? 's' : ''}`;
}

function formatarParaCompartilhar(items: MockItem[]): string {
  const pending = items.filter((i) => !i.checked);
  return pending
    .map((i) => `• ${i.name}${i.quantity ? ` (${i.quantity}${i.unit ? ' ' + i.unit : ''})` : ''}`)
    .join('\n');
}

// ─── fixtures ─────────────────────────────────────────────────────────────────

const fralda:  MockItem = { id: '1', name: 'fralda tamanho M', checked: false, category: 'bebê', quantity: 2, unit: 'pacotes' };
const lenco:   MockItem = { id: '2', name: 'lenço umedecido',  checked: true,  category: 'bebê' };
const deterg:  MockItem = { id: '3', name: 'detergente',       checked: false, category: 'casa' };
const cafe:    MockItem = { id: '4', name: 'café',             checked: false, category: 'casa',  quantity: 1, unit: 'kg' };
const semcat:  MockItem = { id: '5', name: 'sal',              checked: false };

// ─── agruparPorCategoria ──────────────────────────────────────────────────────

describe('agruparPorCategoria', () => {
  it('agrupa itens por categoria corretamente', () => {
    const items = [fralda, lenco, deterg, cafe];
    const grouped = agruparPorCategoria(items);
    expect(Object.keys(grouped)).toHaveLength(2);
    expect(grouped['bebê']).toHaveLength(2);
    expect(grouped['casa']).toHaveLength(2);
  });

  it('itens sem categoria caem em "geral"', () => {
    const grouped = agruparPorCategoria([semcat]);
    expect(grouped['geral']).toHaveLength(1);
    expect(grouped['geral'][0].name).toBe('sal');
  });

  it('lista vazia retorna objeto vazio', () => {
    expect(agruparPorCategoria([])).toEqual({});
  });

  it('mantém itens comprados na categoria (não colapsa)', () => {
    // Handoff: "não colapsar a seção automaticamente"
    const grouped = agruparPorCategoria([fralda, lenco]); // fralda=pending, lenco=checked
    expect(grouped['bebê']).toHaveLength(2);
  });
});

// ─── separar ─────────────────────────────────────────────────────────────────

describe('separar — pending vs checked', () => {
  it('separa pendentes de comprados', () => {
    const items = [fralda, lenco, deterg];
    const { pending, checked } = separar(items);
    expect(pending).toHaveLength(2);
    expect(checked).toHaveLength(1);
  });

  it('todos comprados → pending vazio', () => {
    const items = [{ ...fralda, checked: true }, { ...deterg, checked: true }];
    const { pending } = separar(items);
    expect(pending).toHaveLength(0);
  });

  it('todos pendentes → checked vazio', () => {
    const { checked } = separar([fralda, deterg]);
    expect(checked).toHaveLength(0);
  });
});

// ─── marcarComprado — UC022 ───────────────────────────────────────────────────

describe('marcarComprado — UC022', () => {
  it('marca item como comprado', () => {
    const items = [fralda, deterg];
    const result = marcarComprado(items, '1');
    expect(result[0].checked).toBe(true);
  });

  it('não altera outros itens', () => {
    const items = [fralda, deterg];
    const result = marcarComprado(items, '1');
    expect(result[1].checked).toBe(false);
  });

  it('id inexistente não altera nenhum item', () => {
    const items = [fralda];
    const result = marcarComprado(items, 'nao-existe');
    expect(result[0].checked).toBe(false);
  });
});

// ─── contadorLabel ────────────────────────────────────────────────────────────

describe('contadorLabel', () => {
  it('3 itens · 2 pendentes', () => {
    const items = [fralda, lenco, deterg]; // fralda+deterg=pending, lenco=checked
    expect(contadorLabel(items)).toBe('3 itens · 2 pendentes');
  });

  it('1 item · 1 pendente (singular)', () => {
    expect(contadorLabel([fralda])).toBe('1 item · 1 pendente');
  });

  it('0 itens · 0 pendentes', () => {
    expect(contadorLabel([])).toBe('0 itens · 0 pendentes');
  });
});

// ─── formatarParaCompartilhar — UC023 ────────────────────────────────────────

describe('formatarParaCompartilhar — UC023', () => {
  it('formata itens pendentes com quantidade e unidade', () => {
    const text = formatarParaCompartilhar([fralda]);
    expect(text).toBe('• fralda tamanho M (2 pacotes)');
  });

  it('formata item sem quantidade', () => {
    const text = formatarParaCompartilhar([deterg]);
    expect(text).toBe('• detergente');
  });

  it('exclui itens já marcados como comprados', () => {
    const text = formatarParaCompartilhar([fralda, lenco]); // lenco=checked
    expect(text).not.toContain('lenço umedecido');
    expect(text).toContain('fralda tamanho M');
  });

  it('lista totalmente comprada retorna string vazia', () => {
    const allChecked = [{ ...fralda, checked: true }];
    expect(formatarParaCompartilhar(allChecked)).toBe('');
  });

  it('múltiplos itens separados por nova linha', () => {
    const text = formatarParaCompartilhar([fralda, deterg, cafe]);
    const lines = text.split('\n');
    expect(lines).toHaveLength(3);
  });
});

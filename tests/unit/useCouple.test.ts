// tests/unit/useCouple.test.ts
// UC031: Apreciação | UC032: Check-in emocional | UC034: Divisão de gastos
// Testa lógica pura do hook/service sem depender do Supabase.

import { describe, it, expect } from '@jest/globals';
import {
  MoodLevel,
  MOOD_LABELS,
  MOOD_EMOJI,
  ExpenseBalance,
  CoupleCheckin,
  DailyMoodSummary,
  CoupleAppreciation,
  CoupleExpense,
  ExpenseSplitMode,
  EXPENSE_SPLIT_LABELS,
  EXPENSE_CATEGORY_LABELS,
} from '@/types/couple.types';

// ─── Funções puras replicadas do coupleService / useCouple ───────────────────

/** Insere nova apreciação na lista (estado otimista) */
function adicionarApreciacao(
  lista: CoupleAppreciation[],
  nova: CoupleAppreciation,
): CoupleAppreciation[] {
  return [nova, ...lista];
}

/** Faz upsert do check-in no array local (mesma lógica do useCouple.upsertCheckin) */
function upsertCheckin(
  lista: CoupleCheckin[],
  checkin: CoupleCheckin,
): CoupleCheckin[] {
  const idx = lista.findIndex(
    (c) => c.member_id === checkin.member_id && c.checked_at === checkin.checked_at,
  );
  if (idx >= 0) {
    const next = [...lista];
    next[idx] = checkin;
    return next;
  }
  return [checkin, ...lista];
}

/** Constrói DailyMoodSummary a partir de lista de check-ins */
function buildDailySummary(
  checkins: CoupleCheckin[],
  memberAId: string,
  memberBId: string,
  date: string,
): DailyMoodSummary {
  const forDate = checkins.filter((c) => c.checked_at === date);
  return {
    date,
    member_a: forDate.find((c) => c.member_id === memberAId),
    member_b: forDate.find((c) => c.member_id === memberBId),
  };
}

/** Calcula balanço entre dois membros a partir de lista de despesas não quitadas */
function calcularBalanco(
  expenses: CoupleExpense[],
  memberAId: string,
  memberBId: string,
): ExpenseBalance {
  const unsettled = expenses.filter((e) => !e.settled);

  let memberAPaid  = 0, memberBPaid  = 0;
  let memberAShare = 0, memberBShare = 0;

  for (const exp of unsettled) {
    const amount = exp.amount_cents;
    if (exp.paid_by === memberAId) memberAPaid += amount;
    else if (exp.paid_by === memberBId) memberBPaid += amount;

    if (exp.split_mode === 'equal') {
      memberAShare += Math.round(amount / 2);
      memberBShare += amount - Math.round(amount / 2);
    } else if (exp.split_mode === 'one_pays') {
      if (exp.paid_by === memberAId) memberAShare += amount;
      else memberBShare += amount;
    } else if (exp.split_mode === 'custom') {
      const pct         = exp.paid_by_pct ?? 50;
      const payerShare  = Math.round(amount * (pct / 100));
      const otherShare  = amount - payerShare;
      if (exp.paid_by === memberAId) {
        memberAShare += payerShare;
        memberBShare += otherShare;
      } else {
        memberBShare += payerShare;
        memberAShare += otherShare;
      }
    }
  }

  const memberAOwes = memberAShare - memberAPaid;
  const memberBOwes = memberBShare - memberBPaid;
  const total       = memberAPaid + memberBPaid;

  return {
    total_cents:         total,
    member_a_paid_cents: memberAPaid,
    member_b_paid_cents: memberBPaid,
    member_a_owes_cents: memberAOwes,
    member_b_owes_cents: memberBOwes,
    is_balanced:         Math.abs(memberAOwes) < 100,
  };
}

/** Remove despesa da lista local */
function removerDespesa(lista: CoupleExpense[], id: string): CoupleExpense[] {
  return lista.filter((e) => e.id !== id);
}

/** Quita despesa (settled = true) */
function quitarDespesa(lista: CoupleExpense[], id: string): CoupleExpense[] {
  return lista.map((e) => (e.id === id ? { ...e, settled: true } : e));
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MEMBER_A = 'profile-001';
const MEMBER_B = 'profile-002';
const FAMILY   = 'family-001';
const TODAY    = '2025-07-01';

function makeExpense(overrides: Partial<CoupleExpense> = {}): CoupleExpense {
  return {
    id:           'exp-001',
    family_id:    FAMILY,
    title:        'mercado',
    amount_cents: 10000,   // R$ 100,00
    category:     'food',
    paid_by:      MEMBER_A,
    split_mode:   'equal',
    settled:      false,
    expense_date: TODAY,
    created_at:   new Date().toISOString(),
    ...overrides,
  };
}

function makeCheckin(memberId: string, mood: MoodLevel, date = TODAY): CoupleCheckin {
  return {
    id:         `checkin-${memberId}-${date}`,
    family_id:  FAMILY,
    member_id:  memberId,
    mood,
    checked_at: date,
    created_at: new Date().toISOString(),
  };
}

function makeAppreciation(from: string, to: string): CoupleAppreciation {
  return {
    id:         'apr-001',
    family_id:  FAMILY,
    from_member: from,
    to_member:  to,
    message:    'Obrigado por tudo hoje!',
    created_at: new Date().toISOString(),
  };
}

// ─── UC031 — Apreciações ──────────────────────────────────────────────────────

describe('adicionarApreciacao — UC031', () => {
  it('insere nova apreciação no início da lista', () => {
    const existente = makeAppreciation(MEMBER_B, MEMBER_A);
    const nova      = makeAppreciation(MEMBER_A, MEMBER_B);
    const resultado = adicionarApreciacao([existente], nova);
    expect(resultado[0].id).toBe(nova.id);
    expect(resultado).toHaveLength(2);
  });

  it('lista vazia → retorna lista com apenas a nova', () => {
    const nova = makeAppreciation(MEMBER_A, MEMBER_B);
    expect(adicionarApreciacao([], nova)).toHaveLength(1);
  });
});

// ─── UC032 — Check-in emocional ───────────────────────────────────────────────

describe('upsertCheckin — UC032', () => {
  it('insere novo check-in quando não existe', () => {
    const novo = makeCheckin(MEMBER_A, 'good');
    const resultado = upsertCheckin([], novo);
    expect(resultado).toHaveLength(1);
    expect(resultado[0].mood).toBe('good');
  });

  it('atualiza check-in existente (mesmo membro + data)', () => {
    const inicial = makeCheckin(MEMBER_A, 'bad');
    const atualizado = { ...makeCheckin(MEMBER_A, 'great'), id: inicial.id };
    const resultado = upsertCheckin([inicial], atualizado);
    expect(resultado).toHaveLength(1);
    expect(resultado[0].mood).toBe('great');
  });

  it('não afeta check-in de outro membro', () => {
    const a = makeCheckin(MEMBER_A, 'ok');
    const b = makeCheckin(MEMBER_B, 'good');
    const atualizado = { ...makeCheckin(MEMBER_A, 'great'), id: a.id };
    const resultado = upsertCheckin([a, b], atualizado);
    expect(resultado.find((c) => c.member_id === MEMBER_B)?.mood).toBe('good');
  });
});

describe('buildDailySummary — UC032', () => {
  it('constrói summary correto para o dia', () => {
    const checkins = [makeCheckin(MEMBER_A, 'great'), makeCheckin(MEMBER_B, 'ok')];
    const s = buildDailySummary(checkins, MEMBER_A, MEMBER_B, TODAY);
    expect(s.member_a?.mood).toBe('great');
    expect(s.member_b?.mood).toBe('ok');
  });

  it('member_a undefined quando não fez check-in hoje', () => {
    const checkins = [makeCheckin(MEMBER_B, 'good')];
    const s = buildDailySummary(checkins, MEMBER_A, MEMBER_B, TODAY);
    expect(s.member_a).toBeUndefined();
    expect(s.member_b?.mood).toBe('good');
  });

  it('ambos undefined quando nenhum fez check-in', () => {
    const s = buildDailySummary([], MEMBER_A, MEMBER_B, TODAY);
    expect(s.member_a).toBeUndefined();
    expect(s.member_b).toBeUndefined();
  });
});

// ─── UC034 — Divisão de gastos ────────────────────────────────────────────────

describe('calcularBalanco — UC034', () => {
  it('divisão igual: cada um deve metade', () => {
    const expenses = [makeExpense()]; // R$ 100, pago por A, equal
    const b = calcularBalanco(expenses, MEMBER_A, MEMBER_B);
    // A pagou 100, share de A = 50 → A deve receber 50 (owes = -50)
    // B pagou 0, share de B = 50 → B deve 50
    expect(b.member_a_paid_cents).toBe(10000);
    expect(b.member_b_paid_cents).toBe(0);
    expect(b.member_b_owes_cents).toBe(5000); // B deve R$ 50
    expect(b.member_a_owes_cents).toBe(-5000); // A deve receber R$ 50
    expect(b.is_balanced).toBe(false);
  });

  it('one_pays: quem pagou arca com tudo', () => {
    const exp = makeExpense({ split_mode: 'one_pays' });
    const b = calcularBalanco([exp], MEMBER_A, MEMBER_B);
    expect(b.member_b_owes_cents).toBe(0);
    expect(b.member_a_owes_cents).toBe(0);
    expect(b.is_balanced).toBe(true);
  });

  it('custom 70%: quem pagou assume 70% da despesa', () => {
    const exp = makeExpense({ split_mode: 'custom', paid_by_pct: 70 }); // A paga 70% dos 100
    const b = calcularBalanco([exp], MEMBER_A, MEMBER_B);
    // A paid 100, A share = 70 → A owes = 70 - 100 = -30 (recebe R$30)
    // B paid 0,  B share = 30 → B owes = 30
    expect(b.member_b_owes_cents).toBe(3000);
    expect(b.member_a_owes_cents).toBe(-3000);
  });

  it('despesas quitadas não entram no balanço', () => {
    const quitada = makeExpense({ settled: true });
    const b = calcularBalanco([quitada], MEMBER_A, MEMBER_B);
    expect(b.total_cents).toBe(0);
    expect(b.is_balanced).toBe(true);
  });

  it('balanço zerado quando nenhuma despesa', () => {
    const b = calcularBalanco([], MEMBER_A, MEMBER_B);
    expect(b.total_cents).toBe(0);
    expect(b.is_balanced).toBe(true);
  });

  it('is_balanced = true quando diferença < R$ 1,00 (< 100 centavos)', () => {
    // A paga R$ 10,00 (1000 cents), divisão igual → A owes -500, B owes 500
    // Não está equilibrado. Testar caso onde está:
    const exp = makeExpense({ amount_cents: 99, paid_by: MEMBER_A, split_mode: 'equal' });
    const b = calcularBalanco([exp], MEMBER_A, MEMBER_B);
    // A paid 99, A share ≈ 50 → owes -49; diff = 49 < 100 → balanced
    expect(b.is_balanced).toBe(true);
  });
});

describe('removerDespesa + quitarDespesa', () => {
  it('removerDespesa filtra o item correto', () => {
    const lista = [makeExpense({ id: 'e1' }), makeExpense({ id: 'e2' })];
    expect(removerDespesa(lista, 'e1')).toHaveLength(1);
    expect(removerDespesa(lista, 'e1')[0].id).toBe('e2');
  });

  it('quitarDespesa marca settled = true apenas no item alvo', () => {
    const lista = [makeExpense({ id: 'e1' }), makeExpense({ id: 'e2' })];
    const result = quitarDespesa(lista, 'e1');
    expect(result.find((e) => e.id === 'e1')?.settled).toBe(true);
    expect(result.find((e) => e.id === 'e2')?.settled).toBe(false);
  });
});

// ─── Constants — sanity check ─────────────────────────────────────────────────

describe('constants — MoodLevel + labels', () => {
  it('todos os 5 níveis de humor têm label e emoji', () => {
    const levels: MoodLevel[] = ['terrible', 'bad', 'ok', 'good', 'great'];
    for (const lvl of levels) {
      expect(MOOD_LABELS[lvl]).toBeTruthy();
      expect(MOOD_EMOJI[lvl]).toBeTruthy();
    }
  });

  it('todos os modos de split têm label', () => {
    const modes: ExpenseSplitMode[] = ['equal', 'custom', 'one_pays'];
    for (const mode of modes) {
      expect(EXPENSE_SPLIT_LABELS[mode]).toBeTruthy();
    }
  });

  it('categorias de despesa têm labels', () => {
    expect(EXPENSE_CATEGORY_LABELS['food']).toBe('Alimentação');
    expect(EXPENSE_CATEGORY_LABELS['other']).toBe('Outros');
  });
});

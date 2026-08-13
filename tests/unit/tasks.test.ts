import { describe, it, expect } from '@jest/globals';

// ─── tipos locais ────────────────────────────────────────────────────────────

interface MockTask {
  id: string;
  title: string;
  status: 'pending' | 'done';
  priority: 'high' | 'medium' | 'low';
}

// ─── funções puras replicadas ────────────────────────────────────────────────

function filtrarTarefas(
  tasks: MockTask[],
  tab: 'all' | 'pending' | 'done',
): MockTask[] {
  return tab === 'all' ? tasks : tasks.filter(t => t.status === tab);
}

function contadorTarefas(tasks: MockTask[]) {
  const pending = tasks.filter(t => t.status === 'pending').length;
  const total = tasks.length;
  const allDone = total > 0 && pending === 0;
  return {
    pending,
    total,
    allDone,
    label: allDone
      ? `${total} de ${total} · tudo em dia`
      : `${total - pending} de ${total} hoje`,
  };
}

const PRIO_ORDER: Record<MockTask['priority'], number> = {
  high: 3,
  medium: 2,
  low: 1,
};

function ordenarPorPrioridade(tasks: MockTask[]): MockTask[] {
  return [...tasks].sort(
    (a, b) => (PRIO_ORDER[b.priority] ?? 0) - (PRIO_ORDER[a.priority] ?? 0),
  );
}

// ─── fixtures ────────────────────────────────────────────────────────────────

const pending1: MockTask = { id: '1', title: 'Comprar leite', status: 'pending', priority: 'high' };
const pending2: MockTask = { id: '2', title: 'Lavar roupa', status: 'pending', priority: 'medium' };
const pending3: MockTask = { id: '3', title: 'Pagar conta', status: 'pending', priority: 'low' };
const done1: MockTask = { id: '4', title: 'Fazer cama', status: 'done', priority: 'low' };
const done2: MockTask = { id: '5', title: 'Varrer sala', status: 'done', priority: 'medium' };

// ─── testes ──────────────────────────────────────────────────────────────────

describe('filtrarTarefas', () => {
  it('tab "all" retorna todas as tarefas', () => {
    const tasks = [pending1, pending2, done1];
    expect(filtrarTarefas(tasks, 'all')).toHaveLength(3);
  });

  it('tab "pending" retorna apenas pendentes', () => {
    const tasks = [pending1, pending2, done1, done2];
    const result = filtrarTarefas(tasks, 'pending');
    expect(result).toHaveLength(2);
    expect(result.every(t => t.status === 'pending')).toBe(true);
  });

  it('tab "done" retorna apenas concluídas', () => {
    const tasks = [pending1, done1, done2];
    const result = filtrarTarefas(tasks, 'done');
    expect(result).toHaveLength(2);
    expect(result.every(t => t.status === 'done')).toBe(true);
  });

  it('lista vazia retorna []', () => {
    expect(filtrarTarefas([], 'all')).toEqual([]);
    expect(filtrarTarefas([], 'pending')).toEqual([]);
    expect(filtrarTarefas([], 'done')).toEqual([]);
  });

  it('tarefa "done" é filtrada fora de "pending" e incluída em "done"', () => {
    const tasks = [done1];
    expect(filtrarTarefas(tasks, 'pending')).toHaveLength(0);
    expect(filtrarTarefas(tasks, 'done')).toHaveLength(1);
  });
});

describe('contadorTarefas', () => {
  it('3 pendentes e 2 concluídas → label "2 de 5 hoje"', () => {
    const tasks = [pending1, pending2, pending3, done1, done2];
    const result = contadorTarefas(tasks);
    expect(result.pending).toBe(3);
    expect(result.total).toBe(5);
    expect(result.allDone).toBe(false);
    expect(result.label).toBe('2 de 5 hoje');
  });

  it('todas concluídas → allDone = true, label "3 de 3 · tudo em dia"', () => {
    const doneTasks: MockTask[] = [
      { id: 'a', title: 'A', status: 'done', priority: 'low' },
      { id: 'b', title: 'B', status: 'done', priority: 'medium' },
      { id: 'c', title: 'C', status: 'done', priority: 'high' },
    ];
    const result = contadorTarefas(doneTasks);
    expect(result.allDone).toBe(true);
    expect(result.label).toBe('3 de 3 · tudo em dia');
  });

  it('lista vazia → allDone = false (total 0 não conta como tudo em dia)', () => {
    const result = contadorTarefas([]);
    expect(result.allDone).toBe(false);
    expect(result.total).toBe(0);
  });
});

describe('ordenarPorPrioridade', () => {
  it('coloca "high" na frente de "medium" e "low"', () => {
    const tasks = [pending3, pending2, pending1]; // low, medium, high
    const result = ordenarPorPrioridade(tasks);
    expect(result[0].priority).toBe('high');
    expect(result[1].priority).toBe('medium');
    expect(result[2].priority).toBe('low');
  });

  it('tarefa de alta prioridade aparece antes de média na ordenação', () => {
    const tasks = [pending2, pending1]; // medium, high
    const result = ordenarPorPrioridade(tasks);
    expect(result[0].id).toBe(pending1.id); // high
    expect(result[1].id).toBe(pending2.id); // medium
  });

  it('mantém ordem relativa entre tarefas de mesma prioridade', () => {
    const t1: MockTask = { id: 'x1', title: 'X1', status: 'pending', priority: 'medium' };
    const t2: MockTask = { id: 'x2', title: 'X2', status: 'pending', priority: 'medium' };
    const result = ordenarPorPrioridade([t1, t2]);
    // ambas são medium — ordem entre elas deve ser estável (sort estável no V8)
    expect(result.map(t => t.id)).toEqual(['x1', 'x2']);
  });

  it('lista de 1 item retorna o mesmo item sem modificação', () => {
    const result = ordenarPorPrioridade([pending1]);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(pending1);
  });

  it('não muta o array original', () => {
    const tasks = [pending3, pending1, pending2];
    const original = [...tasks];
    ordenarPorPrioridade(tasks);
    expect(tasks.map(t => t.id)).toEqual(original.map(t => t.id));
  });
});

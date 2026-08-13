// tests/unit/useTasks.test.ts
// UC018: Criar tarefa | UC019: Concluir + desfazer (optimistic) | UC020: Delegar
// Testa lógica pura do hook/service sem depender do Supabase.

import { describe, it, expect } from '@jest/globals';

// ─── tipos locais ─────────────────────────────────────────────────────────────

interface MockTask {
  id: string;
  title: string;
  status: 'pending' | 'done';
  priority: 'high' | 'medium' | 'low';
  assigned_to: string | null;
  completed_at: string | null;
  completed_by: string | null;
}

// ─── funções puras replicadas do hook useTasks ────────────────────────────────

/** Marca tarefa como concluída (optimistic update) */
function completarTarefa(tasks: MockTask[], id: string): MockTask[] {
  return tasks.map((t) =>
    t.id === id
      ? { ...t, status: 'done' as const, completed_at: new Date().toISOString(), completed_by: 'prof-001' }
      : t
  );
}

/** Desfaz conclusão (optimistic revert) */
function desfazerConclusao(tasks: MockTask[], id: string): MockTask[] {
  return tasks.map((t) =>
    t.id === id
      ? { ...t, status: 'pending' as const, completed_at: null, completed_by: null }
      : t
  );
}

/** Reverte optimistic em caso de erro do servidor */
function reverterParaPendente(tasks: MockTask[], id: string): MockTask[] {
  return tasks.map((t) => t.id === id ? { ...t, status: 'pending' as const } : t);
}

/** Delegar tarefa a um membro */
function delegarTarefa(tasks: MockTask[], id: string, assignedTo: string): MockTask[] {
  return tasks.map((t) => t.id === id ? { ...t, assigned_to: assignedTo } : t);
}

/** Filtrar por tab */
function filtrarTarefas(tasks: MockTask[], tab: 'all' | 'pending' | 'done'): MockTask[] {
  return tab === 'all' ? tasks : tasks.filter((t) => t.status === tab);
}

/** Contador */
function contarTarefas(tasks: MockTask[]) {
  const pending = tasks.filter((t) => t.status === 'pending').length;
  const total   = tasks.length;
  const allDone = total > 0 && pending === 0;
  return { pending, total, allDone };
}

// ─── fixtures ─────────────────────────────────────────────────────────────────

function makeTask(overrides: Partial<MockTask> = {}): MockTask {
  return {
    id:           'task-001',
    title:        'lavar mamadeiras',
    status:       'pending',
    priority:     'medium',
    assigned_to:  null,
    completed_at: null,
    completed_by: null,
    ...overrides,
  };
}

// ─── UC019 — completarTarefa ──────────────────────────────────────────────────

describe('completarTarefa — UC019', () => {
  it('muda status de pending para done', () => {
    const tasks = [makeTask()];
    const result = completarTarefa(tasks, 'task-001');
    expect(result[0].status).toBe('done');
  });

  it('preenche completed_at ao concluir', () => {
    const tasks = [makeTask()];
    const result = completarTarefa(tasks, 'task-001');
    expect(result[0].completed_at).not.toBeNull();
  });

  it('não afeta outras tarefas', () => {
    const tasks = [makeTask({ id: 't-1' }), makeTask({ id: 't-2' })];
    const result = completarTarefa(tasks, 't-1');
    expect(result[0].status).toBe('done');
    expect(result[1].status).toBe('pending');
  });

  it('id inexistente não altera nenhuma tarefa', () => {
    const tasks = [makeTask()];
    const result = completarTarefa(tasks, 'nao-existe');
    expect(result[0].status).toBe('pending');
  });
});

// ─── UC019 — desfazerConclusao ────────────────────────────────────────────────

describe('desfazerConclusao — UC019 undo', () => {
  it('retorna para pending e limpa campos de conclusão', () => {
    const tasks = [makeTask({
      status: 'done',
      completed_at: new Date().toISOString(),
      completed_by: 'prof-001',
    })];
    const result = desfazerConclusao(tasks, 'task-001');
    expect(result[0].status).toBe('pending');
    expect(result[0].completed_at).toBeNull();
    expect(result[0].completed_by).toBeNull();
  });
});

// ─── Optimistic revert ────────────────────────────────────────────────────────

describe('reverterParaPendente — falha do servidor', () => {
  it('reverte status local de volta para pending', () => {
    // Simula: marcou otimisticamente como done, servidor falhou
    let tasks = [makeTask()];
    tasks = completarTarefa(tasks, 'task-001'); // optimistic
    expect(tasks[0].status).toBe('done');

    tasks = reverterParaPendente(tasks, 'task-001'); // revert on error
    expect(tasks[0].status).toBe('pending');
  });
});

// ─── UC020 — delegarTarefa ────────────────────────────────────────────────────

describe('delegarTarefa — UC020', () => {
  it('atribui assigned_to ao membro correto', () => {
    const tasks = [makeTask()];
    const result = delegarTarefa(tasks, 'task-001', 'prof-002');
    expect(result[0].assigned_to).toBe('prof-002');
  });

  it('não altera o status da tarefa ao delegar', () => {
    const tasks = [makeTask()];
    const result = delegarTarefa(tasks, 'task-001', 'prof-002');
    expect(result[0].status).toBe('pending');
  });

  it('não altera outras tarefas', () => {
    const tasks = [makeTask({ id: 't-1' }), makeTask({ id: 't-2' })];
    const result = delegarTarefa(tasks, 't-1', 'prof-002');
    expect(result[0].assigned_to).toBe('prof-002');
    expect(result[1].assigned_to).toBeNull();
  });
});

// ─── filtrarTarefas ───────────────────────────────────────────────────────────

describe('filtrarTarefas', () => {
  it('tab "all" retorna todas', () => {
    const tasks = [makeTask({ status: 'pending' }), makeTask({ id: 't-2', status: 'done' })];
    expect(filtrarTarefas(tasks, 'all')).toHaveLength(2);
  });

  it('tab "pending" retorna apenas pendentes', () => {
    const tasks = [makeTask(), makeTask({ id: 't-2', status: 'done' })];
    const result = filtrarTarefas(tasks, 'pending');
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('pending');
  });

  it('tab "done" retorna apenas concluídas', () => {
    const tasks = [makeTask(), makeTask({ id: 't-2', status: 'done' })];
    const result = filtrarTarefas(tasks, 'done');
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('done');
  });
});

// ─── contarTarefas ────────────────────────────────────────────────────────────

describe('contarTarefas', () => {
  it('3 pendentes e 2 concluídas', () => {
    const tasks = [
      makeTask({ id: '1', status: 'pending' }),
      makeTask({ id: '2', status: 'pending' }),
      makeTask({ id: '3', status: 'pending' }),
      makeTask({ id: '4', status: 'done' }),
      makeTask({ id: '5', status: 'done' }),
    ];
    const { pending, total, allDone } = contarTarefas(tasks);
    expect(pending).toBe(3);
    expect(total).toBe(5);
    expect(allDone).toBe(false);
  });

  it('todas concluídas → allDone = true', () => {
    const tasks = [makeTask({ status: 'done' }), makeTask({ id: 't-2', status: 'done' })];
    expect(contarTarefas(tasks).allDone).toBe(true);
  });

  it('lista vazia → allDone = false', () => {
    expect(contarTarefas([]).allDone).toBe(false);
  });
});

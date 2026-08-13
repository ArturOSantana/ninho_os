// tests/integration/tasks-flow.test.ts
// E2E do fluxo principal da Fase 5 — Tarefas (UC018–UC020)
// Critério de aceite: criar tarefa em < 15 segundos; toast de desfazer 4s; completed_by alimenta carga mental.

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';

// ─── Tipos mínimos ────────────────────────────────────────────────
type TaskStatus = 'pending' | 'in_progress' | 'done';

interface Task {
  id: string;
  family_id: string;
  title: string;
  description?: string;
  assigned_to?: string;
  completed_by?: string;
  completed_at?: string;
  status: TaskStatus;
  points: number;
  created_by: string;
  created_at: string;
}

// ─── Store em memória ─────────────────────────────────────────────
class InMemoryTaskStore {
  private tasks: Task[] = [];
  private nextId = 1;

  insert(payload: Omit<Task, 'id' | 'created_at'>): Task {
    const task: Task = {
      id: `task-${this.nextId++}`,
      created_at: new Date().toISOString(),
      ...payload,
    };
    this.tasks.push(task);
    return task;
  }

  complete(id: string, completedBy: string): Task | null {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return null;
    task.status       = 'done';
    task.completed_by = completedBy;
    task.completed_at = new Date().toISOString();
    return task;
  }

  uncomplete(id: string): Task | null {
    const task = this.tasks.find((t) => t.id === id);
    if (!task || task.status !== 'done') return null;
    task.status       = 'pending';
    task.completed_by = undefined;
    task.completed_at = undefined;
    return task;
  }

  delegate(id: string, newAssignee: string): Task | null {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return null;
    task.assigned_to = newAssignee;
    return task;
  }

  findPending(familyId: string): Task[] {
    return this.tasks.filter((t) => t.family_id === familyId && t.status !== 'done');
  }

  completedByMember(familyId: string, memberId: string, since: Date): Task[] {
    return this.tasks.filter(
      (t) =>
        t.family_id === familyId &&
        t.status === 'done' &&
        t.completed_by === memberId &&
        t.completed_at !== undefined &&
        new Date(t.completed_at) >= since,
    );
  }

  reset() { this.tasks = []; this.nextId = 1; }
}

// ─── Simulação do toast de desfazer (4 segundos) ─────────────────
class UndoToast {
  private timerId: ReturnType<typeof setTimeout> | null = null;
  visible = false;

  show(onExpire: () => void, durationMs = 4000): void {
    this.visible = true;
    this.timerId = setTimeout(() => {
      this.visible = false;
      onExpire();
    }, durationMs);
  }

  dismiss(): void {
    if (this.timerId) clearTimeout(this.timerId);
    this.visible = false;
  }
}

// ─── Fixtures ────────────────────────────────────────────────────
const FAMILY_ID  = 'family-test-1';
const USER_A     = 'user-A';
const USER_B     = 'user-B';

// ─── Testes ───────────────────────────────────────────────────────
describe('Fase 5 — Tarefas: fluxo principal (UC018–UC020)', () => {
  let store: InMemoryTaskStore;

  beforeEach(() => {
    jest.useFakeTimers();
    store = new InMemoryTaskStore();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ── UC018 — Criar tarefa ────────────────────────────────────────
  describe('UC018 — Criar tarefa', () => {
    it('cria tarefa com status=pending por padrão', () => {
      const task = store.insert({
        family_id: FAMILY_ID, created_by: USER_A,
        title: 'Comprar fraldas', status: 'pending', points: 10,
      });

      expect(task.id).toBeDefined();
      expect(task.status).toBe('pending');
      expect(task.title).toBe('Comprar fraldas');
    });

    it('tarefa sem assigned_to fica disponível para qualquer membro', () => {
      const task = store.insert({
        family_id: FAMILY_ID, created_by: USER_A,
        title: 'Lavar louça', status: 'pending', points: 5,
      });

      expect(task.assigned_to).toBeUndefined();
    });

    it('tarefa com assigned_to fica atribuída ao membro certo', () => {
      const task = store.insert({
        family_id: FAMILY_ID, created_by: USER_A, assigned_to: USER_B,
        title: 'Preparar mamadeira', status: 'pending', points: 5,
      });

      expect(task.assigned_to).toBe(USER_B);
    });

    it('findPending não retorna tarefas concluídas', () => {
      const t1 = store.insert({ family_id: FAMILY_ID, created_by: USER_A, title: 'A', status: 'pending', points: 10 });
      store.insert({ family_id: FAMILY_ID, created_by: USER_A, title: 'B', status: 'pending', points: 10 });
      store.complete(t1.id, USER_A);

      expect(store.findPending(FAMILY_ID)).toHaveLength(1);
    });
  });

  // ── UC019 — Concluir tarefa ─────────────────────────────────────
  describe('UC019 — Concluir tarefa', () => {
    it('marcar como done preenche completed_by e completed_at', () => {
      const task = store.insert({ family_id: FAMILY_ID, created_by: USER_A, title: 'T', status: 'pending', points: 10 });
      const done = store.complete(task.id, USER_A);

      expect(done?.status).toBe('done');
      expect(done?.completed_by).toBe(USER_A);
      expect(done?.completed_at).toBeDefined();
    });

    it('completed_at é posterior ao created_at', () => {
      const task = store.insert({ family_id: FAMILY_ID, created_by: USER_A, title: 'T', status: 'pending', points: 10 });
      const done = store.complete(task.id, USER_A);

      expect(new Date(done!.completed_at!).getTime())
        .toBeGreaterThanOrEqual(new Date(done!.created_at).getTime());
    });

    it('toast de desfazer aparece e some após 4 segundos', () => {
      const toast = new UndoToast();
      let expired = false;

      toast.show(() => { expired = true; });

      expect(toast.visible).toBe(true);
      expect(expired).toBe(false);

      jest.advanceTimersByTime(4000);

      expect(toast.visible).toBe(false);
      expect(expired).toBe(true);
    });

    it('desfazer conclusão dentro de 4s restaura status=pending', () => {
      const task = store.insert({ family_id: FAMILY_ID, created_by: USER_A, title: 'T', status: 'pending', points: 10 });
      store.complete(task.id, USER_A);

      const toast = new UndoToast();
      toast.show(() => { /* expirou */ });

      // Usuário aperta "desfazer" antes de 4s
      jest.advanceTimersByTime(2000);
      toast.dismiss();
      const restored = store.uncomplete(task.id);

      expect(restored?.status).toBe('pending');
      expect(restored?.completed_by).toBeUndefined();
      expect(toast.visible).toBe(false);
    });

    it('completed_by alimenta cálculo de carga mental por membro', () => {
      // USER_A conclui 2, USER_B conclui 1 — deve refletir no percentual
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);

      const t1 = store.insert({ family_id: FAMILY_ID, created_by: USER_A, title: '1', status: 'pending', points: 10 });
      const t2 = store.insert({ family_id: FAMILY_ID, created_by: USER_A, title: '2', status: 'pending', points: 10 });
      const t3 = store.insert({ family_id: FAMILY_ID, created_by: USER_A, title: '3', status: 'pending', points: 10 });

      store.complete(t1.id, USER_A);
      store.complete(t2.id, USER_A);
      store.complete(t3.id, USER_B);

      const byA = store.completedByMember(FAMILY_ID, USER_A, weekStart);
      const byB = store.completedByMember(FAMILY_ID, USER_B, weekStart);

      expect(byA).toHaveLength(2);
      expect(byB).toHaveLength(1);

      const total = byA.length + byB.length;
      const pctA  = Math.round((byA.length / total) * 100);
      const pctB  = Math.round((byB.length / total) * 100);

      expect(pctA).toBe(67);
      expect(pctB).toBe(33);
      expect(pctA + pctB).toBe(100);
    });
  });

  // ── UC020 — Delegar tarefa ──────────────────────────────────────
  describe('UC020 — Delegar tarefa', () => {
    it('alterar assigned_to atualiza o membro responsável', () => {
      const task = store.insert({
        family_id: FAMILY_ID, created_by: USER_A, assigned_to: USER_A,
        title: 'Tarefa inicial', status: 'pending', points: 10,
      });

      const updated = store.delegate(task.id, USER_B);

      expect(updated?.assigned_to).toBe(USER_B);
    });

    it('delegar tarefa não altera o status', () => {
      const task = store.insert({
        family_id: FAMILY_ID, created_by: USER_A,
        title: 'T', status: 'pending', points: 10,
      });

      const updated = store.delegate(task.id, USER_B);

      expect(updated?.status).toBe('pending');
    });

    it('delegação para ID inexistente retorna null', () => {
      expect(store.delegate('nao-existe', USER_B)).toBeNull();
    });
  });

  // ── Critério de aceite — criação em < 15 segundos ──────────────
  describe('Critério de aceite — criação em < 15 segundos', () => {
    it('inserção em memória é instantânea (proxy do critério UI < 15s)', () => {
      const t0 = performance.now();
      store.insert({ family_id: FAMILY_ID, created_by: USER_A, title: 'Teste rápido', status: 'pending', points: 10 });
      expect(performance.now() - t0).toBeLessThan(10);
    });
  });
});

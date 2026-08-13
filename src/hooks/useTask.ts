// src/hooks/useTask.ts
// Alias de compatibilidade — o hook canônico é useTasks.ts.
// Migrado para usar tasksService (taskService.ts foi removido).

import { useState, useCallback, useEffect } from 'react';
import { tasksService as taskService } from '@/services/tasks/tasksService';
import { Task, CreateTaskInput } from '@/types/productivity.types';
import { UUID } from '@/types';

/**
 * Hook para gerenciar tarefas da família
 * UC018: Criar | UC019: Concluir | UC020: Delegar
 */
export function useTask(familyId: UUID | null | undefined) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!familyId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await taskService.listTasks(familyId);
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar tarefas');
    } finally {
      setLoading(false);
    }
  }, [familyId]);

  useEffect(() => {
    load();
  }, [load]);

  const createTask = useCallback(async (input: CreateTaskInput) => {
    if (!familyId) throw new Error('Família não encontrada');
    try {
      setError(null);
      const task = await taskService.createTask(familyId, input);
      setTasks((prev) => [task, ...prev]);
      return task;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar tarefa';
      setError(msg);
      throw err;
    }
  }, [familyId]);

  const toggleTask = useCallback(async (id: UUID) => {
    try {
      setError(null);
      const updated = await taskService.completeTask(id);
      setTasks((prev) => prev.map((t) => t.id === id ? updated : t));
      return updated;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar tarefa';
      setError(msg);
      throw err;
    }
  }, []);

  const delegateTask = useCallback(async (id: UUID, assignedTo: UUID) => {
    try {
      setError(null);
      const updated = await taskService.delegateTask(id, assignedTo);
      setTasks((prev) => prev.map((t) => t.id === id ? updated : t));
      return updated;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao delegar tarefa';
      setError(msg);
      throw err;
    }
  }, []);

  const deleteTask = useCallback(async (id: UUID) => {
    try {
      setError(null);
      await taskService.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir tarefa';
      setError(msg);
      throw err;
    }
  }, []);

  const pendingCount = tasks.filter((t) => t.status !== 'done').length;
  const doneCount    = tasks.filter((t) => t.status === 'done').length;

  return { tasks, loading, error, load, createTask, toggleTask, delegateTask, deleteTask, pendingCount, doneCount };
}

// src/hooks/useTasks.ts

import { useState, useCallback, useEffect, useRef } from 'react';
import { tasksService } from '@/services/tasks/tasksService';
import { supabase } from '@/lib/supabase';
import { Task, CreateTaskInput, UpdateTaskInput, TaskFilters } from '@/types';

interface TasksState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook para gerenciar tarefas familiares
 * UC018: Criar tarefa | UC019: Concluir | UC020: Delegar
 * Realtime: subscription em tasks WHERE family_id = familyId
 */
export const useTasks = (familyId: string) => {
  const [state, setState] = useState<TasksState>({
    tasks: [],
    loading: false,
    error: null,
  });

  // Ref para evitar re-subscribe desnecessário
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const setLoading = (loading: boolean) =>
    setState((prev) => ({ ...prev, loading }));

  const setError = (error: string | null) =>
    setState((prev) => ({ ...prev, error }));

  const loadTasks = useCallback(
    async (filters?: TaskFilters) => {
      try {
        setLoading(true);
        setError(null);
        const tasks = await tasksService.listTasks(familyId, filters);
        setState((prev) => ({ ...prev, tasks, loading: false }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao carregar tarefas';
        setState((prev) => ({ ...prev, error: message, loading: false }));
      }
    },
    [familyId]
  );

  // ── Realtime: ouve INSERT / UPDATE / DELETE na tabela tasks da família ──
  useEffect(() => {
    if (!familyId) return;

    // Cancela canal anterior se familyId mudou
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`tasks:family:${familyId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `family_id=eq.${familyId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newTask = payload.new as Task;
            setState((prev) => {
              // Evita duplicata se o insert já veio do optimistic update
              if (prev.tasks.some((t) => t.id === newTask.id)) return prev;
              return { ...prev, tasks: [newTask, ...prev.tasks] };
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Task;
            setState((prev) => ({
              ...prev,
              tasks: prev.tasks.map((t) => (t.id === updated.id ? updated : t)),
            }));
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old as { id: string };
            setState((prev) => ({
              ...prev,
              tasks: prev.tasks.filter((t) => t.id !== deleted.id),
            }));
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [familyId]);

  const createTask = useCallback(
    async (input: CreateTaskInput) => {
      try {
        setLoading(true);
        setError(null);
        const newTask = await tasksService.createTask(familyId, input);
        setState((prev) => ({
          ...prev,
          tasks: [newTask, ...prev.tasks],
          loading: false,
        }));
        return newTask;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao criar tarefa';
        setState((prev) => ({ ...prev, error: message, loading: false }));
        throw err;
      }
    },
    [familyId]
  );

  const completeTask = useCallback(async (id: string) => {
    // Optimistic update
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === id ? { ...t, status: 'done' as const } : t
      ),
    }));
    try {
      const updated = await tasksService.completeTask(id);
      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === id ? updated : t)),
      }));
    } catch (err) {
      // Reverter optimistic update em caso de falha
      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === id ? { ...t, status: 'pending' as const } : t
        ),
        error: err instanceof Error ? err.message : 'Erro ao concluir tarefa',
      }));
      throw err;
    }
  }, []);

  const undoCompleteTask = useCallback(async (id: string) => {
    // Optimistic update
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === id ? { ...t, status: 'pending' as const, completed_by: undefined, completed_at: undefined } : t
      ),
    }));
    try {
      const updated = await tasksService.undoCompleteTask(id);
      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === id ? updated : t)),
      }));
    } catch (err) {
      // Reverter optimistic update em caso de falha
      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === id ? { ...t, status: 'done' as const } : t
        ),
        error: err instanceof Error ? err.message : 'Erro ao desfazer conclusão',
      }));
      throw err;
    }
  }, []);

  const delegateTask = useCallback(async (id: string, assignedTo: string) => {
    try {
      setLoading(true);
      setError(null);
      const updated = await tasksService.delegateTask(id, assignedTo);
      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === id ? updated : t)),
        loading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao delegar tarefa';
      setState((prev) => ({ ...prev, error: message, loading: false }));
      throw err;
    }
  }, []);

  const updateTask = useCallback(async (id: string, input: UpdateTaskInput) => {
    try {
      setLoading(true);
      setError(null);
      const updated = await tasksService.updateTask(id, input);
      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === id ? updated : t)),
        loading: false,
      }));
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar tarefa';
      setState((prev) => ({ ...prev, error: message, loading: false }));
      throw err;
    }
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await tasksService.deleteTask(id);
      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.filter((t) => t.id !== id),
        loading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir tarefa';
      setState((prev) => ({ ...prev, error: message, loading: false }));
      throw err;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    tasks: state.tasks,
    loading: state.loading,
    error: state.error,
    pendingTasks: state.tasks.filter((t) => t.status === 'pending'),
    doneTasks: state.tasks.filter((t) => t.status === 'done'),
    loadTasks,
    createTask,
    completeTask,
    undoCompleteTask,
    delegateTask,
    updateTask,
    deleteTask,
    clearError,
  };
};

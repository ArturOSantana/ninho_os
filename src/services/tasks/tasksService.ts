// src/services/tasks/tasksService.ts

import { supabase } from '@/lib/supabase';
import {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  TaskFilters,
  UUID,
} from '@/types';

/**
 * Tasks Service - CRUD de tarefas familiares (tasks)
 * UC018: Criar tarefa | UC019: Concluir tarefa | UC020: Delegar tarefa
 */
export const tasksService = {
  /**
   * Listar tarefas da família com filtros opcionais
   */
  async listTasks(familyId: UUID, filters?: TaskFilters): Promise<Task[]> {
    let query = supabase
      .from('tasks')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters?.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []) as Task[];
  },

  /**
   * Criar tarefa — UC018/UC020
   */
  async createTask(familyId: UUID, input: CreateTaskInput): Promise<Task> {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user?.id) throw new Error('Usuário não autenticado');

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', auth.user.id)
      .single();

    if (profileError || !profile) throw new Error('Perfil não encontrado');

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        family_id: familyId,
        title: input.title,
        description: input.description ?? null,
        assigned_to: input.assigned_to ?? null,
        status: 'pending',
        priority: input.priority ?? 'medium',
        due_date: input.due_date ?? null,
        category: input.category ?? 'other',
        created_by: profile.id,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Task;
  },

  /**
   * Atualizar tarefa
   */
  async updateTask(id: UUID, input: UpdateTaskInput): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Task;
  },

  /**
   * Concluir tarefa — UC019
   * Grava status=done + completed_by (profile.id) + completed_at
   */
  async completeTask(id: UUID): Promise<Task> {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user?.id) throw new Error('Usuário não autenticado');

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', auth.user.id)
      .single();

    if (profileError || !profile) throw new Error('Perfil não encontrado');

    return tasksService.updateTask(id, {
      status: 'done',
      completed_by: profile.id,
      completed_at: new Date().toISOString(),
    });
  },

  /**
   * Desfazer conclusão de tarefa — UC019 undo
   * Reverte status=pending e limpa completed_by / completed_at
   */
  async undoCompleteTask(id: UUID): Promise<Task> {
    return tasksService.updateTask(id, {
      status: 'pending',
      completed_by: null,
      completed_at: null,
    });
  },

  /**
   * Delegar tarefa — UC020
   */
  async delegateTask(id: UUID, assignedTo: UUID): Promise<Task> {
    return tasksService.updateTask(id, { assigned_to: assignedTo });
  },

  /**
   * Excluir tarefa
   */
  async deleteTask(id: UUID): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  },
};

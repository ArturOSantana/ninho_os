// src/components/tasks/TaskCard.tsx
// Design: dark theme Ninho

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Task, TaskPriority, TASK_PRIORITY_LABELS } from '@/types/productivity.types';

const PRIORITY_DOT: Record<TaskPriority, string> = {
  high:   '#e8720c',
  medium: '#f0b429',
  low:    '#f5d9b0',
};

interface TaskCardProps {
  task: Task;
  onComplete: () => void;
  onDelete: () => void;
}

export function TaskCard({ task, onComplete, onDelete }: TaskCardProps) {
  const done = task.status === 'done';

  return (
    <View
      style={{ backgroundColor: '#16283d', borderRadius: 12, borderWidth: 1, borderColor: '#2a3d52' }}
    >
      <View style={{ padding: 14, flexDirection: 'row', alignItems: 'flex-start' }}>
        {/* Checkbox */}
        <TouchableOpacity
          onPress={onComplete}
          style={{
            width: 22, height: 22, borderRadius: 6, borderWidth: 2,
            borderColor: done ? '#e8720c' : '#2a3d52',
            backgroundColor: done ? '#e8720c' : 'transparent',
            alignItems: 'center', justifyContent: 'center',
            marginRight: 12, marginTop: 1,
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {done ? <Text style={{ color: '#4a1b0c', fontSize: 11, fontWeight: '700' }}>✓</Text> : null}
        </TouchableOpacity>

        {/* Conteúdo */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: done ? '#f5d9b0' : '#fdf6ec', fontSize: 14, fontWeight: '500',
              textDecorationLine: done ? 'line-through' : 'none', opacity: done ? 0.55 : 1,
            }}
            numberOfLines={2}
          >
            {task.title}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 }}>
            <View style={{
              width: 6, height: 6, borderRadius: 3,
              backgroundColor: PRIORITY_DOT[task.priority as TaskPriority] ?? '#f5d9b0',
            }} />
            <Text style={{ color: '#f5d9b0', fontSize: 11 }}>
              {TASK_PRIORITY_LABELS[task.priority as TaskPriority] ?? task.priority}
            </Text>
            {task.due_date ? (
              <Text style={{ color: '#f5d9b0', fontSize: 11, opacity: 0.7 }}>
                · {new Date(task.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Deletar */}
        <TouchableOpacity
          onPress={onDelete}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{ paddingLeft: 8, paddingTop: 2 }}
        >
          <Text style={{ color: '#2a3d52', fontSize: 16 }}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

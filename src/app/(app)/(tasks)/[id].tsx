import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '@/components/ui/Avatar';
import { Colors } from '@/constants/theme';
import { useFamily } from '@/hooks';
import { useTask } from '@/hooks/useTask';
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  TaskPriority,
  TaskStatus,
} from '@/types/productivity.types';

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  high: Colors.primary,
  medium: Colors.secondary,
  low: Colors.muted,
};

export default function TaskDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const { family, members } = useFamily();
  const { tasks, loading, toggleTask, delegateTask, deleteTask } = useTask(family?.id);
  const [delegatingMemberId, setDelegatingMemberId] = useState<string | null>(null);

  const taskId = Array.isArray(id) ? id[0] : id;
  const task = useMemo(() => tasks.find((item) => item.id === taskId), [tasks, taskId]);
  const isDone = task?.status === 'done';

  const handleToggleTask = async () => {
    if (!task) return;
    await toggleTask(task.id);
  };

  const handleDeleteTask = () => {
    if (!task) return;

    Alert.alert('Excluir tarefa', `Deseja excluir “${task.title}”?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await deleteTask(task.id);
          router.back();
        },
      },
    ]);
  };

  const handleDelegateTask = async (memberId: string) => {
    if (!task) return;

    setDelegatingMemberId(memberId);
    try {
      await delegateTask(task.id, memberId);
    } finally {
      setDelegatingMemberId(null);
    }
  };

  if (loading && !task) {
    return (
      <View style={[styles.screen, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (!task) {
    return (
      <View style={[styles.screen, styles.centered, { paddingTop: insets.top, paddingHorizontal: 24 }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>tarefa</Text>
          <View style={styles.headerActionPlaceholder} />
        </View>
        <Text style={styles.emptyText}>Tarefa não encontrada.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>tarefa</Text>

        <TouchableOpacity onPress={handleDeleteTask} activeOpacity={0.7}>
          <Text style={styles.deleteButtonText}>Excluir</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: insets.bottom + 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={[styles.taskTitle, isDone && styles.taskTitleDone]}>{task.title}</Text>

          <View style={styles.badgeRow}>
            <View
              style={[
                styles.badge,
                {
                  borderColor: PRIORITY_COLORS[task.priority],
                  backgroundColor: Colors.bg,
                },
              ]}
            >
              <Text style={[styles.badgeText, { color: PRIORITY_COLORS[task.priority] }]}>
                {TASK_PRIORITY_LABELS[task.priority as TaskPriority]}
              </Text>
            </View>

            <View style={[styles.badge, styles.statusBadge]}>
              <Text style={styles.statusBadgeText}>
                {TASK_STATUS_LABELS[task.status as TaskStatus]}
              </Text>
            </View>
          </View>

          {task.due_date ? (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>Prazo</Text>
              <Text style={styles.sectionValue}>
                {new Date(task.due_date).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>
          ) : null}

          {task.description ? (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>Descrição</Text>
              <Text style={styles.descriptionText}>{task.description}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.primaryButton} onPress={handleToggleTask} activeOpacity={0.85}>
            <Text style={styles.primaryButtonText}>
              {isDone ? 'Marcar como pendente' : 'Marcar como concluída'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Delegar para</Text>

          {members.map((member) => {
            const isAssigned = task.assigned_to === member.id;
            const isDelegating = delegatingMemberId === member.id;

            return (
              <TouchableOpacity
                key={member.id}
                style={[
                  styles.memberRow,
                  isAssigned && styles.memberRowActive,
                ]}
                onPress={() => handleDelegateTask(member.id)}
                activeOpacity={0.8}
                disabled={isDelegating}
              >
                <Avatar name={member.name} size={36} style={styles.avatar} />

                <View style={styles.memberTextWrapper}>
                  <Text style={styles.memberName}>{member.name}</Text>
                </View>

                {isDelegating ? (
                  <ActivityIndicator color={Colors.primary} size="small" />
                ) : isAssigned ? (
                  <Text style={styles.memberAssignedText}>Responsável</Text>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 18,
    fontFamily: 'Georgia',
  },
  headerActionPlaceholder: {
    width: 48,
  },
  backButtonText: {
    color: Colors.muted,
    fontSize: 15,
  },
  deleteButtonText: {
    color: Colors.error,
    fontSize: 15,
    fontWeight: '600',
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  taskTitle: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: Colors.muted,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadge: {
    borderColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  statusBadgeText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  sectionBlock: {
    marginBottom: 16,
  },
  sectionLabel: {
    color: Colors.muted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  sectionValue: {
    color: Colors.text,
    fontSize: 15,
  },
  descriptionText: {
    color: Colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.onLight,
    fontSize: 15,
    fontWeight: '700',
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
  },
  memberRowActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.bgCard,
  },
  avatar: {
    marginRight: 12,
  },
  memberTextWrapper: {
    flex: 1,
  },
  memberName: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  memberAssignedText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyText: {
    color: Colors.muted,
    fontSize: 15,
    marginTop: 24,
    textAlign: 'center',
  },
});

// src/app/(app)/(tasks)/index.tsx
// UC018: Criar tarefa | UC019: Concluir tarefa (com undo) | UC020: Delegar tarefa

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconPlus, IconCheck } from '@tabler/icons-react-native';
import { useTasks, useFamily, useFamilyMembers } from '@/hooks';
import { Task, TaskStatus, Profile } from '@/types';
import { Colors } from '@/constants/theme';
import { Avatar } from '@/components/ui/Avatar';
import { TutorialOverlay } from '@/components/ui/TutorialOverlay';
import { useTutorial } from '@/hooks/useTutorial';

const STATUS_TABS: { value: TaskStatus | 'all'; label: string }[] = [
  { value: 'all',     label: 'Todas' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'done',    label: 'Concluídas' },
];

const TOAST_DURATION_MS = 4000;

// ─── UndoToast ────────────────────────────────────────────────
interface UndoToastProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
}

function UndoToast({ message, onUndo, onDismiss }: UndoToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  const handleUndo = () => {
    onUndo();
    onDismiss();
  };

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: 24,
        left: 16,
        right: 16,
        backgroundColor: '#1c3352',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        opacity,
        zIndex: 999,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      <Text style={{ flex: 1, color: Colors.text, fontSize: 13 }}>
        {message}
      </Text>
      <TouchableOpacity
        onPress={handleUndo}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={{
          marginLeft: 16,
          paddingHorizontal: 12,
          paddingVertical: 5,
          backgroundColor: Colors.primary,
          borderRadius: 8,
        }}
      >
        <Text style={{ color: Colors.onLight, fontSize: 12, fontWeight: '600' }}>
          Desfazer
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── TaskRow ──────────────────────────────────────────────────
function TaskRow({
  task,
  members,
  onToggle,
}: {
  task: Task;
  members: Profile[];
  onToggle: () => void;
}) {
  const done = task.status === 'done';
  const assignee = task.assigned_to
    ? members.find((m) => m.id === task.assigned_to)
    : undefined;

  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.78}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      accessibilityLabel={`${task.title}${assignee ? `, atribuída a ${assignee.name}` : ''}, ${done ? 'concluída' : 'pendente'}`}
      style={{
        backgroundColor: Colors.card, borderRadius: 12,
        borderWidth: 1, borderColor: Colors.border,
        flexDirection: 'row', alignItems: 'center',
        padding: 14, marginBottom: 8,
        opacity: done ? 0.5 : 1,
      }}
    >
      {/* Checkbox */}
      <View
        style={{
          width: 22, height: 22, borderRadius: 6,
          borderWidth: done ? 0 : 2, borderColor: Colors.border,
          backgroundColor: done ? Colors.primary : 'transparent',
          alignItems: 'center', justifyContent: 'center',
          marginRight: 12,
        }}
      >
        {done ? <IconCheck size={13} color={Colors.onLight} /> : null}
      </View>

      {/* Título */}
      <Text
        style={{
          flex: 1, color: Colors.text, fontSize: 14,
          textDecorationLine: done ? 'line-through' : 'none',
        }}
        numberOfLines={2}
      >
        {task.title}
      </Text>

      {/* Avatar do responsável */}
      {assignee ? (
        <Avatar name={assignee.name} size={26} style={{ marginLeft: 10 }} />
      ) : task.assigned_to ? (
        // assigned_to preenchido mas membro ainda não carregado — mostra placeholder neutro
        <View style={{
          width: 26, height: 26, borderRadius: 13,
          backgroundColor: Colors.border,
          alignItems: 'center', justifyContent: 'center', marginLeft: 10,
        }} />
      ) : (
        <View style={{
          width: 26, height: 26, borderRadius: 13,
          borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed',
          alignItems: 'center', justifyContent: 'center', marginLeft: 10,
        }}>
          <IconPlus size={12} color={Colors.muted} />
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────
export default function TasksScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { family } = useFamily();
  const { tasks, loading, error, loadTasks, completeTask, undoCompleteTask } =
    useTasks(family?.id ?? '');
  const { members, load: loadMembers } = useFamilyMembers(family?.id);
  const [activeTab, setActiveTab] = useState<TaskStatus | 'all'>('all');

  // Toast state
  const [toastTaskId, setToastTaskId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hook must be called before any early return
  const tutorial = useTutorial('tasks');

  useEffect(() => {
    if (family?.id) {
      loadMembers();
    }
  }, [family?.id, loadMembers]);

  // Recarrega tarefas toda vez que a tela entra em foco (inclusive ao voltar de new-task)
  useFocusEffect(
    useCallback(() => {
      if (family?.id) loadTasks();
    }, [family?.id, loadTasks])
  );

  // Limpar timer ao desmontar
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastTaskId(null);
  }, []);

  const handleToggle = useCallback((task: Task) => {
    if (task.status === 'done') return;

    completeTask(task.id).catch(() => {/* erro já tratado no hook */});

    // Cancelar toast anterior se existir
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);

    setToastMessage(`"${task.title}" concluída`);
    setToastTaskId(task.id);

    toastTimerRef.current = setTimeout(() => {
      setToastTaskId(null);
    }, TOAST_DURATION_MS);
  }, [completeTask]);

  const handleUndo = useCallback(() => {
    if (!toastTaskId) return;
    undoCompleteTask(toastTaskId).catch(() => {/* erro já tratado no hook */});
  }, [toastTaskId, undoCompleteTask]);

  const filteredTasks = activeTab === 'all' ? tasks : tasks.filter(t => t.status === activeTab);
  const pending = tasks.filter(t => t.status === 'pending').length;
  const total   = tasks.length;
  const allDone = total > 0 && pending === 0;

  if (loading && tasks.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg, paddingTop: insets.top }}>
      <TutorialOverlay
        visible={tutorial.visible}
        screenKey="tasks"
        onDismiss={tutorial.dismiss}
      />
      {/* Header — serif v2 */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ color: Colors.text, fontSize: 20, fontFamily: 'Georgia' }}>tarefas</Text>
          <Text style={{ color: allDone ? Colors.secondary : Colors.muted, fontSize: 13, marginTop: 3 }}>
            {allDone ? `${total} de ${total} · tudo em dia` : `${total - pending} de ${total} hoje`}
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 20, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
        {STATUS_TABS.map(tab => (
          <TouchableOpacity key={tab.value} onPress={() => setActiveTab(tab.value)} style={{ paddingBottom: 10 }}>
            <Text style={{
              fontSize: 13,
              fontWeight: activeTab === tab.value ? '500' : '400',
              color: activeTab === tab.value ? Colors.primary : Colors.muted,
              borderBottomWidth: activeTab === tab.value ? 2 : 0,
              borderBottomColor: Colors.primary,
              paddingBottom: activeTab === tab.value ? 2 : 0,
            }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error ? (
        <View style={{ marginHorizontal: 16, marginTop: 12, padding: 12, backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.border }}>
          <Text style={{ color: Colors.muted, fontSize: 13 }}>{error}</Text>
        </View>
      ) : null}

      <ScrollView
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadTasks} tintColor={Colors.primary} />}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {filteredTasks.length === 0 && !loading ? (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <IconCheck size={40} color={Colors.border} />
            <Text style={{ color: Colors.muted, fontSize: 14, marginTop: 12 }}>
              {activeTab === 'done' ? 'Nenhuma tarefa concluída' : 'Nenhuma tarefa pendente'}
            </Text>
          </View>
        ) : (
          <>
            {filteredTasks.map(task => (
              <TaskRow key={task.id} task={task} members={members} onToggle={() => handleToggle(task)} />
            ))}
            {/* CTA tracejado */}
            <TouchableOpacity
              onPress={() => router.push('/(app)/(tasks)/new-task' as never)}
              accessibilityRole="button"
              style={{
                borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border,
                borderStyle: 'dashed', height: 52, marginTop: 4,
                alignItems: 'center', justifyContent: 'center',
                flexDirection: 'row', gap: 8,
              }}
            >
              <IconPlus size={16} color={Colors.muted} />
              <Text style={{ color: Colors.muted, fontSize: 13 }}>nova tarefa</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* FAB — nova tarefa (sempre visível, sobreposto) */}
      <TouchableOpacity
        onPress={() => router.push('/(app)/(tasks)/new-task' as never)}
        activeOpacity={0.82}
        accessibilityRole="button"
        accessibilityLabel="Nova tarefa"
        style={{
          position: 'absolute',
          bottom: insets.bottom + 24,
          right: 20,
          width: 52, height: 52,
          borderTopLeftRadius: 24, borderTopRightRadius: 28,
          borderBottomRightRadius: 30, borderBottomLeftRadius: 22,
          backgroundColor: Colors.primary,
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <IconPlus size={22} color={Colors.onLight} />
      </TouchableOpacity>

      {/* Toast desfazer */}
      {toastTaskId ? (
        <UndoToast
          message={toastMessage}
          onUndo={handleUndo}
          onDismiss={dismissToast}
        />
      ) : null}
    </View>
  );
}

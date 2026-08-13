// src/app/(app)/(tasks)/index.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Animated, Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconPlus, IconCheck, IconAlertCircle, IconUser, IconRepeat } from '@tabler/icons-react-native';
import { useTasks, useFamily, useFamilyMembers } from '@/hooks';
import { Task, TaskStatus, Profile } from '@/types';
import { Colors, Radius, FontSize, Spacing } from '@/constants/theme';
import { Avatar } from '@/components/ui/Avatar';
import { TutorialOverlay } from '@/components/ui/TutorialOverlay';
import { useTutorial } from '@/hooks/useTutorial';
import { useBreakpoint } from '@/hooks/useBreakpoint';

const STATUS_TABS: { value: TaskStatus | 'all'; label: string }[] = [
  { value: 'all',     label: 'Todas'      },
  { value: 'pending', label: 'Pendentes'  },
  { value: 'done',    label: 'Concluídas' },
];

// ─── Helpers de prazo ──────────────────────────────────────────────

const MONTHS_SHORT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

function getDueDaysLeft(dueDateISO: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateISO);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86400000);
}

function formatDueLabel(dueDateISO: string): { label: string; overdue: boolean; urgent: boolean } {
  const days = getDueDaysLeft(dueDateISO);
  if (days < 0)   return { label: `atrasada ${Math.abs(days)}d`, overdue: true,  urgent: true  };
  if (days === 0) return { label: 'hoje',                         overdue: false, urgent: true  };
  if (days === 1) return { label: 'amanhã',                       overdue: false, urgent: true  };
  if (days <= 7)  return { label: `em ${days} dias`,              overdue: false, urgent: true  };
  const d = new Date(dueDateISO);
  return {
    label: `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`,
    overdue: false,
    urgent:  false,
  };
}

/**
 * Ordenação inteligente de tarefas:
 * 1. Atrasadas (due_date < hoje) — mais urgente primeiro
 * 2. Vencendo hoje/amanhã
 * 3. Alta prioridade pendentes
 * 4. Média prioridade pendentes
 * 5. Sem prazo / baixa prioridade
 * 6. Concluídas por último
 */
function smartSort(tasks: Task[]): Task[] {
  const priorityScore = { high: 3, medium: 2, low: 1 };

  return [...tasks].sort((a, b) => {
    const aDone = a.status === 'done';
    const bDone = b.status === 'done';

    // Concluídas vão para o final
    if (aDone && !bDone) return 1;
    if (!aDone && bDone) return -1;

    if (!aDone && !bDone) {
      const aDays = a.due_date ? getDueDaysLeft(a.due_date) : 999;
      const bDays = b.due_date ? getDueDaysLeft(b.due_date) : 999;

      // Atrasadas primeiro (dias negativos)
      if (aDays < 0 && bDays >= 0) return -1;
      if (bDays < 0 && aDays >= 0) return 1;

      // Ambas com prazo: mais próxima primeiro
      if (a.due_date && b.due_date) return aDays - bDays;

      // Com prazo antes de sem prazo
      if (a.due_date && !b.due_date) return -1;
      if (!a.due_date && b.due_date) return 1;

      // Sem prazo: por prioridade
      return (priorityScore[b.priority] ?? 1) - (priorityScore[a.priority] ?? 1);
    }

    // Ambas concluídas: mais recente primeiro
    return (b.completed_at ?? b.created_at).localeCompare(a.completed_at ?? a.created_at);
  });
}

const TOAST_DURATION_MS = 4000;

function UndoToast({ message, onUndo, onDismiss }: {
  message: string; onUndo: () => void; onDismiss: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
  }, [opacity]);

  return (
    <Animated.View style={{
      position:          'absolute',
      bottom:            24,
      left:              16,
      right:             16,
      backgroundColor:   Colors.bgCard,
      borderRadius:      Radius.lg,
      borderWidth:       1,
      borderColor:       Colors.border,
      flexDirection:     'row',
      alignItems:        'center',
      paddingVertical:   12,
      paddingHorizontal: 16,
      opacity,
      zIndex:            999,
    }}>
      <Text style={{ flex: 1, color: Colors.text, fontSize: FontSize.sm }}>
        {message}
      </Text>
      <TouchableOpacity
        onPress={() => { onUndo(); onDismiss(); }}
        style={{
          marginLeft:        12,
          paddingHorizontal: 12,
          paddingVertical:   6,
          backgroundColor:   Colors.primary,
          borderRadius:      Radius.sm,
        }}
      >
        <Text style={{ color: '#fff', fontSize: FontSize.xs, fontWeight: '600' }}>
          Desfazer
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const TASK_RECURRENCE_LABELS: Record<string, string> = {
  daily:   'Diária',
  weekly:  'Semanal',
  monthly: 'Mensal',
  yearly:  'Anual',
};

function TaskRow({ task, members, onToggle }: {
  task: Task; members: Profile[]; onToggle: () => void;
}) {
  const done        = task.status === 'done';
  const assignee    = task.assigned_to ? members.find((m) => m.id === task.assigned_to) : undefined;
  const noOwner     = !task.assigned_to && !done;
  const isRecurring = task.recurrence && task.recurrence !== 'none';

  const dueInfo  = task.due_date && !done ? formatDueLabel(task.due_date) : null;

  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.75}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      accessibilityLabel={
        `${task.title}` +
        `${assignee ? `, responsável: ${assignee.name}` : ''}` +
        `${isRecurring ? `, recorrência ${TASK_RECURRENCE_LABELS[task.recurrence!] ?? task.recurrence}` : ''}` +
        `${dueInfo ? `, prazo: ${dueInfo.label}` : ''}` +
        `${done ? ', concluída' : ', pendente'}`
      }
      style={{
        flexDirection:     'row',
        alignItems:        'center',
        paddingHorizontal: 16,
        paddingVertical:   14,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        opacity:           done ? 0.45 : 1,
        // Destaque sutil para tarefas atrasadas
        backgroundColor:   dueInfo?.overdue ? Colors.coralBg : 'transparent',
      }}
    >
      {/* Checkbox */}
      <View style={{
        width:           20,
        height:          20,
        borderRadius:    5,
        borderWidth:     done ? 0 : 1.5,
        borderColor:     dueInfo?.overdue ? Colors.coral : Colors.borderMid,
        backgroundColor: done ? Colors.success : 'transparent',
        alignItems:      'center',
        justifyContent:  'center',
        marginRight:     12,
        flexShrink:      0,
      }}>
        {done ? <IconCheck size={12} color="#fff" /> : null}
      </View>

      {/* Conteúdo central */}
      <View style={{ flex: 1, minWidth: 0 }}>
        {/* Título + ícone de recorrência */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Text style={{
            flex:               1,
            color:              Colors.text,
            fontSize:           FontSize.md,
            textDecorationLine: done ? 'line-through' : 'none',
          }} numberOfLines={2}>
            {task.title}
          </Text>
          {isRecurring && (
            <IconRepeat
              size={13}
              color={Colors.muted}
              accessibilityLabel={`Recorrente: ${TASK_RECURRENCE_LABELS[task.recurrence!] ?? task.recurrence}`}
            />
          )}
        </View>

        {/* Linha de metadados: prazo + sem responsável */}
        {(dueInfo || noOwner) ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 }}>
            {dueInfo && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                {dueInfo.overdue && (
                  <IconAlertCircle size={11} color={Colors.coral} />
                )}
                <Text style={{
                  fontSize:   FontSize.xs,
                  color:      dueInfo.overdue ? Colors.coral : dueInfo.urgent ? Colors.amber : Colors.muted,
                  fontWeight: dueInfo.urgent ? '500' : '400',
                }}>
                  {dueInfo.label}
                </Text>
              </View>
            )}
            {noOwner && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <IconUser size={10} color={Colors.muted} />
                <Text style={{ fontSize: FontSize.xs, color: Colors.muted }}>
                  sem responsável
                </Text>
              </View>
            )}
          </View>
        ) : null}
      </View>

      {/* Responsável */}
      {assignee ? (
        <Avatar name={assignee.name} size={24} style={{ marginLeft: 10 }} />
      ) : task.assigned_to ? (
        <View style={{
          width: 24, height: 24, borderRadius: 12,
          backgroundColor: Colors.border, marginLeft: 10,
        }} />
      ) : (
        <View style={{
          width: 24, height: 24, borderRadius: 12,
          borderWidth: 1, borderColor: Colors.border,
          borderStyle: 'dashed', marginLeft: 10,
          alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <IconPlus size={10} color={Colors.textDisabled} />
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function TasksScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { isDesktop } = useBreakpoint();
  const { family } = useFamily();
  const { tasks, loading, error, loadTasks, completeTask, undoCompleteTask } =
    useTasks(family?.id ?? '');
  const { members, load: loadMembers } = useFamilyMembers(family?.id);
  const [activeTab, setActiveTab] = useState<TaskStatus | 'all'>('all');

  const [toastTaskId,  setToastTaskId]  = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tutorial = useTutorial('tasks');

  useEffect(() => {
    if (family?.id) loadMembers();
  }, [family?.id, loadMembers]);

  useFocusEffect(useCallback(() => {
    if (family?.id) loadTasks();
  }, [family?.id, loadTasks]));

  useEffect(() => {
    return () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); };
  }, []);

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastTaskId(null);
  }, []);

  const handleToggle = useCallback((task: Task) => {
    if (task.status === 'done') return;
    completeTask(task.id).catch(() => {});
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(`"${task.title}" concluída`);
    setToastTaskId(task.id);
    toastTimerRef.current = setTimeout(() => setToastTaskId(null), TOAST_DURATION_MS);
  }, [completeTask]);

  const handleUndo = useCallback(() => {
    if (!toastTaskId) return;
    undoCompleteTask(toastTaskId).catch(() => {});
  }, [toastTaskId, undoCompleteTask]);

  const baseTasks     = activeTab === 'all' ? tasks : tasks.filter((t) => t.status === activeTab);
  const filteredTasks = smartSort(baseTasks);
  const pending       = tasks.filter((t) => t.status === 'pending').length;
  const overdue       = tasks.filter((t) => t.status !== 'done' && !!t.due_date && getDueDaysLeft(t.due_date) < 0).length;
  const total         = tasks.length;
  const allDone       = total > 0 && pending === 0;

  if (loading && tasks.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bgPage, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const topPadding = Platform.OS === 'web' ? 24 : insets.top;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgPage, paddingTop: topPadding }}>
      <TutorialOverlay visible={tutorial.visible} screenKey="tasks" onDismiss={tutorial.dismiss} />

      {/* Header */}
      <View style={{
        paddingHorizontal: isDesktop ? 32 : 20,
        paddingTop:        16,
        paddingBottom:     0,
        flexDirection:     'row',
        alignItems:        'flex-start',
        justifyContent:    'space-between',
      }}>
        <View>
          <Text style={{
            color:         Colors.text,
            fontSize:      FontSize.xxl,
            fontWeight:    '700',
            letterSpacing: -0.5,
          }}>
            Tarefas
          </Text>
          <Text style={{
            color:     allDone ? Colors.success : overdue > 0 ? Colors.coral : Colors.muted,
            fontSize:  FontSize.sm,
            marginTop: 3,
          }}>
            {allDone
              ? `${total} de ${total} concluídas · tudo em dia`
              : overdue > 0
                ? `${overdue} atrasada${overdue > 1 ? 's' : ''} · ${total - pending} de ${total} feitas`
                : `${total - pending} de ${total} concluídas`
            }
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/(app)/(tasks)/new-task' as never)}
          style={{
            width:           36,
            height:          36,
            borderRadius:    8,
            backgroundColor: Colors.primary,
            alignItems:      'center',
            justifyContent:  'center',
          }}
        >
          <IconPlus size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={{
        flexDirection:    'row',
        paddingHorizontal: isDesktop ? 32 : 20,
        gap:              24,
        marginTop:        16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
      }}>
        {STATUS_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.value}
            onPress={() => setActiveTab(tab.value)}
            style={{ paddingBottom: 10 }}
          >
            <Text style={{
              fontSize:         FontSize.sm,
              fontWeight:       activeTab === tab.value ? '600' : '400',
              color:            activeTab === tab.value ? Colors.primary : Colors.muted,
              borderBottomWidth: activeTab === tab.value ? 2 : 0,
              borderBottomColor: Colors.primary,
              paddingBottom:    activeTab === tab.value ? 2 : 0,
            }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error ? (
        <View style={{
          margin:          16,
          padding:         12,
          backgroundColor: Colors.errorBg,
          borderRadius:    Radius.md,
          borderWidth:     1,
          borderColor:     Colors.error + '40',
        }}>
          <Text style={{ color: Colors.error, fontSize: FontSize.sm }}>{error}</Text>
        </View>
      ) : null}

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadTasks} tintColor={Colors.primary} />
        }
        contentContainerStyle={{
          paddingBottom:   insets.bottom + 100,
          maxWidth:        isDesktop ? 760 : undefined,
          alignSelf:       isDesktop ? 'center' : undefined,
          width:           isDesktop ? '100%' : undefined,
          paddingHorizontal: isDesktop ? 32 : 0,
        }}
        showsVerticalScrollIndicator={false}
      >
        {filteredTasks.length === 0 && !loading ? (
          <View style={{ alignItems: 'center', paddingVertical: 56 }}>
            <View style={{
              width:           48,
              height:          48,
              borderRadius:    12,
              backgroundColor: Colors.bgCard,
              borderWidth:     1,
              borderColor:     Colors.border,
              alignItems:      'center',
              justifyContent:  'center',
              marginBottom:    14,
            }}>
              <IconCheck size={22} color={Colors.muted} />
            </View>
            <Text style={{ color: Colors.muted, fontSize: FontSize.md }}>
              {activeTab === 'done' ? 'Nenhuma tarefa concluída' : 'Nenhuma tarefa pendente'}
            </Text>
            {activeTab !== 'done' && (
              <TouchableOpacity
                onPress={() => router.push('/(app)/(tasks)/new-task' as never)}
                style={{ marginTop: 16 }}
              >
                <Text style={{ color: Colors.primary, fontSize: FontSize.sm }}>
                  + Adicionar tarefa
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={{
            backgroundColor: isDesktop ? Colors.bgCard : Colors.bgCard,
            borderRadius:    isDesktop ? Radius.lg : 0,
            borderWidth:     isDesktop ? 1 : 0,
            borderColor:     Colors.border,
            marginTop:       isDesktop ? 16 : 0,
            overflow:        'hidden',
          }}>
            {filteredTasks.map((task) => (
              <TaskRow key={task.id} task={task} members={members} onToggle={() => handleToggle(task)} />
            ))}
            {/* Nova tarefa */}
            <TouchableOpacity
              onPress={() => router.push('/(app)/(tasks)/new-task' as never)}
              style={{
                flexDirection:     'row',
                alignItems:        'center',
                gap:               10,
                paddingHorizontal: 16,
                paddingVertical:   14,
              }}
            >
              <View style={{
                width:           20,
                height:          20,
                borderRadius:    5,
                borderWidth:     1,
                borderColor:     Colors.border,
                borderStyle:     'dashed',
                alignItems:      'center',
                justifyContent:  'center',
              }}>
                <IconPlus size={10} color={Colors.textDisabled} />
              </View>
              <Text style={{ color: Colors.textDisabled, fontSize: FontSize.md }}>
                Nova tarefa
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

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

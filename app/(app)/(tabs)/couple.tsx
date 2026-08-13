import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth.store';
import { coupleService } from '@/services/couple/coupleService';
import {
  CoupleAppreciation,
  CoupleCheckin,
  CoupleExpense,
  CreateExpenseInput,
  MoodLevel,
  MOOD_LABELS,
  MOOD_EMOJI,
  EXPENSE_CATEGORY_LABELS,
  ExpenseSplitMode,
  EXPENSE_SPLIT_LABELS,
} from '@/types/couple.types';
import { Profile } from '@/types/family.types';
import { supabase } from '@/lib/supabase';

// ─── Tipos de aba ────────────────────────────────────────────
type Tab = 'mood' | 'appreciations' | 'expenses' | 'window';

// ─── Helpers ─────────────────────────────────────────────────
const formatCents = (cents: number) =>
  `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;

export default function CoupleScreen() {
  const insets = useSafeAreaInsets();
  const { family, profile } = useAuthStore();

  const [activeTab, setActiveTab] = useState<Tab>('mood');
  const [refreshing, setRefreshing] = useState(false);

  // Parceiro
  const [partner, setPartner] = useState<Profile | null>(null);

  // UC032 — Check-in emocional
  const [myCheckin, setMyCheckin] = useState<CoupleCheckin | null>(null);
  const [partnerCheckin, setPartnerCheckin] = useState<CoupleCheckin | null>(null);
  const [savingMood, setSavingMood] = useState(false);

  // UC031 — Apreciações
  const [appreciations, setAppreciations] = useState<CoupleAppreciation[]>([]);
  const [showAppModal, setShowAppModal] = useState(false);
  const [appMessage, setAppMessage] = useState('');
  const [appEmoji, setAppEmoji] = useState('❤️');
  const [savingApp, setSavingApp] = useState(false);

  // UC034 — Gastos
  const [expenses, setExpenses] = useState<CoupleExpense[]>([]);
  const [showExpModal, setShowExpModal] = useState(false);
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState('other');
  const [expSplit, setExpSplit] = useState<ExpenseSplitMode>('equal');
  const [savingExp, setSavingExp] = useState(false);

  // ─── Carga inicial ─────────────────────────────────────────
  const load = useCallback(async () => {
    if (!family || !profile) return;

    // Busca parceiro (outro membro adulto da família)
    const { data: members } = await supabase
      .from('profiles')
      .select('id, name, avatar_url, role')
      .eq('family_id', family.id)
      .in('role', ['admin', 'parent'])
      .neq('id', profile.id);

    const partnerProfile = members?.[0] ?? null;
    setPartner(partnerProfile as Profile | null);

    // Check-ins do dia
    const today = new Date().toISOString().split('T')[0];
    const { data: checkins } = await supabase
      .from('couple_checkins')
      .select('*')
      .eq('family_id', family.id)
      .eq('checked_at', today);

    setMyCheckin((checkins ?? []).find((c) => c.member_id === profile.id) ?? null);
    setPartnerCheckin(
      partnerProfile
        ? (checkins ?? []).find((c) => c.member_id === partnerProfile.id) ?? null
        : null,
    );

    // Apreciações recentes
    const apps = await coupleService.listAppreciations(family.id);
    setAppreciations(apps);

    // Gastos não quitados
    const exps = await coupleService.listExpenses(family.id, false);
    setExpenses(exps);
  }, [family, profile]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // ─── UC032: salvar humor ───────────────────────────────────
  const handleSaveMood = async (mood: MoodLevel) => {
    if (!family) return;
    setSavingMood(true);
    try {
      const saved = await coupleService.upsertCheckin(family.id, { mood });
      setMyCheckin(saved);
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setSavingMood(false);
    }
  };

  // ─── UC031: enviar apreciação ──────────────────────────────
  const handleSendAppreciation = async () => {
    if (!appMessage.trim() || !family || !partner) return;
    setSavingApp(true);
    try {
      const a = await coupleService.sendAppreciation(family.id, {
        to_member: partner.id,
        message:   appMessage.trim(),
        emoji:     appEmoji,
      });
      setAppreciations((prev) => [a, ...prev]);
      setShowAppModal(false);
      setAppMessage('');
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setSavingApp(false);
    }
  };

  // ─── UC034: criar gasto ────────────────────────────────────
  const handleCreateExpense = async () => {
    const amountCents = Math.round(parseFloat(expAmount.replace(',', '.')) * 100);
    if (!expTitle.trim() || isNaN(amountCents) || amountCents <= 0 || !family) return;
    setSavingExp(true);
    try {
      const exp = await coupleService.createExpense(family.id, {
        title:        expTitle.trim(),
        amount_cents: amountCents,
        category:     expCategory,
        split_mode:   expSplit,
      } as CreateExpenseInput);
      setExpenses((prev) => [exp, ...prev]);
      setShowExpModal(false);
      setExpTitle('');
      setExpAmount('');
      setExpCategory('other');
      setExpSplit('equal');
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setSavingExp(false);
    }
  };

  const handleSettleExpense = async (id: string) => {
    try {
      await coupleService.updateExpense(id, { settled: true });
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    }
  };

  // ─── Renders das abas ──────────────────────────────────────

  const renderMoodTab = () => (
    <View>
      <Text style={styles.sectionTitle}>Como você está hoje?</Text>

      {/* Seleção de humor */}
      {!myCheckin ? (
        savingMood ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 24 }} />
        ) : (
          <View style={styles.moodRow}>
            {(['terrible', 'bad', 'ok', 'good', 'great'] as MoodLevel[]).map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => handleSaveMood(m)}
                style={styles.moodBtn}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 32 }}>{MOOD_EMOJI[m]}</Text>
                <Text style={styles.moodLabel}>{MOOD_LABELS[m]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )
      ) : (
        <View style={styles.checkinCard}>
          <Text style={{ fontSize: 40 }}>{MOOD_EMOJI[myCheckin.mood as MoodLevel]}</Text>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.cardTitle}>Seu humor hoje</Text>
            <Text style={styles.cardValue}>{MOOD_LABELS[myCheckin.mood as MoodLevel]}</Text>
            {myCheckin.note ? (
              <Text style={styles.cardNote}>{myCheckin.note}</Text>
            ) : null}
          </View>
          <TouchableOpacity onPress={() => setMyCheckin(null)} style={styles.editBtn}>
            <Text style={styles.editBtnText}>Editar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Humor do parceiro */}
      {partner && (
        <View style={[styles.checkinCard, { marginTop: 12, opacity: partnerCheckin ? 1 : 0.5 }]}>
          {partnerCheckin ? (
            <>
              <Text style={{ fontSize: 40 }}>{MOOD_EMOJI[partnerCheckin.mood as MoodLevel]}</Text>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.cardTitle}>{partner.name}</Text>
                <Text style={styles.cardValue}>{MOOD_LABELS[partnerCheckin.mood as MoodLevel]}</Text>
              </View>
            </>
          ) : (
            <>
              <Text style={{ fontSize: 40 }}>❓</Text>
              <Text style={[styles.cardNote, { marginLeft: 12 }]}>
                {partner.name} ainda não fez o check-in de hoje.
              </Text>
            </>
          )}
        </View>
      )}
    </View>
  );

  const renderAppreciationsTab = () => (
    <View>
      {partner && (
        <TouchableOpacity
          onPress={() => setShowAppModal(true)}
          style={styles.addBtn}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnIcon}>❤️</Text>
          <Text style={styles.addBtnText}>Elogiar {partner.name}</Text>
        </TouchableOpacity>
      )}

      {appreciations.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 40 }}>💌</Text>
          <Text style={styles.emptyText}>Nenhuma apreciação ainda.{'\n'}Seja o primeiro!</Text>
        </View>
      ) : (
        appreciations.map((a) => (
          <View key={a.id} style={styles.appreciationCard}>
            <Text style={{ fontSize: 28 }}>{a.emoji ?? '❤️'}</Text>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.appreciationMsg}>{a.message}</Text>
              <Text style={styles.appreciationMeta}>
                {new Date(a.created_at).toLocaleDateString('pt-BR')}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderExpensesTab = () => {
    const pendingExp = expenses.filter((e) => !e.settled);
    const totalCents = pendingExp.reduce((s, e) => s + e.amount_cents, 0);

    return (
      <View>
        {/* Resumo */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total não quitado</Text>
          <Text style={styles.balanceValue}>{formatCents(totalCents)}</Text>
        </View>

        <TouchableOpacity onPress={() => setShowExpModal(true)} style={styles.addBtn} activeOpacity={0.8}>
          <Text style={styles.addBtnIcon}>+</Text>
          <Text style={styles.addBtnText}>Registrar gasto</Text>
        </TouchableOpacity>

        {pendingExp.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 40 }}>💸</Text>
            <Text style={styles.emptyText}>Nenhum gasto pendente.</Text>
          </View>
        ) : (
          pendingExp.map((e) => (
            <View key={e.id} style={styles.expenseCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.expenseTitle}>{e.title}</Text>
                <Text style={styles.expenseMeta}>
                  {EXPENSE_CATEGORY_LABELS[e.category] ?? e.category} · {EXPENSE_SPLIT_LABELS[e.split_mode as ExpenseSplitMode]}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <Text style={styles.expenseAmount}>{formatCents(e.amount_cents)}</Text>
                <TouchableOpacity
                  onPress={() => handleSettleExpense(e.id)}
                  style={styles.settleBtn}
                >
                  <Text style={styles.settleBtnText}>Quitar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    );
  };

  const renderWindowTab = () => (
    <View style={styles.emptyState}>
      <Text style={{ fontSize: 40 }}>🗓️</Text>
      <Text style={[styles.emptyText, { marginTop: 12 }]}>Janela livre</Text>
      <Text style={styles.cardNote}>
        Verifique os seus eventos de amanhã na aba Agenda para identificar janelas disponíveis.
        Em breve, sugestões automáticas baseadas na sua agenda.
      </Text>
    </View>
  );

  // ─── Render principal ──────────────────────────────────────
  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: Colors.bg }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.amber} />
        }
      >
        {/* Header */}
        <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 8 }}>
          <Text style={styles.label}>Casal</Text>
          <Text style={styles.pageTitle}>Conexão do dia</Text>
        </View>

        {/* Abas */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 4 }}
        >
          {(
            [
              { key: 'mood',          icon: '😊', label: 'Humor' },
              { key: 'appreciations', icon: '❤️',  label: 'Elogios' },
              { key: 'expenses',      icon: '💸',  label: 'Gastos' },
              { key: 'window',        icon: '🗓️',  label: 'Tempo livre' },
            ] as { key: Tab; icon: string; label: string }[]
          ).map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[
                styles.tabChip,
                activeTab === tab.key && styles.tabChipActive,
              ]}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 14 }}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Conteúdo da aba */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
          {activeTab === 'mood'          && renderMoodTab()}
          {activeTab === 'appreciations' && renderAppreciationsTab()}
          {activeTab === 'expenses'      && renderExpensesTab()}
          {activeTab === 'window'        && renderWindowTab()}
        </View>
      </ScrollView>

      {/* Modal: Nova apreciação */}
      <Modal visible={showAppModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 24 }]}>
            <Text style={styles.modalTitle}>Elogiar {partner?.name}</Text>

            {/* Seleção de emoji */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {['❤️','🌟','💪','🙏','😍','🥰','✨','🫂'].map((e) => (
                <TouchableOpacity
                  key={e}
                  onPress={() => setAppEmoji(e)}
                  style={[styles.emojiBtn, appEmoji === e && styles.emojiBtnActive]}
                >
                  <Text style={{ fontSize: 22 }}>{e}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              value={appMessage}
              onChangeText={setAppMessage}
              placeholder="Escreva um elogio..."
              placeholderTextColor={Colors.muted}
              multiline
              maxLength={280}
              style={styles.textarea}
              autoFocus
            />
            <Text style={styles.charCount}>{appMessage.length}/280</Text>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              <TouchableOpacity
                onPress={() => { setShowAppModal(false); setAppMessage(''); }}
                style={[styles.modalBtn, styles.modalBtnSecondary]}
              >
                <Text style={styles.modalBtnSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSendAppreciation}
                disabled={savingApp || !appMessage.trim()}
                style={[styles.modalBtn, styles.modalBtnPrimary, { opacity: !appMessage.trim() ? 0.5 : 1 }]}
              >
                {savingApp
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.modalBtnPrimaryText}>Enviar ❤️</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Novo gasto */}
      <Modal visible={showExpModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 24 }]}>
            <Text style={styles.modalTitle}>Registrar gasto</Text>

            <TextInput
              value={expTitle}
              onChangeText={setExpTitle}
              placeholder="Descrição (ex: Mercado, Consulta...)"
              placeholderTextColor={Colors.muted}
              style={[styles.input, { marginBottom: 10 }]}
              autoFocus
            />
            <TextInput
              value={expAmount}
              onChangeText={setExpAmount}
              placeholder="Valor (ex: 45,90)"
              placeholderTextColor={Colors.muted}
              keyboardType="decimal-pad"
              style={[styles.input, { marginBottom: 10 }]}
            />

            {/* Categoria */}
            <Text style={styles.fieldLabel}>Categoria</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              {Object.entries(EXPENSE_CATEGORY_LABELS).map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => setExpCategory(key)}
                  style={[styles.chipBtn, expCategory === key && styles.chipBtnActive]}
                >
                  <Text style={[styles.chipText, expCategory === key && styles.chipTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Divisão */}
            <Text style={styles.fieldLabel}>Divisão</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {(['equal', 'one_pays', 'custom'] as ExpenseSplitMode[]).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  onPress={() => setExpSplit(mode)}
                  style={[styles.chipBtn, expSplit === mode && styles.chipBtnActive]}
                >
                  <Text style={[styles.chipText, expSplit === mode && styles.chipTextActive]}>
                    {EXPENSE_SPLIT_LABELS[mode]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => { setShowExpModal(false); setExpTitle(''); setExpAmount(''); }}
                style={[styles.modalBtn, styles.modalBtnSecondary]}
              >
                <Text style={styles.modalBtnSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCreateExpense}
                disabled={savingExp || !expTitle.trim() || !expAmount.trim()}
                style={[styles.modalBtn, styles.modalBtnPrimary, { opacity: !expTitle.trim() ? 0.5 : 1 }]}
              >
                {savingExp
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.modalBtnPrimaryText}>Salvar</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ─── Estilos ──────────────────────────────────────────────────
const styles = {
  label: {
    color: Colors.muted, fontSize: 12, fontWeight: '600' as const,
    letterSpacing: 0.5, textTransform: 'uppercase' as const,
  },
  pageTitle: { color: Colors.text, fontSize: 22, fontWeight: '800' as const, marginTop: 4 },
  sectionTitle: { color: Colors.text, fontSize: 16, fontWeight: '700' as const, marginBottom: 16 },

  // Abas
  tabChip: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  tabChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '22' },
  tabLabel: { color: Colors.muted, fontSize: 13, fontWeight: '600' as const },
  tabLabelActive: { color: Colors.primary },

  // Check-in de humor
  moodRow: {
    flexDirection: 'row' as const, justifyContent: 'space-between' as const, marginTop: 8,
  },
  moodBtn: { alignItems: 'center' as const, gap: 6, flex: 1 },
  moodLabel: { color: Colors.muted, fontSize: 10, textAlign: 'center' as const },
  checkinCard: {
    flexDirection: 'row' as const, alignItems: 'center' as const,
    backgroundColor: Colors.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.border, marginTop: 8,
  },
  cardTitle: { color: Colors.muted, fontSize: 12, fontWeight: '600' as const },
  cardValue: { color: Colors.text, fontSize: 16, fontWeight: '700' as const, marginTop: 2 },
  cardNote:  { color: Colors.muted, fontSize: 12, marginTop: 4 },
  editBtn: {
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 8, borderWidth: 1, borderColor: Colors.border,
  },
  editBtnText: { color: Colors.muted, fontSize: 12 },

  // Botão adicionar
  addBtn: {
    flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10,
    backgroundColor: Colors.primary + '22', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.primary + '44', marginBottom: 16,
  },
  addBtnIcon: { color: Colors.primary, fontSize: 20 },
  addBtnText: { color: Colors.primary, fontSize: 15, fontWeight: '600' as const },

  // Apreciações
  appreciationCard: {
    flexDirection: 'row' as const, alignItems: 'flex-start' as const,
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 10,
  },
  appreciationMsg: { color: Colors.text, fontSize: 14, lineHeight: 20 },
  appreciationMeta: { color: Colors.muted, fontSize: 11, marginTop: 4 },

  // Gastos
  balanceCard: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 16,
    alignItems: 'center' as const,
  },
  balanceLabel: { color: Colors.muted, fontSize: 12, fontWeight: '600' as const },
  balanceValue: { color: Colors.text, fontSize: 28, fontWeight: '800' as const, marginTop: 4 },
  expenseCard: {
    flexDirection: 'row' as const, alignItems: 'center' as const,
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 10,
  },
  expenseTitle: { color: Colors.text, fontSize: 15, fontWeight: '600' as const },
  expenseMeta:  { color: Colors.muted, fontSize: 12, marginTop: 2 },
  expenseAmount: { color: Colors.amber, fontSize: 15, fontWeight: '700' as const },
  settleBtn: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 8, backgroundColor: Colors.success + '22',
    borderWidth: 1, borderColor: Colors.success + '44',
  },
  settleBtnText: { color: Colors.success, fontSize: 11, fontWeight: '600' as const },

  // Estado vazio
  emptyState: { alignItems: 'center' as const, paddingVertical: 40 },
  emptyText: { color: Colors.muted, fontSize: 14, textAlign: 'center' as const, lineHeight: 22, marginTop: 12 },

  // Modal
  modalBackdrop: { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' as const },
  modalSheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 24,
    borderTopRightRadius: 24, padding: 24,
  },
  modalTitle: { color: Colors.text, fontSize: 18, fontWeight: '700' as const, marginBottom: 16 },
  input: {
    backgroundColor: Colors.card, borderRadius: 12, padding: 14,
    color: Colors.text, fontSize: 15,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  textarea: {
    backgroundColor: Colors.card, borderRadius: 12, padding: 14,
    color: Colors.text, fontSize: 15,
    borderWidth: 1.5, borderColor: Colors.border,
    minHeight: 100, textAlignVertical: 'top' as const,
  },
  charCount: { color: Colors.muted, fontSize: 11, textAlign: 'right' as const, marginTop: 4 },
  fieldLabel: { color: Colors.muted, fontSize: 12, fontWeight: '600' as const, marginBottom: 8 },

  // Chips
  chipBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border, marginRight: 6,
  },
  chipBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '22' },
  chipText: { color: Colors.muted, fontSize: 12 },
  chipTextActive: { color: Colors.primary, fontWeight: '600' as const },

  emojiBtn: {
    width: 44, height: 44, borderRadius: 22, marginRight: 8,
    justifyContent: 'center' as const, alignItems: 'center' as const,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  emojiBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '22' },

  // Botões do modal
  modalBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    alignItems: 'center' as const, justifyContent: 'center' as const,
  },
  modalBtnPrimary: { backgroundColor: Colors.primary },
  modalBtnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' as const },
  modalBtnSecondary: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  modalBtnSecondaryText: { color: Colors.muted, fontSize: 15 },
};

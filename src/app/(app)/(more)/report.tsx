// src/app/(app)/(more)/report.tsx
// Tela de Relatório Familiar — admin e parent

import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconBabyBottle,
  IconCalendar,
  IconChartBar,
  IconCheckbox,
  IconChevronLeft,
  IconChevronRight,
  IconCircleCheck,
  IconClock,
  IconDeviceGamepad2,
  IconFileReport,
  IconHeart,
  IconMoodSmile,
  IconScale,
  IconSchool,
  IconShare,
  IconShoppingCart,
  IconStar,
  IconUsers,
} from '@tabler/icons-react-native';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import { useFamily } from '@/hooks';
import { useReport } from '@/hooks/useReport';
import {
  FamilyReport,
  ReportBabyRow,
  ReportChildRow,
  ReportPeriod,
  ReportPeriodOptions,
} from '@/services/report/reportService';
import { exportReportPdf } from '@/services/report/reportPdf';

// ─── Helpers ─────────────────────────────────────────────────

function fmtCents(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function cap(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const MONTH_NAMES_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

const MONTH_NAMES_FULL = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

// ─── Primitivos de UI ────────────────────────────────────────

function SectionTitle({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: Spacing['3xl'], marginBottom: Spacing.md }}>
      {icon}
      <Text style={{ color: Colors.textSecondary, fontSize: FontSize.sm, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '600' }}>
        {label}
      </Text>
    </View>
  );
}

function SubLabel({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: Spacing.md, marginBottom: 4 }}>
      {icon}
      <Text style={{ color: Colors.muted, fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </Text>
    </View>
  );
}

function StatCard({ label, value, accent = false }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <View style={{
      flex: 1,
      backgroundColor: Colors.bgCard,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: accent ? Colors.primary : Colors.border,
      padding: Spacing.lg,
      alignItems: 'center',
      gap: 4,
    }}>
      <Text style={{ color: accent ? Colors.primary : Colors.textPrimary, fontSize: FontSize.xxxl, fontWeight: '700', fontFamily: 'Georgia' }}>
        {value}
      </Text>
      <Text style={{ color: Colors.muted, fontSize: FontSize.xs, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </Text>
    </View>
  );
}

function ProgressBar({ value, total, color = Colors.primary }: { value: number; total: number; color?: string }) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{ flex: 1, height: 6, backgroundColor: Colors.border, borderRadius: Radius.full, overflow: 'hidden' }}>
        <View style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: Radius.full }} />
      </View>
      <Text style={{ color: Colors.muted, fontSize: FontSize.xs, width: 32, textAlign: 'right' }}>{pct}%</Text>
    </View>
  );
}

function Card({ children, accentBorder }: { children: React.ReactNode; accentBorder?: boolean }) {
  return (
    <View style={{
      backgroundColor: Colors.bgCard,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: accentBorder ? Colors.primary : Colors.border,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      gap: Spacing.md,
    }}>
      {children}
    </View>
  );
}

// ─── MonthPickerModal ─────────────────────────────────────────

interface MonthPickerModalProps {
  visible: boolean;
  selectedMonth: number; // 1-12
  selectedYear: number;
  onSelect: (month: number, year: number) => void;
  onClose: () => void;
}

function MonthPickerModal({ visible, selectedMonth, selectedYear, onSelect, onClose }: MonthPickerModalProps) {
  const [viewYear, setViewYear] = useState(selectedYear);
  const insets = useSafeAreaInsets();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Não permite navegar para o futuro
  const canGoForward = viewYear < currentYear || (viewYear === currentYear);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={{ flex: 1, backgroundColor: '#00000088', justifyContent: 'center', alignItems: 'center' }}
      >
        <TouchableOpacity activeOpacity={1} onPress={() => {}}>
          <View style={{
            backgroundColor: Colors.bgCard,
            borderRadius: Radius.xl,
            borderWidth: 1,
            borderColor: Colors.border,
            padding: Spacing.xl,
            width: 320,
            gap: Spacing.lg,
          }}>
            {/* Cabeçalho ano */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <TouchableOpacity
                onPress={() => setViewYear((y) => y - 1)}
                style={{ padding: 6, borderRadius: Radius.md, backgroundColor: Colors.border + '44' }}
              >
                <IconChevronLeft size={18} color={Colors.muted} />
              </TouchableOpacity>

              <Text style={{ color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: '700', fontFamily: 'Georgia' }}>
                {viewYear}
              </Text>

              <TouchableOpacity
                onPress={() => setViewYear((y) => Math.min(currentYear, y + 1))}
                disabled={viewYear >= currentYear}
                style={{ padding: 6, borderRadius: Radius.md, backgroundColor: viewYear >= currentYear ? 'transparent' : Colors.border + '44' }}
              >
                <IconChevronRight size={18} color={viewYear >= currentYear ? Colors.border : Colors.muted} />
              </TouchableOpacity>
            </View>

            {/* Grade de meses */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {MONTH_NAMES_SHORT.map((name, idx) => {
                const m = idx + 1;
                const isFuture = viewYear > currentYear || (viewYear === currentYear && m > currentMonth);
                const isSelected = m === selectedMonth && viewYear === selectedYear;
                const isCurrentMonth = m === currentMonth && viewYear === currentYear;

                return (
                  <TouchableOpacity
                    key={m}
                    disabled={isFuture}
                    onPress={() => { onSelect(m, viewYear); onClose(); }}
                    style={{
                      width: '22%',
                      aspectRatio: 1.6,
                      borderRadius: Radius.md,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isSelected ? Colors.primary : isCurrentMonth ? Colors.primaryBg : Colors.bg,
                      borderWidth: isCurrentMonth && !isSelected ? 1 : 0,
                      borderColor: Colors.primary,
                      opacity: isFuture ? 0.3 : 1,
                    }}
                  >
                    <Text style={{
                      color: isSelected ? '#fff' : isCurrentMonth ? Colors.primary : Colors.textSecondary,
                      fontSize: FontSize.sm,
                      fontWeight: isSelected || isCurrentMonth ? '700' : '400',
                    }}>
                      {name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Botão cancelar */}
            <TouchableOpacity
              onPress={onClose}
              style={{ alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 20 }}
            >
              <Text style={{ color: Colors.muted, fontSize: FontSize.sm }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Tela principal ──────────────────────────────────────────

export default function ReportScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { family } = useFamily();
  const { report, loading, error, generate } = useReport(family?.id);

  const now = new Date();
  const [period, setPeriod]             = useState<ReportPeriod>('month');
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear]   = useState(now.getFullYear());
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [exporting, setExporting]         = useState(false);

  const periodLabel = useMemo(() => {
    if (period === 'all') return 'Todo período';
    return `${MONTH_NAMES_FULL[selectedMonth - 1]} ${selectedYear}`;
  }, [period, selectedMonth, selectedYear]);

  const handleGenerate = useCallback((p: ReportPeriod, month?: number, year?: number) => {
    const opts: ReportPeriodOptions = {
      period: p,
      month: p === 'month' ? (month ?? selectedMonth) : undefined,
      year:  p === 'month' ? (year  ?? selectedYear)  : undefined,
    };
    generate(opts);
  }, [generate, selectedMonth, selectedYear]);

  const handleSelectPeriod = useCallback((p: ReportPeriod) => {
    setPeriod(p);
    handleGenerate(p);
  }, [handleGenerate]);

  const handleMonthSelect = useCallback((month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    if (period === 'month') handleGenerate('month', month, year);
  }, [period, handleGenerate]);

  const handleExport = useCallback(async () => {
    if (!report) return;
    setExporting(true);
    try {
      await exportReportPdf(report);
    } finally {
      setExporting(false);
    }
  }, [report]);

  const tasksDoneRate = report && report.tasks_total > 0
    ? Math.round((report.tasks_done / report.tasks_total) * 100)
    : 0;
  const shoppingRate = report && report.shopping_total_items > 0
    ? Math.round((report.shopping_checked_items / report.shopping_total_items) * 100)
    : 0;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + Spacing.lg,
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: Spacing.lg,
        }}
      >
        {/* ── Header ──────────────────────────────────────────── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: Spacing.xl }}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <IconArrowLeft size={22} color={Colors.muted} />
          </TouchableOpacity>
          <Text style={{ flex: 1, fontFamily: 'Georgia', fontSize: FontSize.xxl, color: Colors.textPrimary }}>
            relatório familiar
          </Text>
          {report && (
            <TouchableOpacity
              onPress={handleExport}
              disabled={exporting}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: Colors.primary,
                borderRadius: Radius.md,
                paddingHorizontal: 14,
                paddingVertical: 8,
              }}
            >
              {exporting
                ? <ActivityIndicator size="small" color="#fff" />
                : <IconShare size={15} color="#fff" />}
              <Text style={{ color: '#fff', fontSize: FontSize.sm, fontWeight: '600' }}>
                {exporting ? 'gerando…' : 'exportar PDF'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Filtro de período ────────────────────────────────── */}
        <View style={{
          backgroundColor: Colors.bgCard,
          borderRadius: Radius.lg,
          borderWidth: 1,
          borderColor: Colors.border,
          padding: Spacing.md,
          marginBottom: Spacing.xl,
          gap: Spacing.md,
        }}>
          {/* Toggle Mês / Todo período */}
          <View style={{ flexDirection: 'row', backgroundColor: Colors.bg, borderRadius: Radius.md, padding: 3, gap: 3 }}>
            {(['month', 'all'] as ReportPeriod[]).map((p) => {
              const active = period === p;
              return (
                <TouchableOpacity
                  key={p}
                  onPress={() => handleSelectPeriod(p)}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    paddingVertical: 9,
                    borderRadius: Radius.sm,
                    alignItems: 'center',
                    backgroundColor: active ? Colors.primary : 'transparent',
                  }}
                >
                  <Text style={{
                    color: active ? '#fff' : Colors.muted,
                    fontSize: FontSize.sm,
                    fontWeight: active ? '700' : '400',
                  }}>
                    {p === 'month' ? 'Por mês' : 'Todo período'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Seletor de mês — só quando period === 'month' */}
          {period === 'month' && (
            <TouchableOpacity
              onPress={() => setMonthPickerOpen(true)}
              activeOpacity={0.8}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: Colors.bg,
                borderRadius: Radius.md,
                borderWidth: 1,
                borderColor: Colors.borderMid,
                paddingHorizontal: Spacing.lg,
                paddingVertical: Spacing.md,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <IconCalendar size={16} color={Colors.primary} />
                <Text style={{ color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '600' }}>
                  {periodLabel}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>alterar</Text>
                <IconChevronRight size={14} color={Colors.muted} />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Sem dados ─────────────────────────────────────────── */}
        {!report && !loading && !error && (
          <View style={{ alignItems: 'center', paddingVertical: 60, gap: Spacing.lg }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primaryBg, alignItems: 'center', justifyContent: 'center' }}>
              <IconFileReport size={32} color={Colors.primary} />
            </View>
            <Text style={{ color: Colors.textSecondary, fontSize: FontSize.lg, textAlign: 'center', fontWeight: '600' }}>
              Nenhum relatório gerado
            </Text>
            <Text style={{ color: Colors.muted, fontSize: FontSize.md, textAlign: 'center', lineHeight: 20 }}>
              Selecione o período acima e toque em{'\n'}"Por mês" ou "Todo período" para gerar.
            </Text>
          </View>
        )}

        {/* ── Loading ───────────────────────────────────────────── */}
        {loading && (
          <View style={{ alignItems: 'center', paddingVertical: 60, gap: Spacing.lg }}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={{ color: Colors.muted, fontSize: FontSize.md }}>Gerando relatório…</Text>
          </View>
        )}

        {/* ── Erro ─────────────────────────────────────────────── */}
        {error && !loading && (
          <Card accentBorder>
            <View style={{ alignItems: 'center', gap: Spacing.md }}>
              <IconAlertTriangle size={32} color={Colors.error} />
              <Text style={{ color: Colors.textPrimary, fontSize: FontSize.md, textAlign: 'center' }}>{error}</Text>
              <TouchableOpacity
                onPress={() => handleGenerate(period)}
                style={{ backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: Spacing.xl, paddingVertical: 10 }}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* ── Conteúdo do relatório ───────────────────────────── */}
        {report && !loading && (
          <ReportContent report={report} tasksDoneRate={tasksDoneRate} shoppingRate={shoppingRate} />
        )}
      </ScrollView>

      {/* ── Month Picker Modal ───────────────────────────────── */}
      <MonthPickerModal
        visible={monthPickerOpen}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onSelect={handleMonthSelect}
        onClose={() => setMonthPickerOpen(false)}
      />
    </View>
  );
}

// ─── Conteúdo completo do relatório ──────────────────────────

function ReportContent({
  report,
  tasksDoneRate,
  shoppingRate,
}: {
  report: FamilyReport;
  tasksDoneRate: number;
  shoppingRate: number;
}) {
  const totalBabyLogs = report.babies.reduce((s, b) => s + b.logs_total, 0);

  return (
    <>
      {/* ── Cabeçalho ──────────────────────────────────────── */}
      <Card>
        <Text style={{ fontFamily: 'Georgia', fontSize: FontSize.xxl, color: Colors.textPrimary }}>
          {report.family_name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <IconCalendar size={14} color={Colors.secondary} />
          <Text style={{ color: Colors.secondary, fontSize: FontSize.sm, fontWeight: '600' }}>
            {cap(report.period_label)}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <IconClock size={12} color={Colors.muted} />
          <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>
            Gerado em {new Date(report.generated_at).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </Card>

      {/* ── Visão geral ────────────────────────────────────── */}
      <SectionTitle label="visão geral" icon={<IconChartBar size={14} color={Colors.secondary} />} />
      <View style={{ flexDirection: 'row', gap: Spacing.md }}>
        <StatCard label="tarefas" value={report.tasks_total} />
        <StatCard label="concluídas" value={report.tasks_done} accent />
        <StatCard label="reg. bebê" value={totalBabyLogs} />
      </View>
      <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md }}>
        <StatCard label="itens compras" value={report.shopping_total_items} />
        <StatCard label="comprados" value={report.shopping_checked_items} accent />
        <StatCard label="gastos" value={fmtCents(report.expenses_total_cents)} />
      </View>

      {/* ── Membros ────────────────────────────────────────── */}
      <SectionTitle label="contribuição por membro" icon={<IconUsers size={14} color={Colors.secondary} />} />
      {report.members.map((m, idx) => (
        <Card key={m.member_id}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: '600' }}>
              {m.member_name}
            </Text>
            <View style={{ backgroundColor: (idx === 0 ? Colors.primary : Colors.secondary) + '22', borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3 }}>
              <Text style={{ color: idx === 0 ? Colors.primary : Colors.secondary, fontSize: FontSize.xs, fontWeight: '600' }}>
                {m.mental_load_pct}% carga
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
            <MemberChip icon="✔" label="tarefas feitas" value={m.tasks_done} />
            <MemberChip icon="⏳" label="pendentes"     value={m.tasks_pending} />
            <MemberChip icon="👶" label="reg. bebê"    value={m.baby_logs} />
            <MemberChip icon="🛒" label="compras"       value={m.shopping_added} />
            <MemberChip icon="💬" label="check-ins"     value={m.couple_checkins} />
          </View>
          <View style={{ height: 6, backgroundColor: Colors.border, borderRadius: Radius.full, overflow: 'hidden' }}>
            <View style={{ width: `${m.mental_load_pct}%`, height: '100%', backgroundColor: idx === 0 ? Colors.primary : Colors.secondary, borderRadius: Radius.full }} />
          </View>
        </Card>
      ))}

      {/* ── Tarefas ────────────────────────────────────────── */}
      <SectionTitle label="tarefas" icon={<IconCheckbox size={14} color={Colors.secondary} />} />
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: Colors.textPrimary, fontSize: FontSize.md }}>Taxa de conclusão</Text>
          <Text style={{ color: Colors.primary, fontWeight: '700', fontSize: FontSize.md }}>{tasksDoneRate}%</Text>
        </View>
        <ProgressBar value={report.tasks_done} total={report.tasks_total} />
        {report.tasks_by_category.map((cat) => {
          const catTotal = cat.done + cat.pending;
          return (
            <View key={cat.category} style={{ gap: 4 }}>
              <View style={{ height: 1, backgroundColor: Colors.border }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: Colors.textSecondary, fontSize: FontSize.sm }}>{cap(cat.category)}</Text>
                <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>{cat.done}/{catTotal}</Text>
              </View>
              <ProgressBar value={cat.done} total={catTotal} color={Colors.secondary} />
            </View>
          );
        })}
      </Card>

      {/* ── Bebês ── um card por bebê ───────────────────────── */}
      {report.babies.length > 0 && (
        <>
          <SectionTitle
            label={report.babies.length === 1 ? 'bebê' : `bebês (${report.babies.length})`}
            icon={<IconBabyBottle size={14} color={Colors.secondary} />}
          />
          {report.babies.map((baby) => (
            <BabyCard key={baby.baby_id} baby={baby} />
          ))}
        </>
      )}

      {/* ── Compras ────────────────────────────────────────── */}
      {report.shopping_total_items > 0 && (
        <>
          <SectionTitle label="lista de compras" icon={<IconShoppingCart size={14} color={Colors.secondary} />} />
          <Card>
            <View style={{ flexDirection: 'row', gap: Spacing.md }}>
              <StatCard label="adicionados" value={report.shopping_total_items} />
              <StatCard label="comprados" value={report.shopping_checked_items} accent />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: Colors.textPrimary, fontSize: FontSize.md }}>Itens comprados</Text>
              <Text style={{ color: Colors.primary, fontWeight: '700', fontSize: FontSize.md }}>{shoppingRate}%</Text>
            </View>
            <ProgressBar value={report.shopping_checked_items} total={report.shopping_total_items} />
          </Card>
        </>
      )}

      {/* ── Gastos ─────────────────────────────────────────── */}
      {report.expenses_total_cents > 0 && (
        <>
          <SectionTitle label="gastos do casal" icon={<IconHeart size={14} color={Colors.secondary} />} />
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: Colors.muted, fontSize: FontSize.sm }}>Total</Text>
              <Text style={{ color: Colors.primary, fontSize: FontSize.xxl, fontWeight: '700', fontFamily: 'Georgia' }}>
                {fmtCents(report.expenses_total_cents)}
              </Text>
            </View>
            {report.expenses_by_category
              .sort((a, b) => b.total_cents - a.total_cents)
              .map((cat) => (
                <View key={cat.category} style={{ gap: 4 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: Colors.textSecondary, fontSize: FontSize.sm }}>{cap(cat.category)}</Text>
                    <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>{fmtCents(cat.total_cents)} · {cat.count}x</Text>
                  </View>
                  <ProgressBar value={cat.total_cents} total={report.expenses_total_cents} color={Colors.secondary} />
                </View>
              ))}
          </Card>
        </>
      )}

      {/* ── Carga mental ───────────────────────────────────── */}
      <SectionTitle label="equilíbrio de carga mental" icon={<IconScale size={14} color={Colors.secondary} />} />
      <Card accentBorder={!report.mental_load_balanced}>
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 8,
          backgroundColor: report.mental_load_balanced ? '#22c55e18' : Colors.primary + '18',
          borderRadius: Radius.md, padding: Spacing.md,
        }}>
          {report.mental_load_balanced
            ? <IconCircleCheck size={18} color="#22c55e" />
            : <IconAlertTriangle size={18} color={Colors.primary} />}
          <Text style={{ color: report.mental_load_balanced ? '#22c55e' : Colors.primary, fontSize: FontSize.md, fontWeight: '600', flex: 1 }}>
            {report.mental_load_balanced
              ? 'Carga bem distribuída'
              : `Desequilíbrio de ${report.mental_load_imbalance_pct}%`}
          </Text>
        </View>
        {[...report.members]
          .sort((a, b) => b.mental_load_points - a.mental_load_points)
          .map((m, idx) => (
            <View key={m.member_id} style={{ gap: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: Colors.textPrimary, fontSize: FontSize.md }}>{m.member_name}</Text>
                <Text style={{ color: Colors.muted, fontSize: FontSize.sm }}>{m.mental_load_points} pts · {m.mental_load_pct}%</Text>
              </View>
              <View style={{ height: 8, backgroundColor: Colors.border, borderRadius: Radius.full, overflow: 'hidden' }}>
                <View style={{ width: `${m.mental_load_pct}%`, height: '100%', backgroundColor: idx === 0 ? Colors.primary : Colors.secondary, borderRadius: Radius.full }} />
              </View>
            </View>
          ))}
      </Card>

      {/* ── Filhos ─────────────────────────────────────────── */}
      {report.children.length > 0 && (
        <>
          <SectionTitle label="filhos" icon={<IconUsers size={14} color={Colors.secondary} />} />
          {report.children.map((child) => (
            <ChildCard key={child.child_id} child={child} period={report.period} />
          ))}
        </>
      )}

      <View style={{ height: Spacing.xxl }} />
    </>
  );
}

// ─── BabyCard ─────────────────────────────────────────────────

function BabyCard({ baby }: { baby: ReportBabyRow }) {
  if (baby.logs_total === 0) return null;
  return (
    <Card>
      <View style={{ gap: 2 }}>
        <Text style={{ fontFamily: 'Georgia', fontSize: FontSize.xl, color: Colors.textPrimary, fontWeight: '600' }}>
          {baby.baby_name}
        </Text>
        {baby.birth_date ? (
          <Text style={{ color: Colors.muted, fontSize: FontSize.sm }}>
            Nascimento: {new Date(baby.birth_date + 'T00:00:00').toLocaleDateString('pt-BR')}
          </Text>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row' }}>
        <StatCard label="registros" value={baby.logs_total} />
      </View>

      {baby.logs_by_type
        .sort((a, b) => b.count - a.count)
        .map((item) => (
          <View key={item.type} style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: Colors.textSecondary, fontSize: FontSize.sm }}>{item.label}</Text>
              <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>{item.count} registros</Text>
            </View>
            <ProgressBar value={item.count} total={baby.logs_total} color={Colors.secondary} />
          </View>
        ))}
    </Card>
  );
}

// ─── ChildCard ────────────────────────────────────────────────

function ChildCard({ child, period }: { child: ReportChildRow; period: ReportPeriod }) {
  const hwTotal       = child.homework_done + child.homework_pending;
  const hwRate        = hwTotal > 0 ? Math.round((child.homework_done / hwTotal) * 100) : 0;
  const mealTotal     = child.meals_great + child.meals_ok + child.meals_refused;
  const mealAccept    = mealTotal > 0 ? Math.round(((child.meals_great + child.meals_ok) / mealTotal) * 100) : 0;

  return (
    <Card>
      <Text style={{ fontFamily: 'Georgia', fontSize: FontSize.xl, color: Colors.textPrimary, fontWeight: '600' }}>
        {child.child_name}
      </Text>

      {/* Tarefas e pontos */}
      <SubLabel label="tarefas e pontos" icon={<IconCheckbox size={12} color={Colors.secondary} />} />
      <View style={{ flexDirection: 'row', gap: Spacing.md }}>
        <StatCard label="feitas"    value={child.tasks_done} accent />
        <StatCard label="pendentes" value={child.tasks_pending} />
        <StatCard label="pontos"    value={child.total_points} />
      </View>
      {child.allowance_cents > 0 && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.bg, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border }}>
          <Text style={{ color: Colors.muted, fontSize: FontSize.sm }}>Mesada estimada</Text>
          <Text style={{ color: Colors.primary, fontSize: FontSize.xl, fontWeight: '700' }}>
            {fmtCents(child.allowance_cents)}
          </Text>
        </View>
      )}

      {/* Conquistas */}
      {child.achievements_total > 0 && (
        <>
          <SubLabel label="conquistas" icon={<IconStar size={12} color={Colors.secondary} />} />
          <View style={{ flexDirection: 'row', gap: Spacing.md }}>
            <StatCard label="total" value={child.achievements_total} />
            {child.achievements_new > 0 && (
              <StatCard label={period === 'month' ? 'este mês' : 'no período'} value={child.achievements_new} accent />
            )}
          </View>
        </>
      )}

      {/* Deveres */}
      {hwTotal > 0 && (
        <>
          <SubLabel label="deveres de casa" icon={<IconSchool size={12} color={Colors.secondary} />} />
          <View style={{ flexDirection: 'row', gap: Spacing.md }}>
            <StatCard label="entregues" value={child.homework_done} accent />
            <StatCard label="pendentes" value={child.homework_pending} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: Colors.textSecondary, fontSize: FontSize.sm }}>Taxa de entrega</Text>
            <Text style={{ color: Colors.primary, fontWeight: '700', fontSize: FontSize.sm }}>{hwRate}%</Text>
          </View>
          <ProgressBar value={child.homework_done} total={hwTotal} />
        </>
      )}

      {/* Alimentação */}
      {mealTotal > 0 && (
        <>
          <SubLabel label="alimentação" icon={<IconMoodSmile size={12} color={Colors.secondary} />} />
          <View style={{ flexDirection: 'row', gap: Spacing.md }}>
            <StatCard label="registros"  value={child.meals_total} />
            <StatCard label="comeu bem"  value={child.meals_great} accent />
            <StatCard label="recusou"    value={child.meals_refused} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: Colors.textSecondary, fontSize: FontSize.sm }}>Taxa de aceitação</Text>
            <Text style={{ color: Colors.primary, fontWeight: '700', fontSize: FontSize.sm }}>{mealAccept}%</Text>
          </View>
          <ProgressBar value={child.meals_great + child.meals_ok} total={mealTotal} />
        </>
      )}

      {/* Tempo de tela */}
      {child.screen_time_avg_min > 0 && (
        <>
          <SubLabel label="tempo de tela" icon={<IconDeviceGamepad2 size={12} color={Colors.secondary} />} />
          <View style={{ flexDirection: 'row', gap: Spacing.md }}>
            <StatCard label="média/dia (min)" value={child.screen_time_avg_min} />
            {child.screen_time_over_limit_days > 0 && (
              <StatCard label="dias c/ excesso" value={child.screen_time_over_limit_days} />
            )}
          </View>
          {child.screen_time_over_limit_days > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary + '18', borderRadius: Radius.md, padding: Spacing.md }}>
              <IconAlertTriangle size={14} color={Colors.primary} />
              <Text style={{ color: Colors.primary, fontSize: FontSize.sm, flex: 1 }}>
                {child.screen_time_over_limit_days}{' '}
                {child.screen_time_over_limit_days === 1 ? 'dia ultrapassou' : 'dias ultrapassaram'} o limite combinado.
              </Text>
            </View>
          )}
        </>
      )}
    </Card>
  );
}

// ─── MemberChip ──────────────────────────────────────────────

function MemberChip({ icon, label, value }: { icon: string; label: string; value: number }) {
  if (value === 0) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.bg, borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: Colors.border }}>
      <Text style={{ fontSize: FontSize.xs }}>{icon}</Text>
      <Text style={{ color: Colors.textPrimary, fontSize: FontSize.xs, fontWeight: '600' }}>{value}</Text>
      <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>{label}</Text>
    </View>
  );
}

// src/app/(app)/(mental-load)/checkin.tsx
// UC030 — Check-in semanal guiado
// 3 perguntas exibidas uma por vez; respostas visíveis apenas para os adultos da família

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFamily } from '@/context/FamilyContext';
import {
  weeklyCheckinService,
  currentWeekStart,
  WeeklyCheckinAnswer,
} from '@/services/mental-load/weeklyCheckinService';
import { Colors, Radius, Spacing, FontSize } from '@/constants/theme';

// ─── Perguntas guiadas ────────────────────────────────────────────

const QUESTIONS = [
  {
    label:       'Como você se sentiu em relação à divisão das responsabilidades essa semana?',
    placeholder: 'Ex: me senti sobrecarregado(a) com as tarefas noturnas…',
  },
  {
    label:       'O que funcionou bem na parceria essa semana?',
    placeholder: 'Ex: dividimos as refeições de forma equilibrada…',
  },
  {
    label:       'O que você gostaria de ajustar para a próxima semana?',
    placeholder: 'Ex: precisamos combinar quem cuida do banho…',
  },
] as const;

// ─── Indicador de progresso ───────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: Spacing.sm, justifyContent: 'center', marginBottom: Spacing.xl }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            height:          4,
            flex:            1,
            borderRadius:    Radius.full,
            backgroundColor: i <= current ? Colors.primary : Colors.border,
          }}
        />
      ))}
    </View>
  );
}

// ─── Tela principal ───────────────────────────────────────────────

export default function WeeklyCheckinScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { family } = useFamily();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>(['', '', '']);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLastStep = step === QUESTIONS.length - 1;

  const handleNext = useCallback(async () => {
    if (!answers[step].trim()) return; // não avança sem resposta

    if (!isLastStep) {
      setStep(s => s + 1);
      return;
    }

    // Última pergunta — salva no banco
    if (!family?.id) {
      setError('Família não encontrada');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload: WeeklyCheckinAnswer[] = answers.map((answer, index) => ({
        question_index: index,
        answer: answer.trim(),
      }));

      await weeklyCheckinService.upsert({
        family_id:  family.id,
        week_start: currentWeekStart(),
        answers:    payload,
      });

      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar check-in');
    } finally {
      setSaving(false);
    }
  }, [step, answers, isLastStep, family?.id]);

  const updateAnswer = useCallback((text: string) => {
    setAnswers(prev => {
      const next = [...prev];
      next[step] = text;
      return next;
    });
  }, [step]);

  // ─── Estado: concluído ─────────────────────────────────────────

  if (done) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, paddingTop: insets.top }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl }}>
          <Text style={{ fontSize: 56, marginBottom: Spacing.xl }}>🎉</Text>
          <Text style={{ fontSize: FontSize.xxl, fontWeight: '500', color: Colors.text, textAlign: 'center', marginBottom: Spacing.md }}>
            check-in concluído!
          </Text>
          <Text style={{ fontSize: FontSize.base, color: Colors.muted, textAlign: 'center', marginBottom: Spacing.xl, lineHeight: 22 }}>
            suas respostas foram salvas e são visíveis apenas para os adultos da família.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              backgroundColor: Colors.primary,
              borderRadius:    Radius.md,
              paddingVertical: Spacing.lg,
              paddingHorizontal: Spacing.xl,
            }}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: FontSize.base, fontWeight: '500', color: Colors.onLight }}>
              voltar para carga mental
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── Formulário ────────────────────────────────────────────────

  const question  = QUESTIONS[step];
  const hasAnswer = answers[step].trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ paddingTop: insets.top }}>
        {/* Header */}
        <View style={{
          flexDirection:     'row',
          alignItems:        'center',
          paddingHorizontal: Spacing.lg,
          paddingVertical:   Spacing.lg,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
          gap:               Spacing.md,
        }}>
          <TouchableOpacity
            onPress={step === 0 ? () => router.back() : () => setStep(s => s - 1)}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 24, color: Colors.primary }}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: FontSize.xl, fontWeight: '500', color: Colors.text }}>
              check-in semanal
            </Text>
            <Text style={{ fontSize: FontSize.xs, color: Colors.muted, marginTop: 2 }}>
              pergunta {step + 1} de {QUESTIONS.length}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding:       Spacing.xl,
          paddingBottom: insets.bottom + 40,
          flexGrow:      1,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Indicador de passo */}
        <StepIndicator current={step} total={QUESTIONS.length} />

        {/* Pergunta */}
        <View style={{
          backgroundColor: Colors.card,
          borderRadius:    Radius.lg,
          padding:         Spacing.xl,
          borderWidth:     1,
          borderColor:     Colors.border,
          marginBottom:    Spacing.xl,
        }}>
          <Text style={{
            fontSize:   FontSize.xs,
            fontWeight: '500',
            color:      Colors.primary,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: Spacing.sm,
          }}>
            pergunta {step + 1}
          </Text>
          <Text style={{
            fontSize:   FontSize.lg,
            fontWeight: '500',
            color:      Colors.text,
            lineHeight: 24,
          }}>
            {question.label}
          </Text>
        </View>

        {/* Campo de resposta */}
        <TextInput
          value={answers[step]}
          onChangeText={updateAnswer}
          placeholder={question.placeholder}
          placeholderTextColor={Colors.border}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          style={{
            backgroundColor: Colors.card,
            borderRadius:    Radius.md,
            borderWidth:     1,
            borderColor:     hasAnswer ? Colors.primary : Colors.border,
            color:           Colors.text,
            fontSize:        FontSize.base,
            padding:         Spacing.lg,
            minHeight:       120,
            marginBottom:    Spacing.xl,
            lineHeight:      22,
          }}
        />

        {/* Erro */}
        {error && (
          <View style={{
            backgroundColor: Colors.card,
            borderRadius:    Radius.md,
            padding:         Spacing.md,
            borderWidth:     1,
            borderColor:     Colors.error,
            marginBottom:    Spacing.lg,
          }}>
            <Text style={{ color: Colors.error, fontSize: FontSize.sm }}>{error}</Text>
          </View>
        )}

        {/* Aviso de privacidade */}
        <View style={{
          backgroundColor: Colors.card,
          borderRadius:    Radius.sm,
          padding:         Spacing.md,
          borderWidth:     1,
          borderColor:     Colors.border,
          marginBottom:    Spacing.xl,
        }}>
          <Text style={{ fontSize: FontSize.xs, color: Colors.muted, textAlign: 'center' }}>
            🔒 suas respostas são visíveis apenas para os adultos da família
          </Text>
        </View>

        {/* Botão avançar / concluir */}
        <TouchableOpacity
          onPress={handleNext}
          disabled={!hasAnswer || saving}
          activeOpacity={0.8}
          style={{
            backgroundColor: hasAnswer ? Colors.primary : Colors.border,
            borderRadius:    Radius.md,
            paddingVertical: Spacing.lg,
            alignItems:      'center',
          }}
        >
          {saving ? (
            <ActivityIndicator size="small" color={Colors.onLight} />
          ) : (
            <Text style={{ fontSize: FontSize.base, fontWeight: '500', color: Colors.onLight }}>
              {isLastStep ? 'concluir check-in' : 'próxima pergunta →'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

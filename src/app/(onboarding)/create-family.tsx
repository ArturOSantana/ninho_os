// src/app/(onboarding)/create-family.tsx

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFamily } from '@/hooks';
import { Colors, Radius, Spacing, FontSize } from '@/constants/theme';

export default function CreateFamilyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { createFamily, loading, clearError } = useFamily();
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    try {
      setSubmitting(true);
      clearError();
      await createFamily({ name: name.trim() });
      router.push('/(onboarding)/add-baby');
    } catch (err) {
      Alert.alert('Erro', err instanceof Error ? err.message : 'Erro ao criar família', [
        { text: 'Tentar novamente', onPress: () => setSubmitting(false) },
      ]);
    } finally {
      setSubmitting(false);
    }
  };

  const isLoading = loading || submitting;

  return (
    <View style={[s.root, { paddingTop: insets.top + Spacing.xxl, paddingBottom: insets.bottom + Spacing.xl }]}>
      {/* Voltar */}
      <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
        <Text style={s.backText}>← voltar</Text>
      </TouchableOpacity>

      {/* Step indicator */}
      <View style={s.steps}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={[s.stepDot, i === 2 && s.stepDotActive]} />
        ))}
      </View>

      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Text style={s.title}>como se chama sua família?</Text>
        <Text style={s.sub}>escolha um nome que represente vocês — pode ser o sobrenome ou algo especial</Text>

        <TextInput
          style={s.input}
          value={name}
          onChangeText={setName}
          placeholder="ex: família Silva"
          placeholderTextColor={Colors.muted}
          autoCapitalize="words"
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
          maxLength={60}
          accessibilityLabel="Nome da família"
          accessibilityHint="Digite o nome que identifica a sua família"
        />
      </View>

      <TouchableOpacity
        style={[s.btnPrimary, (!name.trim() || isLoading) && { opacity: 0.5 }]}
        onPress={handleSubmit}
        disabled={!name.trim() || isLoading}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Continuar"
        accessibilityState={{ disabled: !name.trim() || isLoading }}
      >
        {isLoading
          ? <ActivityIndicator color={Colors.onLight} />
          : <Text style={s.btnPrimaryText}>continuar →</Text>}
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingHorizontal: Spacing.xxl,
  },
  backBtn: { marginBottom: Spacing.xl },
  backText: { color: Colors.muted, fontSize: FontSize.sm, fontWeight: '400' },

  steps: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing.xxl * 2,
  },
  stepDot: {
    width: 28,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  stepDotActive: { backgroundColor: Colors.primary },

  title: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '500',
    marginBottom: Spacing.md,
    lineHeight: 28,
  },
  sub: {
    color: Colors.muted,
    fontSize: FontSize.base,
    fontWeight: '400',
    lineHeight: 20,
    marginBottom: Spacing.xxl,
  },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '400',
  },

  btnPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: Colors.onLight,
    fontSize: FontSize.lg,
    fontWeight: '500',
  },
});

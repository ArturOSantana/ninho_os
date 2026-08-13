// src/app/(app)/(baby)/edit-baby.tsx
// Edição de nome e data de nascimento do bebê atual

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconChevronLeft } from '@tabler/icons-react-native';
import { useFamily } from '@/hooks';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import { familyService } from '@/services/family/familyService';

export default function EditBabyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { type, id, name: paramName, birth_date: paramBirthDate } = useLocalSearchParams<{
    type?: string;
    id?: string;
    name?: string;
    birth_date?: string;
  }>();
  const { currentBaby, updateBaby } = useFamily();

  // Usa os params quando disponíveis (baby e child), senão cai no contexto como fallback
  const [name, setName] = useState(paramName ?? currentBaby?.name ?? '');
  const [birthDate, setBirthDate] = useState(paramBirthDate ?? currentBaby?.birth_date ?? '');
  const [loading, setLoading] = useState(false);

  // Aceita qualquer texto — valida apenas no save
  function handleBirthDateChange(text: string) {
    setBirthDate(text);
  }

  // Limites de data: mínimo = 6 anos atrás, máximo = hoje
  const today     = new Date(); today.setHours(0, 0, 0, 0);
  const minDate   = new Date(today); minDate.setFullYear(today.getFullYear() - 6);
  const minStr    = minDate.toISOString().slice(0, 10);
  const maxStr    = today.toISOString().slice(0, 10);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Nome obrigatório', type === 'child' ? 'Por favor, informe o nome do filho.' : 'Por favor, informe o nome do bebê.');
      return;
    }
    if (birthDate) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
        Alert.alert('Data inválida', 'Use o formato AAAA-MM-DD (ex: 2024-03-15).');
        return;
      }
      if (birthDate > maxStr) {
        Alert.alert('Data inválida', 'A data de nascimento não pode ser no futuro.');
        return;
      }
      if (birthDate < minStr) {
        Alert.alert('Data inválida', 'O módulo bebê é para crianças de até 6 anos. Para filhos mais velhos, use o módulo Filhos.');
        return;
      }
    }

    try {
      setLoading(true);
      if (type === 'child') {
        if (!id) throw new Error('ID do filho não encontrado');
        await familyService.updateChildProfile(id, name.trim(), birthDate);
      } else {
        // baby: usa id do param se disponível, senão cai no currentBaby
        const babyId = id ?? currentBaby?.id;
        if (!babyId) return;
        const updates: { name: string; birth_date?: string } = { name: name.trim() };
        if (birthDate) updates.birth_date = birthDate;
        await updateBaby(babyId, updates);
      }
      router.back();
    } catch (err: any) {
      Alert.alert('Erro', err.message ?? 'Não foi possível salvar as alterações.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + Spacing.md,
          paddingBottom: Spacing.md,
          paddingHorizontal: Spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={8}
          style={{
            width: 36,
            height: 36,
            borderRadius: Radius.md,
            backgroundColor: Colors.bgCard,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: Colors.border,
          }}
        >
          <IconChevronLeft size={18} color={Colors.text} />
        </TouchableOpacity>
        <Text style={{ color: Colors.text, fontSize: FontSize.lg, fontWeight: '500' }}>
          {type === 'child' ? 'editar filho' : 'editar bebê'}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: Spacing.lg,
          paddingBottom: insets.bottom + 40,
        }}
      >
        {/* Nome */}
        <Text style={{ color: Colors.muted, fontSize: FontSize.sm, marginBottom: 6 }}>
          nome
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={type === 'child' ? 'Nome do filho' : 'Nome do bebê'}
          placeholderTextColor={Colors.muted}
          style={{
            backgroundColor: Colors.bgCard,
            borderWidth: 1,
            borderColor: Colors.border,
            borderRadius: Radius.md,
            paddingHorizontal: Spacing.lg,
            paddingVertical: 14,
            color: Colors.text,
            fontSize: FontSize.lg,
            marginBottom: Spacing.xl,
          }}
        />

        {/* Data de nascimento */}
        <Text style={{ color: Colors.muted, fontSize: FontSize.sm, marginBottom: 6 }}>
          data de nascimento
        </Text>
        {Platform.OS === 'web' ? (
          <input
            type="date"
            value={birthDate}
            min={minStr}
            max={maxStr}
            onChange={(e) => setBirthDate(e.target.value)}
            style={{
              backgroundColor: Colors.bgCard,
              border: `1px solid ${Colors.border}`,
              borderRadius: Radius.md,
              paddingLeft: Spacing.lg,
              paddingRight: Spacing.lg,
              paddingTop: 14,
              paddingBottom: 14,
              color: Colors.text,
              fontSize: FontSize.lg,
              marginBottom: Spacing.xl,
              width: '100%',
              display: 'block',
              outline: 'none',
              colorScheme: 'dark',
            } as any}
          />
        ) : (
          <TextInput
            value={birthDate}
            onChangeText={handleBirthDateChange}
            placeholder="AAAA-MM-DD"
            placeholderTextColor={Colors.muted}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            style={{
              backgroundColor: Colors.bgCard,
              borderWidth: 1,
              borderColor: Colors.border,
              borderRadius: Radius.md,
              paddingHorizontal: Spacing.lg,
              paddingVertical: 14,
              color: Colors.text,
              fontSize: FontSize.lg,
              marginBottom: Spacing.xl,
            }}
          />
        )}

        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.82}
          style={{
            backgroundColor: Colors.primary,
            borderRadius: Radius.lg,
            height: 52,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {loading ? (
            <ActivityIndicator color={Colors.textOnLight} />
          ) : (
            <Text style={{ color: Colors.textOnLight, fontSize: FontSize.lg, fontWeight: '600' }}>
              salvar alterações
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

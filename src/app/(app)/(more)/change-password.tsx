// src/app/(app)/(more)/change-password.tsx
// Tela de troca de senha

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
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconChevronLeft } from '@tabler/icons-react-native';
import { supabase } from '@/lib/supabase';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (password.length < 8) {
      Alert.alert('Senha fraca', 'A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Senhas diferentes', 'As senhas não coincidem.');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      Alert.alert('Senha alterada', 'Sua senha foi atualizada com sucesso.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Erro', err.message ?? 'Não foi possível alterar a senha.');
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
          trocar senha
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: Spacing.lg,
          paddingBottom: insets.bottom + 40,
        }}
      >
        <Text style={{ color: Colors.muted, fontSize: FontSize.sm, marginBottom: 6 }}>
          nova senha
        </Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Mínimo 8 caracteres"
          placeholderTextColor={Colors.muted}
          secureTextEntry
          style={{
            backgroundColor: Colors.bgCard,
            borderWidth: 1,
            borderColor: Colors.border,
            borderRadius: Radius.md,
            paddingHorizontal: Spacing.lg,
            paddingVertical: 14,
            color: Colors.text,
            fontSize: FontSize.lg,
            marginBottom: Spacing.lg,
          }}
        />

        <Text style={{ color: Colors.muted, fontSize: FontSize.sm, marginBottom: 6 }}>
          confirmar senha
        </Text>
        <TextInput
          value={confirm}
          onChangeText={setConfirm}
          placeholder="Repita a nova senha"
          placeholderTextColor={Colors.muted}
          secureTextEntry
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
            <ActivityIndicator color={Colors.onLight} />
          ) : (
            <Text style={{ color: Colors.onLight, fontSize: FontSize.lg, fontWeight: '600' }}>
              salvar nova senha
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

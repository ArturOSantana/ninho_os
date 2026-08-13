import React, { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Input } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { resetPassword } from '@/services/api';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleReset() {
    if (!email.trim()) {
      Alert.alert('Atenção', 'Digite seu e-mail.');
      return;
    }
    try {
      setLoading(true);
      await resetPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (err: any) {
      Alert.alert('Erro', err?.message ?? 'Não foi possível enviar o e-mail.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 32,
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: 24,
          justifyContent: 'center',
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ color: Colors.text, fontSize: 24, fontWeight: '800', marginBottom: 8 }}>
          Redefinir senha
        </Text>

        {sent ? (
          <>
            <Text style={{ color: Colors.muted, fontSize: 15, lineHeight: 24, marginBottom: 32 }}>
              ✉️ E-mail enviado para <Text style={{ color: Colors.orange }}>{email}</Text>.{'\n'}
              Verifique sua caixa de entrada e siga as instruções.
            </Text>
            <Button title="Voltar para o login" onPress={() => router.replace('/(auth)/login')} fullWidth size="lg" />
          </>
        ) : (
          <>
            <Text style={{ color: Colors.muted, fontSize: 14, marginBottom: 28, lineHeight: 20 }}>
              Digite seu e-mail e enviaremos um link para redefinir sua senha.
            </Text>
            <Input
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              placeholder="seu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            <Button title="Enviar link" onPress={handleReset} loading={loading} fullWidth size="lg" style={{ marginBottom: 16 }} />
            <Button title="Voltar" variant="ghost" onPress={() => router.back()} fullWidth />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

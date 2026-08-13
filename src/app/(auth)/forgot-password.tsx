// src/app/(auth)/forgot-password.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconChevronLeft } from '@tabler/icons-react-native';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    if (!email.trim()) {
      Alert.alert('Atenção', 'Digite seu e-mail.');
      return;
    }
    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: 'ninho://change-password' },
      );
      if (error) throw error;
      Alert.alert(
        'E-mail enviado',
        'Verifique sua caixa de entrada para redefinir a senha.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
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
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: 24,
          justifyContent: 'center',
          maxWidth: 340, alignSelf: 'center', width: '100%',
        }}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 32 }}
        >
          <IconChevronLeft size={20} color={Colors.primary} />
          <Text style={{ color: Colors.primary, fontSize: 14, marginLeft: 4 }}>Voltar</Text>
        </TouchableOpacity>

        <View style={{ marginBottom: 32 }}>
          <Text style={{ color: Colors.text, fontSize: 22, fontWeight: '500', marginBottom: 8 }}>
            Redefinir senha
          </Text>
          <Text style={{ color: Colors.muted, fontSize: 13, lineHeight: 20 }}>
            Digite seu e-mail e enviaremos um link para redefinir sua senha.
          </Text>
        </View>

        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: Colors.muted, fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
            E-mail
          </Text>
          <View style={{
            backgroundColor: Colors.card, borderRadius: 12,
            borderWidth: 1, borderColor: Colors.border,
            paddingHorizontal: 14, height: 48, justifyContent: 'center',
          }}>
            <TextInput
              value={email} onChangeText={setEmail}
              placeholder="seu@email.com" placeholderTextColor={Colors.border}
              keyboardType="email-address" autoCapitalize="none"
              style={{ color: Colors.text, fontSize: 14 }}
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleReset} disabled={loading} activeOpacity={0.8}
          style={{
            backgroundColor: Colors.primary, borderRadius: 16,
            height: 52, alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Text style={{ color: Colors.onLight, fontSize: 15, fontWeight: '500' }}>
            {loading ? 'Enviando…' : 'Enviar link'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

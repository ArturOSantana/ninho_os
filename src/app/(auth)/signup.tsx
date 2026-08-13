// src/app/(auth)/signup.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconFeather } from '@tabler/icons-react-native';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/theme';

/** Traduz erros do Supabase no cadastro para PT-BR sem expor detalhes internos */
function parseSignUpError(err: any): string {
  const msg: string = err?.message ?? '';
  const code: string = err?.code ?? '';

  if (code === 'user_already_exists' || msg.includes('User already registered')) {
    return 'Este e-mail já está cadastrado. Tente entrar ou recupere sua senha.';
  }
  if (msg.includes('Password should be') || msg.includes('password')) {
    return 'A senha não atende aos requisitos mínimos. Use pelo menos 8 caracteres.';
  }
  if (msg.includes('Unable to validate email') || msg.includes('invalid email')) {
    return 'Endereço de e-mail inválido.';
  }
  if (code === 'too_many_requests' || msg.includes('rate limit')) {
    return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return 'Sem conexão com a internet. Verifique sua rede.';
  }
  return 'Não foi possível criar a conta. Tente novamente.';
}

export default function SignUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleSignUp() {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name.trim()) { setErrorMsg('Informe seu nome.'); return; }
    if (!email.trim()) { setErrorMsg('Informe seu e-mail.'); return; }
    if (!password.trim()) { setErrorMsg('Informe uma senha.'); return; }
    if (password.length < 8) {
      setErrorMsg('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: { name: name.trim() } },
      });
      if (error) throw error;
      // Se confirmação de e-mail estiver desabilitada, o onAuthStateChange
      // já navega automaticamente. Se estiver habilitada, mostramos aviso.
      setSuccessMsg('Conta criada! Verifique seu e-mail para confirmar o cadastro.');
    } catch (err: any) {
      setErrorMsg(parseSignUpError(err));
    } finally {
      setLoading(false);
    }
  }

  const clearFeedback = () => { setErrorMsg(null); setSuccessMsg(null); };

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
          maxWidth: 340, alignSelf: 'center', width: '100%',
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <View style={{
            width: 56, height: 56, borderRadius: 28,
            backgroundColor: Colors.primary,
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 3, borderColor: Colors.secondary, marginBottom: 14,
          }}>
            <IconFeather size={24} color={Colors.onLight} />
          </View>
          <Text style={{ color: Colors.text, fontSize: 22, fontWeight: '500' }}>Criar conta</Text>
          <Text style={{ color: Colors.muted, fontSize: 13, marginTop: 4 }}>Junte-se ao Ninho</Text>
        </View>

        {/* Banner de erro */}
        {errorMsg ? (
          <View style={{
            backgroundColor: Colors.bgCard,
            borderWidth: 1, borderColor: Colors.error,
            borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
            marginBottom: 16,
          }}>
            <Text style={{ color: Colors.error, fontSize: 13, lineHeight: 18 }}>
              {errorMsg}
            </Text>
          </View>
        ) : null}

        {/* Banner de sucesso */}
        {successMsg ? (
          <View style={{
            backgroundColor: Colors.bgCard,
            borderWidth: 1, borderColor: Colors.success,
            borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
            marginBottom: 16,
          }}>
            <Text style={{ color: Colors.success, fontSize: 13, lineHeight: 18 }}>
              {successMsg}
            </Text>
          </View>
        ) : null}

        {/* Nome */}
        <View style={{ marginBottom: 12 }}>
          <Text style={{ color: Colors.muted, fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
            Seu nome
          </Text>
          <View style={{
            backgroundColor: Colors.card, borderRadius: 12,
            borderWidth: 1, borderColor: Colors.border,
            paddingHorizontal: 14, height: 48, justifyContent: 'center',
          }}>
            <TextInput
              value={name} onChangeText={(v) => { setName(v); clearFeedback(); }}
              placeholder="Como você quer ser chamado?" placeholderTextColor={Colors.border}
              autoCapitalize="words"
              style={{ color: Colors.text, fontSize: 14 }}
            />
          </View>
        </View>

        {/* E-mail */}
        <View style={{ marginBottom: 12 }}>
          <Text style={{ color: Colors.muted, fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
            E-mail
          </Text>
          <View style={{
            backgroundColor: Colors.card, borderRadius: 12,
            borderWidth: 1, borderColor: Colors.border,
            paddingHorizontal: 14, height: 48, justifyContent: 'center',
          }}>
            <TextInput
              value={email} onChangeText={(v) => { setEmail(v); clearFeedback(); }}
              placeholder="seu@email.com" placeholderTextColor={Colors.border}
              keyboardType="email-address" autoCapitalize="none"
              style={{ color: Colors.text, fontSize: 14 }}
            />
          </View>
        </View>

        {/* Senha */}
        <View style={{ marginBottom: 4 }}>
          <Text style={{ color: Colors.muted, fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
            Senha
          </Text>
          <View style={{
            backgroundColor: Colors.card, borderRadius: 12,
            borderWidth: 1, borderColor: Colors.border,
            paddingHorizontal: 14, height: 48, justifyContent: 'center',
          }}>
            <TextInput
              value={password} onChangeText={(v) => { setPassword(v); clearFeedback(); }}
              placeholder="Mínimo 8 caracteres" placeholderTextColor={Colors.border}
              secureTextEntry
              style={{ color: Colors.text, fontSize: 14 }}
            />
          </View>
        </View>
        <Text style={{ color: Colors.muted, fontSize: 11, marginTop: 6, marginBottom: 20 }}>
          Use letras, números e símbolos para uma senha segura.
        </Text>

        <TouchableOpacity
          onPress={handleSignUp} disabled={loading} activeOpacity={0.8}
          style={{
            backgroundColor: Colors.primary, borderRadius: 16,
            height: 52, alignItems: 'center', justifyContent: 'center', marginBottom: 24,
            opacity: loading ? 0.7 : 1,
          }}
        >
          <Text style={{ color: Colors.onLight, fontSize: 15, fontWeight: '500' }}>
            {loading ? 'Criando conta…' : 'Criar conta'}
          </Text>
        </TouchableOpacity>

        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: Colors.muted, fontSize: 13 }}>
            Já tem conta?{' '}
            <Text style={{ color: Colors.primary, fontWeight: '500' }} onPress={() => router.back()}>
              Entrar
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

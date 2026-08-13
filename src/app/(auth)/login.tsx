// src/app/(auth)/login.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Polygon, Path, Ellipse } from 'react-native-svg';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/theme';

// Raposa — assinatura da marca (handoff v2). Mesmo SVG do dashboard.
function FoxMark({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Polygon points="20,10 45,50 10,45" fill="#e8720c" />
      <Polygon points="80,10 55,50 90,45" fill="#e8720c" />
      <Path d="M50,30 C70,30 85,50 82,72 C79,92 65,100 50,100 C35,100 21,92 18,72 C15,50 30,30 50,30 Z" fill="#e8720c" />
      <Path d="M50,55 C62,55 70,66 68,80 C66,92 58,98 50,99 C42,98 34,92 32,80 C30,66 38,55 50,55 Z" fill="#f5d9b0" />
      <Ellipse cx="40" cy="62" rx="3.2" ry="4.2" fill="#0d1b2a" />
      <Ellipse cx="60" cy="62" rx="3.2" ry="4.2" fill="#0d1b2a" />
      <Polygon points="46,85 54,85 50,92" fill="#0d1b2a" />
    </Svg>
  );
}

/** Traduz os códigos/mensagens do Supabase para PT-BR sem vazar detalhes internos */
function parseAuthError(err: any): string {
  const msg: string = err?.message ?? '';
  const code: string = err?.code ?? '';

  if (code === 'invalid_credentials' || msg.includes('Invalid login credentials')) {
    return 'E-mail ou senha incorretos. Verifique e tente novamente.';
  }
  if (code === 'email_not_confirmed' || msg.includes('Email not confirmed')) {
    return 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.';
  }
  if (code === 'too_many_requests' || msg.includes('rate limit')) {
    return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return 'Sem conexão com a internet. Verifique sua rede.';
  }
  // Fallback genérico — não expõe detalhes técnicos
  return 'Não foi possível entrar. Tente novamente.';
}

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleLogin() {
    setErrorMsg(null);

    if (!email.trim()) {
      setErrorMsg('Informe seu e-mail.');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Informe sua senha.');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw error;
      // Sucesso: o AuthContext/onAuthStateChange cuida da navegação
    } catch (err: any) {
      setErrorMsg(parseAuthError(err));
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
          maxWidth: 340,
          alignSelf: 'center',
          width: '100%',
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo — FoxMark + wordmark (handoff v2) */}
        <View style={{ alignItems: 'center', marginBottom: 48 }}>
          <View style={{
            width: 64, height: 64, borderRadius: 32,
            backgroundColor: Colors.primary,
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 3, borderColor: Colors.secondary,
            marginBottom: 16,
          }}>
            <FoxMark size={36} />
          </View>
          <Text style={{ color: Colors.text, fontFamily: 'Georgia', fontStyle: 'italic', fontSize: 26, letterSpacing: -0.5 }}>
            ninho
          </Text>
          <Text style={{ color: Colors.muted, fontSize: 13, marginTop: 4 }}>
            O sistema operacional da sua família
          </Text>
        </View>

        {/* Banner de erro inline */}
        {errorMsg ? (
          <View style={{
            backgroundColor: Colors.bgCard,
            borderWidth: 1,
            borderColor: Colors.error,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 10,
            marginBottom: 16,
          }}>
            <Text style={{ color: Colors.error, fontSize: 13, lineHeight: 18 }}>
              {errorMsg}
            </Text>
          </View>
        ) : null}

        {/* Email */}
        <View style={{ marginBottom: 12 }}>
          <Text style={{ color: Colors.muted, fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
            E-mail
          </Text>
          <View style={{
            backgroundColor: Colors.card, borderRadius: 12,
            borderWidth: 1,
            borderColor: errorMsg ? Colors.error : Colors.border,
            paddingHorizontal: 14, height: 48, justifyContent: 'center',
          }}>
            <TextInput
              value={email} onChangeText={(v) => { setEmail(v); setErrorMsg(null); }}
              placeholder="seu@email.com" placeholderTextColor={Colors.border}
              keyboardType="email-address" autoCapitalize="none" autoComplete="email"
              style={{ color: Colors.text, fontSize: 14 }}
            />
          </View>
        </View>

        {/* Senha */}
        <View style={{ marginBottom: 8 }}>
          <Text style={{ color: Colors.muted, fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
            Senha
          </Text>
          <View style={{
            backgroundColor: Colors.card, borderRadius: 12,
            borderWidth: 1,
            borderColor: errorMsg ? Colors.error : Colors.border,
            paddingHorizontal: 14, height: 48, flexDirection: 'row', alignItems: 'center',
          }}>
            <TextInput
              value={password} onChangeText={(v) => { setPassword(v); setErrorMsg(null); }}
              placeholder="••••••••" placeholderTextColor={Colors.border}
              secureTextEntry={!showPw}
              style={{ flex: 1, color: Colors.text, fontSize: 14 }}
            />
            <TouchableOpacity onPress={() => setShowPw(v => !v)} style={{ paddingLeft: 8 }}>
              <Text style={{ color: Colors.muted, fontSize: 12 }}>{showPw ? 'Ocultar' : 'Ver'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Esqueceu senha */}
        <View style={{ alignItems: 'flex-end', marginBottom: 24 }}>
          <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
            <Text style={{ color: Colors.primary, fontSize: 13 }}>Esqueci minha senha</Text>
          </TouchableOpacity>
        </View>

        {/* CTA */}
        <TouchableOpacity
          onPress={handleLogin} disabled={loading}
          activeOpacity={0.8}
          style={{
            backgroundColor: Colors.primary, borderRadius: 16,
            height: 52, alignItems: 'center', justifyContent: 'center',
            marginBottom: 24,
            opacity: loading ? 0.7 : 1,
          }}
        >
          <Text style={{ color: Colors.onLight, fontSize: 15, fontWeight: '500' }}>
            {loading ? 'Entrando…' : 'Entrar'}
          </Text>
        </TouchableOpacity>

        {/* Cadastro */}
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: Colors.muted, fontSize: 13 }}>
            Não tem conta?{' '}
            <Text
              style={{ color: Colors.primary, fontWeight: '500' }}
              onPress={() => router.push('/(auth)/signup')}
            >
              Criar agora
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

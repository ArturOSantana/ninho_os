// src/app/(auth)/login.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Polygon, Path, Ellipse } from 'react-native-svg';
import { IconEye, IconEyeOff } from '@tabler/icons-react-native';
import { supabase } from '@/lib/supabase';
import { Colors, Radius, FontSize } from '@/constants/theme';

function NinhoLogo({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Polygon points="20,10 45,50 10,45" fill={Colors.coral} />
      <Polygon points="80,10 55,50 90,45" fill={Colors.coral} />
      <Path d="M50,30 C70,30 85,50 82,72 C79,92 65,100 50,100 C35,100 21,92 18,72 C15,50 30,30 50,30 Z" fill={Colors.coral} />
      <Path d="M50,55 C62,55 70,66 68,80 C66,92 58,98 50,99 C42,98 34,92 32,80 C30,66 38,55 50,55 Z" fill="#1a1d27" />
      <Ellipse cx="40" cy="62" rx="3" ry="4" fill="#0f1117" />
      <Ellipse cx="60" cy="62" rx="3" ry="4" fill="#0f1117" />
      <Polygon points="46,85 54,85 50,92" fill="#0f1117" />
    </Svg>
  );
}

function parseAuthError(err: any): string {
  const msg: string = err?.message ?? '';
  const code: string = err?.code ?? '';
  if (code === 'invalid_credentials' || msg.includes('Invalid login credentials'))
    return 'E-mail ou senha incorretos.';
  if (code === 'email_not_confirmed' || msg.includes('Email not confirmed'))
    return 'Confirme seu e-mail antes de entrar.';
  if (code === 'too_many_requests' || msg.includes('rate limit'))
    return 'Muitas tentativas. Aguarde e tente novamente.';
  if (msg.includes('network') || msg.includes('fetch'))
    return 'Sem conexão. Verifique sua rede.';
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
    if (!email.trim()) { setErrorMsg('Informe seu e-mail.'); return; }
    if (!password.trim()) { setErrorMsg('Informe sua senha.'); return; }
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(parseAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  const isWeb = Platform.OS === 'web';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.bgPage }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow:          1,
          paddingTop:        isWeb ? 0 : insets.top + 24,
          paddingBottom:     insets.bottom + 32,
          paddingHorizontal: 24,
          justifyContent:    'center',
          alignItems:        'center',
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Card central */}
        <View style={{
          width:     '100%',
          maxWidth:  400,
          backgroundColor: Colors.bgCard,
          borderRadius:    Radius.xl,
          borderWidth:     1,
          borderColor:     Colors.border,
          padding:         32,
        }}>
          {/* Logo */}
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <View style={{
              width:           56,
              height:          56,
              borderRadius:    14,
              backgroundColor: Colors.coralBg,
              borderWidth:     1,
              borderColor:     Colors.coral + '40',
              alignItems:      'center',
              justifyContent:  'center',
              marginBottom:    16,
            }}>
              <NinhoLogo size={32} />
            </View>
            <Text style={{
              color:         Colors.text,
              fontSize:      22,
              fontWeight:    '600',
              letterSpacing: -0.5,
            }}>
              Bem-vindo ao Ninho
            </Text>
            <Text style={{
              color:      Colors.muted,
              fontSize:   FontSize.sm,
              marginTop:  6,
              textAlign:  'center',
              lineHeight: 18,
            }}>
              O sistema operacional da sua família
            </Text>
          </View>

          {/* Erro */}
          {errorMsg ? (
            <View style={{
              backgroundColor: Colors.errorBg,
              borderWidth:     1,
              borderColor:     Colors.error + '60',
              borderRadius:    Radius.md,
              padding:         12,
              marginBottom:    20,
            }}>
              <Text style={{ color: Colors.error, fontSize: FontSize.sm }}>
                {errorMsg}
              </Text>
            </View>
          ) : null}

          {/* Email */}
          <View style={{ marginBottom: 14 }}>
            <Text style={{
              color:         Colors.muted,
              fontSize:      FontSize.xs,
              fontWeight:    '500',
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              marginBottom:  6,
            }}>
              E-mail
            </Text>
            <View style={{
              backgroundColor: Colors.bgPage,
              borderRadius:    Radius.md,
              borderWidth:     1,
              borderColor:     errorMsg ? Colors.error + '60' : Colors.border,
              paddingHorizontal: 14,
              height:          46,
              justifyContent:  'center',
            }}>
              <TextInput
                value={email}
                onChangeText={(v) => { setEmail(v); setErrorMsg(null); }}
                placeholder="seu@email.com"
                placeholderTextColor={Colors.textDisabled}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                style={{ color: Colors.text, fontSize: FontSize.md }}
              />
            </View>
          </View>

          {/* Senha */}
          <View style={{ marginBottom: 8 }}>
            <Text style={{
              color:         Colors.muted,
              fontSize:      FontSize.xs,
              fontWeight:    '500',
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              marginBottom:  6,
            }}>
              Senha
            </Text>
            <View style={{
              backgroundColor:   Colors.bgPage,
              borderRadius:      Radius.md,
              borderWidth:       1,
              borderColor:       errorMsg ? Colors.error + '60' : Colors.border,
              paddingHorizontal: 14,
              height:            46,
              flexDirection:     'row',
              alignItems:        'center',
            }}>
              <TextInput
                value={password}
                onChangeText={(v) => { setPassword(v); setErrorMsg(null); }}
                placeholder="••••••••"
                placeholderTextColor={Colors.textDisabled}
                secureTextEntry={!showPw}
                style={{ flex: 1, color: Colors.text, fontSize: FontSize.md }}
              />
              <TouchableOpacity onPress={() => setShowPw(v => !v)} style={{ padding: 4 }}>
                {showPw
                  ? <IconEyeOff size={18} color={Colors.muted} />
                  : <IconEye    size={18} color={Colors.muted} />
                }
              </TouchableOpacity>
            </View>
          </View>

          {/* Esqueci a senha */}
          <View style={{ alignItems: 'flex-end', marginBottom: 24 }}>
            <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
              <Text style={{ color: Colors.primary, fontSize: FontSize.sm }}>
                Esqueci minha senha
              </Text>
            </TouchableOpacity>
          </View>

          {/* CTA */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
            style={{
              backgroundColor: Colors.primary,
              borderRadius:    Radius.md,
              height:          46,
              alignItems:      'center',
              justifyContent:  'center',
              marginBottom:    20,
              opacity:         loading ? 0.65 : 1,
            }}
          >
            <Text style={{
              color:      '#ffffff',
              fontSize:   FontSize.md,
              fontWeight: '600',
            }}>
              {loading ? 'Entrando…' : 'Entrar'}
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: Colors.border }} />
            <Text style={{ color: Colors.textDisabled, fontSize: FontSize.xs, marginHorizontal: 12 }}>
              ou
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: Colors.border }} />
          </View>

          {/* Criar conta */}
          <TouchableOpacity
            onPress={() => router.push('/(auth)/signup')}
            activeOpacity={0.8}
            style={{
              borderWidth:     1,
              borderColor:     Colors.border,
              borderRadius:    Radius.md,
              height:          46,
              alignItems:      'center',
              justifyContent:  'center',
            }}
          >
            <Text style={{ color: Colors.text, fontSize: FontSize.md, fontWeight: '500' }}>
              Criar conta gratuita
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

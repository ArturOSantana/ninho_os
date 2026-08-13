import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Input } from '@/components/ui';
import { Colors } from '@/constants/theme';
import { signInWithEmail } from '@/services/api';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Atenção', 'Preencha e-mail e senha.');
      return;
    }
    try {
      setLoading(true);
      await signInWithEmail(email.trim().toLowerCase(), password);
    } catch (err: any) {
      Alert.alert('Erro ao entrar', err?.message ?? 'Verifique suas credenciais e tente novamente.');
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
        {/* Logo */}
        <View style={{ alignItems: 'center', marginBottom: 48 }}>
          <Image
            source={require('../../assets/ninho-logo.png')}
            style={{ width: 72, height: 72, borderRadius: 20, marginBottom: 16 }}
            resizeMode="cover"
          />
          <Text style={{ color: Colors.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 }}>
            ninho
          </Text>
          <Text style={{ color: Colors.muted, fontSize: 14, marginTop: 4 }}>
            O sistema operacional da sua família
          </Text>
        </View>

        {/* Form */}
        <Input
          label="E-mail"
          value={email}
          onChangeText={setEmail}
          placeholder="seu@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />

        <Input
          label="Senha"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry={!showPassword}
          rightElement={
            <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={{ padding: 4 }}>
              <Text style={{ color: Colors.muted, fontSize: 13 }}>{showPassword ? 'Ocultar' : 'Ver'}</Text>
            </TouchableOpacity>
          }
        />

        <View style={{ alignItems: 'flex-end', marginTop: -8, marginBottom: 24 }}>
          <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
            <Text style={{ color: Colors.orange, fontSize: 13 }}>Esqueci minha senha</Text>
          </TouchableOpacity>
        </View>

        <Button
          title="Entrar"
          onPress={handleLogin}
          loading={loading}
          fullWidth
          size="lg"
        />

        <View style={{ alignItems: 'center', marginTop: 24 }}>
          <Text style={{ color: Colors.muted, fontSize: 14 }}>
            Não tem conta?{' '}
            <Text
              style={{ color: Colors.orange, fontWeight: '600' }}
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

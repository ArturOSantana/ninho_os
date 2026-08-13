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
import { signUpWithEmail } from '@/services/api';

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Senha fraca', 'A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    try {
      setLoading(true);
      await signUpWithEmail(email.trim().toLowerCase(), password, name.trim());
      router.replace('/(auth)/onboarding');
    } catch (err: any) {
      Alert.alert('Erro ao criar conta', err?.message ?? 'Tente novamente.');
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
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <Image
            source={require('../../assets/ninho-logo.png')}
            style={{ width: 64, height: 64, borderRadius: 18, marginBottom: 14 }}
            resizeMode="cover"
          />
          <Text style={{ color: Colors.text, fontSize: 24, fontWeight: '800' }}>
            Criar conta
          </Text>
          <Text style={{ color: Colors.muted, fontSize: 14, marginTop: 4 }}>
            Junte-se ao Ninho
          </Text>
        </View>

        <Input
          label="Seu nome"
          value={name}
          onChangeText={setName}
          placeholder="Como você quer ser chamado?"
          autoCapitalize="words"
          autoComplete="name"
        />

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
          placeholder="Mínimo 8 caracteres"
          secureTextEntry
          hint="Use letras, números e símbolos para uma senha segura."
        />

        <Button
          title="Criar conta"
          onPress={handleSignUp}
          loading={loading}
          fullWidth
          size="lg"
          style={{ marginTop: 8 }}
        />

        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <Text style={{ color: Colors.muted, fontSize: 14 }}>
            Já tem conta?{' '}
            <Text
              style={{ color: Colors.orange, fontWeight: '600' }}
              onPress={() => router.back()}
            >
              Entrar
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// src/app/(app)/(more)/edit-profile.tsx
// Tela de edição de perfil

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
import { useAuthStore } from '@/stores/auth.store';
import { supabase } from '@/lib/supabase';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, setProfile } = useAuthStore();

  const [name, setName] = useState(profile?.name ?? '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Nome obrigatório', 'Por favor, informe seu nome.');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({ name: name.trim() })
        .eq('user_id', profile?.user_id);

      if (error) throw error;

      setProfile({ ...profile!, name: name.trim() });
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
          editar perfil
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: Spacing.lg,
          paddingBottom: insets.bottom + 40,
        }}
      >
        <Text style={{ color: Colors.muted, fontSize: FontSize.sm, marginBottom: 6 }}>
          nome
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Seu nome"
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
              salvar alterações
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

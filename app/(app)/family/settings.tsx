import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth.store';
import { signOut } from '@/services/api';

export default function FamilySettingsScreen() {
  const insets = useSafeAreaInsets();
  const { profile, family, babies, reset } = useAuthStore();

  async function handleSignOut() {
    Alert.alert('Sair do Ninho', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          reset();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
    >
      {/* Header */}
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Text style={{ color: Colors.orange, fontSize: 24 }}>←</Text>
        </TouchableOpacity>
        <Text style={{ color: Colors.text, fontSize: 20, fontWeight: '800' }}>Configurações</Text>
      </View>

      <View style={{ paddingHorizontal: 20 }}>
        {/* Perfil */}
        <View style={{ backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.border }}>
          <Text style={{ color: Colors.muted, fontSize: 11, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 }}>
            Seu perfil
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: Colors.orangeBg,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: Colors.orange,
            }}>
              <Text style={{ color: Colors.orange, fontSize: 16, fontWeight: '700' }}>
                {profile?.name?.slice(0, 2).toUpperCase() ?? '?'}
              </Text>
            </View>
            <View>
              <Text style={{ color: Colors.text, fontSize: 16, fontWeight: '700' }}>{profile?.name ?? '–'}</Text>
              <Text style={{ color: Colors.muted, fontSize: 12, marginTop: 2, textTransform: 'capitalize' }}>
                {profile?.role ?? 'admin'}
              </Text>
            </View>
          </View>
        </View>

        {/* Família */}
        <View style={{ backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.border }}>
          <Text style={{ color: Colors.muted, fontSize: 11, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 }}>
            Família
          </Text>
          <Text style={{ color: Colors.text, fontSize: 16, fontWeight: '700' }}>{family?.name ?? '–'}</Text>
          <Text style={{ color: Colors.muted, fontSize: 12, marginTop: 4 }}>
            {babies.length} bebê{babies.length !== 1 ? 's' : ''} cadastrado{babies.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Bebês */}
        {babies.map((baby) => (
          <View key={baby.id} style={{ backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 28 }}>{baby.sex === 'female' ? '👧' : '👦'}</Text>
              <View>
                <Text style={{ color: Colors.text, fontSize: 15, fontWeight: '700' }}>{baby.name}</Text>
                <Text style={{ color: Colors.muted, fontSize: 12, marginTop: 2 }}>
                  Nascimento: {new Date(baby.birth_date).toLocaleDateString('pt-BR')}
                </Text>
              </View>
            </View>
          </View>
        ))}

        {/* Rodapé */}
        <View style={{ marginTop: 32 }}>
          <TouchableOpacity
            onPress={handleSignOut}
            style={{
              backgroundColor: Colors.error + '18',
              borderRadius: 14,
              padding: 16,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: Colors.error + '40',
            }}
          >
            <Text style={{ color: Colors.error, fontSize: 15, fontWeight: '700' }}>Sair do Ninho</Text>
          </TouchableOpacity>

          <Text style={{ color: Colors.muted, fontSize: 11, textAlign: 'center', marginTop: 20 }}>
            Ninho v1.0.0 — Fase 0/1
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

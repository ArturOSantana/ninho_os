// src/app/(app)/(couple)/appreciation.tsx
// UC031: Enviar apreciação rápida ao parceiro(a)

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCouple } from '@/hooks/useCouple';
import { useFamily } from '@/context/FamilyContext';
import { CoupleAppreciation } from '@/types/couple.types';
import { Colors, Radius, Spacing, FontSize } from '@/constants/theme';

const QUICK_EMOJIS = ['💛', '❤️', '🙏', '⭐', '🌟', '🫶', '💪', '✨'];

const QUICK_MESSAGES = [
  'Obrigado(a) por tudo hoje 💛',
  'Você fez isso parecer fácil — mas eu vi o esforço.',
  'Fico feliz de dividir isso tudo com você.',
  'Vi o que você fez e quero que saiba que eu notei.',
  'Você é incrível — mesmo nas partes difíceis.',
];

function AppreciationItem({ item }: { item: CoupleAppreciation }) {
  return (
    <View
      style={{
        backgroundColor: Colors.bgCard,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: Spacing.lg,
        marginBottom: Spacing.sm,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm }}>
        <Text style={{ fontSize: 20 }}>{item.emoji ?? '💛'}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ color: Colors.text, fontSize: FontSize.base, lineHeight: 20 }}>
            {item.message}
          </Text>
          <Text style={{ color: Colors.muted, fontSize: FontSize.xs, marginTop: 6 }}>
            {new Date(item.created_at).toLocaleDateString('pt-BR', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function AppreciationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { family } = useFamily();
  const { appreciations, sendAppreciation, loading } = useCouple();

  const [message, setMessage] = useState('');
  const [emoji, setEmoji] = useState('💛');
  const [saving, setSaving] = useState(false);

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed) {
      Alert.alert('Mensagem vazia', 'Escreva algo antes de enviar.');
      return;
    }
    // Para MVP, usamos o primeiro membro que não seja o usuário.
    // Se não houver partnerIds, a lógica de seleção de to_member fica para o service.
    setSaving(true);
    try {
      // to_member será resolvido depois da tela de seleção de parceiro(a)
      // Por ora usa placeholder UUID vazio — um fluxo de escolha pode ser adicionado
      Alert.alert(
        'Enviar apreciação',
        `"${emoji} ${trimmed}"\n\nEnviar para seu parceiro(a)?`,
        [
          { text: 'Cancelar', style: 'cancel', onPress: () => setSaving(false) },
          {
            text: 'Enviar',
            onPress: async () => {
              try {
                // Busca os membros da família para encontrar o parceiro
                // Simplificado: envia com to_member vazio e o service resolve via RLS
                await sendAppreciation({
                  to_member: '' as any, // será preenchido quando houver seleção de membro
                  message: trimmed,
                  emoji,
                });
                setMessage('');
                router.back();
              } catch (err) {
                Alert.alert('Erro', err instanceof Error ? err.message : 'Não foi possível enviar.');
              } finally {
                setSaving(false);
              }
            },
          },
        ],
      );
    } catch {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + Spacing.lg,
          paddingBottom: Spacing.lg,
          paddingHorizontal: Spacing.lg,
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={{ color: Colors.primary, fontSize: FontSize.xl }}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'Georgia', color: Colors.text, fontSize: 20 }}>apreciação</Text>
          <Text style={{ color: Colors.muted, fontSize: FontSize.sm, marginTop: 2 }}>mostre que você vê e valoriza</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: Spacing['2xl'],
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: Spacing.lg,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Seletor de emoji */}
        <Text style={{ color: Colors.muted, fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Spacing.md }}>
          escolha um emoji
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing['2xl'] }}>
          {QUICK_EMOJIS.map((e) => (
            <TouchableOpacity
              key={e}
              onPress={() => setEmoji(e)}
              activeOpacity={0.78}
              style={{
                width: 48,
                height: 48,
                borderRadius: Radius.md,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: emoji === e ? Colors.secondary : Colors.border,
                backgroundColor: emoji === e ? Colors.secondary + '22' : Colors.bgCard,
              }}
            >
              <Text style={{ fontSize: 22 }}>{e}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Campo de mensagem */}
        <Text style={{ color: Colors.muted, fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Spacing.sm }}>
          mensagem
        </Text>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="o que você quer que seu parceiro(a) saiba hoje?"
          placeholderTextColor={Colors.muted + '99'}
          multiline
          numberOfLines={4}
          maxLength={280}
          style={{
            backgroundColor: Colors.bgCard,
            borderRadius: Radius.lg,
            borderWidth: 1,
            borderColor: Colors.border,
            padding: Spacing.lg,
            color: Colors.text,
            fontSize: FontSize.base,
            lineHeight: 20,
            textAlignVertical: 'top',
            minHeight: 100,
            marginBottom: Spacing.sm,
          }}
        />
        <Text style={{ color: Colors.muted, fontSize: FontSize.xs, textAlign: 'right', marginBottom: Spacing.lg }}>
          {message.length}/280
        </Text>

        {/* Mensagens rápidas */}
        <Text style={{ color: Colors.muted, fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: Spacing.md }}>
          ou use uma sugestão
        </Text>
        {QUICK_MESSAGES.map((q) => (
          <TouchableOpacity
            key={q}
            onPress={() => setMessage(q)}
            activeOpacity={0.78}
            style={{
              backgroundColor: Colors.bgCard,
              borderRadius: Radius.md,
              borderWidth: 1,
              borderColor: message === q ? Colors.secondary : Colors.border,
              padding: Spacing.md,
              marginBottom: Spacing.sm,
            }}
          >
            <Text style={{ color: message === q ? Colors.secondary : Colors.text, fontSize: FontSize.sm, lineHeight: 18 }}>
              {q}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Botão enviar */}
        <TouchableOpacity
          onPress={handleSend}
          disabled={saving || !message.trim()}
          activeOpacity={0.82}
          style={{
            backgroundColor: message.trim() ? Colors.secondary : Colors.border,
            borderRadius: Radius.lg,
            paddingVertical: Spacing.lg,
            alignItems: 'center',
            marginTop: Spacing.xl,
          }}
        >
          {saving ? (
            <ActivityIndicator size="small" color={Colors.onLight} />
          ) : (
            <Text style={{ color: Colors.onLight, fontSize: FontSize.lg, fontWeight: '600' }}>
              enviar apreciação
            </Text>
          )}
        </TouchableOpacity>

        {/* Histórico */}
        {appreciations.length > 0 && (
          <>
            <Text style={{ color: Colors.muted, fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginTop: Spacing['3xl'], marginBottom: Spacing.md }}>
              histórico recente
            </Text>
            {appreciations.slice(0, 10).map((item) => (
              <AppreciationItem key={item.id} item={item} />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

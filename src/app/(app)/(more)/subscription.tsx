// src/app/(app)/(more)/subscription.tsx
// Fase 12: Tela de assinatura "Ninho Premium" com identidade visual v2

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  IconChevronLeft,
  IconCheck,
  IconSparkles,
  IconCrown,
  IconCircleCheck,
} from '@tabler/icons-react-native';
import { useSubscription } from '@/hooks';
import { Colors, Radius, Spacing, FontSize } from '@/constants/theme';

export default function SubscriptionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { plan, isPremium, upgradeToPremium, loading, error } = useSubscription();
  const [success, setSuccess] = useState(false);

  const handleSubscribe = async () => {
    try {
      await upgradeToPremium(30); // 30 dias de teste premium
      setSuccess(true);
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Não foi possível processar a assinatura.');
    }
  };

  if (success) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.successBlob}>
          <IconCrown size={48} color={Colors.textOnLight} />
        </View>
        <Text style={styles.serifTitle}>Família Premium!</Text>
        <Text style={styles.successSubtitle}>
          Assinatura confirmada com sucesso. Agora todos os membros da sua família têm acesso ilimitado aos relatórios de IA, histórico completo e análises avançadas.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.82}
          style={styles.successBtn}
        >
          <Text style={styles.successBtnText}>Aproveitar o Ninho Premium</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgPage }}>
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
          <IconChevronLeft size={18} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={{ color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: '500' }}>
          Assinatura
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: Spacing.lg,
          paddingTop: Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
        }}
      >
        <Text style={styles.eyebrow}>ninho premium</Text>
        <Text style={styles.serifTitle}>Leve o cuidado para o próximo nível</Text>
        <Text style={styles.description}>
          Assine o Premium e libere todas as ferramentas inteligentes de IA, relatórios detalhados de saúde e divisão automatizada para o casal.
        </Text>

        {isPremium ? (
          /* Plano Ativo */
          <View style={styles.activePlanCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <IconCrown size={22} color={Colors.secondary} />
              <Text style={{ color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: '600' }}>
                Seu Plano Premium está Ativo!
              </Text>
            </View>
            <Text style={{ color: Colors.textSecondary, fontSize: FontSize.base, marginTop: 8, lineHeight: 20 }}>
              Sua família está aproveitando a experiência completa do Ninho sem limites. Obrigado por cuidar com a gente!
            </Text>
          </View>
        ) : (
          /* Checkout de Planos */
          <View>
            {/* Card Blob Premium */}
            <View style={styles.premiumCardBlob}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View>
                  <Text style={{ color: Colors.textOnLight, fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' }}>
                    melhor escolha
                  </Text>
                  <Text style={styles.serifCardTitle}>Ninho Premium</Text>
                </View>
                <View style={styles.premiumIconBadge}>
                  <IconCrown size={20} color={Colors.primary} />
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 14 }}>
                <Text style={styles.serifPrice}>R$ 19,90</Text>
                <Text style={{ color: Colors.textOnLight, fontSize: FontSize.sm, fontWeight: '500', marginLeft: 4 }}>
                  / mês
                </Text>
              </View>

              <Text style={{ color: Colors.textOnLight, fontSize: FontSize.sm, marginTop: 10, lineHeight: 18, opacity: 0.85 }}>
                Acesso para toda a família (você, parceiro, avós e babá inclusos no mesmo plano).
              </Text>

              <View style={styles.dividerLight} />

              <View style={styles.featureRow}>
                <IconCheck size={16} color={Colors.textOnLight} />
                <Text style={styles.featureText}>Relatórios de Inteligência Artificial ilimitados</Text>
              </View>
              <View style={styles.featureRow}>
                <IconCheck size={16} color={Colors.textOnLight} />
                <Text style={styles.featureText}>Histórico completo do bebê sem expiração</Text>
              </View>
              <View style={styles.featureRow}>
                <IconCheck size={16} color={Colors.textOnLight} />
                <Text style={styles.featureText}>Controle de Carga Mental avançado e alertas</Text>
              </View>
              <View style={styles.featureRow}>
                <IconCheck size={16} color={Colors.textOnLight} />
                <Text style={styles.featureText}>Mesada e controle escolar dos filhos</Text>
              </View>
            </View>

            {error ? (
              <Text style={{ color: Colors.error, fontSize: FontSize.sm, marginVertical: Spacing.sm, textAlign: 'center' }}>
                {error}
              </Text>
            ) : null}

            {/* CTA Button */}
            <TouchableOpacity
              onPress={handleSubscribe}
              disabled={loading}
              activeOpacity={0.85}
              style={styles.subscribeBtn}
            >
              {loading ? (
                <ActivityIndicator size="small" color={Colors.textOnLight} />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <IconSparkles size={18} color={Colors.textOnLight} />
                  <Text style={styles.subscribeBtnText}>Ativar 30 dias grátis</Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.footerNote}>
              Sem fidelidade. Cancele quando quiser diretamente no aplicativo.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPage,
    paddingHorizontal: Spacing.lg,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  serifTitle: {
    fontFamily: 'Georgia',
    fontSize: FontSize.xxl + 4,
    color: Colors.textPrimary,
    fontWeight: '500',
    marginBottom: 12,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    lineHeight: 22,
    marginBottom: Spacing.xxl,
  },
  activePlanCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    marginTop: Spacing.md,
  },
  premiumCardBlob: {
    backgroundColor: Colors.tertiary, // creme/sand
    borderTopLeftRadius: 44,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 44,
    padding: 24,
    marginBottom: 24,
  },
  premiumIconBadge: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: '#ffffff88',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serifCardTitle: {
    fontFamily: 'Georgia',
    fontSize: FontSize.xl + 4,
    color: Colors.textOnLight,
    fontWeight: '600',
    marginTop: 4,
  },
  serifPrice: {
    fontFamily: 'Georgia',
    fontSize: FontSize.display,
    color: Colors.textOnLight,
    fontWeight: '600',
  },
  dividerLight: {
    height: 1,
    backgroundColor: '#00000015',
    marginVertical: 18,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  featureText: {
    color: Colors.textOnLight,
    fontSize: FontSize.base,
    fontWeight: '500',
    flex: 1,
  },
  subscribeBtn: {
    backgroundColor: Colors.secondary, // amarelo ouro
    borderRadius: Radius.xl,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  subscribeBtnText: {
    color: Colors.textOnLight,
    fontSize: FontSize.lg,
    fontWeight: '600',
  },
  footerNote: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    textAlign: 'center',
    marginTop: 14,
    opacity: 0.8,
  },
  successBlob: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: Colors.secondary,
  },
  successSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  successBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingHorizontal: 24,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  successBtnText: {
    color: Colors.textOnLight,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
});

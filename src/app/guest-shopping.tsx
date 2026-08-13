// src/app/guest-shopping.tsx
// Tela pública de lista de compras para convidados temporários.
// Acessada via deep-link: ninho://guest-shopping?token=<hex>
// Não requer autenticação. Acesso revogado ao expirar o convite.

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGuestShopping } from '@/hooks/useGuestShopping';
import { ShoppingItem } from '@/types';
import { Colors, Radius, Spacing, FontSize } from '@/constants/theme';

export default function GuestShoppingScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    session,
    items,
    loading,
    error,
    expired,
    pendingItems,
    checkedItems,
    initSession,
    loadItems,
    checkItem,
    clearError,
  } = useGuestShopping();

  // ─── Inicializar sessão ao montar ──────────────────────────
  useEffect(() => {
    if (!token) return;
    initSession(token).then((s) => {
      if (s) loadItems(s);
    });
  }, [token]);

  // ─── Pull-to-refresh ───────────────────────────────────────
  const handleRefresh = useCallback(() => {
    if (session) loadItems(session);
  }, [session, loadItems]);

  // ─── Marcar item ──────────────────────────────────────────
  const handleCheck = useCallback(
    (item: ShoppingItem) => {
      if (!session || item.checked) return;
      Alert.alert(
        'Marcar como comprado',
        `"${item.name}" foi comprado?`,
        [
          { text: 'Não', style: 'cancel' },
          { text: 'Sim', onPress: () => checkItem(session, item.id) },
        ]
      );
    },
    [session, checkItem]
  );

  // ─── Token ausente ────────────────────────────────────────
  if (!token) {
    return (
      <View style={[s.root, s.center]}>
        <Text style={s.bigIcon}>⚠️</Text>
        <Text style={s.title}>Link inválido</Text>
        <Text style={s.subtitle}>Peça um novo link ao responsável pela família.</Text>
      </View>
    );
  }

  // ─── Carregando sessão ────────────────────────────────────
  if (loading && !session) {
    return (
      <View style={[s.root, s.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={[s.subtitle, { marginTop: Spacing.md }]}>verificando acesso…</Text>
      </View>
    );
  }

  // ─── Token expirado / revogado ────────────────────────────
  if (expired || (!loading && !session)) {
    return (
      <View style={[s.root, s.center, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Text style={s.bigIcon}>🔒</Text>
        <Text style={s.title}>Acesso encerrado</Text>
        <Text style={s.subtitle}>
          Este link de convidado expirou ou foi revogado.{'\n'}
          Peça um novo link ao responsável.
        </Text>
        <TouchableOpacity
          style={s.btnSecondary}
          onPress={() => router.replace('/(auth)/login')}
          activeOpacity={0.8}
        >
          <Text style={s.btnSecondaryText}>Ir para o login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Agrupar pendentes por categoria ─────────────────────
  const pendingByCategory = pendingItems.reduce<Record<string, ShoppingItem[]>>(
    (acc, item) => {
      const cat = item.category ?? 'geral';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    },
    {}
  );

  const expiresLabel = session
    ? new Date(session.expires_at).toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
      })
    : '';

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={{ paddingTop: insets.top }} />

      {/* Header */}
      <View style={{
        paddingHorizontal: Spacing.lg,
        paddingVertical:   Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
      }}>
        <Text style={{ fontSize: FontSize.xl, fontWeight: '500', color: Colors.text }}>
          lista de compras
        </Text>
        <Text style={{ fontSize: FontSize.xs, color: Colors.muted, marginTop: 2 }}>
          acesso de convidado · expira {expiresLabel}
        </Text>
        {error && (
          <Text style={{ fontSize: FontSize.xs, color: Colors.error, marginTop: 4 }}>
            {error}
          </Text>
        )}
      </View>

      {/* Aviso somente-leitura parcial */}
      <View style={{
        marginHorizontal: Spacing.lg,
        marginTop:        Spacing.md,
        padding:          Spacing.md,
        backgroundColor:  Colors.card,
        borderRadius:     Radius.sm,
        borderWidth:      1,
        borderColor:      Colors.border,
        flexDirection:    'row',
        alignItems:       'center',
        gap:              Spacing.sm,
      }}>
        <Text style={{ fontSize: 14 }}>👀</Text>
        <Text style={{ fontSize: FontSize.xs, color: Colors.muted, flex: 1 }}>
          Você pode visualizar e marcar itens como comprados. Para adicionar ou remover itens, entre com uma conta.
        </Text>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        contentContainerStyle={{
          padding:       Spacing.lg,
          paddingBottom: insets.bottom + 80,
        }}
        showsVerticalScrollIndicator={false}
      >
        {items.length === 0 && !loading ? (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <Text style={{ fontSize: 36, marginBottom: Spacing.md }}>🛒</Text>
            <Text style={{ fontSize: FontSize.lg, fontWeight: '500', color: Colors.text, marginBottom: Spacing.sm }}>
              lista vazia
            </Text>
            <Text style={{ fontSize: FontSize.base, color: Colors.muted, textAlign: 'center' }}>
              nenhum item foi adicionado ainda.
            </Text>
          </View>
        ) : (
          <>
            {/* Pendentes agrupados por categoria */}
            {Object.entries(pendingByCategory).map(([category, catItems]) => (
              <View key={category} style={{ marginBottom: Spacing.lg }}>
                <Text style={{
                  fontSize:      FontSize.xs,
                  fontWeight:    '500',
                  color:         Colors.muted,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom:  Spacing.sm,
                }}>
                  {category}
                </Text>
                <View style={{ gap: Spacing.xs }}>
                  {catItems.map((item) => (
                    <GuestItemRow
                      key={item.id}
                      item={item}
                      onCheck={() => handleCheck(item)}
                    />
                  ))}
                </View>
              </View>
            ))}

            {/* Comprados */}
            {checkedItems.length > 0 && (
              <View style={{ marginTop: Spacing.sm }}>
                <Text style={{
                  fontSize:      FontSize.xs,
                  fontWeight:    '500',
                  color:         Colors.muted,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom:  Spacing.sm,
                  opacity:       0.6,
                }}>
                  comprados ({checkedItems.length})
                </Text>
                <View style={{ gap: Spacing.xs }}>
                  {checkedItems.map((item) => (
                    <GuestItemRow
                      key={item.id}
                      item={item}
                      onCheck={() => {}}
                    />
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Componente de linha (sem botão de excluir) ────────────────
function GuestItemRow({
  item,
  onCheck,
}: {
  item: ShoppingItem;
  onCheck: () => void;
}) {
  return (
    <View style={{
      backgroundColor: Colors.card,
      borderRadius:    Radius.md,
      paddingVertical:   Spacing.md,
      paddingHorizontal: Spacing.lg,
      flexDirection:   'row',
      alignItems:      'center',
      borderWidth:     1,
      borderColor:     Colors.border,
    }}>
      {/* Checkbox */}
      <TouchableOpacity
        onPress={onCheck}
        disabled={item.checked}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        activeOpacity={0.7}
        accessible
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.checked }}
        accessibilityLabel={`${item.name}, ${item.checked ? 'comprado' : 'pendente'}`}
        style={{
          width:           20,
          height:          20,
          borderRadius:    Radius.sm,
          borderWidth:     2,
          borderColor:     item.checked ? Colors.primary : Colors.border,
          backgroundColor: item.checked ? Colors.primary : 'transparent',
          marginRight:     Spacing.md,
          alignItems:      'center',
          justifyContent:  'center',
          flexShrink:      0,
        }}
      >
        {item.checked ? (
          <Text style={{ color: Colors.onLight, fontSize: 10, lineHeight: 13, fontWeight: '600' }}>✓</Text>
        ) : null}
      </TouchableOpacity>

      {/* Nome e detalhes */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize:           FontSize.base,
            fontWeight:         item.checked ? '400' : '500',
            color:              item.checked ? Colors.muted : Colors.text,
            textDecorationLine: item.checked ? 'line-through' : 'none',
            opacity:            item.checked ? 0.5 : 1,
          }}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        {(item.quantity || item.category) ? (
          <Text style={{ fontSize: FontSize.xs, color: Colors.muted, marginTop: 2 }}>
            {[
              item.quantity ? `${item.quantity}${item.unit ? ' ' + item.unit : ''}` : null,
              item.category,
            ]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

// ─── Estilos comuns ───────────────────────────────────────────
const s = {
  root:            { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: Spacing.xxl },
  center:          { alignItems: 'center' as const, justifyContent: 'center' as const },
  bigIcon:         { fontSize: 52, marginBottom: Spacing.lg },
  title:           { color: Colors.text, fontSize: FontSize.xxl, fontWeight: '500' as const, marginBottom: Spacing.sm, textAlign: 'center' as const },
  subtitle:        { color: Colors.muted, fontSize: FontSize.base, lineHeight: 22, textAlign: 'center' as const, marginBottom: Spacing.xl },
  btnSecondary:    { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, paddingVertical: 14, paddingHorizontal: Spacing.xxl, marginTop: Spacing.md },
  btnSecondaryText:{ color: Colors.muted, fontSize: FontSize.md },
};

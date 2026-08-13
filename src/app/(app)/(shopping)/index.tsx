// src/app/(app)/(shopping)/index.tsx
// UC021–023 com paleta dark do handoff

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconPlus } from '@tabler/icons-react-native';
import * as Clipboard from 'expo-clipboard';
import { useShopping, useFamily } from '@/hooks';
import { ShoppingItemRow } from '@/components/shopping/ShoppingItemRow';
import { ShoppingItem } from '@/types';
import { Colors, Radius, Spacing, FontSize } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth.store';
import { familyService } from '@/services/family/familyService';
import { TutorialOverlay } from '@/components/ui/TutorialOverlay';
import { useTutorial } from '@/hooks/useTutorial';

export default function ShoppingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { family } = useFamily();
  const inputRef = useRef<TextInput>(null);
  const profile = useAuthStore((s) => s.profile);
  const { items, loading, error, newItemIds, loadItems, addItem, checkItem, deleteItem } =
    useShopping(family?.id ?? '');

  const [newItemName, setNewItemName] = useState('');
  const [adding, setAdding] = useState(false);
  const [generatingGuestLink, setGeneratingGuestLink] = useState(false);
  const tutorial = useTutorial('shopping');

  /** Visível apenas para admin/parent */
  const canShareGuestLink =
    profile?.role === 'admin' || profile?.role === 'parent';

  useEffect(() => {
    if (family?.id) loadItems();
  }, [family?.id, loadItems]);

  const handleAdd = useCallback(async () => {
    if (!newItemName.trim()) return;
    try {
      setAdding(true);
      await addItem({ name: newItemName.trim() });
      setNewItemName('');
    } catch {
      Alert.alert('Erro', 'Não foi possível adicionar o item.');
    } finally {
      setAdding(false);
    }
  }, [newItemName, addItem]);

  const handleCheck = useCallback(
    (item: ShoppingItem) => {
      if (item.checked) return;
      // Otimista — sincroniza imediatamente sem confirmação extra,
      // igual ao comportamento das tarefas (handoff: "sincroniza em tempo real").
      checkItem(item.id);
    },
    [checkItem]
  );

  const handleDelete = useCallback(
    (item: ShoppingItem) => {
      Alert.alert('Remover item', `Remover "${item.name}" da lista?`, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: () => deleteItem(item.id) },
      ]);
    },
    [deleteItem]
  );

  const handleShare = useCallback(async () => {
    const pending = items.filter((i) => !i.checked);
    if (pending.length === 0) {
      Alert.alert('Lista vazia', 'Adicione itens antes de compartilhar.');
      return;
    }
    const text = pending
      .map((i) => `• ${i.name}${i.quantity ? ` (${i.quantity}${i.unit ? ' ' + i.unit : ''})` : ''}`)
      .join('\n');
    await Share.share({ message: `Lista de compras:\n\n${text}` });
  }, [items]);

  /** Gera um guest_link de 48h e abre o Share com o deep-link */
  const handleShareGuestLink = useCallback(async () => {
    if (!family?.id) return;
    try {
      setGeneratingGuestLink(true);
      const result = await familyService.createGuestShoppingLink(family.id, 48);
      const link = `ninho://guest-shopping?token=${result.token}`;
      const expires = new Date(result.expires_at).toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
      });
      await Share.share({
        message: `Olha nossa lista de compras! Acesse como convidado (expira ${expires}):\n\n${link}`,
        url: link,
      });
    } catch {
      Alert.alert('Erro', 'Não foi possível gerar o link de convidado.');
    } finally {
      setGeneratingGuestLink(false);
    }
  }, [family?.id]);

  const pendingItems = items.filter((i) => !i.checked);
  const checkedItems = items.filter((i) => i.checked);

  // Agrupar pendentes por categoria
  const pendingByCategory = pendingItems.reduce<Record<string, ShoppingItem[]>>((acc, item) => {
    const cat = item.category ?? 'geral';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  if (loading && items.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <TutorialOverlay
        visible={tutorial.visible}
        screenKey="shopping"
        onDismiss={tutorial.dismiss}
      />
      <View style={{ paddingTop: insets.top }} />

      {/* Header — serif v2 */}
      <View style={{
        paddingHorizontal: Spacing.lg,
        paddingVertical:   Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        flexDirection:     'row',
        alignItems:        'center',
        justifyContent:    'space-between',
      }}>
        <View>
          <Text style={{ fontSize: 20, fontFamily: 'Georgia', color: Colors.text }}>lista de compras</Text>
          <Text style={{ fontSize: FontSize.xs, color: Colors.muted, marginTop: 2 }}>
            {items.length} {items.length !== 1 ? 'itens' : 'item'} · {pendingItems.length} pendente{pendingItems.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          {/* Compartilhar como texto */}
          <TouchableOpacity
            onPress={handleShare}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Compartilhar lista como texto"
            style={{
              backgroundColor: Colors.card,
              borderRadius:    Radius.sm,
              width: 36,
              height: 36,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: Colors.border,
            }}
          >
            <Text style={{ fontSize: 18 }}>🔗</Text>
          </TouchableOpacity>

          {/* Compartilhar link de convidado (admin/parent) */}
          {canShareGuestLink && (
            <TouchableOpacity
              onPress={handleShareGuestLink}
              disabled={generatingGuestLink}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Convidar acesso temporário à lista"
              style={{
                backgroundColor: Colors.card,
                borderRadius:    Radius.sm,
                width: 36,
                height: 36,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: Colors.border,
                opacity: generatingGuestLink ? 0.5 : 1,
              }}
            >
              {generatingGuestLink
                ? <ActivityIndicator size="small" color={Colors.primary} />
                : <Text style={{ fontSize: 18 }}>👥</Text>
              }
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Campo de adicionar */}
      <View style={{
        flexDirection:     'row',
        paddingHorizontal: Spacing.lg,
        paddingVertical:   Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        gap:               Spacing.sm,
      }}>
        <TextInput
          ref={inputRef}
          value={newItemName}
          onChangeText={setNewItemName}
          placeholder="adicionar item..."
          placeholderTextColor={Colors.muted}
          style={{
            flex:              1,
            backgroundColor:   Colors.card,
            borderRadius:      Radius.md,
            borderWidth:       1,
            borderColor:       Colors.border,
            paddingHorizontal: Spacing.md,
            paddingVertical:   Spacing.sm,
            color:             Colors.text,
            fontSize:          FontSize.base,
          }}
          returnKeyType="done"
          onSubmitEditing={handleAdd}
          maxLength={100}
        />
        <TouchableOpacity
          onPress={handleAdd}
          disabled={adding || !newItemName.trim()}
          accessible
          accessibilityRole="button"
          activeOpacity={0.8}
          style={{
            backgroundColor: Colors.primary,
            borderRadius:    Radius.md,
            paddingHorizontal: Spacing.lg,
            alignItems:      'center',
            justifyContent:  'center',
            opacity: adding || !newItemName.trim() ? 0.5 : 1,
          }}
        >
          {adding ? (
            <ActivityIndicator size="small" color={Colors.onLight} />
          ) : (
            <Text style={{ color: Colors.onLight, fontWeight: '500', fontSize: FontSize.base }}>OK</Text>
          )}
        </TouchableOpacity>
      </View>

      {error && (
        <View style={{ margin: Spacing.lg, padding: Spacing.md, backgroundColor: Colors.card, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.error }}>
          <Text style={{ color: Colors.error, fontSize: FontSize.sm }}>{error}</Text>
        </View>
      )}

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => loadItems()}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
      >
        {items.length === 0 && !loading ? (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <Text style={{ fontSize: 36, marginBottom: Spacing.md }}>🛒</Text>
            <Text style={{ fontSize: FontSize.lg, fontWeight: '500', color: Colors.text, marginBottom: Spacing.sm }}>
              lista vazia
            </Text>
            <Text style={{ fontSize: FontSize.base, color: Colors.muted, textAlign: 'center' }}>
              adicione itens que a família precisa comprar.
            </Text>
          </View>
        ) : (
          <>
            {/* Itens pendentes — agrupados por categoria */}
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
                    <ShoppingItemRow
                      key={item.id}
                      item={item}
                      isNew={newItemIds.has(item.id)}
                      onCheck={() => handleCheck(item)}
                      onDelete={() => handleDelete(item)}
                    />
                  ))}
                </View>
              </View>
            ))}

            {/* CTA nova linha — foca o input de texto */}
            <TouchableOpacity
              onPress={() => inputRef.current?.focus()}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Adicionar item"
              style={{
                borderRadius:    Radius.md,
                borderWidth:     1,
                borderColor:     Colors.border,
                borderStyle:     'dashed' as const,
                paddingVertical: Spacing.lg,
                alignItems:      'center',
                flexDirection:   'row',
                justifyContent:  'center',
                gap:             Spacing.sm,
                marginBottom:    Spacing.sm,
              }}
            >
              <Text style={{ color: Colors.muted, fontSize: 18 }}>+</Text>
              <Text style={{ fontSize: FontSize.base, color: Colors.muted }}>adicionar item</Text>
            </TouchableOpacity>

            {/* FAB blob — adicionar item (handoff v2) */}
            <View style={{ alignItems: 'flex-end', marginBottom: Spacing.lg }}>
              <TouchableOpacity
                onPress={() => inputRef.current?.focus()}
                activeOpacity={0.82}
                accessibilityRole="button"
                accessibilityLabel="Adicionar item à lista"
                style={{
                  width: 52, height: 52,
                  borderTopLeftRadius: 22, borderTopRightRadius: 30,
                  borderBottomRightRadius: 24, borderBottomLeftRadius: 28,
                  backgroundColor: Colors.primary,
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <IconPlus size={22} color={Colors.onLight} />
              </TouchableOpacity>
            </View>

            {/* Itens comprados */}
            {checkedItems.length > 0 && (
              <View>
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
                    <ShoppingItemRow
                      key={item.id}
                      item={item}
                      onCheck={() => {}}
                      onDelete={() => handleDelete(item)}
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

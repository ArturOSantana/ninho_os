// src/app/(app)/(shopping)/history.tsx
// Histórico de itens comprados — UC022

import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShopping, useFamily } from '@/hooks';
import { Colors } from '@/constants/theme';

export default function ShoppingHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { family } = useFamily();
  const { items, loading, loadItems } = useShopping(family?.id ?? '');

  useEffect(() => {
    if (family?.id) loadItems();
  }, [family?.id, loadItems]);

  const checkedItems = items.filter((i) => i.checked);

  // Agrupar por data de criação (dia)
  const grouped = checkedItems.reduce<Record<string, typeof checkedItems>>((acc, item) => {
    const day = new Date(item.created_at).toLocaleDateString('pt-BR', {
      weekday: 'long', day: '2-digit', month: 'long',
    });
    if (!acc[day]) acc[day] = [];
    acc[day].push(item);
    return acc;
  }, {});

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg, paddingTop: insets.top }}>

      {/* Header serif v2 */}
      <View style={{
        paddingHorizontal: 16, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: Colors.border,
        flexDirection: 'row', alignItems: 'center', gap: 12,
      }}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={{ color: Colors.muted, fontSize: 22, lineHeight: 26 }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: Colors.text, fontSize: 18, fontFamily: 'Georgia' }}>histórico</Text>
          <Text style={{ color: Colors.muted, fontSize: 12, marginTop: 1, opacity: 0.7 }}>
            {checkedItems.length} ite{checkedItems.length !== 1 ? 'ns' : 'm'} comprado{checkedItems.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => loadItems()} tintColor={Colors.primary} />
        }
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {loading && checkedItems.length === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 64 }}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : checkedItems.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 64 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🧾</Text>
            <Text style={{ color: Colors.text, fontSize: 16, fontWeight: '500', marginBottom: 6 }}>
              Nenhum item comprado
            </Text>
            <Text style={{ color: Colors.muted, fontSize: 13, textAlign: 'center', opacity: 0.7 }}>
              Os itens marcados como comprados aparecerão aqui.
            </Text>
          </View>
        ) : (
          Object.entries(grouped).map(([day, dayItems]) => (
            <View key={day} style={{ marginBottom: 20 }}>
              {/* Cabeçalho do grupo */}
              <Text style={{ color: Colors.muted, fontSize: 11, fontWeight: '500', opacity: 0.7, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {day}
              </Text>

              <View style={{ gap: 6 }}>
                {dayItems.map((item) => (
                  <View
                    key={item.id}
                    style={{
                      backgroundColor: Colors.card, borderRadius: 10,
                      borderWidth: 1, borderColor: Colors.border,
                      paddingHorizontal: 14, paddingVertical: 12,
                      flexDirection: 'row', alignItems: 'center',
                    }}
                  >
                    {/* Check */}
                    <View style={{
                      width: 20, height: 20, borderRadius: 10,
                      backgroundColor: Colors.primary + '33', borderWidth: 1, borderColor: Colors.primary,
                      alignItems: 'center', justifyContent: 'center', marginRight: 12,
                    }}>
                      <Text style={{ color: Colors.primary, fontSize: 10, fontWeight: '500' }}>✓</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={{ color: Colors.muted, fontSize: 14, textDecorationLine: 'line-through', opacity: 0.6 }}>
                        {item.name}
                      </Text>
                      {item.quantity ? (
                        <Text style={{ color: Colors.muted, fontSize: 11, opacity: 0.5, marginTop: 1 }}>
                          {item.quantity} {item.unit ?? ''}
                        </Text>
                      ) : null}
                    </View>

                    {item.category ? (
                      <Text style={{ color: Colors.border, fontSize: 11 }}>{item.category}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

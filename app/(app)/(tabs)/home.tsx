import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth.store';
import { getShoppingList, addShoppingItem, toggleShoppingItem } from '@/services/api';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { family, profile } = useAuthStore();
  const [items, setItems] = useState<any[]>([]);
  const [newItem, setNewItem] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [adding, setAdding] = useState(false);

  async function loadItems() {
    if (!family) return;
    const data = await getShoppingList(family.id);
    setItems(data);
  }

  useEffect(() => { loadItems(); }, [family]);

  async function onRefresh() {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  }

  async function handleAdd() {
    if (!newItem.trim() || !family || !profile) return;
    try {
      setAdding(true);
      await addShoppingItem({ family_id: family.id, name: newItem.trim(), added_by: profile.id });
      setNewItem('');
      await loadItems();
    } finally {
      setAdding(false);
    }
  }

  async function handleToggle(itemId: string, checked: boolean) {
    await toggleShoppingItem(itemId, !checked, profile?.id);
    setItems((prev) => prev.map((i) => i.id === itemId ? { ...i, checked: !checked } : i));
  }

  const pending = items.filter((i) => !i.checked);
  const done = items.filter((i) => i.checked);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.orange} />}
    >
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 20 }}>
        <Text style={{ color: Colors.muted, fontSize: 12, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' }}>
          Casa
        </Text>
        <Text style={{ color: Colors.text, fontSize: 22, fontWeight: '800', marginTop: 4 }}>
          Lista de compras
        </Text>

        {/* Input adicionar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: Colors.card,
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor: Colors.border,
            paddingHorizontal: 16,
            marginTop: 20,
            gap: 8,
          }}
        >
          <TextInput
            value={newItem}
            onChangeText={setNewItem}
            placeholder="Adicionar item..."
            placeholderTextColor={Colors.muted}
            style={{ flex: 1, color: Colors.text, fontSize: 15, paddingVertical: 14 }}
            returnKeyType="done"
            onSubmitEditing={handleAdd}
          />
          <TouchableOpacity
            onPress={handleAdd}
            disabled={adding || !newItem.trim()}
            style={{
              backgroundColor: Colors.orange,
              borderRadius: 10,
              paddingHorizontal: 16,
              paddingVertical: 8,
              opacity: newItem.trim() ? 1 : 0.5,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Pendentes */}
        {pending.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <Text style={{ color: Colors.muted, fontSize: 12, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 }}>
              Pendentes ({pending.length})
            </Text>
            {pending.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleToggle(item.id, item.checked)}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: Colors.card,
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 8,
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    borderWidth: 2,
                    borderColor: Colors.orange,
                  }}
                />
                <Text style={{ color: Colors.text, fontSize: 15, flex: 1 }}>{item.name}</Text>
                {item.quantity ? (
                  <Text style={{ color: Colors.muted, fontSize: 12 }}>{item.quantity}</Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Marcados */}
        {done.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <Text style={{ color: Colors.muted, fontSize: 12, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 }}>
              Comprados ({done.length})
            </Text>
            {done.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleToggle(item.id, item.checked)}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: Colors.surface,
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 8,
                  gap: 12,
                  opacity: 0.6,
                }}
              >
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: Colors.success,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text>
                </View>
                <Text style={{ color: Colors.muted, fontSize: 15, flex: 1, textDecorationLine: 'line-through' }}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {items.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <Text style={{ fontSize: 40 }}>🛒</Text>
            <Text style={{ color: Colors.muted, fontSize: 15, marginTop: 12, textAlign: 'center' }}>
              Lista de compras vazia.{'\n'}Adicione o primeiro item acima.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

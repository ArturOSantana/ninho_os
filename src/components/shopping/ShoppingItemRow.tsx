// src/components/shopping/ShoppingItemRow.tsx
// Paleta dark do handoff
// isNew: fundo pisca suavemente por 600ms ao chegar de outro membro via Realtime

import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { ShoppingItem } from '@/types';
import { Colors, Radius, Spacing, FontSize } from '@/constants/theme';

interface ShoppingItemRowProps {
  item:     ShoppingItem;
  onCheck:  () => void;
  onDelete: () => void;
  /** Quando true, anima o fundo por 600ms — sinaliza item inserido por outro membro */
  isNew?:   boolean;
}

export function ShoppingItemRow({ item, onCheck, onDelete, isNew = false }: ShoppingItemRowProps) {
  // Opacidade do overlay de destaque — anima de 0.25 → 0 em 600ms
  const highlightOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isNew) return;
    // Sobe para 0.25 rapidamente, depois desce para 0 até completar 600ms
    Animated.sequence([
      Animated.timing(highlightOpacity, {
        toValue:         0.25,
        duration:        80,
        useNativeDriver: true,
      }),
      Animated.timing(highlightOpacity, {
        toValue:         0,
        duration:        520,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isNew, highlightOpacity]);

  return (
    <View style={{ position: 'relative' }}>
      {/* Overlay de destaque para novo item remoto */}
      <Animated.View
        pointerEvents="none"
        accessibilityElementsHidden
        style={{
          position:     'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          borderRadius: Radius.md,
          backgroundColor: Colors.primary,
          opacity:      highlightOpacity,
          zIndex:       1,
        }}
      />

      <View
        accessible
        accessibilityLiveRegion={isNew ? 'polite' : 'none'}
        style={{
          backgroundColor: Colors.card,
          borderRadius:    Radius.md,
          paddingVertical:   Spacing.md,
          paddingHorizontal: Spacing.lg,
          flexDirection:   'row',
          alignItems:      'center',
          borderWidth:     1,
          borderColor:     Colors.border,
        }}
      >
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

        {/* Nome e quantidade */}
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

        {/* Excluir */}
        <TouchableOpacity
          onPress={onDelete}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Remover item"
          style={{ marginLeft: Spacing.sm }}
        >
          <Text style={{ color: Colors.border, fontSize: 18 }}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

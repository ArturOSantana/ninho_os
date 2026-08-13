// src/components/ui/Header.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { IconArrowLeft } from '@tabler/icons-react-native';
import { Colors, FontSize, Spacing } from '@/constants/theme';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightElement?: React.ReactNode;
  /** Remove border bottom — útil quando a tela começa com um card imediatamente abaixo */
  noBorder?: boolean;
}

export function Header({ title, subtitle, showBack = false, rightElement, noBorder = false }: HeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{
      paddingTop:        Platform.OS === 'web' ? 16 : insets.top + 8,
      paddingBottom:     12,
      paddingHorizontal: Spacing.xl,
      backgroundColor:   Colors.bgPage,
      flexDirection:     'row',
      alignItems:        'center',
      borderBottomWidth: noBorder ? 0 : 1,
      borderBottomColor: Colors.border,
    }}>
      {showBack ? (
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            marginRight:     12,
            width:           32,
            height:          32,
            borderRadius:    8,
            backgroundColor: Colors.bgCard,
            alignItems:      'center',
            justifyContent:  'center',
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <IconArrowLeft size={18} color={Colors.text} />
        </TouchableOpacity>
      ) : null}

      <View style={{ flex: 1 }}>
        <Text style={{
          color:      Colors.text,
          fontSize:   FontSize.xl,
          fontWeight: '600',
          letterSpacing: -0.2,
        }}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{
            color:     Colors.muted,
            fontSize:  FontSize.xs,
            marginTop: 2,
          }}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {rightElement ? (
        <View style={{ marginLeft: 12 }}>{rightElement}</View>
      ) : null}
    </View>
  );
}

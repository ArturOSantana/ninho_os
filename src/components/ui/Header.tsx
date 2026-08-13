import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, FontSize, Spacing } from '@/constants/theme';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightElement?: React.ReactNode;
}

export function Header({ title, subtitle, showBack = false, rightElement }: HeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{
      paddingTop:        insets.top + 8,
      paddingBottom:     12,
      paddingHorizontal: Spacing.xl,
      backgroundColor:   Colors.bg,
      flexDirection:     'row',
      alignItems:        'center',
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    }}>
      {showBack ? (
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginRight: 12, padding: 4 }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Text style={{ color: Colors.primary, fontSize: 24 }}>←</Text>
        </TouchableOpacity>
      ) : null}

      <View style={{ flex: 1 }}>
        <Text style={{ color: Colors.text, fontSize: FontSize.xl, fontWeight: '500' }}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ color: Colors.muted, fontSize: FontSize.xs, marginTop: 2 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {rightElement}
    </View>
  );
}

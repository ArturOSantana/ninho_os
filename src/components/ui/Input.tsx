// src/components/ui/Input.tsx
import React, { useState } from 'react';
import { TextInput, TextInputProps, View, Text, ViewStyle } from 'react-native';
import { Colors, Radius } from '@/constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  rightElement?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  hint,
  rightElement,
  containerStyle,
  style,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[{ marginBottom: 16 }, containerStyle]}>
      {label ? (
        <Text
          style={{
            color: Colors.muted,
            fontSize: 11,
            fontWeight: '500',
            letterSpacing: 0.6,
            textTransform: 'uppercase',
            marginBottom: 6,
          }}
        >
          {label}
        </Text>
      ) : null}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: Colors.card,
          borderRadius: Radius.md,
          borderWidth: 1.5,
          borderColor: error ? Colors.error : focused ? Colors.primary : Colors.border,
          paddingHorizontal: 14,
        }}
      >
        <TextInput
          style={[
            {
              flex: 1,
              color: Colors.text,
              fontSize: 15,
              paddingVertical: 14,
            },
            style,
          ]}
          placeholderTextColor={Colors.border}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {rightElement}
      </View>

      {error ? (
        <Text style={{ color: Colors.error, fontSize: 12, marginTop: 4 }}>{error}</Text>
      ) : hint ? (
        <Text style={{ color: Colors.muted, fontSize: 12, marginTop: 4 }}>{hint}</Text>
      ) : null}
    </View>
  );
}

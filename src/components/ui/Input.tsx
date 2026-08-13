// src/components/ui/Input.tsx
import React, { useState } from 'react';
import { TextInput, TextInputProps, View, Text, ViewStyle } from 'react-native';
import { Colors, Radius, FontSize } from '@/constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  rightElement?: React.ReactNode;
  leftElement?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  hint,
  rightElement,
  leftElement,
  containerStyle,
  style,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? Colors.error
    : focused
    ? Colors.primary
    : Colors.border;

  return (
    <View style={[{ marginBottom: 16 }, containerStyle]}>
      {label ? (
        <Text style={{
          color:          Colors.muted,
          fontSize:       FontSize.xs,
          fontWeight:     '500',
          letterSpacing:  0.5,
          textTransform:  'uppercase',
          marginBottom:   6,
        }}>
          {label}
        </Text>
      ) : null}

      <View style={{
        flexDirection:    'row',
        alignItems:       'center',
        backgroundColor:  Colors.bgCard,
        borderRadius:     Radius.md,
        borderWidth:      1,
        borderColor,
        paddingHorizontal: 12,
        height:           46,
      }}>
        {leftElement ? (
          <View style={{ marginRight: 8 }}>{leftElement}</View>
        ) : null}
        <TextInput
          style={[{
            flex:          1,
            color:         Colors.text,
            fontSize:      FontSize.md,
            paddingVertical: 0,
          }, style]}
          placeholderTextColor={Colors.textDisabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {rightElement ? (
          <View style={{ marginLeft: 8 }}>{rightElement}</View>
        ) : null}
      </View>

      {error ? (
        <Text style={{ color: Colors.error, fontSize: FontSize.xs, marginTop: 4 }}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={{ color: Colors.muted, fontSize: FontSize.xs, marginTop: 4 }}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

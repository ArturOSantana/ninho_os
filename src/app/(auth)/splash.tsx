// src/app/(auth)/splash.tsx
// Tela de loading enquanto o estado de autenticação é resolvido — paleta dark.

import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import Svg, { Polygon, Path, Ellipse } from 'react-native-svg';
import { Colors, FontSize } from '@/constants/theme';

function FoxMark({ size = 36 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Polygon points="20,10 45,50 10,45" fill="#e8720c" />
      <Polygon points="80,10 55,50 90,45" fill="#e8720c" />
      <Path d="M50,30 C70,30 85,50 82,72 C79,92 65,100 50,100 C35,100 21,92 18,72 C15,50 30,30 50,30 Z" fill="#e8720c" />
      <Path d="M50,55 C62,55 70,66 68,80 C66,92 58,98 50,99 C42,98 34,92 32,80 C30,66 38,55 50,55 Z" fill="#f5d9b0" />
      <Ellipse cx="40" cy="62" rx="3.2" ry="4.2" fill="#0d1b2a" />
      <Ellipse cx="60" cy="62" rx="3.2" ry="4.2" fill="#0d1b2a" />
      <Polygon points="46,85 54,85 50,92" fill="#0d1b2a" />
    </Svg>
  );
}

export default function SplashScreen() {
  return (
    <View style={s.root}>
      <View style={s.logoRing}>
        <FoxMark size={36} />
      </View>
      <Text style={s.wordmark}>ninho</Text>
      <Text style={s.tagline}>carregando…</Text>
      <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 32 }} />
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.secondary,
    marginBottom: 18,
  },
  wordmark: {
    fontFamily: 'Georgia',
    fontStyle: 'italic',
    fontSize: 26,
    color: Colors.tertiary,
    letterSpacing: -0.5,
  },
  tagline: {
    color: Colors.muted,
    fontSize: FontSize.sm,
    marginTop: 6,
  },
});

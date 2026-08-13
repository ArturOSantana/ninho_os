// src/app/(auth)/splash.tsx
// Tela de loading enquanto o estado de autenticação é resolvido
import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import Svg, { Polygon, Path, Ellipse } from 'react-native-svg';
import { Colors, FontSize } from '@/constants/theme';

function NinhoLogo({ size = 36 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Polygon points="20,10 45,50 10,45" fill={Colors.coral} />
      <Polygon points="80,10 55,50 90,45" fill={Colors.coral} />
      <Path d="M50,30 C70,30 85,50 82,72 C79,92 65,100 50,100 C35,100 21,92 18,72 C15,50 30,30 50,30 Z" fill={Colors.coral} />
      <Path d="M50,55 C62,55 70,66 68,80 C66,92 58,98 50,99 C42,98 34,92 32,80 C30,66 38,55 50,55 Z" fill={Colors.bgCard} />
      <Ellipse cx="40" cy="62" rx="3" ry="4" fill={Colors.bgPage} />
      <Ellipse cx="60" cy="62" rx="3" ry="4" fill={Colors.bgPage} />
      <Polygon points="46,85 54,85 50,92" fill={Colors.bgPage} />
    </Svg>
  );
}

export default function SplashScreen() {
  return (
    <View style={{
      flex:            1,
      backgroundColor: Colors.bgPage,
      alignItems:      'center',
      justifyContent:  'center',
    }}>
      <View style={{
        width:           64,
        height:          64,
        borderRadius:    16,
        backgroundColor: Colors.coralBg,
        borderWidth:     1,
        borderColor:     Colors.coral + '30',
        alignItems:      'center',
        justifyContent:  'center',
        marginBottom:    18,
      }}>
        <NinhoLogo size={36} />
      </View>

      <Text style={{
        color:         Colors.text,
        fontSize:      22,
        fontWeight:    '700',
        letterSpacing: -0.8,
        marginBottom:  6,
      }}>
        ninho
      </Text>

      <Text style={{
        color:        Colors.muted,
        fontSize:     FontSize.sm,
        marginBottom: 32,
      }}>
        carregando…
      </Text>

      <ActivityIndicator size="small" color={Colors.primary} />
    </View>
  );
}

// src/app/(onboarding)/welcome.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Polygon, Path, Ellipse } from 'react-native-svg';
import { IconBabyBottle, IconCalendarEvent, IconScale, IconArrowRight } from '@tabler/icons-react-native';
import { useAuthStore } from '@/stores/auth.store';
import { Colors, Radius, FontSize } from '@/constants/theme';

function NinhoLogo({ size = 48 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Polygon points="20,10 45,50 10,45" fill={Colors.coral} />
      <Polygon points="80,10 55,50 90,45" fill={Colors.coral} />
      <Path d="M50,30 C70,30 85,50 82,72 C79,92 65,100 50,100 C35,100 21,92 18,72 C15,50 30,30 50,30 Z" fill={Colors.coral} />
      <Path d="M50,55 C62,55 70,66 68,80 C66,92 58,98 50,99 C42,98 34,92 32,80 C30,66 38,55 50,55 Z" fill="#1a1d27" />
      <Ellipse cx="40" cy="62" rx="3" ry="4" fill="#0f1117" />
      <Ellipse cx="60" cy="62" rx="3" ry="4" fill="#0f1117" />
      <Polygon points="46,85 54,85 50,92" fill="#0f1117" />
    </Svg>
  );
}

const FEATURES = [
  {
    icon: <IconBabyBottle size={18} color={Colors.primary} />,
    title:  'Registro de bebê',
    desc:   'Mamadas, sono e trocas em segundos',
  },
  {
    icon: <IconCalendarEvent size={18} color={Colors.secondary} />,
    title:  'Agenda compartilhada',
    desc:   'Eventos e tarefas em tempo real',
  },
  {
    icon: <IconScale size={18} color={Colors.success} />,
    title:  'Equilíbrio familiar',
    desc:   'Distribua a carga mental de forma justa',
  },
] as const;

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { family, setIsOnboarded } = useAuthStore();
  const isWeb = Platform.OS === 'web';

  return (
    <View style={{
      flex:              1,
      backgroundColor:   Colors.bgPage,
      paddingTop:        isWeb ? 0 : insets.top,
      paddingBottom:     insets.bottom + 24,
      paddingHorizontal: 24,
      justifyContent:    'center',
      alignItems:        'center',
    }}>
      {/* Card central */}
      <View style={{
        width:           '100%',
        maxWidth:        440,
        backgroundColor: Colors.bgCard,
        borderRadius:    Radius.xl,
        borderWidth:     1,
        borderColor:     Colors.border,
        padding:         36,
      }}>
        {/* Logo + nome */}
        <View style={{ alignItems: 'center', marginBottom: 36 }}>
          <View style={{
            width:           72,
            height:          72,
            borderRadius:    18,
            backgroundColor: Colors.coralBg,
            borderWidth:     1,
            borderColor:     Colors.coral + '30',
            alignItems:      'center',
            justifyContent:  'center',
            marginBottom:    20,
          }}>
            <NinhoLogo size={42} />
          </View>

          <Text style={{
            color:         Colors.text,
            fontSize:      28,
            fontWeight:    '700',
            letterSpacing: -1,
            marginBottom:  8,
          }}>
            ninho
          </Text>
          <Text style={{
            color:      Colors.muted,
            fontSize:   FontSize.sm,
            textAlign:  'center',
            lineHeight: 20,
          }}>
            O sistema operacional da sua família
          </Text>
        </View>

        {/* Features */}
        <View style={{ gap: 12, marginBottom: 36 }}>
          {FEATURES.map((f) => (
            <View key={f.title} style={{
              flexDirection:    'row',
              alignItems:       'flex-start',
              gap:              12,
              backgroundColor:  Colors.bgPage,
              borderRadius:     Radius.md,
              padding:          14,
              borderWidth:      1,
              borderColor:      Colors.border,
            }}>
              <View style={{
                width:           34,
                height:          34,
                borderRadius:    8,
                backgroundColor: Colors.bgCard,
                alignItems:      'center',
                justifyContent:  'center',
              }}>
                {f.icon}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  color:      Colors.text,
                  fontSize:   FontSize.md,
                  fontWeight: '500',
                  marginBottom: 2,
                }}>
                  {f.title}
                </Text>
                <Text style={{
                  color:    Colors.muted,
                  fontSize: FontSize.sm,
                }}>
                  {f.desc}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* CTA principal */}
        <TouchableOpacity
          onPress={() => router.push('/(onboarding)/create-family')}
          activeOpacity={0.8}
          style={{
            backgroundColor: Colors.primary,
            borderRadius:    Radius.md,
            height:          48,
            flexDirection:   'row',
            alignItems:      'center',
            justifyContent:  'center',
            gap:             8,
            marginBottom:    14,
          }}
        >
          <Text style={{ color: '#ffffff', fontSize: FontSize.md, fontWeight: '600' }}>
            Começar agora
          </Text>
          <IconArrowRight size={18} color="#ffffff" />
        </TouchableOpacity>

        {/* Pular */}
        <TouchableOpacity
          onPress={() => {
            if (family) setIsOnboarded(true);
            router.replace('/(app)/(dashboard)');
          }}
          activeOpacity={0.7}
          style={{ alignItems: 'center', paddingVertical: 4 }}
        >
          <Text style={{ color: Colors.muted, fontSize: FontSize.sm }}>
            Pular por agora
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

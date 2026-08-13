// src/app/(app)/_layout.tsx
// Barra de navegação v2 — 5 abas conforme roadmap.
// handoff: bg-nav #0a1420, cantos 26px, sem labels,
// ícone Tabler outline, pontinho de 4px abaixo do item ativo.
import React from 'react';
import { Tabs } from 'expo-router';
import { View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  IconHome,
  IconBabyBottle,
  IconCalendar,
  IconChecklist,
  IconDots,
} from '@tabler/icons-react-native';
import { Colors } from '@/constants/theme';

type TabName = 'dashboard' | 'baby' | 'agenda' | 'tasks' | 'more';

// Ícone ativo: accent-primary. Inativo: border — discreto, não o creme quente.
// Sem texto — só ícone + pontinho de 4px quando ativo.
function TabIcon({
  name,
  focused,
}: {
  name: TabName;
  focused: boolean;
}) {
  const activeColor   = Colors.primary;  // #e8720c
  const inactiveColor = Colors.border;   // #2a3d52

  const iconColor = focused ? activeColor : inactiveColor;
  const iconSize  = 22;

  const icons: Record<TabName, React.ReactNode> = {
    dashboard: <IconHome        size={iconSize} color={iconColor} />,
    baby:      <IconBabyBottle  size={iconSize} color={iconColor} />,
    agenda:    <IconCalendar    size={iconSize} color={iconColor} />,
    tasks:     <IconChecklist   size={iconSize} color={iconColor} />,
    more:      <IconDots        size={iconSize} color={iconColor} />,
  };

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', gap: 4, paddingTop: 4 }}>
      {icons[name]}
      {/* Pontinho de 4px abaixo do ícone ativo */}
      {focused ? (
        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: activeColor }} />
      ) : (
        <View style={{ width: 4, height: 4 }} />
      )}
    </View>
  );
}

export default function AppLayout() {
  const insets = useSafeAreaInsets();

  const tabBarHeight = 60 + (Platform.OS === 'ios' ? insets.bottom : 10);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: Colors.bg,
          paddingBottom: tabBarHeight,
        },
        tabBarStyle: {
          position:        'absolute',
          left:            0,
          right:           0,
          bottom:          0,
          height:          tabBarHeight,
          paddingBottom:   Platform.OS === 'ios' ? insets.bottom : 10,
          paddingTop:      8,
          backgroundColor: Colors.bgNav,          // #0a1420
          borderTopWidth:  0,
          // Cantos superiores arredondados — handoff: 26px 26px 0 0
          borderTopLeftRadius:  26,
          borderTopRightRadius: 26,
        },
        tabBarItemStyle:  { paddingVertical: 0 },
        tabBarShowLabel:  false,
      }}
    >
      <Tabs.Screen name="(dashboard)"     options={{ tabBarIcon: ({ focused }) => <TabIcon name="dashboard" focused={focused} /> }} />
      <Tabs.Screen name="(baby)"          options={{ tabBarIcon: ({ focused }) => <TabIcon name="baby"      focused={focused} /> }} />
      <Tabs.Screen name="(agenda)"        options={{ tabBarIcon: ({ focused }) => <TabIcon name="agenda"    focused={focused} /> }} />
      <Tabs.Screen name="(tasks)"         options={{ tabBarIcon: ({ focused }) => <TabIcon name="tasks"     focused={focused} /> }} />
      {/* Rotas acessíveis via menu "Mais" — sem aba dedicada */}
      <Tabs.Screen name="(shopping)"      options={{ href: null }} />
      <Tabs.Screen name="(mental-load)"   options={{ href: null }} />
      <Tabs.Screen name="(notifications)" options={{ href: null }} />
      <Tabs.Screen name="(family)"        options={{ href: null }} />
      <Tabs.Screen name="(couple)"        options={{ href: null }} />
      <Tabs.Screen name="(kids)"          options={{ href: null }} />
      <Tabs.Screen name="(more)"          options={{ tabBarIcon: ({ focused }) => <TabIcon name="more"      focused={focused} /> }} />
    </Tabs>
  );
}

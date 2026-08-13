// src/app/(app)/_layout.tsx
// Navegação principal: sidebar no web (≥768px) / tab bar no mobile
import React, { useEffect, useMemo, useState } from 'react';
import { Tabs } from 'expo-router';
import { View, Text, Platform, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useSegments } from 'expo-router';
import {
  IconLayoutDashboard,
  IconBabyBottle,
  IconCalendarEvent,
  IconCheckbox,
  IconMenu2,
  IconShoppingCart,
  IconUsers,
  IconScale,
  IconHeart,
  IconUser,
} from '@tabler/icons-react-native';
import { Colors, WEB_SIDEBAR_WIDTH } from '@/constants/theme';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import Svg, { Polygon, Path, Ellipse } from 'react-native-svg';
import { HamburgerDrawer } from '@/components/ui/HamburgerDrawer';
import { useFamily } from '@/hooks';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';

// ── Logo SVG da Raposa (compacto) ─────────────────────────────────────────────
function NinhoLogo({ size = 24 }: { size?: number }) {
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

type NavItem = {
  key: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
  route: string;
};

const NAV_ITEMS: NavItem[] = [
  {
    key: '(dashboard)',
    label: 'Início',
    icon: (a) => <IconLayoutDashboard size={20} color={a ? Colors.primary : Colors.muted} />,
    route: '/(app)/(dashboard)',
  },
  {
    key: '(baby)',
    label: 'Bebê',
    icon: (a) => <IconBabyBottle size={20} color={a ? Colors.primary : Colors.muted} />,
    route: '/(app)/(baby)',
  },
  {
    key: '(agenda)',
    label: 'Agenda',
    icon: (a) => <IconCalendarEvent size={20} color={a ? Colors.primary : Colors.muted} />,
    route: '/(app)/(agenda)',
  },
  {
    key: '(tasks)',
    label: 'Tarefas',
    icon: (a) => <IconCheckbox size={20} color={a ? Colors.primary : Colors.muted} />,
    route: '/(app)/(tasks)',
  },
  {
    key: '(shopping)',
    label: 'Compras',
    icon: (a) => <IconShoppingCart size={20} color={a ? Colors.primary : Colors.muted} />,
    route: '/(app)/(shopping)',
  },
];

const NAV_SECONDARY: NavItem[] = [
  {
    key: '(mental-load)',
    label: 'Carga Mental',
    icon: (a) => <IconScale size={20} color={a ? Colors.primary : Colors.muted} />,
    route: '/(app)/(mental-load)',
  },
  {
    key: '(couple)',
    label: 'Casal',
    icon: (a) => <IconHeart size={20} color={a ? Colors.primary : Colors.muted} />,
    route: '/(app)/(couple)',
  },
  {
    key: '(family)',
    label: 'Família',
    icon: (a) => <IconUsers size={20} color={a ? Colors.primary : Colors.muted} />,
    route: '/(app)/(family)',
  },
  {
    key: '(more)',
    label: 'Perfil',
    icon: (a) => <IconUser size={20} color={a ? Colors.primary : Colors.muted} />,
    route: '/(app)/(more)',
  },
];

// ── Sidebar para Desktop ──────────────────────────────────────────────────────
function Sidebar() {
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const { family } = useFamily();
  const { members, load: loadMembers } = useFamilyMembers(family?.id);
  useEffect(() => { if (family?.id) loadMembers(); }, [family?.id, loadMembers]);
  const hasPartner = useMemo(
    () => members.filter((m) => m.role === 'admin' || m.role === 'parent').length >= 2,
    [members],
  );

  // Segmento ativo — ex: "(dashboard)"
  const activeKey = (segments as string[])[1] as string | undefined;

  function isActive(key: string) {
    return activeKey === key;
  }

  function NavRow({ item }: { item: NavItem }) {
    const active = isActive(item.key);
    return (
      <TouchableOpacity
        onPress={() => router.push(item.route as never)}
        activeOpacity={0.75}
        style={{
          flexDirection:    'row',
          alignItems:       'center',
          gap:              10,
          paddingVertical:  9,
          paddingHorizontal: 12,
          borderRadius:     8,
          backgroundColor:  active ? Colors.primaryBg : 'transparent',
          marginBottom:     2,
        }}
      >
        {item.icon(active)}
        <Text style={{
          color:      active ? Colors.primary : Colors.muted,
          fontSize:   14,
          fontWeight: active ? '500' : '400',
        }}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={{
      width:           WEB_SIDEBAR_WIDTH,
      height:          '100%',
      backgroundColor: Colors.bgPage,
      borderRightWidth: 1,
      borderRightColor: Colors.border,
      paddingTop:       insets.top + 8,
      paddingHorizontal: 12,
      paddingBottom:    24,
      justifyContent:  'space-between',
    }}>
      {/* Logo */}
      <View>
        <View style={{
          flexDirection: 'row',
          alignItems:    'center',
          gap:           10,
          paddingHorizontal: 4,
          marginBottom:  28,
          marginTop:     4,
        }}>
          <NinhoLogo size={22} />
          <Text style={{
            color:         Colors.text,
            fontSize:      16,
            fontWeight:    '600',
            letterSpacing: -0.4,
          }}>
            ninho
          </Text>
        </View>

        {/* Itens principais */}
        <Text style={{
          color:         Colors.textDisabled,
          fontSize:      10,
          fontWeight:    '600',
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          paddingHorizontal: 12,
          marginBottom:  6,
        }}>
          Principal
        </Text>
        {NAV_ITEMS.map((item) => (
          <NavRow key={item.key} item={item} />
        ))}

        {/* Separador */}
        <View style={{ height: 1, backgroundColor: Colors.border, marginVertical: 16 }} />

        {/* Itens secundários */}
        <Text style={{
          color:         Colors.textDisabled,
          fontSize:      10,
          fontWeight:    '600',
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          paddingHorizontal: 12,
          marginBottom:  6,
        }}>
          Módulos
        </Text>
        {NAV_SECONDARY.filter((item) =>
          (item.key === '(mental-load)' || item.key === '(couple)') ? hasPartner : true
        ).map((item) => (
          <NavRow key={item.key} item={item} />
        ))}
      </View>
    </View>
  );
}

// ── Tab icon para Mobile ──────────────────────────────────────────────────────
type TabName = 'dashboard' | 'baby' | 'agenda' | 'tasks' | 'more';

function TabIcon({ name, focused, drawerOpen }: { name: TabName; focused: boolean; drawerOpen?: boolean }) {
  const color = (focused || drawerOpen) ? Colors.primary : Colors.muted;
  const size  = 22;

  const map: Record<TabName, React.ReactNode> = {
    dashboard: <IconLayoutDashboard size={size} color={color} />,
    baby:      <IconBabyBottle      size={size} color={color} />,
    agenda:    <IconCalendarEvent   size={size} color={color} />,
    tasks:     <IconCheckbox        size={size} color={color} />,
    more:      <IconMenu2           size={size} color={color} />,
  };

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 4, gap: 4 }}>
      {map[name]}
      {(focused || drawerOpen) ? (
        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.primary }} />
      ) : (
        <View style={{ width: 4, height: 4 }} />
      )}
    </View>
  );
}

// ── Layout principal ──────────────────────────────────────────────────────────
export default function AppLayout() {
  const insets = useSafeAreaInsets();
  const { isDesktop } = useBreakpoint();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const tabBarHeight = 60 + (Platform.OS === 'ios' ? insets.bottom : 10);

  if (isDesktop) {
    // Web desktop: sidebar + conteúdo lado a lado dentro das Tabs
    return (
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: Colors.bgPage }}>
        <Sidebar />
        <View style={{ flex: 1 }}>
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarStyle: { display: 'none' },
              sceneStyle:  { backgroundColor: Colors.bgPage },
            }}
          >
            <Tabs.Screen name="(dashboard)"     />
            <Tabs.Screen name="(baby)"          />
            <Tabs.Screen name="(agenda)"        />
            <Tabs.Screen name="(tasks)"         />
            <Tabs.Screen name="(shopping)"      />
            <Tabs.Screen name="(mental-load)"   />
            <Tabs.Screen name="(notifications)" options={{ href: null }} />
            <Tabs.Screen name="(family)"        />
            <Tabs.Screen name="(couple)"        />
            <Tabs.Screen name="(kids)"          options={{ href: null }} />
            <Tabs.Screen name="(more)"          />
          </Tabs>
        </View>
      </View>
    );
  }

  // Mobile / tablet: tab bar na parte inferior
  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: {
            backgroundColor: Colors.bgPage,
            paddingBottom:   tabBarHeight,
          },
          tabBarStyle: {
            position:            'absolute',
            left:                0,
            right:               0,
            bottom:              0,
            height:              tabBarHeight,
            paddingBottom:       Platform.OS === 'ios' ? insets.bottom : 10,
            paddingTop:          8,
            backgroundColor:     Colors.bgNav,
            borderTopWidth:      1,
            borderTopColor:      Colors.border,
            borderTopLeftRadius: 20,
            borderTopRightRadius:20,
          },
          tabBarItemStyle:  { paddingVertical: 0 },
          tabBarShowLabel:  false,
        }}
      >
        <Tabs.Screen name="(dashboard)"     options={{ tabBarIcon: ({ focused }) => <TabIcon name="dashboard" focused={focused} /> }} />
        <Tabs.Screen name="(baby)"          options={{ tabBarIcon: ({ focused }) => <TabIcon name="baby"      focused={focused} /> }} />
        <Tabs.Screen name="(agenda)"        options={{ tabBarIcon: ({ focused }) => <TabIcon name="agenda"    focused={focused} /> }} />
        <Tabs.Screen name="(tasks)"         options={{ tabBarIcon: ({ focused }) => <TabIcon name="tasks"     focused={focused} /> }} />
        <Tabs.Screen name="(shopping)"      options={{ href: null }} />
        <Tabs.Screen name="(mental-load)"   options={{ href: null }} />
        <Tabs.Screen name="(notifications)" options={{ href: null }} />
        <Tabs.Screen name="(family)"        options={{ href: null }} />
        <Tabs.Screen name="(couple)"        options={{ href: null }} />
        <Tabs.Screen name="(kids)"          options={{ href: null }} />
        <Tabs.Screen
          name="(more)"
          options={{
            tabBarIcon: ({ focused }) => <TabIcon name="more" focused={focused} drawerOpen={drawerOpen} />,
            tabBarButton: (props) => (
              <TouchableOpacity
                {...(props as any)}
                onPress={() => setDrawerOpen(true)}
                activeOpacity={0.7}
                style={props.style}
              />
            ),
          }}
        />
      </Tabs>

      <HamburgerDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}

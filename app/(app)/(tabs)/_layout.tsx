import { Tabs } from 'expo-router';
import { View, Text, Platform } from 'react-native';
import { Colors } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function TabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 4 }}>
      <Text style={{ fontSize: 20 }}>{icon}</Text>
      <Text
        style={{
          fontSize: 10,
          marginTop: 2,
          color: focused ? Colors.orange : Colors.muted,
          fontWeight: focused ? '700' : '400',
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 60 + (Platform.OS === 'ios' ? insets.bottom : 0),
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 4,
          paddingTop: 4,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="🏠" label="Início" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="baby"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="🍼" label="Bebê" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="couple"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="💑" label="Casal" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="kids"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="🧒" label="Filhos" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="🛒" label="Casa" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

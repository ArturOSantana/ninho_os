// src/app/(app)/(kids)/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function KidsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.bg },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="points" />
      <Stack.Screen name="achievements" />
      <Stack.Screen name="screen-time" />
      <Stack.Screen name="school" />
      <Stack.Screen name="meals" />
      <Stack.Screen name="homework" />
    </Stack>
  );
}

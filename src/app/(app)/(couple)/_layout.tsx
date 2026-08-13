// src/app/(app)/(couple)/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function CoupleLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.bg },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="checkin" />
      <Stack.Screen name="appreciation" />
      <Stack.Screen name="expenses" />
    </Stack>
  );
}

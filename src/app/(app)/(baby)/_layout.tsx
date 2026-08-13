// src/app/(app)/(baby)/_layout.tsx

import React from 'react';
import { Stack } from 'expo-router';

/**
 * Baby Stack Layout
 */
export default function BabyLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="register/[type]"
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen name="history" />
      <Stack.Screen name="edit-baby" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

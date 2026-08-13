// src/app/(app)/(dashboard)/_layout.tsx

import React from 'react';
import { Stack } from 'expo-router';

/**
 * Dashboard Stack Layout
 */
export default function DashboardLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}

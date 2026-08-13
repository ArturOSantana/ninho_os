// src/app/(auth)/_layout.tsx

import React from 'react';
import { Stack } from 'expo-router';

/**
 * Layout para stack de autenticação
 */
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="splash" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}

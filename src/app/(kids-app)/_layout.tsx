// src/app/(kids-app)/_layout.tsx
// Layout exclusivo para a sessão do filho.
// Exibe apenas Stack sem abas — o filho não acessa o app dos pais.

import React from 'react';
import { Stack } from 'expo-router';

export default function KidsAppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="points" />
      <Stack.Screen name="achievements" />
    </Stack>
  );
}

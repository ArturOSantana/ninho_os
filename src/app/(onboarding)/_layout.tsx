// src/app/(onboarding)/_layout.tsx

import React from 'react';
import { Stack } from 'expo-router';

/**
 * Layout para stack de onboarding
 * Todas as telas de onboarding usam este layout
 */
export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationTypeForReplace: 'push',
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="create-family" />
      <Stack.Screen name="add-baby" />
      <Stack.Screen name="invite-partner" />
      <Stack.Screen name="complete" />
    </Stack>
  );
}

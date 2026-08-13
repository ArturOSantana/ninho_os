// src/app/(app)/(agenda)/_layout.tsx

import { Stack } from 'expo-router';

export default function AgendaLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="new-event"
        options={{ presentation: 'modal', headerShown: false }}
      />
    </Stack>
  );
}

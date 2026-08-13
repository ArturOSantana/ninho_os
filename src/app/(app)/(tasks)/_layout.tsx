// src/app/(app)/(tasks)/_layout.tsx

import { Stack } from 'expo-router';

export default function TasksLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen
        name="new-task"
        options={{ presentation: 'modal', headerShown: false }}
      />
    </Stack>
  );
}

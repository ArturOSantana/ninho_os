// src/app/(app)/(mental-load)/_layout.tsx

import React from 'react';
import { Stack } from 'expo-router';

export default function MentalLoadLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="history" />
      <Stack.Screen name="activities" />
      <Stack.Screen name="insights" />
      <Stack.Screen name="checkin" />
    </Stack>
  );
}

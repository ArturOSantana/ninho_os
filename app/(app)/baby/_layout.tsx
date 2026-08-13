import { Stack } from 'expo-router';

export default function BabySubLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_bottom' }}>
      <Stack.Screen name="record" />
    </Stack>
  );
}

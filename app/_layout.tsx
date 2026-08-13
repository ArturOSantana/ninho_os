import '../src/styles/global.css';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, ActivityIndicator } from 'react-native';
import { useEffect, useRef } from 'react';
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/stores/auth.store';
import { supabase } from '@/lib/supabase';
import { getProfile, getFamily, getBabies } from '@/services/api';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 1 } },
});

// Fora do componente para não recriar em re-renders
async function loadUserData(userId: string) {
  const { setProfile, setFamily, setBabies, setIsOnboarded, setIsLoading } =
    useAuthStore.getState();
  try {
    const profile = await getProfile(userId);
    console.log('[Auth] profile:', profile?.id ?? 'null', 'family_id:', profile?.family_id ?? 'none');
    setProfile(profile);

    if (profile?.family_id) {
      const [family, babies] = await Promise.all([
        getFamily(profile.family_id),
        getBabies(profile.family_id),
      ]);
      setFamily(family);
      setBabies(babies ?? []);
      setIsOnboarded(true);
    } else {
      setFamily(null);
      setBabies([]);
      setIsOnboarded(false);
    }
  } catch (e) {
    console.warn('[Auth] loadUserData error:', e);
    // Garante que o loading cai mesmo em erro
  } finally {
    setIsLoading(false);
  }
}

/** Inicializa o AuthStore uma única vez ao montar o app. */
function AuthInitializer() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    console.log('[Auth] initializing...');
    const { setSession, setIsLoading, reset } = useAuthStore.getState();

    // 1. Listener para mudanças futuras (login, logout, refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth] onAuthStateChange event:', event, '| userId:', session?.user?.id ?? 'none');
    });

    // 2. Verifica sessão atual de forma explícita e carrega dados
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('[Auth] getSession result — userId:', session?.user?.id ?? 'none', '| error:', error?.message ?? 'none');
      setSession(session);
      if (session?.user) {
        loadUserData(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}

/** Redireciona para a rota correta conforme o estado de auth. */
function NavigationGuard() {
  const { session, isLoading, isOnboarded } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuth = segments[0] === '(auth)';
    console.log('[Nav] isLoading:false | session:', !!session, '| onboarded:', isOnboarded, '| segment:', segments[0] ?? 'undefined');

    if (!session && !inAuth) {
      router.replace('/(auth)/login');
    } else if (session && !isOnboarded && !inAuth) {
      router.replace('/(auth)/onboarding');
    } else if (session && isOnboarded && inAuth) {
      router.replace('/(app)/(tabs)/dashboard');
    }
  }, [session, isLoading, isOnboarded, segments[0]]);

  // Overlay de loading sobre a Stack (sem desmontar nada)
  if (isLoading) {
    return (
      <View
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: Colors.bg,
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
        }}
      >
        <ActivityIndicator size="large" color={Colors.orange} />
      </View>
    );
  }

  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthInitializer />
          <StatusBar style="light" />
          <NavigationGuard />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(app)" />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

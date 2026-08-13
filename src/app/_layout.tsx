// src/app/_layout.tsx
import '@/styles/global.css';

import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '@/context/AuthContext';
import { FamilyProvider } from '@/context/FamilyContext';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth.store';
import { getProfile, getFamily, getBabies } from '@/services/api';
import { Colors } from '@/constants/theme';

// ─── Carrega dados do usuário no store (fora de componente) ───
let loadingUserId: string | null = null; // evita chamadas paralelas para o mesmo userId

async function loadUserData(userId: string) {
  // Se já há uma carga em andamento para esse usuário, ignora.
  if (loadingUserId === userId) return;
  loadingUserId = userId;

  const { setProfile, setFamily, setBabies, setIsOnboarded, setIsLoading } =
    useAuthStore.getState();
  try {
    console.log('[Auth] loadUserData start', userId);
    const profile = await getProfile(userId);
    console.log('[Auth] profile loaded', profile?.id, 'family_id=', profile?.family_id);
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
  } finally {
    console.log('[Auth] loadUserData done → isLoading=false');
    loadingUserId = null;
    setIsLoading(false);
  }
}

// ─── Inicializa o AuthStore com a sessão do Supabase ──────────
function AuthInitializer() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const { setSession, setIsLoading, reset } = useAuthStore.getState();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth] onAuthStateChange event=', event, 'user=', session?.user?.id ?? null);

      if (event === 'INITIAL_SESSION') {
        // Evento de inicialização — define o estado inicial independente de ter sessão ou não
        if (session?.user) {
          setSession(session);
          setIsLoading(true);
          loadUserData(session.user.id);
        } else {
          setSession(null);
          setIsLoading(false);
        }
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Apenas reage ao SIGNED_IN se for um login/refresh real (não o inicial)
        // O guard loadingUserId evita duplicação se INITIAL_SESSION já disparou
        if (session?.user) {
          setSession(session);
          // Só inicia loading se não houver carga em andamento para esse user
          if (loadingUserId !== session.user.id) {
            setIsLoading(true);
            loadUserData(session.user.id);
          }
        }
      } else if (event === 'PASSWORD_RECOVERY' && session?.user) {
        const s = useAuthStore.getState();
        s.setSession(session);
        loadUserData(session.user.id).then(() => {
          useAuthStore.getState().setPendingPasswordReset(true);
        });
      } else if (event === 'SIGNED_OUT') {
        reset();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}

// ─── Guard de navegação ───────────────────────────────────────
function NavigationGuard() {
  const { session, isLoading, isOnboarded, pendingPasswordReset, setPendingPasswordReset, childSession } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    console.log('[Guard] isLoading=', isLoading, 'session=', !!session, 'isOnboarded=', isOnboarded, 'childSession=', !!childSession, 'segments=', segments);
    if (isLoading) return;

    // Fluxo de recuperação de senha: link do e-mail abre o app com evento
    // PASSWORD_RECOVERY → o store sinaliza via flag → mandamos para a tela de troca.
    if (pendingPasswordReset && session) {
      setPendingPasswordReset(false);
      router.replace('/(app)/(more)/change-password');
      return;
    }

    const inAuth       = segments[0] === '(auth)';
    const inOnboarding = segments[0] === '(onboarding)';
    const inApp        = segments[0] === '(app)';
    const inKidsApp    = segments[0] === '(kids-app)';
    const inChildLogin = segments[0] === 'child-login';
    const inPublic     =
      segments[0] === 'guest-shopping' ||
      segments[0] === 'accept-invite';
    const inKnownRoute = inAuth || inOnboarding || inApp || inKidsApp || inChildLogin || inPublic;

    // Sessão de criança ativa → redireciona para o app restrito do filho
    if (childSession && !inKidsApp) {
      router.replace('/(kids-app)' as never);
      return;
    }

    // Sem sessão → login
    if (!session) {
      if (!inAuth && !inPublic) router.replace('/(auth)/login');
      return;
    }

    // Sem onboarding concluído → onboarding
    if (!isOnboarded) {
      if (!inOnboarding && !inApp) router.replace('/(onboarding)/welcome');
      return;
    }

    // Onboarded: se estiver em /auth OU em rota desconhecida (ex: tela inicial vazia)
    // envia para o dashboard
    if (inAuth || !inKnownRoute) router.replace('/(app)/(dashboard)');
  }, [session, isLoading, isOnboarded, pendingPasswordReset, childSession, segments]);

  if (isLoading) {
    return (
      <View
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: '#0F1117',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
        }}
      >
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return null;
}

// Ninho é always-dark: desativa a detecção via media query do NativeWind v4.
// Sem isso, a lib reclama "Cannot manually set color scheme, as dark mode is
// type 'media'" ao tentar fixar o tema em runtime.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(StyleSheet as any).setFlag?.('darkMode', 'class');

// ─── Layout raiz ──────────────────────────────────────────────
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <FamilyProvider>
            <AuthInitializer />
            <NavigationGuard />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="splash-loader" options={{ gestureEnabled: false }} />
              <Stack.Screen name="(auth)" options={{ gestureEnabled: false }} />
              <Stack.Screen name="(onboarding)" options={{ gestureEnabled: false }} />
              <Stack.Screen name="(app)" />
              <Stack.Screen name="(kids-app)" options={{ gestureEnabled: false }} />
              <Stack.Screen name="child-login" options={{ presentation: 'modal' }} />
              <Stack.Screen name="accept-invite" options={{ presentation: 'modal' }} />
              <Stack.Screen name="guest-shopping" options={{ gestureEnabled: false }} />
            </Stack>
          </FamilyProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

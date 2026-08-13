import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { Profile, Family, Baby } from '@/types';

/**
 * Sessão local de uma criança autenticada via PIN.
 * Não usa JWT — é exclusivamente client-side.
 */
export interface ChildSession {
  profileId: string;
  name: string;
  familyId: string;
  /** Timestamp de quando o PIN foi validado (ms) */
  authenticatedAt: number;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  family: Family | null;
  babies: Baby[];
  isLoading: boolean;
  isOnboarded: boolean;
  pendingPasswordReset: boolean;
  /** Sessão ativa de criança (autenticada via PIN). Null = nenhuma criança ativa. */
  childSession: ChildSession | null;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setFamily: (family: Family | null) => void;
  setBabies: (babies: Baby[]) => void;
  setIsLoading: (loading: boolean) => void;
  setIsOnboarded: (onboarded: boolean) => void;
  setPendingPasswordReset: (pending: boolean) => void;
  setChildSession: (childSession: ChildSession | null) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  family: null,
  babies: [],
  isLoading: true,
  isOnboarded: false,
  pendingPasswordReset: false,
  childSession: null,

  setSession: (session) =>
    set({ session, user: session?.user ?? null }),

  setProfile: (profile) => set({ profile }),
  setFamily: (family) => set({ family }),
  setBabies: (babies) => set({ babies }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsOnboarded: (isOnboarded) => set({ isOnboarded }),
  setPendingPasswordReset: (pendingPasswordReset) => set({ pendingPasswordReset }),
  setChildSession: (childSession) => set({ childSession }),

  reset: () =>
    set({
      session: null,
      user: null,
      profile: null,
      family: null,
      babies: [],
      isLoading: false,
      isOnboarded: false,
      pendingPasswordReset: false,
      childSession: null,
    }),
}));

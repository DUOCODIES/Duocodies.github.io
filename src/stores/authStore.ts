import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User, AuthError, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  setSession: (session: Session | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  initialized: false,

  setSession: (session: Session | null) => {
    set({
      session,
      user: session?.user ?? null,
      loading: false,
      initialized: true,
    });
  },

  refreshSession: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      get().setSession(session);
    } catch (error) {
      console.error('Error refreshing session:', error);
      get().setSession(null);
    }
  },

  signIn: async (email: string, password: string) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      get().setSession(data.session);
    } catch (error) {
      const authError = error as AuthError;
      throw new Error(authError.message);
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    set({ loading: true });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      get().setSession(null);
    } catch (error) {
      const authError = error as AuthError;
      throw new Error(authError.message);
    } finally {
      set({ loading: false });
    }
  },
}));

// Initialize auth state
supabase.auth.onAuthStateChange((event, session) => {
  const store = useAuthStore.getState();
  store.setSession(session);
});

// Initial session check
useAuthStore.getState().refreshSession();
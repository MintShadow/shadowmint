import { create } from "zustand";
import { supabase } from "../utils/supabase";

type AuthState = {
  user: any;
  session: any;
  loading: boolean;

  init: () => Promise<void>;
  loginEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,

  // Call once on app start — restores session if user was already logged in
  init: async () => {
    const { data } = await supabase.auth.getSession();
    set({
      user: data.session?.user ?? null,
      session: data.session ?? null,
      loading: false,
    });

    // Listen for login / logout events automatically
    supabase.auth.onAuthStateChange((_event, session) => {
      set({
        user: session?.user ?? null,
        session: session ?? null,
      });
    });
  },

  // Email + password login
  loginEmail: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    set({ user: data.user, session: data.session });
  },

  // Sign up — also saves full name to profiles table
  signUpEmail: async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    if (error) throw error;
    set({ user: data.user, session: data.session });
  },

  // Logout
  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null });
  },
}));
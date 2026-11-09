"use client";

import type { AuthTokens, UserDTO } from "@/lib/core";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserDTO | null;
  hydrated: boolean;
  setTokens: (tokens: AuthTokens) => void;
  setUser: (user: UserDTO) => void;
  clear: () => void;
}

/**
 * Tokens live in localStorage so a session survives reloads. The API is on a
 * different origin (Fly/Railway vs Vercel), which rules out simple httpOnly cookies.
 */
export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      hydrated: false,
      setTokens: ({ accessToken, refreshToken }) => set({ accessToken, refreshToken }),
      setUser: (user) => set({ user }),
      clear: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    {
      name: "tradepulse-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ accessToken, refreshToken, user }) => ({ accessToken, refreshToken, user }),
      // Rehydrated manually on the client (see Providers) to avoid SSR mismatches.
      skipHydration: true,
      onRehydrateStorage: () => () => {
        useAuth.setState({ hydrated: true });
      },
    },
  ),
);

"use client";

import { ApiClientError, createApiClient } from "@/lib/api-client";
import { useAuth } from "./auth-store";

// Must start with NEXT_PUBLIC_ so Next.js inlines it into the browser bundle at build time.
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://trade-pulse-server.onrender.com/api/v1"
    : "http://localhost:5000/api/v1");

export const api = createApiClient({
  baseUrl: API_URL,
  tokens: {
    getAccessToken: () => useAuth.getState().accessToken,
    getRefreshToken: () => useAuth.getState().refreshToken,
    setTokens: (tokens) => useAuth.getState().setTokens(tokens),
    clear: () => useAuth.getState().clear(),
  },
  onSessionExpired: () => {
    if (
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith("/auth")
    ) {
      // Full reload on purpose: drops all cached data from the expired session.
      const login = new URL("/auth/login", window.location.origin);
      login.searchParams.set("next", window.location.pathname);
      window.location.replace(login.href);
    }
  },
});

export { ApiClientError };

export function errorMessage(
  err: unknown,
  fallback = "Something went wrong",
): string {
  if (err instanceof ApiClientError) return err.message;
  if (err instanceof TypeError)
    return "Can't reach the server. Check your connection.";
  return err instanceof Error ? err.message : fallback;
}

export const isLimitError = (err: unknown) =>
  err instanceof ApiClientError && err.code === "INVOICE_LIMIT_REACHED";

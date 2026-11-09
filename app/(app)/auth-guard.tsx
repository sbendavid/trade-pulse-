"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-store";
import { useMe } from "@/lib/queries";

/** Client-side guard: tokens live in localStorage, so the check runs after hydration. */
export function AuthGuard({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { hydrated, accessToken } = useAuth();

  useEffect(() => {
    if (hydrated && !accessToken) router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`);
  }, [hydrated, accessToken, pathname, router]);

  if (!hydrated || !accessToken) return fallback;
  return <SessionRefresher>{children}</SessionRefresher>;
}

/** Keeps the cached profile (plan, quota) fresh once the user is signed in. */
function SessionRefresher({ children }: { children: React.ReactNode }) {
  useMe();
  return <>{children}</>;
}

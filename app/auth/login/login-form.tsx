"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type LoginInput, loginSchema } from "@/lib/core";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { api, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";

export function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const setUser = useAuth((s) => s.setUser);
  const form = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });
  const { errors } = form.formState;

  const login = useMutation({
    mutationFn: api.auth.login,
    onSuccess: ({ user }) => {
      setUser(user);
      // Only allow relative redirects.
      router.replace(next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
    },
  });

  return (
    <form onSubmit={form.handleSubmit((v) => login.mutate(v))} className="space-y-4" noValidate>
      {login.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {errorMessage(login.error)}
        </p>
      )}
      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...form.register("email")} />
      </Field>
      <Field label="Password" htmlFor="password" error={errors.password?.message}>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          {...form.register("password")}
        />
      </Field>
      <div className="text-right">
        <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
          Forgot password?
        </Link>
      </div>
      <Button type="submit" className="w-full" size="lg" loading={login.isPending}>
        Log in
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        New to TradePulse?{" "}
        <Link href="/auth/register" className="font-medium text-primary hover:underline">
          Create a free account
        </Link>
      </p>
    </form>
  );
}

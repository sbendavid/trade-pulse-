"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { api, errorMessage } from "@/lib/api";

export function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");

  const reset = useMutation({
    mutationFn: () => api.auth.resetPassword(token, password),
    onSuccess: () => {
      toast.success("Password updated. Please log in.");
      router.replace("/auth/login");
    },
  });

  if (!token) return <p className="text-sm text-destructive">This reset link is missing its token.</p>;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        reset.mutate();
      }}
      className="space-y-4"
    >
      <Field
        label="New password"
        htmlFor="password"
        hint="At least 8 characters."
        error={reset.error ? errorMessage(reset.error) : undefined}
      >
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      <Button type="submit" className="w-full" disabled={password.length < 8} loading={reset.isPending}>
        Update password
      </Button>
    </form>
  );
}

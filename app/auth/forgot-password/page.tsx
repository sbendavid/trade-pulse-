"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { api, errorMessage } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const request = useMutation({ mutationFn: () => api.auth.forgotPassword(email) });

  if (request.isSuccess) {
    return (
      <>
        <h1 className="text-xl font-semibold">Check your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          If an account exists for <strong>{email}</strong>, we&apos;ve sent a link to reset your password. It expires in
          1 hour.
        </p>
        <Link href="/auth/login" className="mt-6 inline-block text-sm font-medium text-primary hover:underline">
          Back to log in
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="text-xl font-semibold">Reset your password</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">We&apos;ll email you a link to choose a new password.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          request.mutate();
        }}
        className="space-y-4"
      >
        <Field label="Email" htmlFor="email" error={request.error ? errorMessage(request.error) : undefined}>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Button type="submit" className="w-full" loading={request.isPending}>
          Send reset link
        </Button>
        <p className="text-center text-sm">
          <Link href="/auth/login" className="text-primary hover:underline">
            Back to log in
          </Link>
        </p>
      </form>
    </>
  );
}

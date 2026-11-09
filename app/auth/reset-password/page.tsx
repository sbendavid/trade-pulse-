import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "./reset-form";

export const metadata: Metadata = { title: "Choose a new password" };

export default function ResetPasswordPage() {
  return (
    <>
      <h1 className="text-xl font-semibold">Choose a new password</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">You&apos;ll be signed out on all other devices.</p>
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </>
  );
}

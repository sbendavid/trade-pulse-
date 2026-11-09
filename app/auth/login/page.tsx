import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <>
      <h1 className="text-xl font-semibold">Welcome back</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">Log in to manage your invoices and clients.</p>
      <Suspense>
        <LoginForm />
      </Suspense>
    </>
  );
}

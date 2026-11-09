"use client";

import { useMutation } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { api, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";

export default function VerifyPhonePage() {
  const router = useRouter();
  const { user, accessToken, hydrated, setUser } = useAuth();
  const [otp, setOtp] = useState("");

  useEffect(() => {
    if (hydrated && !accessToken) router.replace("/auth/login");
  }, [hydrated, accessToken, router]);

  const verify = useMutation({
    mutationFn: () => api.auth.verifyPhone(otp),
    onSuccess: (u) => {
      setUser(u);
      toast.success("WhatsApp number verified");
      router.replace("/dashboard");
    },
  });

  const resend = useMutation({
    mutationFn: api.auth.resendOtp,
    onSuccess: ({ sent }) =>
      sent ? toast.success("New code sent on WhatsApp") : toast.info("WhatsApp isn't configured — check the server logs"),
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <>
      <div className="mb-4 grid size-12 place-items-center rounded-full bg-[#25D366]/15 text-[#128C7E]">
        <MessageCircle className="size-6" />
      </div>
      <h1 className="text-xl font-semibold">Verify your WhatsApp</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">
        Enter the 6-digit code we sent to <span className="font-medium text-foreground">{user?.phone ?? "your phone"}</span>.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          verify.mutate();
        }}
        className="space-y-4"
      >
        <Field label="Verification code" htmlFor="otp" error={verify.error ? errorMessage(verify.error) : undefined}>
          <Input
            id="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            className="text-center text-2xl tracking-[0.5em]"
            placeholder="••••••"
          />
        </Field>
        <Button type="submit" className="w-full" size="lg" disabled={otp.length !== 6} loading={verify.isPending}>
          Verify
        </Button>
        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            className="text-primary hover:underline disabled:opacity-50"
            onClick={() => resend.mutate()}
            disabled={resend.isPending}
          >
            Resend code
          </button>
          <button type="button" className="text-muted-foreground hover:underline" onClick={() => router.push("/dashboard")}>
            Skip for now
          </button>
        </div>
      </form>
    </>
  );
}

import { CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
import { Logo } from "@/components/brand";

export const metadata: Metadata = { title: "Payment received" };

/** Paystack redirects the payer here after checkout. */
export default function PaymentCompletePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo />
      <CheckCircle2 className="size-14 text-success" />
      <div>
        <h1 className="text-2xl font-semibold">Thank you for your payment</h1>
        <p className="mt-2 max-w-sm text-muted-foreground">
          Your payment is being confirmed. You&apos;ll receive a receipt on WhatsApp shortly. You can close this page.
        </p>
      </div>
    </div>
  );
}

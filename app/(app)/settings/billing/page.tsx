"use client";

import { PLAN_PRICING_USD, type Plan } from "@/lib/core";
import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/app-shell";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-store";
import { cn, formatDate } from "@/lib/utils";

const SALES_EMAIL = "hello@tradepulse.app";

const plans: { id: Plan; name: string; perks: string[] }[] = [
  { id: "free", name: "Free", perks: ["5 invoices per month", "WhatsApp delivery", "AI quotes", "Client management"] },
  {
    id: "pro",
    name: "Pro",
    perks: [
      "Unlimited invoices",
      "Paystack payment links",
      "Automatic overdue reminders",
      "Your logo on every invoice",
    ],
  },
  { id: "business", name: "Business", perks: ["Everything in Pro", "Team members (coming soon)", "Priority support"] },
];

export default function BillingPage() {
  const user = useAuth((s) => s.user);

  return (
    <>
      <Link href="/settings" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Settings
      </Link>
      <PageHeader
        title="Plans & billing"
        description={
          user?.plan !== "free" && user?.planExpiry
            ? `Your ${user.plan} plan renews on ${formatDate(user.planExpiry)}.`
            : "Upgrade when you need more."
        }
      />
      <div className="grid gap-5 md:grid-cols-3">
        {plans.map((plan) => {
          const current = user?.plan === plan.id;
          return (
            <div
              key={plan.id}
              className={cn(
                "flex flex-col rounded-xl border bg-card p-6",
                plan.id === "pro" && "border-primary ring-2 ring-primary/30",
              )}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">{plan.name}</h2>
                {current && (
                  <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">Current</span>
                )}
              </div>
              <p className="mt-3 text-3xl font-bold">
                ${PLAN_PRICING_USD[plan.id]}
                <span className="text-sm font-normal text-muted-foreground">/month</span>
              </p>
              <ul className="mt-5 flex-1 space-y-2 text-sm">
                {plan.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" /> {perk}
                  </li>
                ))}
              </ul>
              {!current && plan.id !== "free" && (
                <a
                  href={`mailto:${SALES_EMAIL}?subject=${encodeURIComponent(`Upgrade to ${plan.name}`)}&body=${encodeURIComponent(`Account: ${user?.email ?? ""}`)}`}
                  className={cn(buttonVariants({ variant: plan.id === "pro" ? "default" : "outline" }), "mt-6")}
                >
                  Upgrade to {plan.name}
                </a>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-6 text-sm text-muted-foreground">
        Self-serve card checkout for subscriptions is coming soon. Until then, upgrades are activated by our team within
        one business day.
      </p>
    </>
  );
}

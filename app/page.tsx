import { PLAN_PRICING_USD } from "@/lib/core";
import { Bell, Check, CreditCard, FileText, MessageCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: FileText,
    title: "Professional invoices in 60 seconds",
    body: "Branded PDF invoices with your logo, VAT and line items — numbered automatically.",
  },
  {
    icon: MessageCircle,
    title: "Delivered on WhatsApp",
    body: "Your client gets the invoice, the PDF and a Pay now button right in their chat.",
  },
  {
    icon: CreditCard,
    title: "Get paid by card, transfer or USSD",
    body: "Paystack payment links mark invoices as paid automatically when money lands.",
  },
  {
    icon: Sparkles,
    title: "AI quotes from a sentence",
    body: "Describe the job in plain words and get an itemised quote with realistic local prices.",
  },
  {
    icon: Bell,
    title: "Automatic reminders",
    body: "Overdue invoices trigger polite WhatsApp reminders so you don't have to chase.",
  },
];

const trades = ["Electricians", "Plumbers", "Tailors", "Hair stylists", "Caterers", "Cleaners", "Photographers"];

const plans = [
  { name: "Free", price: PLAN_PRICING_USD.free, perks: ["5 invoices / month", "WhatsApp delivery", "AI quotes"] },
  {
    name: "Pro",
    price: PLAN_PRICING_USD.pro,
    perks: ["Unlimited invoices", "Payment links & auto-reconciliation", "Automatic reminders", "Your logo on invoices"],
    highlight: true,
  },
  { name: "Business", price: PLAN_PRICING_USD.business, perks: ["Everything in Pro", "Team members (soon)", "Priority support"] },
];

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 md:px-8">
        <Logo />
        <nav className="flex items-center gap-2">
          <Link href="/auth/login" className={buttonVariants({ variant: "ghost" })}>
            Log in
          </Link>
          <Link href="/auth/register" className={buttonVariants()}>
            Start free
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-10 md:grid-cols-2 md:px-8 md:pt-16">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
              🇳🇬 🇬🇭 🇰🇪 🇿🇦 Built for African service businesses
            </p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              Invoice on WhatsApp.
              <br />
              <span className="text-primary">Get paid faster.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              TradePulse helps plumbers, electricians, tailors, stylists and every trade send professional invoices,
              collect payments and win jobs with AI-powered quotes — all from your phone.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/auth/register" className={buttonVariants({ size: "lg" })}>
                Create free account
              </Link>
              <Link href="#pricing" className={buttonVariants({ size: "lg", variant: "outline" })}>
                See pricing
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">5 free invoices every month · No card required</p>
          </div>

          {/* WhatsApp-style preview */}
          <div className="mx-auto w-full max-w-sm rounded-[2rem] border-8 border-foreground/90 bg-[#e5ddd5] p-3 shadow-2xl">
            <div className="mb-3 flex items-center gap-2 rounded-xl bg-[#075E54] px-3 py-2 text-white">
              <div className="grid size-8 place-items-center rounded-full bg-white/20 text-xs font-bold">AE</div>
              <div className="text-sm font-medium">Ada Electricals</div>
            </div>
            <div className="space-y-2 text-[13px] text-slate-900">
              <div className="max-w-[85%] rounded-lg rounded-tl-none bg-white p-2.5 shadow-sm">
                Hello Chinedu 👋
                <br />
                <br />
                <b>Ada Electricals</b> has sent you invoice <b>INV-014</b>.
                <br />
                🧾 Rewire 3-bedroom flat
                <br />💰 Amount: <b>₦131,150.00</b>
                <br />📅 Due: 20 Oct 2026
              </div>
              <div className="flex max-w-[85%] items-center gap-2 rounded-lg bg-white p-2.5 shadow-sm">
                <div className="grid size-9 place-items-center rounded bg-red-500 text-[10px] font-bold text-white">PDF</div>
                <div>
                  <div className="font-medium">INV-014.pdf</div>
                  <div className="text-xs text-slate-500">1 page</div>
                </div>
              </div>
              <div className="max-w-[85%] overflow-hidden rounded-lg bg-white shadow-sm">
                <div className="p-2.5">Pay ₦131,150.00 securely online.</div>
                <div className="border-t py-2 text-center font-medium text-[#128C7E]">Pay now</div>
              </div>
              <div className="ml-auto max-w-[70%] rounded-lg rounded-tr-none bg-[#dcf8c6] p-2.5 shadow-sm">
                Paid ✅ Thank you!
              </div>
            </div>
          </div>
        </section>

        <section className="border-y bg-card py-6">
          <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-x-8 gap-y-2 px-4 text-sm text-muted-foreground">
            {trades.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 md:px-8">
          <h2 className="text-center text-3xl font-semibold tracking-tight">Everything you need to run your trade</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-xl border bg-card p-6">
                <div className="mb-4 inline-grid size-10 place-items-center rounded-lg bg-primary-soft text-primary">
                  <Icon className="size-5" />
                </div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" className="bg-card py-16">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <h2 className="text-center text-3xl font-semibold tracking-tight">Simple pricing</h2>
            <p className="mt-2 text-center text-muted-foreground">Start free. Upgrade when you&apos;re busy.</p>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={cn(
                    "flex flex-col rounded-xl border bg-background p-6",
                    plan.highlight && "border-primary ring-2 ring-primary/30",
                  )}
                >
                  <h3 className="font-semibold">{plan.name}</h3>
                  <p className="mt-3 text-3xl font-bold">
                    ${plan.price}
                    <span className="text-sm font-normal text-muted-foreground">/month</span>
                  </p>
                  <ul className="mt-5 flex-1 space-y-2 text-sm">
                    {plan.perks.map((perk) => (
                      <li key={perk} className="flex items-start gap-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" /> {perk}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/auth/register"
                    className={cn(buttonVariants({ variant: plan.highlight ? "default" : "outline" }), "mt-6")}
                  >
                    Get started
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © TradePulse · Made for Africa&apos;s builders, fixers and makers
      </footer>
    </div>
  );
}

"use client";

import { formatMoney } from "@/lib/core";
import { AlertTriangle, FileText, MessageCircle, Plus, Sparkles, UserPlus } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/app-shell";
import { InvoiceList } from "@/components/invoice-list";
import { RevenueChart } from "@/components/revenue-chart";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, EmptyState, Skeleton } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-store";
import { useStats } from "@/lib/queries";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const user = useAuth((s) => s.user);
  const { data: stats, isLoading, error } = useStats();
  const money = (n: number) => formatMoney(n, stats?.currency ?? user?.currency ?? "NGN");

  return (
    <>
      <PageHeader
        title={`Hello, ${user?.name.split(" ")[0] ?? "there"} 👋`}
        description={user?.businessName}
        actions={
          <Link href="/invoices/new" className={buttonVariants()}>
            <Plus /> New invoice
          </Link>
        }
      />

      {user && !user.whatsappVerified && (
        <Link
          href="/auth/verify-phone"
          className="mb-5 flex items-center gap-3 rounded-lg border border-[#25D366]/40 bg-[#25D366]/10 px-4 py-3 text-sm"
        >
          <MessageCircle className="size-5 shrink-0 text-[#128C7E]" />
          <span className="flex-1">Verify your WhatsApp number so clients can trust messages from you.</span>
          <span className="font-medium text-primary">Verify →</span>
        </Link>
      )}

      {error && <p className="mb-4 text-sm text-destructive">Couldn&apos;t load your stats. Try refreshing the page.</p>}

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Revenue this month" value={stats && money(stats.revenueThisMonth)} loading={isLoading} />
        <StatTile label="Outstanding" value={stats && money(stats.outstanding)} loading={isLoading} />
        <StatTile
          label="Overdue"
          value={stats && money(stats.overdueAmount)}
          loading={isLoading}
          note={
            stats && stats.invoiceCounts.overdue > 0 ? (
              <span className="inline-flex items-center gap-1 text-destructive">
                <AlertTriangle className="size-3" /> {stats.invoiceCounts.overdue} invoice
                {stats.invoiceCounts.overdue > 1 ? "s" : ""}
              </span>
            ) : undefined
          }
        />
        <StatTile label="Total earned" value={stats && money(stats.totalRevenue)} loading={isLoading} />
      </div>

      {stats && stats.invoiceLimit !== null && (
        <QuotaBar used={stats.invoicesThisMonth} limit={stats.invoiceLimit} />
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Revenue · last 6 months</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading || !stats ? (
              <Skeleton className="h-56" />
            ) : (
              <RevenueChart data={stats.monthlyRevenue} currency={stats.currency} />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <QuickAction href="/invoices/new" icon={<FileText />} title="Create invoice" body="Send it on WhatsApp" />
            <QuickAction href="/ai-quote" icon={<Sparkles />} title="AI quote" body="Describe a job, get a quote" />
            <QuickAction href="/clients?new=1" icon={<UserPlus />} title="Add client" body="Save their WhatsApp number" />
          </CardContent>
        </Card>
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Recent invoices</h2>
          <Link href="/invoices" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </div>
        {isLoading ? (
          <Skeleton className="h-40" />
        ) : stats?.recentInvoices.length ? (
          <InvoiceList invoices={stats.recentInvoices} />
        ) : (
          <EmptyState
            icon={<FileText />}
            title="No invoices yet"
            description="Create your first invoice and send it to a client on WhatsApp."
            action={
              <Link href="/invoices/new" className={buttonVariants()}>
                Create invoice
              </Link>
            }
          />
        )}
      </section>
    </>
  );
}

function StatTile({
  label,
  value,
  loading,
  note,
}: {
  label: string;
  value?: string;
  loading: boolean;
  note?: React.ReactNode;
}) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {loading ? (
        <Skeleton className="mt-2 h-7 w-24" />
      ) : (
        <p className="mt-1 truncate text-xl font-semibold tabular-nums sm:text-2xl">{value}</p>
      )}
      {note && <p className="mt-1 text-xs">{note}</p>}
    </Card>
  );
}

function QuotaBar({ used, limit }: { used: number; limit: number }) {
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const full = used >= limit;
  return (
    <div className="mt-4 flex flex-col gap-2 rounded-lg border bg-card p-4 sm:flex-row sm:items-center">
      <div className="flex-1">
        <p className="text-sm">
          <span className="font-medium">
            {used} of {limit}
          </span>{" "}
          free invoices used this month
        </p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <div className={cn("h-full rounded-full", full ? "bg-destructive" : "bg-primary")} style={{ width: `${pct}%` }} />
        </div>
      </div>
      <Link href="/settings/billing" className={buttonVariants({ variant: full ? "default" : "secondary", size: "sm" })}>
        Upgrade to Pro
      </Link>
    </div>
  );
}

function QuickAction({ href, icon, title, body }: { href: string; icon: React.ReactNode; title: string; body: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-md border p-3 transition-colors hover:bg-muted">
      <span className="grid size-9 place-items-center rounded-md bg-primary-soft text-primary [&_svg]:size-4">{icon}</span>
      <span>
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">{body}</span>
      </span>
    </Link>
  );
}

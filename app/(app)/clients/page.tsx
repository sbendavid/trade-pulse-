"use client";

import { formatMoney } from "@/lib/core";
import { ChevronRight, Search, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { ClientForm } from "@/components/client-form";
import { Button } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/card";
import { Input } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { useAuth } from "@/lib/auth-store";
import { useClients } from "@/lib/queries";
import { initials } from "@/lib/utils";

export default function ClientsPage() {
  const router = useRouter();
  const currency = useAuth((s) => s.user?.currency) ?? "NGN";
  const [adding, setAdding] = useState(useSearchParams().get("new") === "1");
  const [search, setSearch] = useState("");
  const deferred = useDeferredValue(search.trim());
  const { data, isLoading } = useClients({ ...(deferred ? { search: deferred } : {}), limit: 100 });

  return (
    <>
      <PageHeader
        title="Clients"
        description={data ? `${data.meta.total} client${data.meta.total === 1 ? "" : "s"}` : undefined}
        actions={
          <Button onClick={() => setAdding(true)}>
            <UserPlus /> Add client
          </Button>
        }
      />

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, phone or email"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search clients"
        />
      </div>

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : data?.items.length ? (
        <ul className="divide-y rounded-lg border bg-card">
          {data.items.map((c) => (
            <li key={c.id}>
              <Link href={`/clients/${c.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/60">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                  {initials(c.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{c.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.phone}
                    {c.city ? ` · ${c.city}` : ""}
                  </p>
                </div>
                <div className="hidden text-right text-xs sm:block">
                  <p className="font-medium tabular-nums">{formatMoney(c.totalPaid, currency)} paid</p>
                  {c.totalOwed > 0 && (
                    <p className="tabular-nums text-warning">{formatMoney(c.totalOwed, currency)} owed</p>
                  )}
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={<Users />}
          title={search ? "No matching clients" : "No clients yet"}
          description={search ? "Try another search." : "Add the people you work for to invoice them in seconds."}
          action={
            !search ? (
              <Button onClick={() => setAdding(true)}>
                <UserPlus /> Add your first client
              </Button>
            ) : undefined
          }
        />
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Add a client">
        <ClientForm
          onSaved={(client) => {
            setAdding(false);
            router.push(`/clients/${client.id}`);
          }}
        />
      </Modal>
    </>
  );
}

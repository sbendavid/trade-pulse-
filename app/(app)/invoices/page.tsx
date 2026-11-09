"use client";

import { INVOICE_STATUSES, type InvoiceStatus } from "@/lib/core";
import { FileText, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { InvoiceList } from "@/components/invoice-list";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/card";
import { Input } from "@/components/ui/form";
import { useInvoices } from "@/lib/queries";
import { cn } from "@/lib/utils";

const filters: (InvoiceStatus | "all")[] = ["all", ...INVOICE_STATUSES];

export default function InvoicesPage() {
  const [status, setStatus] = useState<InvoiceStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const deferredSearch = useDeferredValue(search.trim());
  const { data, isLoading, isFetching } = useInvoices({
    ...(status !== "all" ? { status } : {}),
    ...(deferredSearch ? { search: deferredSearch } : {}),
    page,
    limit: 20,
  });

  return (
    <>
      <PageHeader
        title="Invoices"
        description={data ? `${data.meta.total} invoice${data.meta.total === 1 ? "" : "s"}` : undefined}
        actions={
          <Link href="/invoices/new" className={buttonVariants()}>
            <Plus /> New invoice
          </Link>
        }
      />

      <div className="mb-4 flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by client, number or service"
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            aria-label="Search invoices"
          />
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0" role="tablist">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={status === f}
              onClick={() => {
                setStatus(f);
                setPage(1);
              }}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-sm capitalize transition-colors",
                status === f ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : data?.items.length ? (
        <div className={cn(isFetching && "opacity-70 transition-opacity")}>
          <InvoiceList invoices={data.items} />
          {data.meta.pages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-muted-foreground">
                Page {data.meta.page} of {data.meta.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.meta.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          icon={<FileText />}
          title={search || status !== "all" ? "No matching invoices" : "No invoices yet"}
          description={
            search || status !== "all" ? "Try a different search or filter." : "Your invoices will show up here."
          }
          action={
            !search && status === "all" ? (
              <Link href="/invoices/new" className={buttonVariants()}>
                Create your first invoice
              </Link>
            ) : undefined
          }
        />
      )}
    </>
  );
}

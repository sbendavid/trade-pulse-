import { formatMoney, type InvoiceDTO } from "@/lib/core";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";

/** Compact, mobile-friendly invoice rows. */
export function InvoiceList({ invoices, showClient = true }: { invoices: InvoiceDTO[]; showClient?: boolean }) {
  return (
    <ul className="divide-y rounded-lg border bg-card">
      {invoices.map((inv) => (
        <li key={inv.id}>
          <Link
            href={`/invoices/${inv.id}`}
            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/60"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{showClient ? inv.clientSnapshot.name : inv.serviceDescription}</span>
                <StatusBadge status={inv.status} />
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {inv.invoiceNumber} · {showClient ? `${inv.serviceDescription} · ` : ""}Due {formatDate(inv.dueDate)}
              </p>
            </div>
            <span className="shrink-0 text-sm font-semibold tabular-nums">{formatMoney(inv.total, inv.currency)}</span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

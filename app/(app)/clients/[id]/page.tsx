"use client";

import { formatMoney, normalizePhone, COUNTRY_DEFAULTS } from "@/lib/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileText, Mail, MessageCircle, Pencil, Phone, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ClientForm } from "@/components/client-form";
import { InvoiceList } from "@/components/invoice-list";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, EmptyState, Skeleton } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { api, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { useClient } from "@/lib/queries";
import { initials } from "@/lib/utils";

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const user = useAuth((s) => s.user);
  const { data: client, isLoading } = useClient(id);
  const [modal, setModal] = useState<"edit" | "delete" | null>(null);

  const remove = useMutation({
    mutationFn: () => api.clients.remove(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Client removed");
      router.replace("/clients");
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (isLoading) return <Skeleton className="h-96" />;
  if (!client) {
    return (
      <div className="py-16 text-center">
        <p className="font-medium">Client not found</p>
        <Link href="/clients" className="mt-2 inline-block text-sm text-primary hover:underline">
          Back to clients
        </Link>
      </div>
    );
  }

  const currency = user?.currency ?? "NGN";
  const waNumber = normalizePhone(client.phone, COUNTRY_DEFAULTS[user?.country ?? "NG"].dialCode);

  return (
    <>
      <Link href="/clients" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Clients
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="grid size-14 place-items-center rounded-full bg-primary-soft text-lg font-semibold text-primary">
            {initials(client.name)}
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{client.name}</h1>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Phone className="size-3.5" /> {client.phone}
              </span>
              {client.email && (
                <span className="inline-flex items-center gap-1">
                  <Mail className="size-3.5" /> {client.email}
                </span>
              )}
              {client.city && <span>{client.city}</span>}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/invoices/new?client=${client.id}`} className={buttonVariants()}>
            <FileText /> New invoice
          </Link>
          <a
            href={`https://wa.me/${waNumber}`}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: "whatsapp" })}
          >
            <MessageCircle /> Chat
          </a>
          <Button variant="outline" size="icon" onClick={() => setModal("edit")} aria-label="Edit client">
            <Pencil />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setModal("delete")} aria-label="Delete client">
            <Trash2 />
          </Button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total paid</p>
          <p className="mt-1 truncate text-lg font-semibold tabular-nums">{formatMoney(client.totalPaid, currency)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Owed</p>
          <p className="mt-1 truncate text-lg font-semibold tabular-nums">{formatMoney(client.totalOwed, currency)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Jobs</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">{client.jobCount}</p>
        </Card>
      </div>

      {client.notes && (
        <Card className="mb-6 p-4 text-sm">
          <p className="mb-1 text-xs text-muted-foreground">Notes</p>
          <p className="whitespace-pre-wrap">{client.notes}</p>
        </Card>
      )}

      <h2 className="mb-3 font-semibold">Invoice history</h2>
      {client.invoices.length ? (
        <InvoiceList invoices={client.invoices} showClient={false} />
      ) : (
        <EmptyState
          icon={<FileText />}
          title="No invoices for this client yet"
          action={
            <Link href={`/invoices/new?client=${client.id}`} className={buttonVariants()}>
              Create invoice
            </Link>
          }
        />
      )}

      <Modal open={modal === "edit"} onClose={() => setModal(null)} title="Edit client">
        <ClientForm client={client} onSaved={() => setModal(null)} />
      </Modal>
      <Modal open={modal === "delete"} onClose={() => setModal(null)} title={`Remove ${client.name}?`}>
        <p className="text-sm text-muted-foreground">
          Their past invoices stay in your records. You can add them again later.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setModal(null)}>
            Keep
          </Button>
          <Button variant="destructive" onClick={() => remove.mutate()} loading={remove.isPending}>
            Remove client
          </Button>
        </div>
      </Modal>
    </>
  );
}

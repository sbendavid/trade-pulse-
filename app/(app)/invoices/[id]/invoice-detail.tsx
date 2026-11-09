"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { EDITABLE_INVOICE_STATUSES, formatMoney, type InvoiceDTO } from "@/lib/core";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  Download,
  Link2,
  MessageCircle,
  Pencil,
  Trash2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { LineItemsEditor } from "@/components/line-items-editor";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { api, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { useInvalidateInvoiceData, useInvoice } from "@/lib/queries";
import { formatDate } from "@/lib/utils";

export function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const invalidate = useInvalidateInvoiceData();
  const { data: invoice, isLoading, error } = useInvoice(id);
  const [modal, setModal] = useState<"paid" | "edit" | "delete" | null>(null);

  const run = <T,>(fn: () => Promise<T>, onDone?: (r: T) => void) => ({
    mutationFn: fn,
    onSuccess: async (r: T) => {
      await invalidate();
      onDone?.(r);
    },
    onError: (err: unknown) => toast.error(errorMessage(err)),
  });

  const send = useMutation(
    run(
      () => api.invoices.send(id),
      ({ channels }) => {
        if (channels.whatsapp === "sent") toast.success("Invoice sent on WhatsApp");
        else if (channels.email === "sent") toast.success("Invoice sent by email");
        else if (channels.whatsapp === "failed" || channels.email === "failed")
          toast.error("Delivery failed. Check the client's number and try again.");
        else toast.info("Invoice issued. WhatsApp/email aren't configured — download the PDF to share it.");
      },
    ),
  );
  const remind = useMutation(run(() => api.invoices.reminder(id), () => toast.success("Reminder sent on WhatsApp")));
  const cancel = useMutation(run(() => api.invoices.update(id, { status: "cancelled" }), () => toast.success("Invoice cancelled")));
  const remove = useMutation(
    run(
      () => api.invoices.remove(id),
      () => {
        toast.success("Invoice deleted");
        router.replace("/invoices");
      },
    ),
  );
  const pdf = useMutation({
    mutationFn: () => api.invoices.pdf(id),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoice?.invoiceNumber ?? "invoice"}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
  const payLink = useMutation({
    mutationFn: () => api.invoices.paymentLink(id),
    onSuccess: async ({ paymentLink }) => {
      try {
        await navigator.clipboard.writeText(paymentLink);
        toast.success("Payment link copied");
      } catch {
        window.prompt("Copy this payment link", paymentLink);
      }
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (isLoading) return <Skeleton className="h-96" />;
  if (error || !invoice) {
    return (
      <div className="py-16 text-center">
        <p className="font-medium">Invoice not found</p>
        <Link href="/invoices" className="mt-2 inline-block text-sm text-primary hover:underline">
          Back to invoices
        </Link>
      </div>
    );
  }

  const money = (n: number) => formatMoney(n, invoice.currency);
  const unpaid = invoice.status === "pending" || invoice.status === "overdue";
  const editable = EDITABLE_INVOICE_STATUSES.includes(invoice.status);
  const sendable = invoice.status !== "paid" && invoice.status !== "cancelled";

  return (
    <>
      <Link href="/invoices" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Invoices
      </Link>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{invoice.invoiceNumber}</h1>
            <StatusBadge status={invoice.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            <Link href={`/clients/${invoice.clientId}`} className="font-medium text-foreground hover:underline">
              {invoice.clientSnapshot.name}
            </Link>{" "}
            · {money(invoice.total)} · due {formatDate(invoice.dueDate)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {sendable && (
            <Button variant="whatsapp" onClick={() => send.mutate()} loading={send.isPending}>
              <MessageCircle /> {invoice.status === "draft" ? "Send on WhatsApp" : "Resend"}
            </Button>
          )}
          {unpaid && (
            <Button variant="default" onClick={() => setModal("paid")}>
              <CheckCircle2 /> Mark paid
            </Button>
          )}
          <Button variant="outline" onClick={() => pdf.mutate()} loading={pdf.isPending}>
            <Download /> PDF
          </Button>
          {unpaid && (
            <>
              <Button variant="outline" onClick={() => payLink.mutate()} loading={payLink.isPending}>
                <Link2 /> Pay link
              </Button>
              <Button variant="outline" onClick={() => remind.mutate()} loading={remind.isPending}>
                <Bell /> Remind
              </Button>
            </>
          )}
          {editable && (
            <Button variant="outline" onClick={() => setModal("edit")}>
              <Pencil /> Edit
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Invoice preview */}
        <Card className="lg:col-span-2">
          <CardContent className="space-y-6 p-5 sm:p-8">
            <div className="flex flex-wrap justify-between gap-4 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Billed to</p>
                <p className="mt-1 font-medium">{invoice.clientSnapshot.name}</p>
                <p className="text-muted-foreground">{invoice.clientSnapshot.phone}</p>
                {invoice.clientSnapshot.email && <p className="text-muted-foreground">{invoice.clientSnapshot.email}</p>}
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Issued</p>
                <p className="mt-1">{formatDate(invoice.issuedAt)}</p>
                <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">Due</p>
                <p className="mt-1 font-medium">{formatDate(invoice.dueDate)}</p>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Service</p>
              <p className="mt-1">{invoice.serviceDescription}</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 font-medium">Item</th>
                    <th className="py-2 text-right font-medium">Qty</th>
                    <th className="py-2 text-right font-medium">Rate</th>
                    <th className="py-2 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, i) => (
                    <tr key={`${item.description}-${i}`} className="border-b last:border-0">
                      <td className="py-2.5 pr-3">{item.description}</td>
                      <td className="whitespace-nowrap py-2.5 text-right tabular-nums">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="whitespace-nowrap py-2.5 text-right tabular-nums">{money(item.rate)}</td>
                      <td className="whitespace-nowrap py-2.5 text-right tabular-nums">{money(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="ml-auto w-full max-w-xs space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">{money(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">VAT ({invoice.vatRate}%)</span>
                <span className="tabular-nums">{money(invoice.vatAmount)}</span>
              </div>
              <div className="flex justify-between rounded-md bg-primary-soft px-2 py-2 text-base font-semibold text-primary">
                <span>Total</span>
                <span className="tabular-nums">{money(invoice.total)}</span>
              </div>
            </div>

            {invoice.notes && (
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Notes</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{invoice.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              <Activity label="Created" date={invoice.createdAt} />
              {invoice.status !== "draft" && <Activity label="Issued" date={invoice.issuedAt} />}
              {invoice.remindersSent > 0 && (
                <Activity
                  label={`${invoice.remindersSent} reminder${invoice.remindersSent > 1 ? "s" : ""} sent`}
                  date={invoice.lastReminderAt}
                />
              )}
              {invoice.paidAt && (
                <Activity
                  label={`Paid${invoice.paymentMethod ? ` via ${invoice.paymentMethod}` : ""}`}
                  date={invoice.paidAt}
                  good
                />
              )}
            </ul>
            {invoice.paymentReference && (
              <p className="mt-4 break-all text-xs text-muted-foreground">Ref: {invoice.paymentReference}</p>
            )}
            {invoice.status !== "paid" && (
              <div className="mt-6 flex flex-col gap-2 border-t pt-4">
                {editable && (
                  <Button variant="ghost" size="sm" className="justify-start" onClick={() => cancel.mutate()} loading={cancel.isPending}>
                    <XCircle /> Cancel invoice
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start text-destructive"
                  onClick={() => setModal("delete")}
                >
                  <Trash2 /> Delete invoice
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <MarkPaidModal invoice={invoice} open={modal === "paid"} onClose={() => setModal(null)} />
      {modal === "edit" && <EditInvoiceModal invoice={invoice} onClose={() => setModal(null)} />}
      <Modal open={modal === "delete"} onClose={() => setModal(null)} title={`Delete ${invoice.invoiceNumber}?`}>
        <p className="text-sm text-muted-foreground">This removes the invoice from your list. This can&apos;t be undone.</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setModal(null)}>
            Keep it
          </Button>
          <Button variant="destructive" onClick={() => remove.mutate()} loading={remove.isPending}>
            Delete
          </Button>
        </div>
      </Modal>
    </>
  );
}

function Activity({ label, date, good }: { label: string; date?: string; good?: boolean }) {
  return (
    <li className="flex items-start gap-3">
      <span className={`mt-1.5 size-2 shrink-0 rounded-full ${good ? "bg-success" : "bg-muted-foreground/40"}`} />
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">
          {formatDate(date, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}
        </p>
      </div>
    </li>
  );
}

function MarkPaidModal({ invoice, open, onClose }: { invoice: InvoiceDTO; open: boolean; onClose: () => void }) {
  const invalidate = useInvalidateInvoiceData();
  const [method, setMethod] = useState("transfer");
  const [reference, setReference] = useState("");
  const markPaid = useMutation({
    mutationFn: () =>
      api.invoices.markPaid(invoice.id, { paymentMethod: method, ...(reference ? { paymentReference: reference } : {}) }),
    onSuccess: async () => {
      await invalidate();
      toast.success(`${invoice.invoiceNumber} marked as paid 🎉`);
      onClose();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <Modal open={open} onClose={onClose} title="Record payment">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Mark {formatMoney(invoice.total, invoice.currency)} from {invoice.clientSnapshot.name} as received.
        </p>
        <Field label="Payment method" htmlFor="method">
          <Select id="method" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="transfer">Bank transfer</option>
            <option value="cash">Cash</option>
            <option value="pos">POS</option>
            <option value="mobile_money">Mobile money</option>
            <option value="other">Other</option>
          </Select>
        </Field>
        <Field label="Reference (optional)" htmlFor="reference">
          <Input id="reference" value={reference} onChange={(e) => setReference(e.target.value)} />
        </Field>
        <Button className="w-full" onClick={() => markPaid.mutate()} loading={markPaid.isPending}>
          Mark as paid
        </Button>
      </div>
    </Modal>
  );
}

const editSchema = z.object({
  serviceDescription: z.string().trim().min(2, "Describe the service"),
  dueDate: z.string().min(1),
  items: z
    .array(
      z.object({
        description: z.string().trim().min(1, "Each item needs a description"),
        quantity: z.number({ error: "Enter a quantity" }).positive("Quantity must be more than 0"),
        unit: z.string().trim().min(1),
        rate: z.number({ error: "Enter a rate" }).min(0),
      }),
    )
    .min(1),
  vatRate: z.number().min(0).max(100),
  notes: z.string().max(2000).optional(),
});
type EditValues = z.infer<typeof editSchema>;

function EditInvoiceModal({ invoice, onClose }: { invoice: InvoiceDTO; onClose: () => void }) {
  const invalidate = useInvalidateInvoiceData();
  const currency = useAuth((s) => s.user?.currency) ?? invoice.currency;
  const form = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      serviceDescription: invoice.serviceDescription,
      dueDate: invoice.dueDate.slice(0, 10),
      items: invoice.items.map(({ description, quantity, unit, rate }) => ({ description, quantity, unit, rate })),
      vatRate: invoice.vatRate,
      notes: invoice.notes ?? "",
    },
  });
  const save = useMutation({
    mutationFn: (v: EditValues) =>
      api.invoices.update(invoice.id, { ...v, dueDate: new Date(v.dueDate).toISOString() }),
    onSuccess: async () => {
      await invalidate();
      toast.success("Invoice updated");
      onClose();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
  const { errors } = form.formState;

  return (
    <Modal open onClose={onClose} title={`Edit ${invoice.invoiceNumber}`} className="max-w-3xl">
      <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-5" noValidate>
        <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
          <Field label="Service" htmlFor="e-service" error={errors.serviceDescription?.message}>
            <Input id="e-service" {...form.register("serviceDescription")} />
          </Field>
          <Field label="Due date" htmlFor="e-due">
            <Input id="e-due" type="date" {...form.register("dueDate")} />
          </Field>
        </div>
        <LineItemsEditor control={form.control} register={form.register} errors={errors} currency={currency} />
        <Field label="Notes" htmlFor="e-notes">
          <Textarea id="e-notes" rows={3} {...form.register("notes")} />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={save.isPending}>
            Save changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}

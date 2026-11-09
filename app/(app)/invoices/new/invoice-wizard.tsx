"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { COUNTRY_DEFAULTS, formatMoney, computeTotals } from "@/lib/core";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, MessageCircle, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { PageHeader } from "@/components/app-shell";
import { ClientForm } from "@/components/client-form";
import { emptyItem, LineItemsEditor } from "@/components/line-items-editor";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { api, errorMessage, isLimitError } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import { useClients, useInvalidateInvoiceData } from "@/lib/queries";
import { cn, dateInputValue } from "@/lib/utils";

const wizardSchema = z.object({
  clientId: z.string().min(1, "Choose a client"),
  serviceDescription: z.string().trim().min(2, "Describe the service").max(300),
  dueDate: z.string().min(1, "Pick a due date"),
  items: z
    .array(
      z.object({
        description: z.string().trim().min(1, "Each item needs a description"),
        quantity: z.number({ error: "Enter a quantity" }).positive("Quantity must be more than 0"),
        unit: z.string().trim().min(1),
        rate: z.number({ error: "Enter a rate" }).min(0, "Rate cannot be negative"),
      }),
    )
    .min(1, "Add at least one item"),
  vatRate: z.number({ error: "Enter a VAT rate" }).min(0).max(100),
  notes: z.string().max(2000).optional(),
});
type WizardValues = z.infer<typeof wizardSchema>;

const steps = ["Client & job", "Items & totals"];

export function InvoiceWizard() {
  const router = useRouter();
  const presetClient = useSearchParams().get("client") ?? "";
  const user = useAuth((s) => s.user);
  const currency = user?.currency ?? "NGN";
  const invalidate = useInvalidateInvoiceData();
  const { data: clients } = useClients({ limit: 100 });
  const [step, setStep] = useState(0);
  const [addingClient, setAddingClient] = useState(false);
  const [limitHit, setLimitHit] = useState(false);

  const form = useForm<WizardValues>({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
      clientId: presetClient,
      serviceDescription: "",
      dueDate: dateInputValue(7),
      items: [emptyItem],
      vatRate: COUNTRY_DEFAULTS[user?.country ?? "NG"].vatRate,
      notes: "",
    },
  });
  const { errors } = form.formState;

  const create = useMutation({
    mutationFn: async ({ values, send }: { values: WizardValues; send: boolean }) => {
      const invoice = await api.invoices.create({
        ...values,
        dueDate: new Date(values.dueDate).toISOString(),
        status: send ? "pending" : "draft",
      });
      if (!send) return { invoice, sent: null };
      try {
        return { invoice, sent: await api.invoices.send(invoice.id) };
      } catch (err) {
        // The invoice exists even if delivery failed — don't lose it.
        toast.error(`Invoice saved, but sending failed: ${errorMessage(err)}`);
        return { invoice, sent: null };
      }
    },
    onSuccess: async ({ invoice, sent }) => {
      await invalidate();
      if (sent) {
        const { whatsapp, email } = sent.channels;
        if (whatsapp === "sent") toast.success(`${invoice.invoiceNumber} sent on WhatsApp`);
        else if (email === "sent") toast.success(`${invoice.invoiceNumber} sent by email`);
        else toast.info(`${invoice.invoiceNumber} created. Delivery channels aren't configured yet — share the PDF manually.`);
      } else if (sent === null && invoice.status === "draft") {
        toast.success(`Draft ${invoice.invoiceNumber} saved`);
      }
      router.push(`/invoices/${invoice.id}`);
    },
    onError: (err) => {
      if (isLimitError(err)) setLimitHit(true);
      else toast.error(errorMessage(err));
    },
  });

  async function next() {
    if (await form.trigger(["clientId", "serviceDescription", "dueDate"])) setStep(1);
  }

  const submit = (send: boolean) => form.handleSubmit((values) => create.mutate({ values, send }))();
  const values = useWatch({ control: form.control });
  const total = computeTotals(
    (values.items ?? []).map((i) => ({
      description: i.description ?? "",
      unit: i.unit ?? "unit",
      quantity: Number(i.quantity) || 0,
      rate: Number(i.rate) || 0,
    })),
    Number(values.vatRate) || 0,
  ).total;
  const selectedClient = clients?.items.find((c) => c.id === values.clientId);

  return (
    <>
      <PageHeader title="New invoice" />

      <ol className="mb-6 flex items-center gap-3 text-sm">
        {steps.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <span
              className={cn(
                "grid size-6 place-items-center rounded-full border text-xs font-semibold",
                i < step && "border-primary bg-primary text-primary-foreground",
                i === step && "border-primary text-primary",
              )}
            >
              {i < step ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span className={cn(i === step ? "font-medium" : "text-muted-foreground")}>{label}</span>
            {i < steps.length - 1 && <span className="mx-1 h-px w-8 bg-border" />}
          </li>
        ))}
      </ol>

      <form onSubmit={(e) => e.preventDefault()} noValidate>
        {step === 0 && (
          <Card>
            <CardContent className="space-y-5 pt-5">
              <Field label="Client" htmlFor="clientId" error={errors.clientId?.message}>
                <div className="flex gap-2">
                  <Select id="clientId" aria-invalid={!!errors.clientId} {...form.register("clientId")}>
                    <option value="">Select a client…</option>
                    {clients?.items.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} · {c.phone}
                      </option>
                    ))}
                  </Select>
                  <Button type="button" variant="outline" onClick={() => setAddingClient(true)}>
                    <UserPlus /> <span className="hidden sm:inline">New</span>
                  </Button>
                </div>
              </Field>
              <Field label="What was the job?" htmlFor="serviceDescription" error={errors.serviceDescription?.message}>
                <Input
                  id="serviceDescription"
                  placeholder="e.g. Rewiring of 3-bedroom flat"
                  aria-invalid={!!errors.serviceDescription}
                  {...form.register("serviceDescription")}
                />
              </Field>
              <Field label="Due date" htmlFor="dueDate" error={errors.dueDate?.message}>
                <Input id="dueDate" type="date" className="max-w-xs" {...form.register("dueDate")} />
              </Field>
              <div className="flex justify-end">
                <Button type="button" onClick={next}>
                  Next <ArrowRight />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 1 && (
          <Card>
            <CardContent className="space-y-6 pt-5">
              <p className="text-sm text-muted-foreground">
                Billing <span className="font-medium text-foreground">{selectedClient?.name}</span> for{" "}
                <span className="font-medium text-foreground">{values.serviceDescription}</span>
              </p>
              <LineItemsEditor control={form.control} register={form.register} errors={errors} currency={currency} />
              <Field label="Notes for the client (optional)" htmlFor="notes">
                <Textarea
                  id="notes"
                  rows={3}
                  placeholder="Bank details, warranty, thank-you note…"
                  {...form.register("notes")}
                />
              </Field>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                <Button type="button" variant="ghost" onClick={() => setStep(0)}>
                  <ArrowLeft /> Back
                </Button>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => submit(false)}
                    loading={create.isPending && !create.variables?.send}
                    disabled={create.isPending}
                  >
                    Save draft
                  </Button>
                  <Button
                    type="button"
                    variant="whatsapp"
                    onClick={() => submit(true)}
                    loading={create.isPending && create.variables?.send}
                    disabled={create.isPending}
                  >
                    <MessageCircle /> Send {formatMoney(total, currency)} on WhatsApp
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </form>

      <Modal open={addingClient} onClose={() => setAddingClient(false)} title="Add a client">
        <ClientForm
          onSaved={(client) => {
            form.setValue("clientId", client.id, { shouldValidate: true });
            setAddingClient(false);
          }}
        />
      </Modal>

      <Modal open={limitHit} onClose={() => setLimitHit(false)} title="You've reached your free limit">
        <p className="text-sm text-muted-foreground">
          The Free plan includes 5 invoices per month. Upgrade to Pro for unlimited invoices, automatic reminders and
          your logo on every invoice.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setLimitHit(false)}>
            Not now
          </Button>
          <Link href="/settings/billing" className={buttonVariants()}>
            See plans
          </Link>
        </div>
      </Modal>
    </>
  );
}

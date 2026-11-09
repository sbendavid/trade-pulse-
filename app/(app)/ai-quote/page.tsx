"use client";

import { formatMoney, type QuoteDTO } from "@/lib/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, FileText, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";
import { api, errorMessage, isLimitError } from "@/lib/api";
import { keys, useClients, useInvalidateInvoiceData, useQuotes } from "@/lib/queries";
import { dateInputValue, formatDate } from "@/lib/utils";

const examples = [
  "Rewire a 3-bedroom flat in Lekki, including new sockets and a distribution board",
  "Fix a leaking kitchen sink and replace two bathroom taps",
  "Sew 5 matching aso-ebi outfits for a wedding, fabric provided by client",
  "Deep clean a 4-bedroom duplex after renovation",
];

export default function AiQuotePage() {
  const qc = useQueryClient();
  const [description, setDescription] = useState("");
  const [quote, setQuote] = useState<QuoteDTO | null>(null);
  const [converting, setConverting] = useState(false);
  const { data: history } = useQuotes();

  const generate = useMutation({
    mutationFn: () => api.quotes.generate({ jobDescription: description }),
    onSuccess: (q) => {
      setQuote(q);
      void qc.invalidateQueries({ queryKey: keys.quotes });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <>
      <PageHeader
        title="AI quote generator"
        description="Describe the job in plain words. Get an itemised quote with realistic local prices in seconds."
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <Card>
            <CardContent className="space-y-4 pt-5">
              <Field label="What's the job?" htmlFor="job">
                <Textarea
                  id="job"
                  rows={5}
                  maxLength={2000}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Install 4 ceiling fans and 10 LED downlights in a 3-bedroom flat"
                />
              </Field>
              <div className="flex flex-wrap gap-2">
                {examples.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => setDescription(ex)}
                    className="rounded-full border bg-muted/50 px-3 py-1 text-left text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    {ex.length > 48 ? `${ex.slice(0, 48)}…` : ex}
                  </button>
                ))}
              </div>
              <Button
                className="w-full sm:w-auto"
                onClick={() => generate.mutate()}
                loading={generate.isPending}
                disabled={description.trim().length < 10}
              >
                <Sparkles /> {generate.isPending ? "Pricing your job…" : "Generate quote"}
              </Button>
            </CardContent>
          </Card>

          {generate.isPending && <Skeleton className="h-72" />}
          {quote && !generate.isPending && <QuoteCard quote={quote} onConvert={() => setConverting(true)} />}
        </div>

        <Card className="h-fit lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent quotes</CardTitle>
          </CardHeader>
          <CardContent>
            {history?.items.length ? (
              <ul className="space-y-1">
                {history.items.map((q) => (
                  <li key={q.id}>
                    <button
                      type="button"
                      onClick={() => setQuote(q)}
                      className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-muted"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{q.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(q.createdAt)}
                          {q.convertedToInvoice ? " · invoiced" : ""}
                        </span>
                      </span>
                      <span className="shrink-0 tabular-nums">{formatMoney(q.total, q.currency)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Your generated quotes will appear here.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {quote && (
        <ConvertModal
          quote={quote}
          open={converting}
          onClose={() => setConverting(false)}
          onConverted={(q) => setQuote(q)}
        />
      )}
    </>
  );
}

function QuoteCard({ quote, onConvert }: { quote: QuoteDTO; onConvert: () => void }) {
  const money = (n: number) => formatMoney(n, quote.currency);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{quote.title}</CardTitle>
        {quote.timeline && (
          <p className="inline-flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="size-3.5" /> {quote.timeline}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
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
              {quote.items.map((item, i) => (
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
            <span className="tabular-nums">{money(quote.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">VAT ({quote.vatRate}%)</span>
            <span className="tabular-nums">{money(quote.vatAmount)}</span>
          </div>
          <div className="flex justify-between rounded-md bg-primary-soft px-2 py-2 text-base font-semibold text-primary">
            <span>Total</span>
            <span className="tabular-nums">{money(quote.total)}</span>
          </div>
        </div>
        {quote.notes && <p className="whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">{quote.notes}</p>}
        <p className="text-xs text-muted-foreground">
          AI-suggested prices are estimates — review them before sending to a client.
        </p>
        {quote.convertedToInvoice && quote.invoiceId ? (
          <Link href={`/invoices/${quote.invoiceId}`} className={buttonVariants({ variant: "outline" })}>
            <FileText /> View invoice
          </Link>
        ) : (
          <Button onClick={onConvert}>
            <FileText /> Turn into invoice
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function ConvertModal({
  quote,
  open,
  onClose,
  onConverted,
}: {
  quote: QuoteDTO;
  open: boolean;
  onClose: () => void;
  onConverted: (q: QuoteDTO) => void;
}) {
  const router = useRouter();
  const invalidate = useInvalidateInvoiceData();
  const qc = useQueryClient();
  const { data: clients } = useClients({ limit: 100 });
  const [clientId, setClientId] = useState("");
  const [dueDate, setDueDate] = useState(dateInputValue(7));

  const convert = useMutation({
    mutationFn: () => api.quotes.convert(quote.id, { clientId, dueDate: new Date(dueDate).toISOString() }),
    onSuccess: async (invoice) => {
      await Promise.all([invalidate(), qc.invalidateQueries({ queryKey: keys.quotes })]);
      onConverted({ ...quote, convertedToInvoice: true, invoiceId: invoice.id });
      toast.success(`Draft ${invoice.invoiceNumber} created — review and send it`);
      router.push(`/invoices/${invoice.id}`);
    },
    onError: (err) =>
      toast.error(isLimitError(err) ? "You've reached this month's free invoice limit." : errorMessage(err)),
  });

  return (
    <Modal open={open} onClose={onClose} title="Create invoice from quote">
      <div className="space-y-4">
        <Field label="Client" htmlFor="q-client">
          <Select id="q-client" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">Select a client…</option>
            {clients?.items.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.phone}
              </option>
            ))}
          </Select>
        </Field>
        {clients && clients.items.length === 0 && (
          <p className="text-sm text-muted-foreground">
            <Link href="/clients?new=1" className="text-primary hover:underline">
              Add a client
            </Link>{" "}
            first.
          </p>
        )}
        <Field label="Due date" htmlFor="q-due">
          <Input id="q-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>
        <Button className="w-full" disabled={!clientId} loading={convert.isPending} onClick={() => convert.mutate()}>
          Create draft invoice
        </Button>
      </div>
    </Modal>
  );
}

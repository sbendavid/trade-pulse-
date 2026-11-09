"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type ClientDTO, type ClientInput, clientSchema } from "@/lib/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { api, errorMessage } from "@/lib/api";

/** Create or edit a client. Calls onSaved with the stored record. */
export function ClientForm({
  client,
  onSaved,
  submitLabel,
}: {
  client?: ClientDTO;
  onSaved: (client: ClientDTO) => void;
  submitLabel?: string;
}) {
  const qc = useQueryClient();
  const form = useForm<ClientInput>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: client?.name ?? "",
      phone: client?.phone ?? "",
      email: client?.email ?? "",
      city: client?.city ?? "",
      notes: client?.notes ?? "",
    },
  });
  const { errors } = form.formState;

  const save = useMutation({
    mutationFn: (input: ClientInput) => (client ? api.clients.update(client.id, input) : api.clients.create(input)),
    onSuccess: async (saved) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["clients"] }),
        qc.invalidateQueries({ queryKey: ["client", saved.id] }),
      ]);
      toast.success(client ? "Client updated" : "Client added");
      onSaved(saved);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-4" noValidate>
      <Field label="Full name" htmlFor="c-name" error={errors.name?.message}>
        <Input id="c-name" autoComplete="name" aria-invalid={!!errors.name} {...form.register("name")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="WhatsApp number" htmlFor="c-phone" error={errors.phone?.message}>
          <Input
            id="c-phone"
            type="tel"
            inputMode="tel"
            placeholder="0803 123 4567"
            aria-invalid={!!errors.phone}
            {...form.register("phone")}
          />
        </Field>
        <Field label="Email (optional)" htmlFor="c-email" error={errors.email?.message}>
          <Input id="c-email" type="email" aria-invalid={!!errors.email} {...form.register("email")} />
        </Field>
      </div>
      <Field label="City (optional)" htmlFor="c-city" error={errors.city?.message}>
        <Input id="c-city" {...form.register("city")} />
      </Field>
      <Field label="Notes (optional)" htmlFor="c-notes" error={errors.notes?.message}>
        <Textarea id="c-notes" rows={3} {...form.register("notes")} />
      </Field>
      <Button type="submit" className="w-full" loading={save.isPending}>
        {submitLabel ?? (client ? "Save changes" : "Add client")}
      </Button>
    </form>
  );
}

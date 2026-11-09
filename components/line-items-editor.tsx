"use client";

import { computeTotals, formatMoney } from "@/lib/core";
import { Plus, Trash2 } from "lucide-react";
import { type Control, type FieldErrors, type UseFormRegister, useFieldArray, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";

export interface ItemsFormValues {
  items: { description: string; quantity: number; unit: string; rate: number }[];
  vatRate: number;
}

export const emptyItem = { description: "", quantity: 1, unit: "unit", rate: 0 };

/** Editable line items with live totals (same math the server uses). */
export function LineItemsEditor<T extends ItemsFormValues>({
  control,
  register,
  errors,
  currency,
}: {
  control: Control<T>;
  register: UseFormRegister<T>;
  errors?: FieldErrors<ItemsFormValues>;
  currency: string;
}) {
  // The generic form shares this shape; narrow once for the field-array helpers.
  const c = control as unknown as Control<ItemsFormValues>;
  const r = register as unknown as UseFormRegister<ItemsFormValues>;
  const { fields, append, remove } = useFieldArray({ control: c, name: "items" });
  const items = useWatch({ control: c, name: "items" }) ?? [];
  const vatRate = Number(useWatch({ control: c, name: "vatRate" })) || 0;
  const totals = computeTotals(
    items.map((i) => ({ ...i, quantity: Number(i.quantity) || 0, rate: Number(i.rate) || 0 })),
    vatRate,
  );
  const money = (n: number) => formatMoney(n, currency);

  return (
    <div className="space-y-3">
      <div className="hidden grid-cols-[1fr_5rem_5rem_7rem_7rem_2.25rem] gap-2 px-1 text-xs font-medium text-muted-foreground md:grid">
        <span>Description</span>
        <span>Qty</span>
        <span>Unit</span>
        <span>Rate</span>
        <span className="text-right">Amount</span>
        <span />
      </div>

      {fields.map((field, index) => {
        const err = errors?.items?.[index];
        return (
          <div
            key={field.id}
            className="grid grid-cols-6 gap-2 rounded-lg border p-3 md:grid-cols-[1fr_5rem_5rem_7rem_7rem_2.25rem] md:items-center md:border-0 md:p-0"
          >
            <Input
              className="col-span-6 md:col-span-1"
              placeholder="e.g. Labour, 2.5mm cable"
              aria-label={`Item ${index + 1} description`}
              aria-invalid={!!err?.description}
              {...r(`items.${index}.description`)}
            />
            <Input
              className="col-span-2 md:col-span-1"
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              aria-label="Quantity"
              aria-invalid={!!err?.quantity}
              {...r(`items.${index}.quantity`, { valueAsNumber: true })}
            />
            <Input className="col-span-2 md:col-span-1" aria-label="Unit" {...r(`items.${index}.unit`)} />
            <Input
              className="col-span-2 md:col-span-1"
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              aria-label="Rate"
              aria-invalid={!!err?.rate}
              {...r(`items.${index}.rate`, { valueAsNumber: true })}
            />
            <span className="col-span-5 self-center text-sm font-medium tabular-nums md:col-span-1 md:text-right">
              {money(totals.items[index]?.total ?? 0)}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="col-span-1 justify-self-end text-muted-foreground"
              onClick={() => remove(index)}
              disabled={fields.length === 1}
              aria-label={`Remove item ${index + 1}`}
            >
              <Trash2 />
            </Button>
            {(err?.description || err?.quantity || err?.rate) && (
              <p className="col-span-6 text-xs text-destructive md:col-span-6">
                {err.description?.message ?? err.quantity?.message ?? err.rate?.message}
              </p>
            )}
          </div>
        );
      })}

      {errors?.items?.root?.message && <p className="text-xs text-destructive">{errors.items.root.message}</p>}

      <Button type="button" variant="outline" size="sm" onClick={() => append(emptyItem)}>
        <Plus /> Add item
      </Button>

      <div className="ml-auto mt-4 w-full max-w-xs space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="tabular-nums">{money(totals.subtotal)}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="vatRate" className="text-muted-foreground">
            VAT (%)
          </label>
          <Input
            id="vatRate"
            type="number"
            step="any"
            min="0"
            max="100"
            className="h-8 w-20 text-right"
            {...r("vatRate", { valueAsNumber: true })}
          />
          <span className="tabular-nums">{money(totals.vatAmount)}</span>
        </div>
        <div className="flex justify-between border-t pt-2 text-base font-semibold">
          <span>Total</span>
          <span className="tabular-nums">{money(totals.total)}</span>
        </div>
      </div>
    </div>
  );
}

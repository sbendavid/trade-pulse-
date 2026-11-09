import type { Metadata } from "next";
import { Suspense } from "react";
import { InvoiceWizard } from "./invoice-wizard";

export const metadata: Metadata = { title: "New invoice" };

export default function NewInvoicePage() {
  return (
    <Suspense>
      <InvoiceWizard />
    </Suspense>
  );
}

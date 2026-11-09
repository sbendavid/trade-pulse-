"use client";

import type { ListInvoicesQuery, PaginationQuery } from "@/lib/core";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { useAuth } from "./auth-store";

export const keys = {
  me: ["me"] as const,
  stats: ["stats"] as const,
  invoices: (q?: ListInvoicesQuery) => ["invoices", q ?? {}] as const,
  invoice: (id: string) => ["invoice", id] as const,
  clients: (q?: PaginationQuery) => ["clients", q ?? {}] as const,
  client: (id: string) => ["client", id] as const,
  quotes: ["quotes"] as const,
};

export function useMe() {
  const setUser = useAuth((s) => s.setUser);
  return useQuery({
    queryKey: keys.me,
    queryFn: async () => {
      const user = await api.users.me();
      setUser(user);
      return user;
    },
  });
}

export const useStats = () => useQuery({ queryKey: keys.stats, queryFn: () => api.users.stats() });

export const useInvoices = (q?: ListInvoicesQuery) =>
  useQuery({ queryKey: keys.invoices(q), queryFn: () => api.invoices.list(q), placeholderData: (prev) => prev });

export const useInvoice = (id: string) =>
  useQuery({ queryKey: keys.invoice(id), queryFn: () => api.invoices.get(id), enabled: Boolean(id) });

export const useClients = (q?: PaginationQuery) =>
  useQuery({ queryKey: keys.clients(q), queryFn: () => api.clients.list(q), placeholderData: (prev) => prev });

export const useClient = (id: string) =>
  useQuery({ queryKey: keys.client(id), queryFn: () => api.clients.get(id), enabled: Boolean(id) });

export const useQuotes = () => useQuery({ queryKey: keys.quotes, queryFn: () => api.quotes.list({ limit: 10 }) });

/** Invalidate everything an invoice change can affect. */
export function useInvalidateInvoiceData() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ["invoices"] }),
      qc.invalidateQueries({ queryKey: ["invoice"] }),
      qc.invalidateQueries({ queryKey: ["clients"] }),
      qc.invalidateQueries({ queryKey: ["client"] }),
      qc.invalidateQueries({ queryKey: keys.stats }),
      qc.invalidateQueries({ queryKey: keys.me }),
    ]);
}

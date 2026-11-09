import type { Currency } from "./constants";

/** Round to 2 decimal places, avoiding binary float drift (e.g. 1.005). */
export function round2(value: number): number {
	return Math.round((value + Number.EPSILON) * 100) / 100;
}

export interface LineItemInput {
	description: string;
	quantity: number;
	unit: string;
	rate: number;
}

export interface LineItem extends LineItemInput {
	total: number;
}

export interface Totals {
	items: LineItem[];
	subtotal: number;
	vatRate: number;
	vatAmount: number;
	total: number;
}

/**
 * Single source of truth for invoice / quote money math. The server always
 * recomputes totals with this — client-supplied totals are never trusted.
 */
export function computeTotals(items: LineItemInput[], vatRate: number): Totals {
	const computed = items.map((item) => ({
		description: item.description,
		quantity: item.quantity,
		unit: item.unit,
		rate: item.rate,
		total: round2(item.quantity * item.rate),
	}));
	const subtotal = round2(computed.reduce((sum, i) => sum + i.total, 0));
	const vatAmount = round2((subtotal * vatRate) / 100);
	return {
		items: computed,
		subtotal,
		vatRate,
		vatAmount,
		total: round2(subtotal + vatAmount),
	};
}

const CURRENCY_LOCALES: Record<Currency, string> = {
	NGN: "en-NG",
	GHS: "en-GH",
	KES: "en-KE",
	ZAR: "en-ZA",
};

export function formatMoney(amount: number, currency: string): string {
	const locale = CURRENCY_LOCALES[currency as Currency] ?? "en";
	try {
		return new Intl.NumberFormat(locale, {
			style: "currency",
			currency,
			maximumFractionDigits: 2,
		}).format(amount);
	} catch {
		return `${currency} ${amount.toFixed(2)}`;
	}
}

/** INV-001, INV-002 … INV-1000 (padding only applies below 1000). */
export function formatInvoiceNumber(sequence: number): string {
	return `INV-${String(sequence).padStart(3, "0")}`;
}

/** Normalise a phone number to E.164 digits without "+", as WhatsApp expects. */
export function normalizePhone(phone: string, defaultDialCode = "234"): string {
	const digits = phone.replace(/\D/g, "");
	if (digits.startsWith("0")) return defaultDialCode + digits.slice(1);
	return digits;
}

export function isSameMonth(a: Date, b: Date): boolean {
	return (
		a.getUTCFullYear() === b.getUTCFullYear() &&
		a.getUTCMonth() === b.getUTCMonth()
	);
}

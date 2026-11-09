import { z } from "zod";
import {
	BUSINESS_TYPES,
	COUNTRIES,
	CURRENCIES,
	INVOICE_STATUSES,
} from "./constants";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");
const phone = z
	.string()
	.trim()
	.min(7, "Phone number is too short")
	.max(20, "Phone number is too long")
	.regex(/^\+?[\d\s()-]+$/, "Invalid phone number");
const password = z
	.string()
	.min(8, "Password must be at least 8 characters")
	.max(128);
const optionalEmail = z
	.union([z.email().trim().toLowerCase(), z.literal("")])
	.optional();

// ── Auth ────────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
	name: z.string().trim().min(2).max(80),
	email: z.email().trim().toLowerCase(),
	phone,
	password,
	businessName: z.string().trim().min(2).max(120),
	businessType: z.enum(BUSINESS_TYPES),
	city: z.string().trim().min(2).max(80),
	country: z.enum(COUNTRIES),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
	email: z.email().trim().toLowerCase(),
	password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({ refreshToken: z.string().min(1) });

export const verifyPhoneSchema = z.object({
	otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export const forgotPasswordSchema = z.object({
	email: z.email().trim().toLowerCase(),
});

export const resetPasswordSchema = z.object({
	token: z.string().min(1),
	password,
});

// ── Users ───────────────────────────────────────────────────────────────────

export const updateProfileSchema = z
	.object({
		name: z.string().trim().min(2).max(80),
		phone,
		businessName: z.string().trim().min(2).max(120),
		businessType: z.enum(BUSINESS_TYPES),
		city: z.string().trim().min(2).max(80),
		country: z.enum(COUNTRIES),
		currency: z.enum(CURRENCIES),
		onboarded: z.boolean(),
	})
	.partial();
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// ── Clients ─────────────────────────────────────────────────────────────────

export const clientSchema = z.object({
	name: z.string().trim().min(2).max(120),
	phone,
	email: optionalEmail,
	city: z.string().trim().max(80).optional(),
	notes: z.string().trim().max(2000).optional(),
});
export type ClientInput = z.infer<typeof clientSchema>;
export const updateClientSchema = clientSchema.partial();

// ── Line items / invoices ───────────────────────────────────────────────────

export const lineItemSchema = z.object({
	description: z.string().trim().min(1, "Description is required").max(300),
	quantity: z.coerce.number().positive("Quantity must be more than 0"),
	unit: z.string().trim().min(1).max(30).default("unit"),
	rate: z.coerce.number().min(0, "Rate cannot be negative"),
});
export type LineItemFormInput = z.input<typeof lineItemSchema>;

export const createInvoiceSchema = z.object({
	clientId: objectId,
	serviceDescription: z.string().trim().min(2).max(300),
	items: z.array(lineItemSchema).min(1, "Add at least one line item"),
	vatRate: z.coerce.number().min(0).max(100).optional(),
	dueDate: z.coerce.date(),
	notes: z.string().trim().max(2000).optional(),
	/** "draft" keeps it private; "pending" means it has been issued. */
	status: z.enum(["draft", "pending"]).default("draft"),
});
export type CreateInvoiceInput = z.input<typeof createInvoiceSchema>;

export const updateInvoiceSchema = z.object({
	serviceDescription: z.string().trim().min(2).max(300).optional(),
	items: z.array(lineItemSchema).min(1).optional(),
	vatRate: z.coerce.number().min(0).max(100).optional(),
	dueDate: z.coerce.date().optional(),
	notes: z.string().trim().max(2000).optional(),
	status: z.enum(["draft", "pending", "cancelled"]).optional(),
});
export type UpdateInvoiceInput = z.input<typeof updateInvoiceSchema>;

export const listInvoicesQuerySchema = z.object({
	status: z.enum(INVOICE_STATUSES).optional(),
	clientId: objectId.optional(),
	from: z.coerce.date().optional(),
	to: z.coerce.date().optional(),
	search: z.string().trim().max(100).optional(),
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListInvoicesQuery = z.input<typeof listInvoicesQuerySchema>;

export const markPaidSchema = z.object({
	paymentMethod: z.string().trim().max(50).default("cash"),
	paymentReference: z.string().trim().max(100).optional(),
});

export const paginationQuerySchema = z.object({
	search: z.string().trim().max(100).optional(),
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.input<typeof paginationQuerySchema>;

// ── Quotes / AI ─────────────────────────────────────────────────────────────

export const generateQuoteSchema = z.object({
	jobDescription: z
		.string()
		.trim()
		.min(10, "Describe the job in a bit more detail")
		.max(2000),
});
export type GenerateQuoteInput = z.infer<typeof generateQuoteSchema>;

export const convertQuoteSchema = z.object({
	clientId: objectId,
	dueDate: z.coerce.date(),
});
export type ConvertQuoteInput = z.input<typeof convertQuoteSchema>;

/** Shape the model is asked to return. Totals are recomputed server-side. */
export const aiQuoteSchema = z.object({
	title: z.string(),
	items: z.array(
		z.object({
			description: z.string(),
			quantity: z.number(),
			unit: z.string(),
			rate: z.number(),
			total: z.number(),
		}),
	),
	subtotal: z.number(),
	vatRate: z.number(),
	vatAmount: z.number(),
	total: z.number(),
	timeline: z.string(),
	notes: z.string(),
});
export type AiQuote = z.infer<typeof aiQuoteSchema>;

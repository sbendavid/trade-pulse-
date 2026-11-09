export const PLANS = ["free", "pro", "business"] as const;
export type Plan = (typeof PLANS)[number];

/** Monthly invoice allowance per plan. `null` = unlimited. */
export const PLAN_INVOICE_LIMITS: Record<Plan, number | null> = {
	free: 5,
	pro: null,
	business: null,
};

export const PLAN_PRICING_USD: Record<Plan, number> = {
	free: 0,
	pro: 9.99,
	business: 29,
};

export const COUNTRIES = ["NG", "GH", "KE", "ZA"] as const;
export type Country = (typeof COUNTRIES)[number];

export const CURRENCIES = ["NGN", "GHS", "KES", "ZAR"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const COUNTRY_DEFAULTS: Record<
	Country,
	{ name: string; currency: Currency; vatRate: number; dialCode: string }
> = {
	NG: { name: "Nigeria", currency: "NGN", vatRate: 7.5, dialCode: "234" },
	GH: { name: "Ghana", currency: "GHS", vatRate: 15, dialCode: "233" },
	KE: { name: "Kenya", currency: "KES", vatRate: 16, dialCode: "254" },
	ZA: { name: "South Africa", currency: "ZAR", vatRate: 15, dialCode: "27" },
};

export const BUSINESS_TYPES = [
	"electrician",
	"plumber",
	"tailor",
	"hair_stylist",
	"caterer",
	"cleaner",
	"photographer",
	"mechanic",
	"carpenter",
	"painter",
	"other",
] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];

export const INVOICE_STATUSES = [
	"draft",
	"pending",
	"paid",
	"overdue",
	"cancelled",
] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

/** Statuses in which an invoice can still be edited. */
export const EDITABLE_INVOICE_STATUSES: readonly InvoiceStatus[] = [
	"draft",
	"pending",
];

export const PAYMENT_PROVIDERS = [
	"paystack",
	"flutterwave",
	"mpesa",
	"manual",
] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export const PAYMENT_STATUSES = ["pending", "success", "failed"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const MAX_CLIENT_REMINDERS = 3;

export const ERROR_CODES = {
	VALIDATION_ERROR: "VALIDATION_ERROR",
	UNAUTHORIZED: "UNAUTHORIZED",
	TOKEN_EXPIRED: "TOKEN_EXPIRED",
	FORBIDDEN: "FORBIDDEN",
	NOT_FOUND: "NOT_FOUND",
	CONFLICT: "CONFLICT",
	INVOICE_LIMIT_REACHED: "INVOICE_LIMIT_REACHED",
	INVOICE_NOT_EDITABLE: "INVOICE_NOT_EDITABLE",
	INVALID_OTP: "INVALID_OTP",
	INTEGRATION_NOT_CONFIGURED: "INTEGRATION_NOT_CONFIGURED",
	INTEGRATION_ERROR: "INTEGRATION_ERROR",
	AI_ERROR: "AI_ERROR",
	RATE_LIMITED: "RATE_LIMITED",
	INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;
export type ErrorCode = keyof typeof ERROR_CODES;

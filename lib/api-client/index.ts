import type {
	ApiError,
	AuthResponse,
	AuthTokens,
	ClientDetailDTO,
	ClientDTO,
	ClientInput,
	ConvertQuoteInput,
	CreateInvoiceInput,
	DashboardStats,
	GenerateQuoteInput,
	InvoiceDTO,
	ListInvoicesQuery,
	LoginInput,
	PageMeta,
	Paginated,
	PaginationQuery,
	PaymentDTO,
	QuoteDTO,
	RegisterInput,
	SendInvoiceResult,
	UpdateInvoiceInput,
	UpdateProfileInput,
	UserDTO,
} from "@/lib/core";

export class ApiClientError extends Error {
	readonly code: string;
	readonly statusCode: number;
	readonly details?: unknown;

	constructor(body: Pick<ApiError, "message" | "code" | "statusCode" | "details">) {
		super(body.message);
		this.name = "ApiClientError";
		this.code = body.code;
		this.statusCode = body.statusCode;
		this.details = body.details;
	}
}

/** Where the client reads and persists tokens (localStorage, SecureStore, …). */
export interface TokenStore {
	getAccessToken(): string | null;
	getRefreshToken(): string | null;
	setTokens(tokens: AuthTokens): void;
	clear(): void;
}

export interface ApiClientOptions {
	baseUrl: string;
	tokens: TokenStore;
	/** Called once a refresh fails, i.e. the session is truly over. */
	onSessionExpired?: () => void;
	fetch?: typeof fetch;
}

type Query = Record<string, string | number | boolean | Date | undefined | null>;

interface RequestOptions {
	method?: "GET" | "POST" | "PATCH" | "DELETE";
	body?: unknown;
	query?: Query;
	auth?: boolean;
}

function toQueryString(query?: Query): string {
	if (!query) return "";
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(query)) {
		if (value === undefined || value === null || value === "") continue;
		params.set(key, value instanceof Date ? value.toISOString() : String(value));
	}
	const qs = params.toString();
	return qs ? `?${qs}` : "";
}

export function createApiClient(options: ApiClientOptions) {
	const { baseUrl, tokens, onSessionExpired } = options;
	const doFetch = options.fetch ?? globalThis.fetch.bind(globalThis);
	let refreshing: Promise<boolean> | null = null;

	async function refreshTokens(): Promise<boolean> {
		const refreshToken = tokens.getRefreshToken();
		if (!refreshToken) return false;
		// Coalesce concurrent 401s into a single refresh call.
		refreshing ??= (async () => {
			try {
				const res = await doFetch(`${baseUrl}/auth/refresh`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ refreshToken }),
				});
				if (!res.ok) return false;
				const json = (await res.json()) as { data: AuthTokens };
				tokens.setTokens(json.data);
				return true;
			} catch {
				return false;
			} finally {
				refreshing = null;
			}
		})();
		return refreshing;
	}

	async function raw(path: string, opts: RequestOptions, retry = true): Promise<Response> {
		const headers: Record<string, string> = {};
		const isForm = typeof FormData !== "undefined" && opts.body instanceof FormData;
		if (opts.body !== undefined && !isForm) headers["Content-Type"] = "application/json";
		const accessToken = tokens.getAccessToken();
		if (opts.auth !== false && accessToken) {
			headers.Authorization = `Bearer ${accessToken}`;
		}

		let body: BodyInit | undefined;
		if (isForm) body = opts.body as FormData;
		else if (opts.body !== undefined) body = JSON.stringify(opts.body);

		const res = await doFetch(`${baseUrl}${path}${toQueryString(opts.query)}`, {
			method: opts.method ?? "GET",
			headers,
			...(body !== undefined ? { body } : {}),
		});

		if (res.status === 401 && retry && opts.auth !== false) {
			if (await refreshTokens()) return raw(path, opts, false);
			tokens.clear();
			onSessionExpired?.();
		}
		return res;
	}

	async function request<T>(path: string, opts: RequestOptions = {}): Promise<{ data: T; meta?: PageMeta }> {
		const res = await raw(path, opts);
		const json = (await res.json().catch(() => null)) as
			| { success: true; data: T; meta?: PageMeta }
			| ApiError
			| null;
		if (!res.ok || !json || json.success === false) {
			throw new ApiClientError(
				json && json.success === false
					? json
					: { message: res.statusText || "Request failed", code: "INTERNAL_ERROR", statusCode: res.status },
			);
		}
		return json.meta ? { data: json.data, meta: json.meta } : { data: json.data };
	}

	const get = async <T>(path: string, query?: Query) =>
		(await request<T>(path, query ? { query } : {})).data;
	const post = async <T>(path: string, body?: unknown, auth = true) =>
		(await request<T>(path, { method: "POST", body, auth })).data;
	const patch = async <T>(path: string, body: unknown) =>
		(await request<T>(path, { method: "PATCH", body })).data;
	const del = async <T>(path: string) => (await request<T>(path, { method: "DELETE" })).data;
	const list = async <T>(path: string, query?: Query): Promise<Paginated<T>> => {
		const res = await request<T[]>(path, query ? { query } : {});
		return {
			items: res.data,
			meta: res.meta ?? { page: 1, limit: res.data.length, total: res.data.length, pages: 1 },
		};
	};

	const auth = {
		register: async (input: RegisterInput) => {
			const data = await post<AuthResponse>("/auth/register", input, false);
			tokens.setTokens(data);
			return data;
		},
		login: async (input: LoginInput) => {
			const data = await post<AuthResponse>("/auth/login", input, false);
			tokens.setTokens(data);
			return data;
		},
		logout: async () => {
			const refreshToken = tokens.getRefreshToken();
			try {
				if (refreshToken) await post("/auth/logout", { refreshToken });
			} finally {
				tokens.clear();
			}
		},
		verifyPhone: (otp: string) => post<UserDTO>("/auth/verify-phone", { otp }),
		resendOtp: () => post<{ sent: boolean }>("/auth/resend-otp"),
		forgotPassword: (email: string) => post<{ sent: boolean }>("/auth/forgot-password", { email }, false),
		resetPassword: (token: string, password: string) =>
			post<{ reset: boolean }>("/auth/reset-password", { token, password }, false),
	};

	const users = {
		me: () => get<UserDTO>("/users/me"),
		update: (input: UpdateProfileInput) => patch<UserDTO>("/users/me", input),
		uploadLogo: async (file: Blob, filename = "logo.png") => {
			const form = new FormData();
			form.append("logo", file, filename);
			return (await request<UserDTO>("/users/me/logo", { method: "PATCH", body: form })).data;
		},
		stats: () => get<DashboardStats>("/users/me/stats"),
	};

	const clients = {
		list: (query?: PaginationQuery) => list<ClientDTO>("/clients", query as Query),
		get: (id: string) => get<ClientDetailDTO>(`/clients/${id}`),
		create: (input: ClientInput) => post<ClientDTO>("/clients", input),
		update: (id: string, input: Partial<ClientInput>) => patch<ClientDTO>(`/clients/${id}`, input),
		remove: (id: string) => del<{ deleted: boolean }>(`/clients/${id}`),
	};

	const invoices = {
		list: (query?: ListInvoicesQuery) => list<InvoiceDTO>("/invoices", query as Query),
		get: (id: string) => get<InvoiceDTO>(`/invoices/${id}`),
		create: (input: CreateInvoiceInput) => post<InvoiceDTO>("/invoices", input),
		update: (id: string, input: UpdateInvoiceInput) => patch<InvoiceDTO>(`/invoices/${id}`, input),
		remove: (id: string) => del<{ deleted: boolean }>(`/invoices/${id}`),
		send: (id: string) => post<SendInvoiceResult>(`/invoices/${id}/send`),
		markPaid: (id: string, input?: { paymentMethod?: string; paymentReference?: string }) =>
			post<InvoiceDTO>(`/invoices/${id}/mark-paid`, input ?? {}),
		reminder: (id: string) => post<SendInvoiceResult>(`/invoices/${id}/reminder`),
		paymentLink: (id: string) => get<{ paymentLink: string }>(`/invoices/${id}/payment-link`),
		/** Fetches the PDF with auth and returns it as a Blob. */
		pdf: async (id: string) => {
			const res = await raw(`/invoices/${id}/pdf`, {});
			if (!res.ok) {
				const json = (await res.json().catch(() => null)) as ApiError | null;
				throw new ApiClientError(
					json ?? { message: "Could not download PDF", code: "INTERNAL_ERROR", statusCode: res.status },
				);
			}
			return res.blob();
		},
	};

	const quotes = {
		generate: (input: GenerateQuoteInput) => post<QuoteDTO>("/quotes/generate", input),
		list: (query?: PaginationQuery) => list<QuoteDTO>("/quotes", query as Query),
		get: (id: string) => get<QuoteDTO>(`/quotes/${id}`),
		convert: (id: string, input: ConvertQuoteInput) => post<InvoiceDTO>(`/quotes/${id}/convert`, input),
		remove: (id: string) => del<{ deleted: boolean }>(`/quotes/${id}`),
	};

	const payments = {
		history: (query?: PaginationQuery) => list<PaymentDTO>("/payments/history", query as Query),
		initiatePaystack: (invoiceId: string) =>
			post<{ paymentLink: string; reference: string }>(`/payments/paystack/initiate/${invoiceId}`),
	};

	return { auth, users, clients, invoices, quotes, payments };
}

export type ApiClient = ReturnType<typeof createApiClient>;

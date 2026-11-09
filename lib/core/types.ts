import type { LineItem } from "./calc";
import type {
	BusinessType,
	Country,
	Currency,
	InvoiceStatus,
	PaymentProvider,
	PaymentStatus,
	Plan,
} from "./constants";

/** Dates cross the wire as ISO strings. */
type ISODate = string;

export interface PageMeta {
	page: number;
	limit: number;
	total: number;
	pages: number;
}

export interface ApiSuccess<T> {
	success: true;
	data: T;
	meta?: PageMeta;
}

export interface ApiError {
	success: false;
	message: string;
	code: string;
	statusCode: number;
	details?: unknown;
}

export interface Paginated<T> {
	items: T[];
	meta: PageMeta;
}

export interface UserDTO {
	id: string;
	name: string;
	email: string;
	phone: string;
	businessName: string;
	businessType: BusinessType;
	city: string;
	country: Country;
	currency: Currency;
	logo?: string;
	plan: Plan;
	planExpiry?: ISODate;
	invoiceCount: number;
	whatsappVerified: boolean;
	onboarded: boolean;
	createdAt: ISODate;
}

export interface AuthTokens {
	accessToken: string;
	refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
	user: UserDTO;
}

export interface ClientDTO {
	id: string;
	name: string;
	phone: string;
	email?: string;
	city?: string;
	notes?: string;
	totalPaid: number;
	totalOwed: number;
	jobCount: number;
	createdAt: ISODate;
}

export interface InvoiceDTO {
	id: string;
	invoiceNumber: string;
	clientId: string;
	clientSnapshot: { name: string; phone: string; email?: string };
	serviceDescription: string;
	items: LineItem[];
	subtotal: number;
	vatRate: number;
	vatAmount: number;
	total: number;
	currency: Currency;
	status: InvoiceStatus;
	issuedAt: ISODate;
	dueDate: ISODate;
	paidAt?: ISODate;
	paymentMethod?: string;
	paymentReference?: string;
	pdfUrl?: string;
	paymentLink?: string;
	notes?: string;
	remindersSent: number;
	lastReminderAt?: ISODate;
	createdAt: ISODate;
}

export interface ClientDetailDTO extends ClientDTO {
	invoices: InvoiceDTO[];
}

export interface QuoteDTO {
	id: string;
	jobDescription: string;
	title: string;
	items: LineItem[];
	subtotal: number;
	vatRate: number;
	vatAmount: number;
	total: number;
	currency: Currency;
	timeline: string;
	notes: string;
	convertedToInvoice: boolean;
	invoiceId?: string;
	createdAt: ISODate;
}

export interface PaymentDTO {
	id: string;
	invoiceId: string;
	amount: number;
	currency: Currency;
	provider: PaymentProvider;
	providerReference: string;
	status: PaymentStatus;
	createdAt: ISODate;
}

export interface DashboardStats {
	currency: Currency;
	totalRevenue: number;
	revenueThisMonth: number;
	outstanding: number;
	overdueAmount: number;
	invoiceCounts: Record<InvoiceStatus, number>;
	clientCount: number;
	invoicesThisMonth: number;
	/** null = unlimited */
	invoiceLimit: number | null;
	monthlyRevenue: { month: string; revenue: number }[];
	recentInvoices: InvoiceDTO[];
}

export type DeliveryStatus = "sent" | "skipped" | "failed";

export interface SendInvoiceResult {
	invoice: InvoiceDTO;
	channels: { whatsapp: DeliveryStatus; email: DeliveryStatus };
}

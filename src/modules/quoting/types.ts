/**
 * Quoting Module — Client-Safe Types
 * Pure TypeScript interfaces with zero server/database dependencies.
 */

export interface QuoteListItem {
  id: string;
  customerName: string;
  customerPhone?: string;
  vehicleText?: string | null;
  leadId: string;
  status: string;
  total: string;
  itemCount: number;
  validUntil: string | null;
  createdAt: string;
  linkedBookingId?: string | null;
}

export interface QuoteDetail extends QuoteListItem {
  customerId: string;
  customerPhone: string;
  customerEmail: string | null;
  vehicleId: string | null;
  vehicleBrand?: string | null;
  vehicleModel?: string | null;
  issuedById: string | null;
  issuedByName?: string | null;
  subtotal: string;
  discount: string;
  tax: string;
  notes: string | null;
  terms: string | null;
  items: QuoteItemDetail[];
  linkedBookingId: string | null;
}

export interface QuoteItemDetail {
  id: string;
  serviceId: string | null;
  packageId: string | null;
  description: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
}

export interface CreateQuoteInput {
  leadId: string;
  customerId: string;
  vehicleId?: string;
  issuedById?: string;
  items: CreateQuoteItemInput[];
  discount?: string;
  tax?: string;
  notes?: string;
  terms?: string;
  validUntil?: string;
}

export interface CreateQuoteItemInput {
  serviceId?: string;
  packageId?: string;
  description: string;
  quantity?: number;
  unitPrice: string;
}

export interface UpdateQuoteInput {
  items?: CreateQuoteItemInput[];
  vehicleId?: string;
  discount?: string;
  tax?: string;
  notes?: string;
  terms?: string;
  validUntil?: string;
}

export interface ListQuotesOptions {
  status?: string;
  leadId?: string;
  customerId?: string;
}

export interface QuoteStats {
  totalCount: number;
  draftCount: number;
  sentCount: number;
  acceptedCount: number;
  declinedCount: number;
  expiredCount: number;
  totalQuotedValue: number;
  acceptedRevenue: number;
}

export type UserRole = 'landlord' | 'tenant';
export type MaintenanceUrgency = 'emergency' | 'urgent' | 'routine';
export type MaintenanceTrade = 'plumbing' | 'electrical' | 'hvac' | 'general';
export type MaintenanceStatus = 'open' | 'assigned' | 'resolved';
export type PaymentMethod = 'ach' | 'card' | 'manual';
export type PaymentStatus = 'pending' | 'paid' | 'late' | 'waived';
export type LeaseStatus = 'active' | 'expired' | 'terminated';
export type DocumentType = 'lease' | 'receipt' | 'photo' | 'insurance' | 'other';
export type SubscriptionPlan = 'starter' | 'standard' | 'annual';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  is_admin: boolean;
  full_name: string;
  stripe_customer_id: string | null;
  created_at: string;
}

export interface Property {
  id: string;
  landlord_id: string;
  address: string;
  nickname: string | null;
  mortgage: number | null; // cents
  insurance: number | null; // cents/year
  tax_annual: number | null; // cents
  created_at: string;
  units?: Unit[];
}

export interface Unit {
  id: string;
  property_id: string;
  unit_number: string;
  bedrooms: number;
  bathrooms: number;
  rent_amount: number; // cents
  leases?: Lease[];
}

export interface Lease {
  id: string;
  unit_id: string;
  tenant_id: string;
  start_date: string;
  end_date: string;
  rent_amount: number; // cents
  deposit_amount: number; // cents
  document_url: string | null;
  status: LeaseStatus;
  tenant?: User;
}

export interface RentPayment {
  id: string;
  lease_id: string;
  amount: number; // cents
  due_date: string;
  paid_at: string | null;
  method: PaymentMethod | null;
  stripe_payment_intent_id: string | null;
  status: PaymentStatus;
}

export interface MaintenanceRequest {
  id: string;
  unit_id: string;
  tenant_id: string;
  title: string;
  description: string;
  photo_urls: string[];
  urgency: MaintenanceUrgency;
  trade: MaintenanceTrade;
  status: MaintenanceStatus;
  vendor_id: string | null;
  created_at: string;
  tenant?: User;
  unit?: Unit & { property?: Property };
  vendor?: Vendor;
}

export interface Vendor {
  id: string;
  landlord_id: string;
  name: string;
  trade: MaintenanceTrade;
  phone: string | null;
  email: string | null;
  notes: string | null;
}

export interface Message {
  id: string;
  lease_id: string;
  sender_id: string;
  body: string;
  ai_drafted: boolean;
  created_at: string;
  sender?: User;
}

export interface Document {
  id: string;
  property_id: string;
  unit_id: string | null;
  name: string;
  type: DocumentType;
  storage_url: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  landlord_id: string;
  stripe_subscription_id: string;
  plan: SubscriptionPlan;
  unit_count: number;
  status: SubscriptionStatus;
  current_period_end: string;
}

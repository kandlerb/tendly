export type UserRole = 'landlord' | 'tenant';
export type MaintenanceUrgency = 'emergency' | 'urgent' | 'routine';
export type MaintenanceTrade = 'plumbing' | 'electrical' | 'hvac' | 'general';
export type MaintenanceStatus = 'open' | 'assigned' | 'resolved';
export type PaymentMethod = 'ach' | 'card' | 'manual';
export type PaymentStatus = 'pending' | 'paid' | 'late' | 'waived';
export type LeaseStatus = 'active' | 'expired' | 'terminated';
export type DocumentType =
  | 'lease' | 'lease_addendum' | 'move_in_checklist' | 'move_out_checklist'
  | 'renters_insurance' | 'notice' | 'receipt' | 'photo' | 'other';
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
  sender_id: string | null;
  body: string;
  ai_drafted: boolean;
  sender_type: 'user' | 'system';
  read_at: string | null;
  created_at: string;
  sender?: User;
}

export interface Document {
  id: string;
  property_id: string | null;
  unit_id: string | null;
  lease_id: string | null;
  uploaded_by: string | null;
  name: string;
  type: DocumentType;
  storage_url: string;
  signed_by_tenant_at: string | null;
  signed_by_landlord_at: string | null;
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

export interface VehicleInfo {
  make: string;
  model: string;
  year: number;
  plate: string;
  color: string;
}

export interface PetInfo {
  type: string;
  breed: string;
  name: string;
  weight_lbs: number;
}

export interface TenantProfile {
  id: string;
  phone: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
  vehicles: VehicleInfo[];
  pets: PetInfo[];
  updated_at: string;
  // move_in_notes intentionally omitted — never fetched by landlord queries
}

export interface TenantWithLease extends Lease {
  tenant: User & { profile?: TenantProfile };
  unit: Unit & { property: Property };
  recentPayment?: RentPayment;
}

export interface TenantInvitation {
  id: string;
  landlord_id: string;
  unit_id: string;
  email: string;
  status: 'pending' | 'accepted' | 'expired';
  expires_at: string;
  created_at: string;
}

# Tendly Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build Tendly — a property management iOS app for small landlords — from zero to TestFlight-ready.

**Architecture:** Expo + React Native (TypeScript) with Expo Router for navigation, Supabase for auth/database/storage/realtime, Stripe for subscriptions, and Claude API for AI features. All AI calls go through Supabase Edge Functions server-side.

**Tech Stack:** Expo SDK 52, Expo Router v4, NativeWind v4, Zustand, Supabase JS v2, Stripe React Native SDK, Claude claude-sonnet-4-6 API via Anthropic SDK, EAS CLI

---

## Prerequisites (human does these before starting)

1. Create a Supabase project at supabase.com — save the project URL and anon key
2. Create a Stripe account — save the publishable key, secret key, and create a webhook endpoint
3. Get a Claude API key from console.anthropic.com
4. Install Node.js 20+, install EAS CLI: `npm install -g eas-cli`
5. Have Xcode installed (for iOS simulator)
6. Create `.env.local` at project root with:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ANTHROPIC_API_KEY=your_anthropic_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_webhook_secret
   ```

---

## Phase 1: Project Scaffolding

### Task 1: Initialize Expo Project

**Files:**
- Create: `package.json` (via Expo CLI)
- Create: `app.json`
- Create: `tsconfig.json`
- Create: `.gitignore`

**Step 1: Scaffold the Expo project**

Run from `C:/Users/kandl.AABC-2LT/Projects/`:
```bash
npx create-expo-app@latest tendly --template blank-typescript
cd tendly
```

Expected: Project created with `app/`, `package.json`, `tsconfig.json`

**Step 2: Install all dependencies at once**

```bash
npx expo install expo-router expo-linking expo-constants expo-status-bar expo-image-picker expo-document-picker expo-file-system expo-notifications react-native-safe-area-context react-native-screens react-native-gesture-handler react-native-reanimated

npm install @supabase/supabase-js zustand nativewind tailwindcss @stripe/stripe-react-native @anthropic-ai/sdk

npm install --save-dev @types/react @testing-library/react-native @testing-library/jest-native jest jest-expo
```

**Step 3: Configure app.json for Expo Router**

Replace contents of `app.json`:
```json
{
  "expo": {
    "name": "Tendly",
    "slug": "tendly",
    "version": "1.0.0",
    "scheme": "tendly",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.tendly.app"
    },
    "android": {
      "package": "com.tendly.app"
    },
    "plugins": [
      "expo-router",
      "@stripe/stripe-react-native"
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

**Step 4: Configure NativeWind**

Create `tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0fdf4",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
        },
      },
    },
  },
  plugins: [],
};
```

Create `global.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Add to `babel.config.js`:
```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
```

**Step 5: Configure Jest**

Add to `package.json`:
```json
{
  "jest": {
    "preset": "jest-expo",
    "setupFilesAfterFramework": ["@testing-library/jest-native/extend-expect"],
    "transformIgnorePatterns": [
      "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)"
    ]
  }
}
```

**Step 6: Create the folder structure**

```bash
mkdir -p app/\(auth\) app/\(landlord\)/properties/\[id\]/unit app/\(landlord\)/maintenance app/\(landlord\)/messages app/\(tenant\) components/ui components/domain lib hooks store types supabase/migrations supabase/functions/triage supabase/functions/tend supabase/functions/draft-message supabase/functions/stripe-webhook
```

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: scaffold expo project with all dependencies"
```

Expected: Clean git status after commit

---

### Task 2: TypeScript Types

**Files:**
- Create: `types/index.ts`

**Step 1: Write types**

Create `types/index.ts`:
```typescript
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
```

**Step 2: Commit**

```bash
git add types/index.ts
git commit -m "feat: add typescript types for all domain models"
```

---

## Phase 2: Supabase Setup

### Task 3: Database Migrations

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

**Step 1: Write migration**

Create `supabase/migrations/001_initial_schema.sql`:
```sql
-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- USERS (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  role text not null check (role in ('landlord', 'tenant')),
  full_name text not null default '',
  stripe_customer_id text,
  created_at timestamptz default now()
);

-- PROPERTIES
create table public.properties (
  id uuid primary key default uuid_generate_v4(),
  landlord_id uuid references public.users(id) on delete cascade not null,
  address text not null,
  nickname text,
  mortgage integer, -- cents/month
  insurance integer, -- cents/year
  tax_annual integer, -- cents/year
  created_at timestamptz default now()
);

-- UNITS
create table public.units (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid references public.properties(id) on delete cascade not null,
  unit_number text not null default '1',
  bedrooms integer not null default 1,
  bathrooms numeric(3,1) not null default 1,
  rent_amount integer not null default 0 -- cents/month
);

-- VENDORS
create table public.vendors (
  id uuid primary key default uuid_generate_v4(),
  landlord_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  trade text not null check (trade in ('plumbing', 'electrical', 'hvac', 'general')),
  phone text,
  email text,
  notes text
);

-- LEASES
create table public.leases (
  id uuid primary key default uuid_generate_v4(),
  unit_id uuid references public.units(id) on delete cascade not null,
  tenant_id uuid references public.users(id) on delete cascade not null,
  start_date date not null,
  end_date date not null,
  rent_amount integer not null, -- cents/month
  deposit_amount integer not null default 0, -- cents
  document_url text,
  status text not null default 'active' check (status in ('active', 'expired', 'terminated'))
);

-- RENT PAYMENTS
create table public.rent_payments (
  id uuid primary key default uuid_generate_v4(),
  lease_id uuid references public.leases(id) on delete cascade not null,
  amount integer not null, -- cents
  due_date date not null,
  paid_at timestamptz,
  method text check (method in ('ach', 'card', 'manual')),
  stripe_payment_intent_id text,
  status text not null default 'pending' check (status in ('pending', 'paid', 'late', 'waived'))
);

-- MAINTENANCE REQUESTS
create table public.maintenance_requests (
  id uuid primary key default uuid_generate_v4(),
  unit_id uuid references public.units(id) on delete cascade not null,
  tenant_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  description text not null,
  photo_urls text[] default '{}',
  urgency text not null default 'routine' check (urgency in ('emergency', 'urgent', 'routine')),
  trade text not null default 'general' check (trade in ('plumbing', 'electrical', 'hvac', 'general')),
  status text not null default 'open' check (status in ('open', 'assigned', 'resolved')),
  vendor_id uuid references public.vendors(id),
  created_at timestamptz default now()
);

-- MESSAGES
create table public.messages (
  id uuid primary key default uuid_generate_v4(),
  lease_id uuid references public.leases(id) on delete cascade not null,
  sender_id uuid references public.users(id) on delete cascade not null,
  body text not null,
  ai_drafted boolean not null default false,
  created_at timestamptz default now()
);

-- DOCUMENTS
create table public.documents (
  id uuid primary key default uuid_generate_v4(),
  property_id uuid references public.properties(id) on delete cascade not null,
  unit_id uuid references public.units(id) on delete set null,
  name text not null,
  type text not null check (type in ('lease', 'receipt', 'photo', 'insurance', 'other')),
  storage_url text not null,
  created_at timestamptz default now()
);

-- SUBSCRIPTIONS
create table public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  landlord_id uuid references public.users(id) on delete cascade not null unique,
  stripe_subscription_id text,
  plan text not null default 'starter' check (plan in ('starter', 'standard', 'annual')),
  unit_count integer not null default 0,
  status text not null default 'active' check (status in ('active', 'canceled', 'past_due', 'trialing')),
  current_period_end timestamptz
);

-- =====================
-- ROW LEVEL SECURITY
-- =====================

alter table public.users enable row level security;
alter table public.properties enable row level security;
alter table public.units enable row level security;
alter table public.vendors enable row level security;
alter table public.leases enable row level security;
alter table public.rent_payments enable row level security;
alter table public.maintenance_requests enable row level security;
alter table public.messages enable row level security;
alter table public.documents enable row level security;
alter table public.subscriptions enable row level security;

-- Users: can only see their own row
create policy "users_own" on public.users
  for all using (auth.uid() = id);

-- Properties: landlord sees their own
create policy "properties_landlord" on public.properties
  for all using (auth.uid() = landlord_id);

-- Units: landlord sees units on their properties
create policy "units_landlord" on public.units
  for all using (
    property_id in (select id from public.properties where landlord_id = auth.uid())
  );

-- Tenant sees units they have an active lease for
create policy "units_tenant" on public.units
  for select using (
    id in (select unit_id from public.leases where tenant_id = auth.uid())
  );

-- Vendors: landlord sees their own
create policy "vendors_landlord" on public.vendors
  for all using (auth.uid() = landlord_id);

-- Leases: landlord sees leases on their units; tenant sees their own
create policy "leases_landlord" on public.leases
  for all using (
    unit_id in (
      select u.id from public.units u
      join public.properties p on u.property_id = p.id
      where p.landlord_id = auth.uid()
    )
  );
create policy "leases_tenant" on public.leases
  for select using (tenant_id = auth.uid());

-- Rent payments: same access as leases
create policy "rent_payments_landlord" on public.rent_payments
  for all using (
    lease_id in (
      select l.id from public.leases l
      join public.units u on l.unit_id = u.id
      join public.properties p on u.property_id = p.id
      where p.landlord_id = auth.uid()
    )
  );
create policy "rent_payments_tenant" on public.rent_payments
  for select using (
    lease_id in (select id from public.leases where tenant_id = auth.uid())
  );

-- Maintenance requests: landlord sees all on their units; tenant sees their own
create policy "maintenance_landlord" on public.maintenance_requests
  for all using (
    unit_id in (
      select u.id from public.units u
      join public.properties p on u.property_id = p.id
      where p.landlord_id = auth.uid()
    )
  );
create policy "maintenance_tenant" on public.maintenance_requests
  for all using (tenant_id = auth.uid());

-- Messages: both parties on a lease can see them
create policy "messages_access" on public.messages
  for all using (
    lease_id in (
      select l.id from public.leases l
      join public.units u on l.unit_id = u.id
      join public.properties p on u.property_id = p.id
      where p.landlord_id = auth.uid() or l.tenant_id = auth.uid()
    )
  );

-- Documents: landlord only
create policy "documents_landlord" on public.documents
  for all using (
    property_id in (select id from public.properties where landlord_id = auth.uid())
  );

-- Subscriptions: landlord sees their own
create policy "subscriptions_landlord" on public.subscriptions
  for all using (auth.uid() = landlord_id);

-- =====================
-- TRIGGER: auto-create user row on signup
-- =====================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, role, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'landlord'),
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- TRIGGER: auto-create starter subscription for new landlords
create or replace function public.handle_new_landlord()
returns trigger as $$
begin
  if new.role = 'landlord' then
    insert into public.subscriptions (landlord_id, plan, unit_count, status)
    values (new.id, 'starter', 0, 'active');
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_landlord_created
  after insert on public.users
  for each row execute procedure public.handle_new_landlord();
```

**Step 2: Apply migration to Supabase**

In Supabase dashboard → SQL Editor → paste and run the migration.

Or if using Supabase CLI:
```bash
npx supabase db push
```

Expected: All 10 tables created with RLS enabled

**Step 3: Set up storage bucket in Supabase**

In Supabase dashboard → Storage → New bucket:
- Name: `documents`
- Public: No (private, accessed via signed URLs)

**Step 4: Commit**

```bash
git add supabase/migrations/
git commit -m "feat: add initial database schema with RLS policies"
```

---

### Task 4: Supabase Client + Lib Setup

**Files:**
- Create: `lib/supabase.ts`
- Create: `lib/claude.ts`
- Create: `lib/stripe.ts`
- Create: `lib/utils.ts`

**Step 1: Write Supabase client**

Create `lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

Install secure store: `npx expo install expo-secure-store`

**Step 2: Write currency utility**

Create `lib/utils.ts`:
```typescript
/** Format cents as USD string: 120000 → "$1,200.00" */
export function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

/** Convert dollars string to cents: "1200.00" → 120000 */
export function dollarsToCents(dollars: string): number {
  return Math.round(parseFloat(dollars) * 100);
}

/** Format date string for display: "2026-02-18" → "Feb 18, 2026" */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Calculate cap rate: (annual net income / property value) * 100 */
export function calcCapRate(annualNetIncome: number, propertyValue: number): number {
  if (propertyValue === 0) return 0;
  return (annualNetIncome / propertyValue) * 100;
}
```

**Step 3: Write unit tests for utils**

Create `lib/__tests__/utils.test.ts`:
```typescript
import { formatCents, dollarsToCents, calcCapRate } from '../utils';

describe('formatCents', () => {
  it('formats cents as USD', () => {
    expect(formatCents(120000)).toBe('$1,200.00');
    expect(formatCents(0)).toBe('$0.00');
    expect(formatCents(99)).toBe('$0.99');
  });
});

describe('dollarsToCents', () => {
  it('converts dollar string to cents', () => {
    expect(dollarsToCents('1200.00')).toBe(120000);
    expect(dollarsToCents('9.99')).toBe(999);
    expect(dollarsToCents('0')).toBe(0);
  });
});

describe('calcCapRate', () => {
  it('calculates cap rate correctly', () => {
    expect(calcCapRate(12000, 200000)).toBeCloseTo(6.0);
    expect(calcCapRate(0, 200000)).toBe(0);
    expect(calcCapRate(1000, 0)).toBe(0);
  });
});
```

**Step 4: Run tests**

```bash
npx jest lib/__tests__/utils.test.ts --verbose
```

Expected: 3 test suites, all passing

**Step 5: Commit**

```bash
git add lib/
git commit -m "feat: add supabase client, utilities, and passing tests"
```

---

## Phase 3: Auth Flow

### Task 5: Auth Store (Zustand)

**Files:**
- Create: `store/auth.ts`

**Step 1: Write auth store**

Create `store/auth.ts`:
```typescript
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  session: any | null;
  loading: boolean;
  setSession: (session: any) => void;
  setUser: (user: User | null) => void;
  signOut: () => Promise<void>;
  fetchUser: (userId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,

  setSession: (session) => set({ session, loading: false }),
  setUser: (user) => set({ user }),

  fetchUser: async (userId: string) => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) set({ user: data as User });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null });
  },
}));
```

**Step 2: Commit**

```bash
git add store/auth.ts
git commit -m "feat: add auth zustand store"
```

---

### Task 6: Root Layout + Auth Provider

**Files:**
- Create: `app/_layout.tsx`
- Create: `app/index.tsx`

**Step 1: Write root layout**

Create `app/_layout.tsx`:
```typescript
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth';

export default function RootLayout() {
  const { session, setSession, fetchUser } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUser(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        if (session) await fetchUser(session.user.id);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(landlord)/dashboard');
    }
  }, [session, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(landlord)" />
      <Stack.Screen name="(tenant)" />
    </Stack>
  );
}
```

Create `app/index.tsx`:
```typescript
import { Redirect } from 'expo-router';
export default function Index() {
  return <Redirect href="/(auth)/login" />;
}
```

**Step 2: Commit**

```bash
git add app/_layout.tsx app/index.tsx
git commit -m "feat: add root layout with auth redirect logic"
```

---

### Task 7: Login + Signup Screens

**Files:**
- Create: `app/(auth)/_layout.tsx`
- Create: `app/(auth)/login.tsx`
- Create: `app/(auth)/signup.tsx`
- Create: `components/ui/Button.tsx`
- Create: `components/ui/Input.tsx`

**Step 1: Write shared UI components**

Create `components/ui/Button.tsx`:
```typescript
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export function Button({ title, onPress, loading, variant = 'primary', disabled }: Props) {
  const base = 'rounded-xl py-4 px-6 items-center justify-center';
  const variants = {
    primary: 'bg-brand-600',
    secondary: 'bg-gray-100 border border-gray-200',
  };
  const textColor = variant === 'primary' ? 'text-white font-semibold' : 'text-gray-800 font-medium';

  return (
    <TouchableOpacity
      className={`${base} ${variants[variant]} ${disabled || loading ? 'opacity-50' : ''}`}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? 'white' : '#374151'} />
      ) : (
        <Text className={textColor}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}
```

Create `components/ui/Input.tsx`:
```typescript
import { View, Text, TextInput, TextInputProps } from 'react-native';

interface Props extends TextInputProps {
  label: string;
  error?: string;
}

export function Input({ label, error, ...props }: Props) {
  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-700 mb-1">{label}</Text>
      <TextInput
        className={`border rounded-xl px-4 py-3 text-base text-gray-900 bg-white ${
          error ? 'border-red-400' : 'border-gray-200'
        }`}
        placeholderTextColor="#9ca3af"
        {...props}
      />
      {error && <Text className="text-red-500 text-xs mt-1">{error}</Text>}
    </View>
  );
}
```

**Step 2: Write auth layout**

Create `app/(auth)/_layout.tsx`:
```typescript
import { Stack } from 'expo-router';
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

**Step 3: Write login screen**

Create `app/(auth)/login.tsx`:
```typescript
import { useState } from 'react';
import { View, Text, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) Alert.alert('Login failed', error.message);
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingTop: 120 }}>
        <Text className="text-3xl font-bold text-gray-900 mb-2">Welcome back</Text>
        <Text className="text-gray-500 mb-10">Sign in to manage your properties</Text>

        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@example.com"
        />
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
        />

        <Button title="Sign In" onPress={handleLogin} loading={loading} />

        <Link href="/(auth)/signup" className="text-center mt-6">
          <Text className="text-brand-600 text-sm">Don't have an account? Sign up</Text>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
```

**Step 4: Write signup screen**

Create `app/(auth)/signup.tsx`:
```typescript
import { useState } from 'react';
import { View, Text, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function SignupScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (!fullName || !email || !password) return;
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: 'landlord', full_name: fullName },
      },
    });
    setLoading(false);
    if (error) Alert.alert('Signup failed', error.message);
    else Alert.alert('Check your email', 'Click the confirmation link to activate your account.');
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingTop: 100 }}>
        <Text className="text-3xl font-bold text-gray-900 mb-2">Get started</Text>
        <Text className="text-gray-500 mb-10">Create your landlord account — free forever for 2 units</Text>

        <Input label="Full name" value={fullName} onChangeText={setFullName} placeholder="Jane Smith" />
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@example.com"
        />
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="8+ characters"
        />

        <Button title="Create Account" onPress={handleSignup} loading={loading} />

        <Link href="/(auth)/login" className="text-center mt-6">
          <Text className="text-brand-600 text-sm">Already have an account? Sign in</Text>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
```

**Step 5: Test in simulator**

```bash
npx expo start --ios
```

Expected: Login and signup screens render, form works, auth redirect fires on successful login

**Step 6: Commit**

```bash
git add app/\(auth\)/ components/ui/Button.tsx components/ui/Input.tsx
git commit -m "feat: add login and signup screens with auth flow"
```

---

## Phase 4: Landlord App Shell

### Task 8: Landlord Tab Layout

**Files:**
- Create: `app/(landlord)/_layout.tsx`
- Create: `app/(landlord)/dashboard.tsx` (stub)
- Create: `app/(landlord)/properties/index.tsx` (stub)
- Create: `app/(landlord)/maintenance/index.tsx` (stub)
- Create: `app/(landlord)/messages/index.tsx` (stub)
- Create: `app/(landlord)/tend.tsx` (stub)

**Step 1: Write tab layout**

Create `app/(landlord)/_layout.tsx`:
```typescript
import { Tabs } from 'expo-router';
import { Home, Building2, Wrench, MessageSquare, Bot } from 'lucide-react-native';

export default function LandlordLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#16a34a',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { borderTopColor: '#f3f4f6' },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{ title: 'Home', tabBarIcon: ({ color }) => <Home size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="properties"
        options={{ title: 'Properties', tabBarIcon: ({ color }) => <Building2 size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="maintenance"
        options={{ title: 'Maintenance', tabBarIcon: ({ color }) => <Wrench size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="messages"
        options={{ title: 'Messages', tabBarIcon: ({ color }) => <MessageSquare size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="tend"
        options={{ title: 'Tend AI', tabBarIcon: ({ color }) => <Bot size={22} color={color} /> }}
      />
    </Tabs>
  );
}
```

Install lucide: `npm install lucide-react-native`

**Step 2: Write stub screens**

Create `app/(landlord)/dashboard.tsx`:
```typescript
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
export default function Dashboard() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-5 pt-4">
        <Text className="text-2xl font-bold text-gray-900">Dashboard</Text>
      </View>
    </SafeAreaView>
  );
}
```

Create identical stubs for:
- `app/(landlord)/properties/index.tsx` — title: "Properties"
- `app/(landlord)/maintenance/index.tsx` — title: "Maintenance"
- `app/(landlord)/messages/index.tsx` — title: "Messages"
- `app/(landlord)/tend.tsx` — title: "Tend AI"

**Step 3: Verify tab bar renders**

```bash
npx expo start --ios
```

Expected: After login, 5-tab bar appears with correct icons and labels

**Step 4: Commit**

```bash
git add app/\(landlord\)/
git commit -m "feat: add landlord tab layout with stub screens"
```

---

## Phase 5: Properties Feature

### Task 9: Properties Store + Hooks

**Files:**
- Create: `store/properties.ts`
- Create: `hooks/useProperties.ts`

**Step 1: Write properties store**

Create `store/properties.ts`:
```typescript
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Property, Unit } from '../types';

interface PropertiesState {
  properties: Property[];
  loading: boolean;
  error: string | null;
  fetchProperties: () => Promise<void>;
  addProperty: (data: Omit<Property, 'id' | 'created_at' | 'units'> ) => Promise<Property | null>;
  addUnit: (propertyId: string, data: Omit<Unit, 'id'>) => Promise<Unit | null>;
}

export const usePropertiesStore = create<PropertiesState>((set, get) => ({
  properties: [],
  loading: false,
  error: null,

  fetchProperties: async () => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from('properties')
      .select('*, units(*)')
      .order('created_at', { ascending: false });
    if (error) set({ error: error.message, loading: false });
    else set({ properties: data as Property[], loading: false });
  },

  addProperty: async (propertyData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from('properties')
      .insert({ ...propertyData, landlord_id: user.id })
      .select()
      .single();
    if (error) { set({ error: error.message }); return null; }
    await get().fetchProperties();
    return data as Property;
  },

  addUnit: async (propertyId, unitData) => {
    const { data, error } = await supabase
      .from('units')
      .insert({ ...unitData, property_id: propertyId })
      .select()
      .single();
    if (error) { set({ error: error.message }); return null; }
    await get().fetchProperties();
    return data as Unit;
  },
}));
```

**Step 2: Commit**

```bash
git add store/properties.ts
git commit -m "feat: add properties zustand store with supabase integration"
```

---

### Task 10: Properties List Screen

**Files:**
- Modify: `app/(landlord)/properties/index.tsx`
- Create: `components/domain/PropertyCard.tsx`
- Create: `app/(landlord)/properties/add.tsx`

**Step 1: Write PropertyCard component**

Create `components/domain/PropertyCard.tsx`:
```typescript
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Building2, ChevronRight } from 'lucide-react-native';
import type { Property } from '../../types';

interface Props { property: Property; }

export function PropertyCard({ property }: Props) {
  const router = useRouter();
  const unitCount = property.units?.length ?? 0;

  return (
    <TouchableOpacity
      className="bg-white rounded-2xl p-4 mb-3 flex-row items-center shadow-sm border border-gray-100"
      onPress={() => router.push(`/(landlord)/properties/${property.id}`)}
    >
      <View className="w-12 h-12 bg-brand-50 rounded-xl items-center justify-center mr-4">
        <Building2 size={22} color="#16a34a" />
      </View>
      <View className="flex-1">
        <Text className="font-semibold text-gray-900 text-base">
          {property.nickname ?? property.address}
        </Text>
        <Text className="text-gray-500 text-sm mt-0.5">
          {property.nickname ? property.address : ''} · {unitCount} {unitCount === 1 ? 'unit' : 'units'}
        </Text>
      </View>
      <ChevronRight size={18} color="#d1d5db" />
    </TouchableOpacity>
  );
}
```

**Step 2: Write properties list screen**

Replace `app/(landlord)/properties/index.tsx`:
```typescript
import { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { usePropertiesStore } from '../../../store/properties';
import { PropertyCard } from '../../../components/domain/PropertyCard';

export default function PropertiesScreen() {
  const router = useRouter();
  const { properties, loading, fetchProperties } = usePropertiesStore();

  useEffect(() => { fetchProperties(); }, []);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-5 pt-4 pb-2 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-gray-900">Properties</Text>
        <TouchableOpacity
          className="bg-brand-600 rounded-xl w-9 h-9 items-center justify-center"
          onPress={() => router.push('/(landlord)/properties/add')}
        >
          <Plus size={20} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={properties}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <PropertyCard property={item} />}
        contentContainerStyle={{ padding: 20 }}
        ListEmptyComponent={
          !loading ? (
            <View className="items-center py-16">
              <Text className="text-gray-400 text-base">No properties yet</Text>
              <Text className="text-gray-300 text-sm mt-1">Tap + to add your first property</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
```

**Step 3: Write add property screen**

Create `app/(landlord)/properties/add.tsx`:
```typescript
import { useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePropertiesStore } from '../../../store/properties';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { dollarsToCents } from '../../../lib/utils';

export default function AddPropertyScreen() {
  const router = useRouter();
  const { addProperty, addUnit } = usePropertiesStore();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [nickname, setNickname] = useState('');
  const [mortgage, setMortgage] = useState('');
  const [unitCount, setUnitCount] = useState('1');
  const [rentAmount, setRentAmount] = useState('');

  async function handleSave() {
    if (!address) { Alert.alert('Address required'); return; }
    setLoading(true);

    const property = await addProperty({
      address,
      nickname: nickname || null,
      mortgage: mortgage ? dollarsToCents(mortgage) : null,
      insurance: null,
      tax_annual: null,
      landlord_id: '', // filled in store
    });

    if (property) {
      const count = parseInt(unitCount) || 1;
      for (let i = 0; i < count; i++) {
        await addUnit(property.id, {
          property_id: property.id,
          unit_number: count === 1 ? '1' : String(i + 1),
          bedrooms: 1,
          bathrooms: 1,
          rent_amount: rentAmount ? dollarsToCents(rentAmount) : 0,
        });
      }
      router.back();
    }
    setLoading(false);
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-5 pt-4">
        <Text className="text-2xl font-bold text-gray-900 mb-6">Add Property</Text>
        <Input label="Street address" value={address} onChangeText={setAddress} placeholder="123 Main St, Austin TX 78701" />
        <Input label="Nickname (optional)" value={nickname} onChangeText={setNickname} placeholder="The duplex" />
        <Input label="Monthly mortgage ($)" value={mortgage} onChangeText={setMortgage} keyboardType="decimal-pad" placeholder="1500" />
        <Input label="Number of units" value={unitCount} onChangeText={setUnitCount} keyboardType="number-pad" placeholder="1" />
        <Input label="Monthly rent per unit ($)" value={rentAmount} onChangeText={setRentAmount} keyboardType="decimal-pad" placeholder="1200" />
        <Button title="Save Property" onPress={handleSave} loading={loading} />
      </ScrollView>
    </SafeAreaView>
  );
}
```

**Step 4: Commit**

```bash
git add app/\(landlord\)/properties/ components/domain/PropertyCard.tsx store/properties.ts
git commit -m "feat: add properties list and add-property screens"
```

---

## Phase 6: Maintenance Pipeline

### Task 11: Maintenance Store + List Screen

**Files:**
- Create: `store/maintenance.ts`
- Modify: `app/(landlord)/maintenance/index.tsx`
- Create: `app/(landlord)/maintenance/[id].tsx`
- Create: `components/domain/MaintenanceBadge.tsx`

**Step 1: Write maintenance store**

Create `store/maintenance.ts`:
```typescript
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { MaintenanceRequest } from '../types';

interface MaintenanceState {
  requests: MaintenanceRequest[];
  loading: boolean;
  fetchRequests: () => Promise<void>;
  updateRequest: (id: string, updates: Partial<MaintenanceRequest>) => Promise<void>;
}

export const useMaintenanceStore = create<MaintenanceState>((set) => ({
  requests: [],
  loading: false,

  fetchRequests: async () => {
    set({ loading: true });
    const { data } = await supabase
      .from('maintenance_requests')
      .select('*, tenant:users(id,full_name,email), unit:units(id,unit_number,property:properties(id,address,nickname)), vendor:vendors(*)')
      .order('created_at', { ascending: false });
    set({ requests: (data ?? []) as MaintenanceRequest[], loading: false });
  },

  updateRequest: async (id, updates) => {
    await supabase.from('maintenance_requests').update(updates).eq('id', id);
    set((state) => ({
      requests: state.requests.map((r) => r.id === id ? { ...r, ...updates } : r),
    }));
  },
}));
```

**Step 2: Write urgency badge component**

Create `components/domain/MaintenanceBadge.tsx`:
```typescript
import { View, Text } from 'react-native';
import type { MaintenanceUrgency, MaintenanceStatus } from '../../types';

const urgencyConfig = {
  emergency: { bg: 'bg-red-100', text: 'text-red-700', label: 'Emergency' },
  urgent: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Urgent' },
  routine: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Routine' },
};

const statusConfig = {
  open: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Open' },
  assigned: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Assigned' },
  resolved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Resolved' },
};

export function UrgencyBadge({ urgency }: { urgency: MaintenanceUrgency }) {
  const c = urgencyConfig[urgency];
  return (
    <View className={`${c.bg} px-2.5 py-0.5 rounded-full`}>
      <Text className={`${c.text} text-xs font-medium`}>{c.label}</Text>
    </View>
  );
}

export function StatusBadge({ status }: { status: MaintenanceStatus }) {
  const c = statusConfig[status];
  return (
    <View className={`${c.bg} px-2.5 py-0.5 rounded-full`}>
      <Text className={`${c.text} text-xs font-medium`}>{c.label}</Text>
    </View>
  );
}
```

**Step 3: Write maintenance list screen**

Replace `app/(landlord)/maintenance/index.tsx`:
```typescript
import { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMaintenanceStore } from '../../../store/maintenance';
import { UrgencyBadge, StatusBadge } from '../../../components/domain/MaintenanceBadge';
import { formatDate } from '../../../lib/utils';

export default function MaintenanceScreen() {
  const router = useRouter();
  const { requests, loading, fetchRequests } = useMaintenanceStore();

  useEffect(() => { fetchRequests(); }, []);

  const open = requests.filter((r) => r.status !== 'resolved');

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-5 pt-4 pb-2">
        <Text className="text-2xl font-bold text-gray-900">Maintenance</Text>
        <Text className="text-gray-500 text-sm mt-1">{open.length} open {open.length === 1 ? 'request' : 'requests'}</Text>
      </View>

      <FlatList
        data={requests}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="bg-white rounded-2xl p-4 mb-3 border border-gray-100 shadow-sm"
            onPress={() => router.push(`/(landlord)/maintenance/${item.id}`)}
          >
            <View className="flex-row items-start justify-between mb-2">
              <Text className="font-semibold text-gray-900 flex-1 mr-2">{item.title}</Text>
              <UrgencyBadge urgency={item.urgency} />
            </View>
            <Text className="text-gray-500 text-sm mb-3" numberOfLines={2}>{item.description}</Text>
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-400 text-xs">{item.tenant?.full_name} · Unit {item.unit?.unit_number}</Text>
              <StatusBadge status={item.status} />
            </View>
            <Text className="text-gray-300 text-xs mt-2">{formatDate(item.created_at)}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !loading ? (
            <View className="items-center py-16">
              <Text className="text-gray-400 text-base">No maintenance requests</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
```

**Step 4: Commit**

```bash
git add store/maintenance.ts app/\(landlord\)/maintenance/ components/domain/MaintenanceBadge.tsx
git commit -m "feat: add maintenance request list with urgency and status badges"
```

---

## Phase 7: Messaging

### Task 12: Messages Store + Thread Screen

**Files:**
- Create: `store/messages.ts`
- Modify: `app/(landlord)/messages/index.tsx`
- Create: `app/(landlord)/messages/[threadId].tsx`

**Step 1: Write messages store with realtime**

Create `store/messages.ts`:
```typescript
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Message, Lease } from '../types';

interface MessagesState {
  threads: Lease[];
  messages: Record<string, Message[]>;
  loadingThreads: boolean;
  fetchThreads: () => Promise<void>;
  fetchMessages: (leaseId: string) => Promise<void>;
  sendMessage: (leaseId: string, body: string, aiDrafted?: boolean) => Promise<void>;
  subscribeToMessages: (leaseId: string) => () => void;
}

export const useMessagesStore = create<MessagesState>((set, get) => ({
  threads: [],
  messages: {},
  loadingThreads: false,

  fetchThreads: async () => {
    set({ loadingThreads: true });
    const { data } = await supabase
      .from('leases')
      .select('*, tenant:users(id,full_name,email), unit:units(id,unit_number,property:properties(id,address,nickname))')
      .eq('status', 'active');
    set({ threads: (data ?? []) as Lease[], loadingThreads: false });
  },

  fetchMessages: async (leaseId) => {
    const { data } = await supabase
      .from('messages')
      .select('*, sender:users(id,full_name,role)')
      .eq('lease_id', leaseId)
      .order('created_at', { ascending: true });
    set((state) => ({ messages: { ...state.messages, [leaseId]: (data ?? []) as Message[] } }));
  },

  sendMessage: async (leaseId, body, aiDrafted = false) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('messages').insert({
      lease_id: leaseId,
      sender_id: user.id,
      body,
      ai_drafted: aiDrafted,
    });
  },

  subscribeToMessages: (leaseId) => {
    const channel = supabase
      .channel(`messages:${leaseId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `lease_id=eq.${leaseId}`,
      }, (payload) => {
        set((state) => ({
          messages: {
            ...state.messages,
            [leaseId]: [...(state.messages[leaseId] ?? []), payload.new as Message],
          },
        }));
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  },
}));
```

**Step 2: Write message thread screen**

Create `app/(landlord)/messages/[threadId].tsx`:
```typescript
import { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Send, Sparkles } from 'lucide-react-native';
import { useMessagesStore } from '../../../store/messages';
import { useAuthStore } from '../../../store/auth';

export default function MessageThreadScreen() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const { user } = useAuthStore();
  const { messages, fetchMessages, sendMessage, subscribeToMessages } = useMessagesStore();
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  const threadMessages = messages[threadId] ?? [];

  useEffect(() => {
    fetchMessages(threadId);
    const unsubscribe = subscribeToMessages(threadId);
    return unsubscribe;
  }, [threadId]);

  useEffect(() => {
    if (threadMessages.length > 0) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [threadMessages.length]);

  async function handleSend(text: string, aiDrafted = false) {
    if (!text.trim()) return;
    setSending(true);
    setBody('');
    await sendMessage(threadId, text, aiDrafted);
    setSending(false);
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <FlatList
          ref={listRef}
          data={threadMessages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => {
            const isMe = item.sender_id === user?.id;
            return (
              <View className={`mb-3 max-w-xs ${isMe ? 'self-end' : 'self-start'}`}>
                {item.ai_drafted && (
                  <View className="flex-row items-center mb-1">
                    <Sparkles size={10} color="#16a34a" />
                    <Text className="text-brand-600 text-xs ml-1">AI drafted</Text>
                  </View>
                )}
                <View className={`px-4 py-3 rounded-2xl ${isMe ? 'bg-brand-600' : 'bg-white border border-gray-100'}`}>
                  <Text className={isMe ? 'text-white' : 'text-gray-900'}>{item.body}</Text>
                </View>
              </View>
            );
          }}
        />

        <View className="px-4 pb-4 flex-row items-end gap-2">
          <TextInput
            className="flex-1 bg-white border border-gray-200 rounded-2xl px-4 py-3 text-base max-h-32"
            placeholder="Message..."
            value={body}
            onChangeText={setBody}
            multiline
          />
          <TouchableOpacity
            className="bg-brand-600 w-11 h-11 rounded-xl items-center justify-center"
            onPress={() => handleSend(body)}
            disabled={sending || !body.trim()}
          >
            <Send size={18} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
```

**Step 3: Commit**

```bash
git add store/messages.ts app/\(landlord\)/messages/
git commit -m "feat: add realtime messaging with thread view"
```

---

## Phase 8: AI Features (Supabase Edge Functions)

### Task 13: Maintenance Triage Edge Function

**Files:**
- Create: `supabase/functions/triage/index.ts`

**Step 1: Write triage function**

Create `supabase/functions/triage/index.ts`:
```typescript
import Anthropic from 'npm:@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });

Deno.serve(async (req) => {
  const { title, description } = await req.json();

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 256,
    messages: [{
      role: 'user',
      content: `You are a property maintenance triage assistant. Given a maintenance request, return ONLY a JSON object with two fields:
- urgency: "emergency" | "urgent" | "routine"
- trade: "plumbing" | "electrical" | "hvac" | "general"

Maintenance request title: "${title}"
Description: "${description}"

Rules:
- emergency: No heat in winter, flooding, gas leak, no hot water, security issue
- urgent: Appliance failure, pest issue, minor leak
- routine: Cosmetic issues, non-critical repairs

Respond with only the JSON, no explanation.`,
    }],
  });

  const text = (message.content[0] as { text: string }).text;
  const result = JSON.parse(text);

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

**Step 2: Write Tend assistant edge function**

Create `supabase/functions/tend/index.ts`:
```typescript
import Anthropic from 'npm:@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });

Deno.serve(async (req) => {
  const { messages, portfolioContext } = await req.json();

  const systemPrompt = `You are Tend, an AI assistant for independent landlords. You help with:
- Landlord-tenant law questions (state-specific when context is provided)
- Maintenance troubleshooting and vendor guidance
- Financial calculations (ROI, cap rate, cash flow)
- Drafting professional communications

Portfolio context:
${portfolioContext}

IMPORTANT: You are not a lawyer. For legal questions, always provide an informed starting point and remind the user to verify with a local attorney or their state's landlord-tenant resource. Never give definitive legal advice.`;

  const stream = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages,
    stream: true,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          controller.enqueue(encoder.encode(event.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
});
```

**Step 3: Write message draft edge function**

Create `supabase/functions/draft-message/index.ts`:
```typescript
import Anthropic from 'npm:@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });

Deno.serve(async (req) => {
  const { scenario, tenantName, propertyAddress, landlordName } = await req.json();

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `Draft a professional landlord message for the following scenario.
Landlord: ${landlordName}
Tenant: ${tenantName}
Property: ${propertyAddress}
Scenario: ${scenario}

Write only the message body. Be professional, clear, and empathetic. Do not include a subject line.`,
    }],
  });

  const draft = (message.content[0] as { text: string }).text;
  return new Response(JSON.stringify({ draft }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

**Step 4: Set edge function secrets in Supabase**

In Supabase dashboard → Edge Functions → Secrets:
```
ANTHROPIC_API_KEY = your_key
```

Or via CLI:
```bash
npx supabase secrets set ANTHROPIC_API_KEY=your_key
```

**Step 5: Deploy edge functions**

```bash
npx supabase functions deploy triage
npx supabase functions deploy tend
npx supabase functions deploy draft-message
```

**Step 6: Commit**

```bash
git add supabase/functions/
git commit -m "feat: add AI edge functions for triage, tend assistant, and message drafting"
```

---

### Task 14: Tend AI Screen

**Files:**
- Modify: `app/(landlord)/tend.tsx`
- Create: `lib/claude.ts`

**Step 1: Write claude lib helper**

Create `lib/claude.ts`:
```typescript
import { supabase } from './supabase';

export async function callTriage(title: string, description: string) {
  const { data, error } = await supabase.functions.invoke('triage', {
    body: { title, description },
  });
  if (error) throw error;
  return data as { urgency: string; trade: string };
}

export async function callDraftMessage(
  scenario: string,
  tenantName: string,
  propertyAddress: string,
  landlordName: string
) {
  const { data, error } = await supabase.functions.invoke('draft-message', {
    body: { scenario, tenantName, propertyAddress, landlordName },
  });
  if (error) throw error;
  return (data as { draft: string }).draft;
}
```

**Step 2: Write Tend chat screen**

Replace `app/(landlord)/tend.tsx`:
```typescript
import { useState, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { usePropertiesStore } from '../../store/properties';
import { useAuthStore } from '../../store/auth';

interface ChatMessage { role: 'user' | 'assistant'; content: string; }

export default function TendScreen() {
  const { user } = useAuthStore();
  const { properties } = usePropertiesStore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Hi! I'm Tend, your property management assistant. Ask me about rent, maintenance, tenant law, or anything landlord-related." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList>(null);

  const portfolioContext = `Landlord: ${user?.full_name}. Properties: ${
    properties.map((p) => `${p.nickname ?? p.address} (${p.units?.length ?? 0} units)`).join(', ')
  }`;

  async function handleSend() {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('tend', {
        body: {
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          portfolioContext,
        },
      });
      if (!error && data) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I ran into an issue. Please try again.' }]);
    }
    setLoading(false);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-5 pt-4 pb-3 border-b border-gray-100 bg-white">
        <Text className="text-xl font-bold text-gray-900">Tend AI</Text>
        <Text className="text-gray-400 text-xs mt-0.5">Not legal advice · Always verify with a local attorney</Text>
      </View>

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View className={`mb-4 max-w-sm ${item.role === 'user' ? 'self-end' : 'self-start'}`}>
              <View className={`px-4 py-3 rounded-2xl ${item.role === 'user' ? 'bg-brand-600' : 'bg-white border border-gray-100'}`}>
                <Text className={item.role === 'user' ? 'text-white' : 'text-gray-800'}>{item.content}</Text>
              </View>
            </View>
          )}
          ListFooterComponent={loading ? <ActivityIndicator color="#16a34a" className="mt-2" /> : null}
        />

        <View className="px-4 pb-4 flex-row items-end gap-2">
          <TextInput
            className="flex-1 bg-white border border-gray-200 rounded-2xl px-4 py-3 text-base max-h-32"
            placeholder="Ask Tend anything..."
            value={input}
            onChangeText={setInput}
            multiline
          />
          <TouchableOpacity
            className="bg-brand-600 w-11 h-11 rounded-xl items-center justify-center"
            onPress={handleSend}
            disabled={loading || !input.trim()}
          >
            <Send size={18} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
```

**Step 3: Commit**

```bash
git add app/\(landlord\)/tend.tsx lib/claude.ts
git commit -m "feat: add Tend AI chat screen with streaming edge function"
```

---

## Phase 9: Stripe Subscriptions

### Task 15: Stripe Webhook Edge Function

**Files:**
- Create: `supabase/functions/stripe-webhook/index.ts`

**Step 1: Write webhook handler**

Create `supabase/functions/stripe-webhook/index.ts`:
```typescript
import Stripe from 'npm:stripe';
import { createClient } from 'npm:@supabase/supabase-js';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', { apiVersion: '2024-11-20.acacia' });
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

Deno.serve(async (req) => {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') ?? '';
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }

  const sub = event.data.object as Stripe.Subscription;

  if (['customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted'].includes(event.type)) {
    const customerId = sub.customer as string;
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (user) {
      const priceId = sub.items.data[0]?.price.id;
      const plan = priceId?.includes('annual') ? 'annual' : priceId?.includes('standard') ? 'standard' : 'starter';

      await supabase.from('subscriptions').upsert({
        landlord_id: user.id,
        stripe_subscription_id: sub.id,
        plan,
        status: sub.status === 'active' ? 'active' : sub.status === 'past_due' ? 'past_due' : 'canceled',
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      }, { onConflict: 'landlord_id' });
    }
  }

  return new Response('ok');
});
```

**Step 2: Set secrets and deploy**

```bash
npx supabase secrets set STRIPE_SECRET_KEY=your_key STRIPE_WEBHOOK_SECRET=your_secret
npx supabase functions deploy stripe-webhook
```

In Stripe dashboard → Webhooks → add endpoint: `https://[project].supabase.co/functions/v1/stripe-webhook`
Events to listen for: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`

**Step 3: Commit**

```bash
git add supabase/functions/stripe-webhook/
git commit -m "feat: add stripe webhook handler for subscription sync"
```

---

### Task 16: Subscription Gate + Upgrade Flow

**Files:**
- Create: `hooks/useSubscription.ts`
- Create: `components/ui/PaywallGate.tsx`

**Step 1: Write subscription hook**

Create `hooks/useSubscription.ts`:
```typescript
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Subscription } from '../types';

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('subscriptions')
      .select('*')
      .single()
      .then(({ data }) => {
        setSubscription(data as Subscription);
        setLoading(false);
      });
  }, []);

  const isPaid = subscription?.plan !== 'starter' && subscription?.status === 'active';
  const unitCount = subscription?.unit_count ?? 0;
  const atFreeLimit = !isPaid && unitCount >= 2;

  return { subscription, loading, isPaid, unitCount, atFreeLimit };
}
```

**Step 2: Write paywall gate component**

Create `components/ui/PaywallGate.tsx`:
```typescript
import { View, Text } from 'react-native';
import { Button } from './Button';

interface Props {
  children: React.ReactNode;
  feature: string;
  onUpgrade: () => void;
  locked: boolean;
}

export function PaywallGate({ children, feature, onUpgrade, locked }: Props) {
  if (!locked) return <>{children}</>;

  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <Text className="text-4xl mb-4">🔒</Text>
      <Text className="text-xl font-bold text-gray-900 text-center mb-2">Upgrade to unlock</Text>
      <Text className="text-gray-500 text-center mb-8">{feature} is included in the Standard plan — $9/unit/month</Text>
      <Button title="View Plans" onPress={onUpgrade} />
    </View>
  );
}
```

**Step 3: Commit**

```bash
git add hooks/useSubscription.ts components/ui/PaywallGate.tsx
git commit -m "feat: add subscription hook and paywall gate component"
```

---

## Phase 10: Dashboard

### Task 17: Dashboard Screen

**Files:**
- Modify: `app/(landlord)/dashboard.tsx`

**Step 1: Write full dashboard**

Replace `app/(landlord)/dashboard.tsx`:
```typescript
import { useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/auth';
import { usePropertiesStore } from '../../store/properties';
import { useMaintenanceStore } from '../../store/maintenance';
import { formatCents } from '../../lib/utils';

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const { properties, fetchProperties } = usePropertiesStore();
  const { requests, fetchRequests } = useMaintenanceStore();

  useEffect(() => {
    fetchProperties();
    fetchRequests();
  }, []);

  const totalUnits = properties.reduce((sum, p) => sum + (p.units?.length ?? 0), 0);
  const monthlyRent = properties.reduce((sum, p) =>
    sum + (p.units?.reduce((s, u) => s + u.rent_amount, 0) ?? 0), 0
  );
  const openRequests = requests.filter((r) => r.status !== 'resolved').length;
  const emergencies = requests.filter((r) => r.urgency === 'emergency' && r.status !== 'resolved').length;

  const firstName = user?.full_name?.split(' ')[0] ?? 'there';

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text className="text-2xl font-bold text-gray-900 mb-1">Hi, {firstName}</Text>
        <Text className="text-gray-500 mb-6">Here's your portfolio today</Text>

        {/* Stats row */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <Text className="text-3xl font-bold text-gray-900">{totalUnits}</Text>
            <Text className="text-gray-500 text-sm mt-1">Total units</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <Text className="text-3xl font-bold text-brand-600">{formatCents(monthlyRent)}</Text>
            <Text className="text-gray-500 text-sm mt-1">Monthly rent</Text>
          </View>
        </View>

        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <Text className="text-3xl font-bold text-gray-900">{openRequests}</Text>
            <Text className="text-gray-500 text-sm mt-1">Open requests</Text>
          </View>
          {emergencies > 0 && (
            <View className="flex-1 bg-red-50 rounded-2xl p-4 border border-red-100 shadow-sm">
              <Text className="text-3xl font-bold text-red-600">{emergencies}</Text>
              <Text className="text-red-500 text-sm mt-1">Emergencies</Text>
            </View>
          )}
        </View>

        {/* Properties summary */}
        <Text className="text-lg font-semibold text-gray-900 mb-3">Your properties</Text>
        {properties.map((p) => (
          <View key={p.id} className="bg-white rounded-2xl p-4 mb-3 border border-gray-100 shadow-sm">
            <Text className="font-semibold text-gray-900">{p.nickname ?? p.address}</Text>
            <Text className="text-gray-500 text-sm mt-0.5">{p.units?.length ?? 0} units</Text>
          </View>
        ))}

        {properties.length === 0 && (
          <View className="items-center py-8">
            <Text className="text-gray-400">Add your first property to get started</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
```

**Step 2: Commit**

```bash
git add app/\(landlord\)/dashboard.tsx
git commit -m "feat: add dashboard with portfolio stats and property summary"
```

---

## Phase 11: Tenant App

### Task 18: Tenant Screens

**Files:**
- Create: `app/(tenant)/_layout.tsx`
- Create: `app/(tenant)/pay.tsx`
- Create: `app/(tenant)/maintenance.tsx`
- Create: `app/(tenant)/messages.tsx`

**Step 1: Write tenant layout**

Create `app/(tenant)/_layout.tsx`:
```typescript
import { Tabs } from 'expo-router';
import { CreditCard, Wrench, MessageSquare } from 'lucide-react-native';

export default function TenantLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#16a34a' }}>
      <Tabs.Screen name="pay" options={{ title: 'Pay Rent', tabBarIcon: ({ color }) => <CreditCard size={22} color={color} /> }} />
      <Tabs.Screen name="maintenance" options={{ title: 'Requests', tabBarIcon: ({ color }) => <Wrench size={22} color={color} /> }} />
      <Tabs.Screen name="messages" options={{ title: 'Messages', tabBarIcon: ({ color }) => <MessageSquare size={22} color={color} /> }} />
    </Tabs>
  );
}
```

**Step 2: Write tenant maintenance submission screen**

Create `app/(tenant)/maintenance.tsx`:
```typescript
import { useState } from 'react';
import { View, Text, ScrollView, Alert, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { callTriage } from '../../lib/claude';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/auth';

export default function TenantMaintenanceScreen() {
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled) {
      setPhotos((prev) => [...prev, result.assets[0].uri]);
    }
  }

  async function handleSubmit() {
    if (!title || !description) { Alert.alert('Please fill in title and description'); return; }
    setSubmitting(true);

    // Get active lease for this tenant
    const { data: lease } = await supabase
      .from('leases')
      .select('unit_id')
      .eq('tenant_id', user!.id)
      .eq('status', 'active')
      .single();

    if (!lease) { Alert.alert('No active lease found'); setSubmitting(false); return; }

    // AI triage
    let urgency = 'routine', trade = 'general';
    try {
      const triage = await callTriage(title, description);
      urgency = triage.urgency;
      trade = triage.trade;
    } catch { /* use defaults */ }

    // Upload photos
    const photoUrls: string[] = [];
    for (const uri of photos) {
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
      const { data } = await supabase.storage.from('documents').upload(fileName, { uri, type: 'image/jpeg' } as any);
      if (data) {
        const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(data.path);
        photoUrls.push(publicUrl);
      }
    }

    await supabase.from('maintenance_requests').insert({
      unit_id: lease.unit_id,
      tenant_id: user!.id,
      title,
      description,
      photo_urls: photoUrls,
      urgency,
      trade,
    });

    Alert.alert('Submitted', `Your ${urgency} request has been sent to your landlord.`);
    setTitle(''); setDescription(''); setPhotos([]);
    setSubmitting(false);
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-5 pt-4">
        <Text className="text-2xl font-bold text-gray-900 mb-6">Submit Request</Text>
        <Input label="What's the issue?" value={title} onChangeText={setTitle} placeholder="Leaking faucet" />
        <Input label="Describe the problem" value={description} onChangeText={setDescription} multiline placeholder="The kitchen faucet has been dripping constantly for 2 days..." />

        <TouchableOpacity className="border-2 border-dashed border-gray-200 rounded-2xl p-4 items-center mb-6" onPress={pickPhoto}>
          <Camera size={24} color="#9ca3af" />
          <Text className="text-gray-400 mt-2">Add photos</Text>
        </TouchableOpacity>

        {photos.length > 0 && (
          <View className="flex-row flex-wrap gap-2 mb-4">
            {photos.map((uri, i) => (
              <Image key={i} source={{ uri }} className="w-20 h-20 rounded-xl" />
            ))}
          </View>
        )}

        <Button title="Submit Request" onPress={handleSubmit} loading={submitting} />
      </ScrollView>
    </SafeAreaView>
  );
}
```

**Step 3: Commit**

```bash
git add app/\(tenant\)/
git commit -m "feat: add tenant app with maintenance submission and AI triage"
```

---

## Phase 12: Financials Screen

### Task 19: Financials + ROI Screen

**Files:**
- Modify: `app/(landlord)/financials/index.tsx`

**Step 1: Write financials screen**

Create `app/(landlord)/financials/index.tsx`:
```typescript
import { useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePropertiesStore } from '../../../store/properties';
import { formatCents } from '../../../lib/utils';

export default function FinancialsScreen() {
  const { properties, fetchProperties } = usePropertiesStore();

  useEffect(() => { fetchProperties(); }, []);

  const totalMonthlyRent = properties.reduce((sum, p) =>
    sum + (p.units?.reduce((s, u) => s + u.rent_amount, 0) ?? 0), 0
  );
  const totalMonthlyExpenses = properties.reduce((sum, p) =>
    sum + (p.mortgage ?? 0) + Math.round((p.insurance ?? 0) / 12) + Math.round((p.tax_annual ?? 0) / 12), 0
  );
  const monthlyNOI = totalMonthlyRent - totalMonthlyExpenses;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text className="text-2xl font-bold text-gray-900 mb-6">Financials</Text>

        {/* Portfolio summary */}
        <View className="bg-white rounded-2xl p-5 mb-4 border border-gray-100 shadow-sm">
          <Text className="font-semibold text-gray-700 mb-4">Portfolio Monthly</Text>
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-500">Gross rent</Text>
            <Text className="font-medium text-gray-900">{formatCents(totalMonthlyRent)}</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-500">Expenses (est.)</Text>
            <Text className="font-medium text-red-500">-{formatCents(totalMonthlyExpenses)}</Text>
          </View>
          <View className="h-px bg-gray-100 my-3" />
          <View className="flex-row justify-between">
            <Text className="font-semibold text-gray-900">Net operating income</Text>
            <Text className={`font-bold text-lg ${monthlyNOI >= 0 ? 'text-brand-600' : 'text-red-600'}`}>
              {formatCents(monthlyNOI)}
            </Text>
          </View>
        </View>

        {/* Per-property breakdown */}
        {properties.map((p) => {
          const rent = p.units?.reduce((s, u) => s + u.rent_amount, 0) ?? 0;
          const expenses = (p.mortgage ?? 0) + Math.round((p.insurance ?? 0) / 12) + Math.round((p.tax_annual ?? 0) / 12);
          const noi = rent - expenses;
          const annualNOI = noi * 12;

          return (
            <View key={p.id} className="bg-white rounded-2xl p-5 mb-3 border border-gray-100 shadow-sm">
              <Text className="font-semibold text-gray-900 mb-4">{p.nickname ?? p.address}</Text>
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-500">Monthly rent</Text>
                <Text className="font-medium">{formatCents(rent)}</Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-500">Monthly expenses</Text>
                <Text className="font-medium text-red-500">-{formatCents(expenses)}</Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-500">Monthly NOI</Text>
                <Text className={`font-semibold ${noi >= 0 ? 'text-brand-600' : 'text-red-600'}`}>{formatCents(noi)}</Text>
              </View>
              <View className="h-px bg-gray-100 my-2" />
              <Text className="text-gray-400 text-xs">Annual NOI: {formatCents(annualNOI)}</Text>
              {p.mortgage && (
                <Text className="text-gray-400 text-xs mt-1">
                  Cap rate requires property value — ask Tend AI to calculate
                </Text>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
```

**Step 2: Commit**

```bash
git add app/\(landlord\)/financials/
git commit -m "feat: add financials screen with per-property NOI breakdown"
```

---

## Phase 13: EAS + App Store Prep

### Task 20: EAS Configuration + Build

**Files:**
- Create: `eas.json`

**Step 1: Configure EAS**

```bash
eas login
eas build:configure
```

Replace generated `eas.json` with:
```json
{
  "cli": { "version": ">= 12.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": { "simulator": false }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your@apple.id",
        "ascAppIdentifier": "your_app_store_connect_id"
      }
    }
  }
}
```

**Step 2: Add environment variables to EAS**

```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "your_value"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your_value"
eas secret:create --scope project --name EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY --value "your_value"
```

**Step 3: Run iOS simulator build first**

```bash
eas build --platform ios --profile preview --local
```

Expected: Build succeeds, .ipa generated

**Step 4: Submit to TestFlight when ready**

```bash
eas submit --platform ios --profile production
```

**Step 5: Commit**

```bash
git add eas.json
git commit -m "feat: add EAS build configuration for iOS"
```

---

## Done — Checklist Before TestFlight

- [ ] Auth: Login, signup, and redirect work end-to-end
- [ ] Properties: Add property, add unit, view list
- [ ] Maintenance: Tenant submits, AI triage fires, landlord sees queue
- [ ] Messages: Realtime thread between landlord and tenant
- [ ] Financials: NOI calculated correctly for at least one property
- [ ] Tend AI: Chat responds with portfolio context
- [ ] Stripe: Checkout session opens, webhook updates subscription table
- [ ] Paywall: Free tier correctly blocks at 3+ units
- [ ] EAS: Production build succeeds
- [ ] TestFlight: Internal testers can install and use the app

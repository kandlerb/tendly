# Tendly — Technical Design Document
**Date:** 2026-02-18
**Status:** Approved
**Product Brief:** `App_Product_Brief.md`

---

## Overview

Tendly is a mobile-first property management app for independent landlords managing 2–20 rental units. This document covers the technical architecture, project structure, database schema, and integration design for the initial iOS build.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Tendly App (Expo)                   │
│         iOS · Android · Web (one codebase)           │
│                                                      │
│  Expo Router     NativeWind     Zustand              │
│  (navigation)    (styling)      (state)              │
└────────────────────┬────────────────────────────────┘
                     │
         ┌───────────┼───────────┐
         ▼           ▼           ▼
    Supabase       Stripe    Claude API
    ─────────      ──────    ──────────
    Auth           Subs      "Tend" AI
    PostgreSQL     Payments  assistant
    Storage        Billing   drafting
    Realtime       portal    triage
```

| Layer | Tool | Purpose |
|---|---|---|
| Mobile/Web | Expo + React Native | Single codebase for iOS, Android, Web |
| Navigation | Expo Router | File-based routing |
| Styling | NativeWind | Tailwind CSS for React Native |
| State | Zustand | Lightweight global state management |
| Auth + DB | Supabase | User auth, PostgreSQL, file storage, realtime |
| Payments | Stripe | Subscriptions, ACH/card processing |
| AI | Claude API | "Tend" assistant, message drafting, maintenance triage |
| CI/CD | EAS | Builds, OTA updates, App Store submission |

---

## Project Structure

```
tendly/
├── app/                        # Expo Router — every file = a screen
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (landlord)/             # Protected landlord screens
│   │   ├── _layout.tsx         # Tab bar
│   │   ├── dashboard.tsx       # Portfolio overview + rent status
│   │   ├── properties/
│   │   │   ├── index.tsx
│   │   │   └── [id]/
│   │   │       ├── index.tsx
│   │   │       └── unit/[unitId].tsx
│   │   ├── maintenance/
│   │   │   ├── index.tsx
│   │   │   └── [id].tsx
│   │   ├── messages/
│   │   │   ├── index.tsx
│   │   │   └── [threadId].tsx
│   │   ├── documents/index.tsx
│   │   ├── financials/index.tsx
│   │   └── tend.tsx            # AI assistant chat
│   └── (tenant)/               # Tenant-facing screens
│       ├── pay.tsx
│       ├── maintenance.tsx
│       └── messages.tsx
│
├── components/
│   ├── ui/                     # Buttons, cards, inputs, modals
│   └── domain/                 # PropertyCard, MaintenanceBadge, etc.
│
├── lib/
│   ├── supabase.ts
│   ├── stripe.ts
│   └── claude.ts
│
├── hooks/
├── store/
├── types/
└── supabase/
    ├── migrations/
    └── functions/              # Edge functions (webhooks, AI calls)
```

---

## Database Schema

```sql
users
  id, email, role (landlord | tenant), full_name,
  stripe_customer_id, created_at

properties
  id, landlord_id → users, address, nickname,
  mortgage, insurance, tax_annual, created_at

units
  id, property_id → properties, unit_number,
  bedrooms, bathrooms, rent_amount

leases
  id, unit_id → units, tenant_id → users,
  start_date, end_date, rent_amount,
  deposit_amount, document_url, status

rent_payments
  id, lease_id → leases, amount, due_date,
  paid_at, method (ach | card | manual),
  stripe_payment_intent_id, status

maintenance_requests
  id, unit_id → units, tenant_id → users,
  title, description, photo_urls[],
  urgency (emergency | urgent | routine),
  trade (plumbing | electrical | hvac | general),
  status (open | assigned | resolved),
  vendor_id → vendors, created_at

vendors
  id, landlord_id → users, name, trade,
  phone, email, notes

messages
  id, lease_id → leases, sender_id → users,
  body, ai_drafted (bool), created_at

documents
  id, property_id → properties, unit_id (nullable),
  name, type (lease | receipt | photo | insurance),
  storage_url, created_at

subscriptions
  id, landlord_id → users, stripe_subscription_id,
  plan (standard | annual), unit_count,
  status, current_period_end
```

**Key decisions:**
- All monetary values stored in cents (integers) — no floating point
- Row Level Security on all tables — enforced at the DB layer, not just app layer
- `ai_drafted` flag on messages for future analytics
- `vendors` are per-landlord

---

## Payments (Stripe)

- Signup → Supabase creates user → Stripe creates customer
- Upgrade → Stripe Checkout session, metered by unit count
- Webhook → Supabase Edge Function → updates `subscriptions` table
- Free tier gate: `unit_count > 2` with no active subscription blocks premium features
- Annual vs monthly handled by Stripe products/prices

| Tier | Price | Gate |
|---|---|---|
| Starter | Free | ≤ 2 units, core features |
| Standard | $9/unit/month | All features, AI included |
| Annual | $7/unit/month | Same as Standard, billed annually |

---

## AI Integration (Claude API)

All Claude API calls go through **Supabase Edge Functions** — never directly from the client. API key stays server-side; rate limiting enforced per subscription tier.

| Feature | Trigger | Output |
|---|---|---|
| Maintenance triage | Tenant submits request | Urgency + trade category auto-filled |
| Message drafting | Landlord taps "Draft with AI" | Editable message pre-filled from context |
| Tend assistant | Conversational chat | Answers using portfolio context + state law awareness |

Tend system prompt includes: landlord's portfolio summary, tenant list, current financials, state-specific context, and a clear legal disclaimer on all law-related responses.

---

## Platform Priority

1. **iOS** — launch target
2. **Web** — fast follow (Expo web, same codebase)
3. **Android** — v2 after product-market fit

---

## Summary

Single TypeScript codebase (Expo + React Native) targeting iOS first. Supabase handles all backend concerns at launch — auth, database, storage, realtime, and edge functions. Stripe manages subscriptions. Claude API powers AI features server-side. No rewrite required to expand to web or Android.

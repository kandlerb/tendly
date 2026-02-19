import { Platform } from 'react-native';

export const colors = {
  brand: {
    50: '#f0fdf4',
    100: '#dcfce7',
    600: '#16a34a',
    700: '#15803d',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  red: { 50: '#fef2f2', 100: '#fee2e2', 400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c' },
  orange: { 100: '#ffedd5', 700: '#c2410c' },
  yellow: { 100: '#fef9c3', 700: '#a16207' },
  blue: { 100: '#dbeafe', 700: '#1d4ed8' },
  purple: { 100: '#f3e8ff', 700: '#7e22ce' },
  green: { 100: '#dcfce7', 700: '#15803d' },
  white: '#ffffff',
};

export const text = {
  // ── Numeric scale (Tailwind-style, kept for backward compat) ──────────
  xs:    12,
  sm:    14,
  base:  16,
  lg:    18,
  xl:    20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  // ── Semantic roles — use these in components ──────────────────────────
  caption:    12,  // badges, metadata, tiny hints
  secondary:  14,  // form labels, supporting descriptions, sub-info
  body:       16,  // primary body copy, card content, inputs, buttons
  subheading: 18,  // section headers within a page, emphasized values
  heading:    20,  // modal/detail screen headers, sidebar brand
  pageTitle:  24,  // top-level screen title
  statNum:    30,  // large dashboard statistics
  heroTitle:  30,  // large heading on auth/landing screens ("Welcome back")
  display:    36,  // hero display numbers (e.g. pending payment amount)
};

export const radius = {
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
};

// Spacing scale — use these instead of hardcoded numbers
export const spacing = {
  pagePad:      20,  // horizontal page padding (mobile)
  pagePadWide:  24,  // horizontal page padding (desktop)
  cardPad:      20,  // padding inside every content card
  cardGap:      16,  // gap / marginBottom between cards
  cardInnerGap: 12,  // gap between elements within a card
} as const;

// Base page header — spread into every screen's header StyleSheet definition
// Apply paddingHorizontal inline (it's responsive: hPad = isWide ? 24 : 20)
export const headerBase = {
  backgroundColor: '#ffffff',
  borderBottomWidth: 1,
  borderBottomColor: '#f3f4f6',  // colors.gray[100]
  paddingTop:    20,
  paddingBottom: 16,
};

// Base card appearance — spread into every StyleSheet card definition
// alongside ...shadow.sm and any layout overrides (flex, flexDirection, etc.)
export const cardBase = {
  backgroundColor: '#ffffff',   // colors.white (avoid circular ref)
  borderRadius:    20,           // radius['2xl']
  borderWidth:     1,
  borderColor:     '#f3f4f6',   // colors.gray[100]
};

export const shadow = {
  sm: Platform.select({
    web: { boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
  }) as object,
};

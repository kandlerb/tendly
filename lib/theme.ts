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
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
};

export const radius = {
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
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

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

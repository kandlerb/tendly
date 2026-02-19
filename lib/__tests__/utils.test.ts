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

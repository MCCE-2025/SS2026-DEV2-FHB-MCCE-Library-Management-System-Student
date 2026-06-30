import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  calculateFee,
  dueDate,
  DAILY_RATE,
  LOAN_DAYS,
  MAX_FEE,
} from '../../src/fees.js';

describe('constants', () => {
  it('exposes the business rule constants', () => {
    expect(DAILY_RATE).toBe(0.5);
    expect(MAX_FEE).toBe(20);
    expect(LOAN_DAYS).toBe(14);
  });
});

describe('dueDate()', () => {
  it('adds exactly 14 calendar days to the borrow date', () => {
    expect(dueDate('2024-06-01')).toBe('2024-06-15');
  });

  it('rolls over to the next month', () => {
    expect(dueDate('2024-01-20')).toBe('2024-02-03');
  });

  it('rolls over to the next year', () => {
    expect(dueDate('2024-12-25')).toBe('2025-01-08');
  });

  it('handles leap-day borrow dates', () => {
    expect(dueDate('2024-02-15')).toBe('2024-02-29');
  });

  it('handles month-end borrow dates', () => {
    expect(dueDate('2024-01-31')).toBe('2024-02-14');
  });

  it('keeps due date in the same month when possible', () => {
    expect(dueDate('2024-03-01')).toBe('2024-03-15');
  });

  it('returns an ISO date string (YYYY-MM-DD)', () => {
    expect(dueDate('2024-06-01')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('calculateFee() — on time (no fee)', () => {
  const due = '2024-06-15';

  it('returns 0 when returned on the due date', () => {
    expect(calculateFee('2024-06-01', due, '2024-06-15')).toBe(0);
  });

  it('returns 0 when returned before the due date', () => {
    expect(calculateFee('2024-06-01', due, '2024-06-10')).toBe(0);
  });

  it('returns 0 when returned one day before due (boundary)', () => {
    expect(calculateFee('2024-06-01', due, '2024-06-14')).toBe(0);
  });

  it('returns 0 when return date equals due date after borrow on day 0', () => {
    expect(calculateFee('2024-06-01', dueDate('2024-06-01'), '2024-06-15')).toBe(0);
  });
});

describe('calculateFee() — overdue (linear €0.50/day)', () => {
  const due = '2024-06-15';

  it('charges €0.50 for the first overdue day', () => {
    expect(calculateFee('2024-06-01', due, '2024-06-16')).toBe(0.5);
  });

  it('charges €1.00 for two overdue days', () => {
    expect(calculateFee('2024-06-01', due, '2024-06-17')).toBe(1);
  });

  it('charges €5.00 for ten overdue days', () => {
    expect(calculateFee('2024-06-01', due, '2024-06-25')).toBe(5);
  });

  it('charges €9.50 for nineteen overdue days', () => {
    expect(calculateFee('2024-06-01', due, '2024-07-04')).toBe(9.5);
  });

  it('rounds fee to two decimal places', () => {
    expect(calculateFee('2024-06-01', due, '2024-06-17')).toBe(1);
    expect(Number.isInteger(calculateFee('2024-06-01', due, '2024-06-17') * 100)).toBe(true);
  });
});

describe('calculateFee() — maximum fee cap (€20.00)', () => {
  const due = '2024-01-01';

  it('charges €19.50 for thirty-nine overdue days', () => {
    expect(calculateFee('2023-12-01', due, '2024-02-09')).toBe(19.5);
  });

  it('reaches exactly €20.00 at forty overdue days', () => {
    expect(calculateFee('2023-12-01', due, '2024-02-10')).toBe(20);
  });

  it('stays capped at €20.00 beyond forty overdue days', () => {
    expect(calculateFee('2023-12-01', due, '2024-03-01')).toBe(20);
  });

  it('stays capped at €20.00 for very long overdue periods', () => {
    expect(calculateFee('2023-12-01', due, '2025-01-01')).toBe(20);
  });
});

describe('calculateFee() — active loan (no return date)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-02-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses today when returnDate is null', () => {
    // due 2024-01-15 → 2024-02-01 = 17 days late → €8.50
    expect(calculateFee('2024-01-01', '2024-01-15', null)).toBe(8.5);
  });

  it('uses today when returnDate is undefined', () => {
    expect(calculateFee('2024-01-01', '2024-01-15', undefined)).toBe(8.5);
  });

  it('returns 0 for an active loan not yet overdue', () => {
    vi.setSystemTime(new Date('2024-01-10T12:00:00Z'));
    expect(calculateFee('2024-01-01', '2024-01-15', null)).toBe(0);
  });
});

describe('calculateFee() — midnight boundary (00:00 UTC)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not mis-count overdue days when the clock hits 00:00 UTC', () => {
    // Due 2024-06-15: at 00:00 on the due date still €0; one second past midnight
    // on the next calendar day must be exactly one overdue day (€0.50), not €0 or €1.00.
    vi.setSystemTime(new Date('2024-06-15T00:00:00.000Z'));
    expect(calculateFee('2024-06-01', '2024-06-15', null)).toBe(0);

    vi.setSystemTime(new Date('2024-06-16T00:00:00.000Z'));
    expect(calculateFee('2024-06-01', '2024-06-15', null)).toBe(0.5);
  });
});

describe('calculateFee() — frozen fee after return', () => {
  it('does not change when a fixed return date is supplied', () => {
    const borrow = '2024-06-01';
    const due = dueDate(borrow);
    const returned = '2024-06-20';

    expect(calculateFee(borrow, due, returned)).toBe(2.5);
    expect(calculateFee(borrow, due, returned)).toBe(2.5);
  });
});

describe('negative cases', () => {
  it('dueDate() throws for an invalid borrow date', () => {
    expect(() => dueDate('not-a-date')).toThrow(RangeError);
  });

  it('calculateFee() returns NaN when dueDate is invalid', () => {
    expect(calculateFee('2024-06-01', 'invalid-due', '2024-06-20')).toBeNaN();
  });
});

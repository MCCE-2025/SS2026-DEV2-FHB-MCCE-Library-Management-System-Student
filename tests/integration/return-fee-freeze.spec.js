import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { seedMemberBook, insertLoan } = require('../fixtures/loans');
const { getApp, initTestApp, resetDb } = require('../helpers/testApp.cjs');

beforeAll(async () => {
  await initTestApp();
});

beforeEach(() => {
  resetDb();
  seedMemberBook();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2024-06-20T12:00:00.000Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('POST /api/loans/:id/return — fee calculation and freeze', () => {
  it('calculates fee on return and keeps it frozen on later fee checks', async () => {
    const loanId = insertLoan({
      borrowDate: '2024-06-01',
      dueDate: '2024-06-01',
    });

    const returnRes = await request(getApp()).post(`/api/loans/${loanId}/return`);

    expect(returnRes.status).toBe(200);
    expect(returnRes.body.status).toBe('returned');
    expect(returnRes.body.returnDate).toBe('2024-06-20');
    expect(returnRes.body.fee).toBe(9.5);

    vi.setSystemTime(new Date('2025-01-01T12:00:00.000Z'));

    const feeRes = await request(getApp()).get(`/api/loans/${loanId}/fee`);
    expect(feeRes.body.fee).toBe(9.5);
  });

  it('returns 409 when the loan was already returned', async () => {
    const loanId = insertLoan({
      borrowDate: '2024-05-01',
      dueDate: '2024-05-15',
      returnDate: '2024-05-20',
      status: 'returned',
      fee: 2.5,
    });

    const res = await request(getApp()).post(`/api/loans/${loanId}/return`);

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Loan already returned');
  });

  it('returns 404 when returning a missing loan', async () => {
    const res = await request(getApp()).post('/api/loans/99999/return');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Loan not found');
  });
});

describe('POST /api/loans — borrow flow', () => {
  it('creates a loan with due date 14 days after borrow', async () => {
    vi.setSystemTime(new Date('2024-06-01T10:00:00.000Z'));

    const res = await request(getApp())
      .post('/api/loans')
      .send({ bookId: 1, memberId: 1 });

    expect(res.status).toBe(201);
    expect(res.body.borrowDate).toBe('2024-06-01');
    expect(res.body.dueDate).toBe('2024-06-15');
    expect(res.body.status).toBe('active');
  });
});

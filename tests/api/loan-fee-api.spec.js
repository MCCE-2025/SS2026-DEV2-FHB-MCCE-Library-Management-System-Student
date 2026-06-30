import { createRequire } from 'node:module';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

const require = createRequire(import.meta.url);
const { calculateFee } = require('../../src/fees');
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

describe('GET /api/loans/:id/fee', () => {
  it('returns fee 0 for an active loan not yet overdue', async () => {
    const loanId = insertLoan({
      borrowDate: '2024-06-01',
      dueDate: '2024-06-25',
    });

    const res = await request(getApp()).get(`/api/loans/${loanId}/fee`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      loanId,
      fee: 0,
      dueDate: '2024-06-25',
      status: 'active',
    });
  });

  it('returns accrued fee for an active overdue loan', async () => {
    const loanId = insertLoan({
      borrowDate: '2024-06-01',
      dueDate: '2024-06-01',
    });

    const res = await request(getApp()).get(`/api/loans/${loanId}/fee`);

    expect(res.status).toBe(200);
    expect(res.body.fee).toBe(9.5);
    expect(res.body.status).toBe('active');
  });

  it('returns frozen fee for a returned loan', async () => {
    const loanId = insertLoan({
      borrowDate: '2024-05-01',
      dueDate: '2024-05-15',
      returnDate: '2024-05-20',
      status: 'returned',
      fee: 2.5,
    });

    const res = await request(getApp()).get(`/api/loans/${loanId}/fee`);

    expect(res.status).toBe(200);
    expect(res.body.fee).toBe(2.5);
    expect(res.body.status).toBe('returned');
  });

  it('returns 404 when the loan does not exist', async () => {
    const res = await request(getApp()).get('/api/loans/99999/fee');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Loan not found');
  });
});

describe('GET /api/reports/loans/overdue', () => {
  it('lists overdue active loans with accruedFee', async () => {
    const overdueDue = '2024-01-01';
    insertLoan({ borrowDate: '2023-12-01', dueDate: overdueDue });
    insertLoan({ borrowDate: '2024-06-01', dueDate: '2099-06-15' });
    insertLoan({
      borrowDate: '2024-04-01',
      dueDate: '2024-04-01',
      returnDate: '2024-04-10',
      status: 'returned',
      fee: 4.5,
    });

    const res = await request(getApp()).get('/api/reports/loans/overdue');
    const today = new Date().toISOString().slice(0, 10);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].accruedFee).toBe(
      calculateFee('2023-12-01', overdueDue, today)
    );
    expect(res.body[0].status).toBe('active');
  });

  it('returns an empty array when no loans are overdue', async () => {
    insertLoan({ borrowDate: '2024-06-10', dueDate: '2099-06-24' });

    const res = await request(getApp()).get('/api/reports/loans/overdue');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

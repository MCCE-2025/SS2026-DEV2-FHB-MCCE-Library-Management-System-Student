const { test, expect } = require('@playwright/test');

test.describe('Loans and late fees', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Loans', exact: true }).click();
    await expect(page.getByRole('heading', { name: /Loans \(\d+\)/ })).toBeVisible();
  });

  test('displays seeded loans in the table', async ({ page }) => {
    const rows = page.locator('table tbody tr');
    await expect(rows.first()).toBeVisible();
    await expect(rows).not.toHaveCount(0);
  });

  test('shows accrued fee on overdue loan detail', async ({ page }) => {
    const overdueRow = page.locator('table tbody tr').filter({
      has: page.locator('.badge.overdue'),
    }).first();
    await expect(overdueRow).toBeVisible();
    await overdueRow.click();

    await expect(page.getByRole('heading', { name: /Loan #\d+/ })).toBeVisible();
    await expect(page.getByText('Accrued fee (today)')).toBeVisible();
    await expect(page.getByText(/€\d+\.\d{2}/).first()).toBeVisible();
  });

  test('returns an active on-time loan from detail view', async ({ page }) => {
    const activeRow = page.locator('table tbody tr').filter({
      has: page.locator('.badge.active'),
    }).first();
    await expect(activeRow).toBeVisible();
    await activeRow.click();

    await page.getByRole('button', { name: 'Return Book' }).click();
    await expect(page.getByText(/Returned\. Fee charged: €/)).toBeVisible();
    await expect(page.locator('.badge.returned')).toBeVisible();
  });

  test('borrows a book via the loans form', async ({ page, request }) => {
    const books = await (await request.get('/api/books')).json();
    const members = await (await request.get('/api/members')).json();

    const book = books.find(b => b.availableCopies > 0);
    const member = members.find(m => m.status === 'active');
    expect(book).toBeTruthy();
    expect(member).toBeTruthy();

    await page.getByPlaceholder('Book ID').fill(String(book.id));
    await page.getByPlaceholder('Member ID').fill(String(member.id));
    await page.getByRole('button', { name: 'Borrow' }).click();

    await expect(page.getByText(/Loan created \(ID \d+\), due/)).toBeVisible();
  });
});

test.describe('Overdue report', () => {
  test('loads overdue loans with accrued fees', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Reports', exact: true }).click();
    await page.getByRole('button', { name: 'Load Overdue' }).click();

    const rows = page.locator('table tbody tr');
    await expect(rows.first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Accrued Fee' })).toBeVisible();
    await expect(page.getByText(/€\d+\.\d{2}/).first()).toBeVisible();
  });

  test('navigates from overdue report row to loan detail', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Reports', exact: true }).click();
    await page.getByRole('button', { name: 'Load Overdue' }).click();

    await page.locator('table tbody tr').first().click();
    await expect(page.getByRole('heading', { name: /Loan #\d+/ })).toBeVisible();
    await expect(page.getByText('Accrued fee (today)')).toBeVisible();
  });
});

const { test, expect } = require('@playwright/test');

test.describe('Library UI smoke', () => {
  test('loads homepage with books tab active', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header h1')).toContainText('Library Management System');
    await expect(page.getByRole('button', { name: 'Books', exact: true })).toHaveClass(/active/);
    await expect(page.getByRole('heading', { name: /All Books \(\d+\)/ })).toBeVisible();
  });

  test('navigates between main tabs', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Loans', exact: true }).click();
    await expect(page.getByRole('heading', { name: /Loans \(\d+\)/ })).toBeVisible();

    await page.getByRole('button', { name: 'Reports', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Member History & Stats' })).toBeVisible();

    await page.getByRole('button', { name: 'ℹ Info', exact: true }).click();
    await expect(page.locator('h1.info-title')).toContainText('Library Management System');
  });

  test('links to Swagger API docs', async ({ page }) => {
    await page.goto('/');
    const docsLink = page.getByRole('link', { name: /Swagger API Docs/ });
    await expect(docsLink).toHaveAttribute('href', '/api-docs');
  });
});

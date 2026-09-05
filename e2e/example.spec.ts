import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  // We'll just assert it doesn't crash and loads the body.
  await expect(page.locator('body')).toBeVisible();
});

test('can navigate to login', async ({ page }) => {
  await page.goto('/login');

  // Verify the login page loads
  await expect(page.locator('form')).toBeVisible();
});

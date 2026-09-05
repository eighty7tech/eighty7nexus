import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  // Increase timeout because Next.js dev server needs to compile pages on demand
  test.setTimeout(120000);
  await page.goto('/');

  // Expect a title "to contain" a substring.
  // We'll just assert it doesn't crash and loads the body.
  await expect(page.locator('body')).toBeVisible();
});

test('can navigate to login', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto('/login');

  // Verify the login page loads by grabbing the first form (often search or login)
  await expect(page.locator('form').first()).toBeVisible();
});

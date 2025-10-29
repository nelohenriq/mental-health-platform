import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should allow user to sign up and sign in', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Should redirect to login since not authenticated
    await expect(page).toHaveURL(/.*login/);

    // Click register link
    await page.click('text=Create Account');

    // Fill registration form
    await page.fill('input[id="email"]', 'test@example.com');
    await page.fill('input[id="password"]', 'password123');
    await page.fill('input[id="confirmPassword"]', 'password123');

    // Submit registration
    await page.click('button[type="submit"]');

    // Should redirect to dashboard after registration
    await expect(page).toHaveURL(/.*dashboard/);

    // Sign out
    await page.click('button:has-text("Sign Out")');

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);

    // Sign back in
    await page.fill('input[id="email"]', 'test@example.com');
    await page.fill('input[id="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should be back on dashboard
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');

    // Try to login with wrong credentials
    await page.fill('input[id="email"]', 'wrong@example.com');
    await page.fill('input[id="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('should protect authenticated routes', async ({ page }) => {
    // Try to access dashboard without authentication
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
  });
});
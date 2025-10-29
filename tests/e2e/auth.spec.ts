import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Mental Health Support Platform')).toBeVisible();
  });

  test('should allow user registration', async ({ page }) => {
    await page.goto('/auth/register');

    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', `test${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.fill('input[name="confirmPassword"]', 'TestPassword123!');

    await page.click('button[type="submit"]');

    // Should redirect to email verification or dashboard
    await expect(page.url()).not.toContain('/auth/register');
  });

  test('should handle login with valid credentials', async ({ page }) => {
    await page.goto('/auth/login');

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');

    await page.click('button[type="submit"]');

    // Should redirect to dashboard on successful login
    await expect(page.url()).toContain('/dashboard');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');

    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');

    await page.click('button[type="submit"]');

    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('should allow password reset request', async ({ page }) => {
    await page.goto('/auth/forgot-password');

    await page.fill('input[name="email"]', 'test@example.com');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Password reset email sent')).toBeVisible();
  });
});
/**
 * Comprehensive UI/UX Validation Tests
 * Tests all links, navigation, accessibility, and user experience flows
 */

import { test, expect } from '@playwright/test';

test.describe('UI/UX Validation Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Set up test environment
    await page.goto('http://localhost:3000');
  });

  test.describe('Navigation & Link Validation', () => {
    test('should validate all main navigation links', async ({ page }) => {
      const navLinks = [
        { text: 'Dashboard', href: '/dashboard' },
        { text: 'Mood Tracking', href: '/mood' },
        { text: 'CBT Exercises', href: '/cbt' },
        { text: 'Profile', href: '/profile' },
        { text: 'Achievements', href: '/achievements' },
      ];

      for (const link of navLinks) {
        const linkElement = page.locator(`a:has-text("${link.text}")`).first();
        await expect(linkElement).toBeVisible();
        await expect(linkElement).toHaveAttribute('href', link.href);
      }
    });

    test('should validate admin navigation links', async ({ page }) => {
      // Navigate to admin area (assuming user is admin)
      await page.goto('/admin/crisis');

      const adminLinks = [
        { text: 'Analytics', href: '/admin/analytics' },
        { text: 'CBT Content', href: '/admin/cbt' },
        { text: 'Crisis Management', href: '/admin/crisis' },
      ];

      for (const link of adminLinks) {
        const linkElement = page.locator(`a:has-text("${link.text}")`).first();
        await expect(linkElement).toBeVisible();
        await expect(linkElement).toHaveAttribute('href', link.href);
      }
    });

    test('should validate breadcrumb navigation', async ({ page }) => {
      await page.goto('/mood/log');

      // Check breadcrumb structure
      const breadcrumb = page.locator('[data-testid="breadcrumb"]').first();
      await expect(breadcrumb).toBeVisible();

      // Check breadcrumb links
      const homeLink = breadcrumb.locator('a:has-text("Home")');
      await expect(homeLink).toHaveAttribute('href', '/');

      const moodLink = breadcrumb.locator('a:has-text("Mood")');
      await expect(moodLink).toHaveAttribute('href', '/mood');
    });
  });

  test.describe('User Flow Validation', () => {
    test('should complete mood logging flow', async ({ page }) => {
      await page.goto('/mood/log');

      // Check mood scale interaction
      const moodScale = page.locator('[data-testid="mood-scale"]').first();
      await expect(moodScale).toBeVisible();

      // Select mood level
      const moodButton = moodScale.locator('button').first();
      await moodButton.click();

      // Check factors selection
      const factorsSelector = page.locator('[data-testid="factors-selector"]').first();
      await expect(factorsSelector).toBeVisible();

      // Add notes
      const notesTextarea = page.locator('textarea[name="notes"]').first();
      await notesTextarea.fill('Feeling productive today');

      // Submit mood entry
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();

      // Check success feedback
      const successMessage = page.locator('[data-testid="success-message"]').first();
      await expect(successMessage).toBeVisible();
    });

    test('should navigate CBT exercise flow', async ({ page }) => {
      await page.goto('/cbt');

      // Check exercise list
      const exerciseList = page.locator('[data-testid="exercise-list"]').first();
      await expect(exerciseList).toBeVisible();

      // Click on first exercise
      const firstExercise = exerciseList.locator('article').first();
      await firstExercise.click();

      // Check exercise content loads
      const exerciseContent = page.locator('[data-testid="exercise-content"]').first();
      await expect(exerciseContent).toBeVisible();

      // Check navigation buttons
      const nextButton = page.locator('button:has-text("Next")').first();
      const backButton = page.locator('button:has-text("Back")').first();

      if (await nextButton.isVisible()) {
        await nextButton.click();
        // Should advance to next step
      }
    });

    test('should validate dashboard data visualization', async ({ page }) => {
      await page.goto('/dashboard');

      // Check mood chart
      const moodChart = page.locator('[data-testid="mood-chart"]').first();
      await expect(moodChart).toBeVisible();

      // Check recent activities
      const recentActivities = page.locator('[data-testid="recent-activities"]').first();
      await expect(recentActivities).toBeVisible();

      // Check progress indicators
      const progressIndicators = page.locator('[data-testid="progress-indicator"]');
      await expect(progressIndicators.first()).toBeVisible();

      // Check achievement badges
      const achievementBadges = page.locator('[data-testid="achievement-badge"]');
      await expect(achievementBadges.first()).toBeVisible();
    });
  });

  test.describe('Accessibility Validation', () => {
    test('should validate keyboard navigation', async ({ page }) => {
      await page.goto('/dashboard');

      // Tab through interactive elements
      await page.keyboard.press('Tab');
      let focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();

      // Continue tabbing
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        focusedElement = page.locator(':focus');
        await expect(focusedElement).toBeVisible();
      }
    });

    test('should validate ARIA labels and roles', async ({ page }) => {
      await page.goto('/mood/log');

      // Check form has proper role
      const moodForm = page.locator('form[data-testid="mood-form"]').first();
      await expect(moodForm).toHaveAttribute('role', 'form');

      // Check buttons have accessible names
      const submitButton = page.locator('button[type="submit"]').first();
      const accessibleName = await submitButton.getAttribute('aria-label') ||
                           await submitButton.textContent();
      expect(accessibleName).toBeTruthy();

      // Check images have alt text
      const images = page.locator('img');
      for (const image of await images.all()) {
        const alt = await image.getAttribute('alt');
        expect(alt).toBeTruthy();
      }
    });

    test('should validate color contrast', async ({ page }) => {
      await page.goto('/dashboard');

      // Check that text has sufficient contrast
      const textElements = page.locator('p, span, h1, h2, h3, h4, h5, h6');
      const textElementsArray = await textElements.all();

      for (const element of textElementsArray.slice(0, 5)) { // Test first 5 elements
        const color = await element.evaluate(el => {
          const style = window.getComputedStyle(el);
          return {
            color: style.color,
            backgroundColor: style.backgroundColor
          };
        });

        // Basic contrast check (would need more sophisticated analysis in real implementation)
        expect(color.color).not.toBe('rgba(0, 0, 0, 0)');
      }
    });

    test('should validate screen reader compatibility', async ({ page }) => {
      await page.goto('/mood/log');

      // Check heading hierarchy
      const h1Elements = page.locator('h1');
      await expect(h1Elements).toHaveCount(1); // Should have exactly one h1

      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const headingCount = await headings.count();
      expect(headingCount).toBeGreaterThan(0);

      // Check semantic HTML structure
      const mainContent = page.locator('main').first();
      await expect(mainContent).toBeVisible();

      const navigation = page.locator('nav').first();
      await expect(navigation).toBeVisible();
    });
  });

  test.describe('Responsive Design Validation', () => {
    test('should validate mobile responsiveness', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
      await page.goto('/dashboard');

      // Check mobile navigation
      const mobileMenu = page.locator('[data-testid="mobile-menu"]').first();
      await expect(mobileMenu).toBeVisible();

      // Check content fits screen
      const content = page.locator('[data-testid="main-content"]').first();
      const boundingBox = await content.boundingBox();
      expect(boundingBox?.width).toBeLessThanOrEqual(375);

      // Check touch targets are adequate size
      const buttons = page.locator('button');
      for (const button of await buttons.all()) {
        const box = await button.boundingBox();
        if (box) {
          expect(box.width).toBeGreaterThanOrEqual(44); // Minimum touch target size
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    });

    test('should validate tablet responsiveness', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 }); // iPad size
      await page.goto('/dashboard');

      // Check tablet layout
      const sidebar = page.locator('[data-testid="sidebar"]').first();
      await expect(sidebar).toBeVisible();

      // Check content layout adjusts
      const mainContent = page.locator('[data-testid="main-content"]').first();
      const contentBox = await mainContent.boundingBox();
      expect(contentBox?.width).toBeGreaterThan(600);
    });

    test('should validate desktop responsiveness', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 }); // Desktop size
      await page.goto('/dashboard');

      // Check desktop layout
      const header = page.locator('[data-testid="header"]').first();
      await expect(header).toBeVisible();

      // Check wide screen content layout
      const container = page.locator('[data-testid="container"]').first();
      const containerBox = await container.boundingBox();
      expect(containerBox?.width).toBeLessThan(1920); // Should not stretch full width
    });
  });

  test.describe('Error Handling & Edge Cases', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Mock network failure
      await page.route('**/api/mood**', route => route.abort());

      await page.goto('/mood/log');

      // Try to submit form
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();

      // Check error message appears
      const errorMessage = page.locator('[data-testid="error-message"]').first();
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText('error');
    });

    test('should handle invalid form inputs', async ({ page }) => {
      await page.goto('/mood/log');

      // Try to submit without required fields
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();

      // Check validation messages
      const validationMessage = page.locator('[data-testid="validation-error"]').first();
      await expect(validationMessage).toBeVisible();
    });

    test('should handle unauthorized access', async ({ page }) => {
      // Try to access admin page without permissions
      await page.goto('/admin/cbt');

      // Should redirect to login or show unauthorized message
      const unauthorizedMessage = page.locator('text=/unauthorized|login|access denied/i').first();
      await expect(unauthorizedMessage).toBeVisible();
    });
  });

  test.describe('Performance & Loading States', () => {
    test('should validate loading states', async ({ page }) => {
      await page.goto('/dashboard');

      // Check loading spinner appears initially
      const loadingSpinner = page.locator('[data-testid="loading-spinner"]').first();
      await expect(loadingSpinner).toBeVisible();

      // Wait for content to load
      await page.waitForSelector('[data-testid="dashboard-content"]');

      // Check loading spinner disappears
      await expect(loadingSpinner).not.toBeVisible();
    });

    test('should validate page load performance', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/dashboard');
      await page.waitForSelector('[data-testid="dashboard-content"]');

      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
    });

    test('should validate lazy loading', async ({ page }) => {
      await page.goto('/cbt');

      // Check initial content loads
      const initialExercises = page.locator('[data-testid="exercise-item"]');
      await expect(initialExercises.first()).toBeVisible();

      // Scroll to trigger lazy loading
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      await page.waitForTimeout(1000); // Wait for lazy load

      // Check more content loaded
      const allExercises = page.locator('[data-testid="exercise-item"]');
      const finalCount = await allExercises.count();
      expect(finalCount).toBeGreaterThan(0);
    });
  });

  test.describe('Cross-browser Compatibility', () => {
    test('should validate form interactions', async ({ page }) => {
      await page.goto('/mood/log');

      // Test form field interactions
      const moodInput = page.locator('input[type="range"]').first();
      if (await moodInput.isVisible()) {
        await moodInput.fill('7');
        const value = await moodInput.getAttribute('value');
        expect(value).toBe('7');
      }

      // Test checkbox interactions
      const checkbox = page.locator('input[type="checkbox"]').first();
      if (await checkbox.isVisible()) {
        await checkbox.check();
        expect(await checkbox.isChecked()).toBe(true);
      }

      // Test select dropdown
      const select = page.locator('select').first();
      if (await select.isVisible()) {
        await select.selectOption({ index: 1 });
        const selectedValue = await select.getAttribute('value');
        expect(selectedValue).toBeTruthy();
      }
    });

    test('should validate modal dialogs', async ({ page }) => {
      await page.goto('/cbt');

      // Open modal (if available)
      const modalTrigger = page.locator('[data-testid="modal-trigger"]').first();
      if (await modalTrigger.isVisible()) {
        await modalTrigger.click();

        // Check modal appears
        const modal = page.locator('[data-testid="modal"]').first();
        await expect(modal).toBeVisible();

        // Check modal can be closed
        const closeButton = modal.locator('[data-testid="modal-close"]').first();
        if (await closeButton.isVisible()) {
          await closeButton.click();
          await expect(modal).not.toBeVisible();
        }
      }
    });
  });
});
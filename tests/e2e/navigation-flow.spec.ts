/**
 * Navigation Flow Tests
 * Tests complete user journeys and navigation patterns
 */

import { test, expect } from '@playwright/test';

test.describe('Navigation Flow Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test.describe('User Onboarding Flow', () => {
    test('should complete new user onboarding journey', async ({ page }) => {
      // Assume user is not onboarded and gets redirected to onboarding
      await page.goto('/onboarding');

      // Step 1: Welcome screen
      const welcomeTitle = page.locator('h1:has-text("Welcome")').first();
      await expect(welcomeTitle).toBeVisible();

      const nextButton = page.locator('button:has-text("Next")').first();
      await nextButton.click();

      // Step 2: Privacy settings
      const privacyTitle = page.locator('h1:has-text("Privacy")').first();
      await expect(privacyTitle).toBeVisible();

      // Set privacy preferences
      const privacyToggle = page.locator('[data-testid="privacy-toggle"]').first();
      if (await privacyToggle.isVisible()) {
        await privacyToggle.click();
      }

      await nextButton.click();

      // Step 3: Initial mood assessment
      const moodTitle = page.locator('h1:has-text("How are you feeling")').first();
      await expect(moodTitle).toBeVisible();

      // Select initial mood
      const moodSelector = page.locator('[data-testid="initial-mood-selector"]').first();
      if (await moodSelector.isVisible()) {
        const moodOption = moodSelector.locator('button').first();
        await moodOption.click();
      }

      await nextButton.click();

      // Step 4: Goals and preferences
      const goalsTitle = page.locator('h1:has-text("Goals")').first();
      await expect(goalsTitle).toBeVisible();

      // Select goals
      const goalCheckboxes = page.locator('[data-testid="goal-checkbox"]');
      const checkboxCount = await goalCheckboxes.count();
      if (checkboxCount > 0) {
        await goalCheckboxes.first().check();
      }

      const completeButton = page.locator('button:has-text("Complete")').first();
      await completeButton.click();

      // Should redirect to dashboard
      await expect(page.url()).toBe('http://localhost:3000/dashboard');
    });
  });

  test.describe('Mood Tracking Flow', () => {
    test('should complete full mood logging workflow', async ({ page }) => {
      // Start from dashboard
      await page.goto('/dashboard');

      // Click log mood button
      const logMoodButton = page.locator('[data-testid="log-mood-button"]').first();
      await logMoodButton.click();

      // Should navigate to mood logging page
      await expect(page.url()).toBe('http://localhost:3000/mood/log');

      // Fill mood form
      const moodScale = page.locator('[data-testid="mood-scale"]').first();
      await expect(moodScale).toBeVisible();

      // Select mood level (assuming 1-10 scale)
      const moodButton = moodScale.locator('button[value="7"]').first();
      if (await moodButton.isVisible()) {
        await moodButton.click();
      }

      // Select mood factors
      const factorButtons = page.locator('[data-testid="mood-factor"]');
      if (await factorButtons.first().isVisible()) {
        await factorButtons.first().click();
      }

      // Add notes
      const notesField = page.locator('textarea[name="notes"]').first();
      await notesField.fill('Feeling productive and focused today');

      // Submit mood entry
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();

      // Should show success message
      const successMessage = page.locator('[data-testid="success-message"]').first();
      await expect(successMessage).toBeVisible();

      // Should redirect back to dashboard or mood history
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/dashboard|\/mood/);
    });

    test('should navigate through mood history', async ({ page }) => {
      await page.goto('/mood');

      // Check mood history list
      const moodEntries = page.locator('[data-testid="mood-entry"]');
      const entryCount = await moodEntries.count();

      if (entryCount > 0) {
        // Click on first mood entry
        await moodEntries.first().click();

        // Should show mood detail view
        const moodDetail = page.locator('[data-testid="mood-detail"]').first();
        await expect(moodDetail).toBeVisible();

        // Test edit functionality
        const editButton = page.locator('button:has-text("Edit")').first();
        if (await editButton.isVisible()) {
          await editButton.click();

          // Should show edit form
          const editForm = page.locator('[data-testid="mood-edit-form"]').first();
          await expect(editForm).toBeVisible();

          // Cancel edit
          const cancelButton = page.locator('button:has-text("Cancel")').first();
          await cancelButton.click();
        }
      }
    });
  });

  test.describe('CBT Exercise Flow', () => {
    test('should complete CBT exercise workflow', async ({ page }) => {
      await page.goto('/cbt');

      // Select exercise category
      const categoryTabs = page.locator('[data-testid="category-tab"]');
      if (await categoryTabs.first().isVisible()) {
        await categoryTabs.first().click();
      }

      // Select specific exercise
      const exerciseCards = page.locator('[data-testid="exercise-card"]');
      const exerciseCount = await exerciseCards.count();

      if (exerciseCount > 0) {
        await exerciseCards.first().click();

        // Should show exercise detail
        const exerciseDetail = page.locator('[data-testid="exercise-detail"]').first();
        await expect(exerciseDetail).toBeVisible();

        // Start exercise
        const startButton = page.locator('button:has-text("Start")').first();
        if (await startButton.isVisible()) {
          await startButton.click();

          // Should show exercise content
          const exerciseContent = page.locator('[data-testid="exercise-content"]').first();
          await expect(exerciseContent).toBeVisible();

          // Navigate through exercise steps
          const nextButtons = page.locator('button:has-text("Next")');
          const nextButtonCount = await nextButtons.count();

          for (let i = 0; i < Math.min(nextButtonCount, 3); i++) {
            await nextButtons.nth(i).click();
            await page.waitForTimeout(500);
          }

          // Complete exercise
          const completeButton = page.locator('button:has-text("Complete")').first();
          if (await completeButton.isVisible()) {
            await completeButton.click();

            // Should show completion screen
            const completionScreen = page.locator('[data-testid="exercise-complete"]').first();
            await expect(completionScreen).toBeVisible();
          }
        }
      }
    });

    test('should navigate CBT progress tracking', async ({ page }) => {
      await page.goto('/cbt');

      // Check progress indicators
      const progressIndicators = page.locator('[data-testid="progress-indicator"]');
      await expect(progressIndicators.first()).toBeVisible();

      // Navigate to sessions
      const sessionsLink = page.locator('a[href*="session"]').first();
      if (await sessionsLink.isVisible()) {
        await sessionsLink.click();

        // Should show session history
        const sessionList = page.locator('[data-testid="session-list"]').first();
        await expect(sessionList).toBeVisible();
      }
    });
  });

  test.describe('Profile Management Flow', () => {
    test('should complete profile update workflow', async ({ page }) => {
      await page.goto('/profile');

      // Click edit profile
      const editButton = page.locator('button:has-text("Edit Profile")').first();
      if (await editButton.isVisible()) {
        await editButton.click();

        // Should show edit form
        const editForm = page.locator('[data-testid="profile-edit-form"]').first();
        await expect(editForm).toBeVisible();

        // Update profile fields
        const nameField = page.locator('input[name="name"]').first();
        if (await nameField.isVisible()) {
          await nameField.fill('Updated Name');
        }

        // Save changes
        const saveButton = page.locator('button[type="submit"]').first();
        await saveButton.click();

        // Should show success message
        const successMessage = page.locator('[data-testid="success-message"]').first();
        await expect(successMessage).toBeVisible();
      }
    });

    test('should navigate privacy settings', async ({ page }) => {
      await page.goto('/profile');

      // Click privacy settings
      const privacyLink = page.locator('a[href*="privacy"]').first();
      if (await privacyLink.isVisible()) {
        await privacyLink.click();

        // Should show privacy settings
        const privacySettings = page.locator('[data-testid="privacy-settings"]').first();
        await expect(privacySettings).toBeVisible();

        // Test privacy toggles
        const privacyToggles = page.locator('[data-testid="privacy-toggle"]');
        const toggleCount = await privacyToggles.count();

        for (let i = 0; i < Math.min(toggleCount, 2); i++) {
          await privacyToggles.nth(i).click();
        }

        // Save settings
        const saveButton = page.locator('button:has-text("Save")').first();
        if (await saveButton.isVisible()) {
          await saveButton.click();
        }
      }
    });
  });

  test.describe('Achievement System Flow', () => {
    test('should navigate achievement system', async ({ page }) => {
      await page.goto('/achievements');

      // Check achievement categories
      const achievementCategories = page.locator('[data-testid="achievement-category"]');
      await expect(achievementCategories.first()).toBeVisible();

      // Check individual achievements
      const achievements = page.locator('[data-testid="achievement-item"]');
      const achievementCount = await achievements.count();

      if (achievementCount > 0) {
        // Click on achievement
        await achievements.first().click();

        // Should show achievement detail
        const achievementDetail = page.locator('[data-testid="achievement-detail"]').first();
        await expect(achievementDetail).toBeVisible();
      }

      // Check progress tracking
      const progressBars = page.locator('[data-testid="achievement-progress"]');
      await expect(progressBars.first()).toBeVisible();
    });
  });

  test.describe('Error Recovery Flows', () => {
    test('should handle 404 errors gracefully', async ({ page }) => {
      await page.goto('/non-existent-page');

      // Should show 404 page
      const errorTitle = page.locator('h1:has-text("404")').first();
      await expect(errorTitle).toBeVisible();

      // Should have navigation options
      const homeLink = page.locator('a:has-text("Home")').first();
      await expect(homeLink).toBeVisible();

      // Click home link
      await homeLink.click();
      await expect(page.url()).toBe('http://localhost:3000/');
    });

    test('should handle network errors', async ({ page }) => {
      // Mock network failure
      await page.route('**/api/**', route => route.abort());

      await page.goto('/dashboard');

      // Should show error state
      const errorState = page.locator('[data-testid="error-state"]').first();
      await expect(errorState).toBeVisible();

      // Should have retry option
      const retryButton = page.locator('button:has-text("Retry")').first();
      if (await retryButton.isVisible()) {
        await retryButton.click();
      }
    });

    test('should handle authentication redirects', async ({ page }) => {
      // Try to access protected route without auth
      await page.goto('/admin/crisis');

      // Should redirect to login or show unauthorized
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/login|\/unauthorized|\/admin/);

      if (currentUrl.includes('/login')) {
        // Should show login form
        const loginForm = page.locator('[data-testid="login-form"]').first();
        await expect(loginForm).toBeVisible();
      }
    });
  });

  test.describe('Mobile Navigation Flows', () => {
    test('should validate mobile navigation', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/dashboard');

      // Open mobile menu
      const menuButton = page.locator('[data-testid="mobile-menu-button"]').first();
      if (await menuButton.isVisible()) {
        await menuButton.click();

        // Mobile menu should be visible
        const mobileMenu = page.locator('[data-testid="mobile-menu"]').first();
        await expect(mobileMenu).toBeVisible();

        // Test mobile navigation links
        const mobileLinks = mobileMenu.locator('a');
        const linkCount = await mobileLinks.count();

        if (linkCount > 0) {
          // Click first mobile link
          await mobileLinks.first().click();

          // Should navigate and close menu
          await expect(mobileMenu).not.toBeVisible();
        }
      }
    });

    test('should handle mobile form interactions', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/mood/log');

      // Test mobile form interactions
      const moodInputs = page.locator('input, select, textarea');
      const inputCount = await moodInputs.count();

      for (let i = 0; i < Math.min(inputCount, 3); i++) {
        const input = moodInputs.nth(i);
        const inputType = await input.getAttribute('type');

        if (inputType === 'text' || inputType === 'email') {
          await input.fill('Test input');
        } else if (inputType === 'checkbox') {
          await input.check();
        }
      }

      // Test mobile submit
      const submitButton = page.locator('button[type="submit"]').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
      }
    });
  });

  test.describe('Cross-Platform Compatibility', () => {
    test('should work across different screen sizes', async ({ page }) => {
      const viewports = [
        { width: 320, height: 568, name: 'iPhone SE' },
        { width: 375, height: 667, name: 'iPhone 6/7/8' },
        { width: 414, height: 896, name: 'iPhone 11' },
        { width: 768, height: 1024, name: 'iPad' },
        { width: 1024, height: 768, name: 'Small Desktop' },
        { width: 1920, height: 1080, name: 'Full HD Desktop' },
      ];

      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });

        await page.goto('/dashboard');

        // Basic functionality check
        const mainContent = page.locator('[data-testid="main-content"]').first();
        await expect(mainContent).toBeVisible();

        // Check that navigation works
        const navElement = page.locator('nav').first();
        await expect(navElement).toBeVisible();

        console.log(`✅ ${viewport.name} (${viewport.width}x${viewport.height}) - Passed`);
      }
    });
  });
});
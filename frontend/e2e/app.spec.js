import { test, expect } from '@playwright/test';

test.describe('AuraFlow App', () => {
  test.beforeEach(async ({ page }) => {
    // Set mock token directly for E2E tests
    await page.addInitScript(() => {
      localStorage.setItem('authToken', 'mock-jwt-token');
    });
  });

  test('loads and displays main interface', async ({ page }) => {
    await page.goto('/');
    
    // Wait for auth to load
    await page.waitForTimeout(1000);
    
    // Check that we have tab navigation (individual tabs are visible)
    await expect(page.locator('[data-testid="chat-tab"]')).toBeVisible();
    await expect(page.locator('[data-testid="calendar-tab"]')).toBeVisible();
  });

  test('switches between tabs', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Click Calendar tab using data-testid
    await page.click('[data-testid="calendar-tab"]');
    await expect(page.getByRole('radiogroup')).toBeVisible(); // Calendar view controls
    
    // Click Tasks tab
    await page.click('[data-testid="tasks-tab"]');
    await expect(page.getByText('Add Task')).toBeVisible();
    
    // Click Meditation tab
    await page.click('[data-testid="meditation-tab"]');
    await expect(page.getByText('Choose your meditation practice')).toBeVisible();
    
    // Back to Chat
    await page.click('[data-testid="chat-tab"]');
    await expect(page.getByPlaceholder('Ask Aurora anything...')).toBeVisible();
  });

  test('navigation works correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Test that all tabs are visible using data-testid
    await expect(page.locator('[data-testid="chat-tab"]')).toBeVisible();
    await expect(page.locator('[data-testid="calendar-tab"]')).toBeVisible();
    await expect(page.locator('[data-testid="tasks-tab"]')).toBeVisible();
    await expect(page.locator('[data-testid="meditation-tab"]')).toBeVisible();
  });
});

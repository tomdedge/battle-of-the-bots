import { test, expect } from '@playwright/test';

test.describe('Tasks Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Set mock token for authenticated tests
    await page.addInitScript(() => {
      localStorage.setItem('authToken', 'mock-jwt-token');
    });
  });

  test('should show tasks tab in navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Check if we can see the tasks tab using data-testid
    await expect(page.locator('[data-testid="tasks-tab"]')).toBeVisible();
  });

  test('should navigate to tasks tab when clicked', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Click tasks tab using data-testid
    await page.click('[data-testid="tasks-tab"]');
    
    // Should show tasks interface (Add Task button)
    await expect(page.getByText('Add Task')).toBeVisible();
  });
});

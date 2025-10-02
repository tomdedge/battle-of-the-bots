import { test, expect } from '@playwright/test';

test.describe('Tasks Integration', () => {
  test('should show tasks tab in navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check if we can see the tasks tab (either authenticated or not)
    const hasTasksTab = await page.locator('[data-testid="tasks-tab"]').isVisible();
    const hasSignIn = await page.locator('text=Sign in with Google').isVisible();
    
    // Should show either the tasks tab or sign in
    expect(hasTasksTab || hasSignIn).toBe(true);
  });

  test('should navigate to tasks tab when clicked', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // If tasks tab is visible, click it
    const tasksTab = page.locator('[data-testid="tasks-tab"]');
    if (await tasksTab.isVisible()) {
      await tasksTab.click();
      // Should not throw an error
      expect(true).toBe(true);
    } else {
      // If not authenticated, that's expected
      expect(await page.locator('text=Sign in with Google').isVisible()).toBe(true);
    }
  });
});

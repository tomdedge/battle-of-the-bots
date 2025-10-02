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
    
    // Check if we can see the tasks tab
    const hasTasksTab = await page.getByRole('tab', { name: 'Tasks' }).isVisible();
    
    // Should show the tasks tab when authenticated
    expect(hasTasksTab).toBe(true);
  });

  test('should navigate to tasks tab when clicked', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Click tasks tab
    await page.getByRole('tab', { name: 'Tasks' }).click();
    
    // Should show tasks interface (Add Task button)
    await expect(page.getByText('Add Task')).toBeVisible();
  });
});

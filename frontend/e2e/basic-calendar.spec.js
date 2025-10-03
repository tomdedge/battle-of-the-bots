import { test, expect } from '@playwright/test';

test.describe('Basic Calendar Test', () => {
  test('should load the app and show calendar functionality', async ({ page }) => {
    // Set mock token for authentication
    await page.addInitScript(() => {
      localStorage.setItem('authToken', 'mock-jwt-token');
    });
    
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Should show tabs when authenticated
    await expect(page.locator('[data-testid="calendar-tab"]')).toBeVisible();
    
    // Click calendar tab and verify calendar loads
    await page.click('[data-testid="calendar-tab"]');
    await expect(page.getByRole('radiogroup')).toBeVisible(); // Calendar view controls
  });
});
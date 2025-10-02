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
    
    // Check header exists
    await expect(page.locator('header')).toBeVisible();
    
    // Check theme toggle button in header (be more specific)
    await expect(page.locator('header button').first()).toBeVisible();
    
    // Check authenticated chat interface
    await expect(page.getByText('Welcome to AuraFlow, Test User!')).toBeVisible();
  });

  test('switches between tabs', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Click Calendar tab
    await page.getByRole('tab', { name: 'Calendar' }).click();
    await expect(page.getByRole('radiogroup')).toBeVisible(); // Calendar view controls (segmented control)
    
    // Click Tasks tab
    await page.getByRole('tab', { name: 'Tasks' }).click();
    await expect(page.getByText('Add Task')).toBeVisible(); // Tasks view
    
    // Click Meditation tab
    await page.getByRole('tab', { name: 'Meditation' }).click();
    await expect(page.getByText('Meditation Coming Soon')).toBeVisible();
    
    // Back to Chat
    await page.getByRole('tab', { name: 'Chat' }).click();
    await expect(page.getByText('Welcome to AuraFlow, Test User!')).toBeVisible();
  });

  test('navigation works correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Test that all tabs are visible
    await expect(page.getByRole('tab', { name: 'Chat' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Calendar' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Tasks' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Meditation' })).toBeVisible();
  });
});

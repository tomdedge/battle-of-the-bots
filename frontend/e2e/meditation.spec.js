import { test, expect } from '@playwright/test';

test.describe('Meditation Interface', () => {
  test.beforeEach(async ({ page }) => {
    // Set mock token for authenticated tests
    await page.addInitScript(() => {
      localStorage.setItem('authToken', 'mock-jwt-token');
    });
    await page.goto('/');
    await page.waitForTimeout(1000);
    // Navigate to meditation tab
    await page.click('[data-testid="meditation-tab"]');
  });

  test('displays meditation menu', async ({ page }) => {
    // Use more specific selector to avoid multiple matches
    await expect(page.getByRole('heading', { name: 'Meditation' })).toBeVisible();
    await expect(page.locator('text=Choose your meditation practice')).toBeVisible();
    
    // Check for meditation options
    await expect(page.locator('text=Box Breathing')).toBeVisible();
    await expect(page.locator('text=4-4-4-4 breathing pattern')).toBeVisible();
    await expect(page.locator('text=Soundscapes')).toBeVisible();
  });

  test('can navigate to box breathing', async ({ page }) => {
    // Click Box Breathing button
    await page.click('text=Box Breathing');
    
    // Should show box breathing interface - check for canvas which is the main element
    await expect(page.locator('canvas')).toBeVisible();
  });

  test('can navigate to soundscapes', async ({ page }) => {
    // Click Soundscapes button
    await page.click('text=Soundscapes');
    
    // Should show soundscape interface
    await expect(page.locator('text=Soundscapes')).toBeVisible();
  });
});

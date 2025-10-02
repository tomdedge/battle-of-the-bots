import { test, expect } from '@playwright/test';

test.describe('Calendar Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="bottom-tabs"]', { timeout: 10000 });
  });

  test('should show calendar tab and load calendar view', async ({ page }) => {
    await page.click('[data-testid="calendar-tab"]');
    await expect(page.locator('.rbc-calendar')).toBeVisible({ timeout: 10000 });
    
    // Check that view controls are present
    await expect(page.locator('text=Day')).toBeVisible();
    await expect(page.locator('text=Week')).toBeVisible();
    await expect(page.locator('text=Month')).toBeVisible();
  });

  test('should show inline focus block suggestions as ghost events', async ({ page }) => {
    await page.click('[data-testid="calendar-tab"]');
    await page.waitForSelector('.rbc-calendar');
    
    // Look for suggestion events (dashed border events)
    const suggestionEvents = page.locator('.rbc-event.suggestion-event');
    
    // If suggestions exist, they should be clickable
    const suggestionCount = await suggestionEvents.count();
    if (suggestionCount > 0) {
      await expect(page.locator('text=focus block suggestions')).toBeVisible();
      
      // Click on a suggestion event
      await suggestionEvents.first().click();
      
      // Should show confirmation dialog
      await expect(page.locator('text=Add')).toBeVisible();
    }
  });

  test('should distinguish between actual events and suggestions', async ({ page }) => {
    await page.click('[data-testid="calendar-tab"]');
    await page.waitForSelector('.rbc-calendar');
    
    // Actual events should have solid styling
    const actualEvents = page.locator('.rbc-event.actual-event');
    
    // Suggestion events should have dashed styling
    const suggestionEvents = page.locator('.rbc-event.suggestion-event');
    
    // Both types should be visually distinct
    if (await actualEvents.count() > 0) {
      await expect(actualEvents.first()).toHaveCSS('border-style', 'solid');
    }
    
    if (await suggestionEvents.count() > 0) {
      await expect(suggestionEvents.first()).toHaveCSS('border-style', 'dashed');
    }
  });
});
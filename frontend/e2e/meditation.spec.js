import { test, expect } from '@playwright/test';

test.describe('Meditation Interface', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Navigate to meditation tab
    await page.click('[data-testid="meditation-tab"]');
  });

  test('displays box breathing interface', async ({ page }) => {
    await expect(page.locator('text=Box Breathing')).toBeVisible();
    await expect(page.locator('text=4-4-4-4 breathing pattern for focus and calm')).toBeVisible();
    
    // Check for canvas element
    await expect(page.locator('canvas')).toBeVisible();
    
    // Check for controls
    await expect(page.locator('text=Start')).toBeVisible();
    await expect(page.locator('text=Reset')).toBeVisible();
    
    // Check initial state
    await expect(page.locator('text=Breathe In')).toBeVisible();
    await expect(page.locator('text=Cycle: 0')).toBeVisible();
  });

  test('can start and pause breathing exercise', async ({ page }) => {
    // Start the exercise
    await page.click('text=Start');
    await expect(page.locator('text=Pause')).toBeVisible();
    await expect(page.locator('text=Start')).not.toBeVisible();
    
    // Pause the exercise
    await page.click('text=Pause');
    await expect(page.locator('text=Start')).toBeVisible();
    await expect(page.locator('text=Pause')).not.toBeVisible();
  });

  test('can reset breathing exercise', async ({ page }) => {
    // Start the exercise
    await page.click('text=Start');
    
    // Wait a moment for state to change
    await page.waitForTimeout(1000);
    
    // Reset
    await page.click('text=Reset');
    
    // Check that we're back to initial state
    await expect(page.locator('text=Start')).toBeVisible();
    await expect(page.locator('text=Breathe In')).toBeVisible();
    await expect(page.locator('text=Cycle: 0')).toBeVisible();
  });

  test('shows breathing phases', async ({ page }) => {
    // Start the exercise
    await page.click('text=Start');
    
    // Should start with "Breathe In"
    await expect(page.locator('text=Breathe In')).toBeVisible();
    
    // The timer should show countdown
    const timerElement = page.locator('text=/^[1-4]$/');
    await expect(timerElement).toBeVisible();
  });

  test('displays instructions', async ({ page }) => {
    await expect(page.locator('text=Follow the circle as it expands and contracts')).toBeVisible();
  });

  test('canvas is properly sized', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    // Check canvas dimensions
    const boundingBox = await canvas.boundingBox();
    expect(boundingBox.width).toBe(300);
    expect(boundingBox.height).toBe(300);
  });
});

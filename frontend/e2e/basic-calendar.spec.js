import { test, expect } from '@playwright/test';

test.describe('Basic Calendar Test', () => {
  test('should load the app and show sign-in or calendar', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Wait for either sign-in button or the app to load
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot to see what's happening
    await page.screenshot({ path: 'test-results/app-state.png' });
    
    // Check if we see either the sign-in page or the app
    const hasSignInButton = await page.locator('button:has-text("Sign in with Google")').isVisible();
    const hasBottomTabs = await page.locator('[data-testid="bottom-tabs"]').isVisible();
    
    expect(hasSignInButton || hasBottomTabs).toBe(true);
    
    console.log('Sign-in button visible:', hasSignInButton);
    console.log('Bottom tabs visible:', hasBottomTabs);
    
    if (hasSignInButton) {
      console.log('App is showing sign-in page - authentication required');
    } else if (hasBottomTabs) {
      console.log('App is authenticated - testing calendar tab');
      await page.click('[data-testid="calendar-tab"]');
      await expect(page.locator('.rbc-calendar')).toBeVisible({ timeout: 10000 });
    }
  });
});
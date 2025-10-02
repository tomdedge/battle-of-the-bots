import { test, expect } from '@playwright/test';

test.describe('AuraFlow App', () => {
  test('loads and displays main interface', async ({ page }) => {
    await page.goto('/');
    
    // Check header
    await expect(page.getByText('AuraFlow')).toBeVisible();
    
    // Check theme toggle button
    await expect(page.getByRole('button')).toBeVisible();
    
    // Check initial tab content
    await expect(page.getByText('Chat Coming Soon')).toBeVisible();
  });

  test('switches between tabs', async ({ page }) => {
    await page.goto('/');
    
    // Click Calendar tab
    await page.getByRole('tab', { name: 'Calendar' }).click();
    await expect(page.getByText('Calendar Coming Soon')).toBeVisible();
    
    // Click Tasks tab
    await page.getByRole('tab', { name: 'Tasks' }).click();
    await expect(page.getByText('Tasks Coming Soon')).toBeVisible();
    
    // Click Meditation tab
    await page.getByRole('tab', { name: 'Meditation' }).click();
    await expect(page.getByText('Meditation Coming Soon')).toBeVisible();
    
    // Back to Chat
    await page.getByRole('tab', { name: 'Chat' }).click();
    await expect(page.getByText('Chat Coming Soon')).toBeVisible();
  });

  test('theme toggle works', async ({ page }) => {
    await page.goto('/');
    
    // Click theme toggle
    await page.getByRole('button').click();
    
    // Verify theme changed (check for dark mode indicator)
    await expect(page.locator('html')).toHaveAttribute('data-mantine-color-scheme', 'dark');
  });
});

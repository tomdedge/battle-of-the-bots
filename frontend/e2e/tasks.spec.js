import { test, expect } from '@playwright/test';

test.describe('Tasks Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in and navigate to tasks
    await page.goto('/');
    await page.click('text=Sign in with Google');
    // ... auth flow would be here
    await page.click('[data-testid="tasks-tab"]');
  });

  test('should load tasks view', async ({ page }) => {
    await expect(page.locator('text=Add Task')).toBeVisible();
  });

  test('should show task form when add button clicked', async ({ page }) => {
    await page.click('text=Add Task');
    await expect(page.locator('input[placeholder="Enter task title..."]')).toBeVisible();
  });

  test('should create a new task', async ({ page }) => {
    await page.click('text=Add Task');
    await page.fill('input[placeholder="Enter task title..."]', 'Test Task');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Test Task')).toBeVisible();
  });
});

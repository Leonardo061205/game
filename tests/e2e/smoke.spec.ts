import { test, expect } from '@playwright/test';

test('班长线可启动、选择、自动保存并恢复', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByTestId('title-screen')).toBeVisible();
  await page.getByTestId('start-button').click();
  await expect(page.getByTestId('hud-date')).toContainText('初一第1天');
  await expect(page.getByTestId('game-canvas')).toBeAttached();
  const firstChoice = page.locator('[data-testid^="choice-"]').first();
  await expect(firstChoice).toBeVisible();
  await firstChoice.click();
  await expect(page.getByTestId('event-log')).toContainText('：');
  await page.getByTestId('save-button').click();
  await page.reload();
  await expect(page.getByTestId('title-screen')).toBeVisible();
  await page.getByTestId('continue-button').click();
  await expect(page.getByTestId('hud-date')).toBeVisible();
  expect(errors).toEqual([]);
});

test('手机竖屏仍能看到选择按钮', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const page = await context.newPage();
  await page.goto('/'); await page.getByTestId('start-button').click();
  await expect(page.locator('[data-testid^="choice-"]').first()).toBeVisible();
  await context.close();
});

import { test, expect } from '@playwright/test';

test('前三天形成闭环并呈现第三天分支', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('start-button').click();
  for (let step = 0; step < 22; step += 1) {
    if (await page.getByTestId('phase-complete').count()) break;
    const choice = page.locator('[data-testid^="choice-"]:not([disabled])').first();
    await expect(choice).toBeVisible();
    await choice.click();
    await page.waitForTimeout(60);
  }
  await expect(page.getByTestId('hud-date')).toContainText('初一第3天');
  await expect(page.getByTestId('phase-complete')).toBeVisible();
  await expect(page.getByTestId('event-log')).toContainText('第三天的广播');
});

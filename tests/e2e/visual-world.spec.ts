import { test, expect } from '@playwright/test';

test('校园场景支持画布人物互动与地点切换', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('start-button').click();
  await expect(page.getByTestId('game-canvas')).toBeVisible();
  await expect(page.getByTestId('world-location')).toContainText('教室');
  await page.waitForTimeout(900);

  const canvas = page.getByTestId('game-canvas');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas has no bounds');
  await canvas.click({ position: { x: box.width * 825 / 960, y: box.height * 280 / 540 } });
  await expect(page.getByTestId('npc-actions')).toBeVisible({ timeout: 7000 });
  await expect(page.getByTestId('npc-name')).toContainText('体育生');
  await page.getByTestId('interaction-talk').click();
  await expect(page.getByTestId('hud-period')).toContainText('上午课');

  await page.getByText('校园地图').click();
  await page.locator('[data-location="canteen"]').click();
  await expect(page.getByTestId('world-location')).toContainText('小卖部');
  await expect(page.getByTestId('game-canvas')).toBeVisible();
});

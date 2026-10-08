import { test, expect } from './fixture';
test('real bundled extension activates once', async ({ page, activate }) => {
  await page.goto('http://127.0.0.1:4173/'); await activate(page);
  await expect(page.locator('[data-accesslab-root]')).toHaveCount(1);
  await expect(page.getByText('AccessLab is active')).toBeVisible();
  await activate(page); await expect(page.locator('[data-accesslab-root]')).toHaveCount(1);
});

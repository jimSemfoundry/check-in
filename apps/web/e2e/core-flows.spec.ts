import { expect, test, type Page } from '@playwright/test';

const session = (role: 'owner' | 'participant') => ({
  data: {
    sessionId: '10000000-0000-4000-8000-000000000001',
    workspace: {
      id: '10000000-0000-4000-8000-000000000002',
      name: '我们的空间',
      slug: 'ours',
      timezone: 'Asia/Bangkok',
    },
    role,
    expiresAt: '2030-01-01T00:00:00.000Z',
  },
});
async function enter(page: Page, role: 'owner' | 'participant') {
  await page.route('**/api/v1/session', (route) => route.fulfill({ json: session(role) }));
  await page.route('**/api/v1/access/exchange', (route) => route.fulfill({ json: session(role) }));
  await page.goto(
    `/w/ours/${role === 'owner' ? 'manage' : 'join'}?k=${role}-access-key-that-is-definitely-long-enough`,
  );
  await expect(page).toHaveURL(/\/today$/);
}
test('管理员进入并创建习惯', async ({ page }) => {
  await enter(page, 'owner');
  await page.getByLabel('添加习惯').click();
  await page.getByLabel('名称').fill('拉伸');
  await page.getByRole('button', { name: '保存' }).click();
  await expect(page.getByText('拉伸')).toBeVisible();
});
test('参与者完成打卡', async ({ page }) => {
  await enter(page, 'participant');
  await page.getByLabel('完成散步').click();
  await expect(page.getByLabel('撤销散步')).toBeVisible();
});
test('参与者不能进入编辑页', async ({ page }) => {
  await enter(page, 'participant');
  await page.goto('/habits/new');
  await expect(page).toHaveURL(/\/today$/);
});
test('参与者喂食并修改宠物名字', async ({ page }) => {
  await enter(page, 'participant');
  await page.getByText('宠物', { exact: true }).click();
  await page.getByRole('button', { name: /喂食/ }).click();
  page.once('dialog', (dialog) => dialog.accept('团子'));
  await page.getByLabel('修改宠物名字').click();
  await expect(page.getByText('团子')).toBeVisible();
});
test('历史页显示完成记录', async ({ page }) => {
  await enter(page, 'participant');
  await page.getByText('历史', { exact: true }).click();
  await expect(page.getByText(/本月完成/)).toBeVisible();
});

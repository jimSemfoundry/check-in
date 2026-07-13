import { expect, test } from '@playwright/test';

const ownerKey = process.env.OWNER_ACCESS_KEY;
const participantKey = process.env.PARTICIPANT_ACCESS_KEY;
const slug = process.env.WORKSPACE_SLUG ?? 'our-home';

test.describe('真实后端联调', () => {
  test.skip(!ownerKey || !participantKey, '需要真实访问密钥');

  test('owner 完整业务流与 participant 权限', async ({ page, browser }) => {
    const habitName = `联调习惯 ${Date.now()}`;
    await page.goto(`/w/${slug}/manage?k=${encodeURIComponent(ownerKey!)}`);
    await expect(page).toHaveURL(/\/today$/);
    await expect(page.getByText('我的习惯')).toBeVisible();

    await page.getByLabel('添加习惯').click();
    await page.getByLabel('名称').fill(habitName);
    await page.getByLabel('图标').fill('science');
    await page.getByRole('button', { name: '保存' }).click();
    await expect(page.getByText(habitName)).toBeVisible();

    await page.getByText('今日', { exact: true }).click();
    await expect(page.getByText(habitName)).toBeVisible();
    await page.getByLabel(`完成${habitName}`).click();
    await expect(page.getByLabel(`撤销${habitName}`)).toBeVisible();

    await page.getByText('历史', { exact: true }).click();
    await expect(page.getByText(habitName)).toBeVisible();

    await page.getByText('宠物', { exact: true }).click();
    await expect(page.getByRole('heading', { name: /.+/ }).first()).toBeVisible();
    const feed = page.getByRole('button', { name: /喂食/ });
    if (await feed.isEnabled()) await feed.click();
    const play = page.getByRole('button', { name: /玩耍/ });
    if (await play.isEnabled()) await play.click();

    const participantContext = await browser.newContext({
      baseURL: 'http://127.0.0.1:4173',
      serviceWorkers: 'block',
    });
    const participant = await participantContext.newPage();
    await participant.goto(`/w/${slug}/join?k=${encodeURIComponent(participantKey!)}`);
    await expect(participant).toHaveURL(/\/today$/);
    await expect(participant.getByLabel('添加习惯')).toHaveCount(0);
    await participant.goto('/habits/new');
    await expect(participant).toHaveURL(/\/today$/);
    await participantContext.close();

    await page.goto('/habits');
    const card = page.getByText(habitName).locator('..').locator('..');
    page.once('dialog', (dialog) => dialog.accept());
    const archived = page.waitForResponse(
      (response) =>
        response.request().method() === 'DELETE' && response.url().includes('/api/v1/habits/'),
    );
    await card.getByLabel(`归档${habitName}`).click();
    expect((await archived).status()).toBe(200);
    await expect(page.getByText(habitName)).toHaveCount(0);
    await page.getByLabel('打开设置').click();
    await expect(page.getByText('管理员')).toBeVisible();
    await page.getByRole('button', { name: '退出当前会话' }).click();
    await expect(page).toHaveURL(/\/welcome$/);
  });
});

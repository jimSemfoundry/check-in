# Soft Habit 后端

当前仓库只实现后端能力。现已覆盖 `docs/backend-development.md` 的 B00–B14：基础设施、共享契约、数据库、匿名会话、权限、习惯与历史，以及完整的打卡奖励和宠物养成事务。

## 本地启动

要求 Node.js 24、pnpm 11 和 PostgreSQL。

```bash
pnpm install
cp .env.example .env
pnpm --filter @soft-habit/api db:migrate
pnpm --filter @soft-habit/api db:seed
pnpm --filter @soft-habit/api dev
```

种子命令会在终端输出一次 owner 和 participant 访问密钥；数据库只保存哈希，请安全保存输出，不要提交到仓库。默认监听 `http://localhost:3001`，健康检查为 `/health` 和 `/health/database`。

## 数据库命令

```bash
pnpm --filter @soft-habit/api db:generate
pnpm --filter @soft-habit/api db:migrate
pnpm --filter @soft-habit/api db:seed
```

测试库重置有双重保护：`NODE_ENV=test`，且 `DATABASE_URL` 的数据库名必须包含 `test`。

```bash
NODE_ENV=test pnpm --filter @soft-habit/api db:reset-test
```

`.env` 还可使用 `CHECKIN_FOOD_REWARD=1` 配置每次打卡的食物奖励。配置测试库后，PostgreSQL 事务和并发测试会自动启用：

```bash
TEST_DATABASE_URL=postgresql://soft_habit:soft_habit_dev@localhost:5432/soft_habit_test \
  pnpm --filter @soft-habit/api test
```

## 质量检查

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm format:check
```

共享契约位于 `packages/contracts`，供前后端共同使用；人类可读版本见 `docs/api-contract.md`。第一版没有账号密码登录，不应增加账号系统。

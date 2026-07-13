# Soft Habit 后端开发文档

## 1. 文档目标

本文档供后端开发终端独立执行。后端是权限、打卡奖励、食物余额和宠物养成数据的权威来源。第一版没有传统账号登录，通过管理链接和参与者链接建立匿名会话。

## 2. 技术栈

- Node.js + TypeScript
- Fastify
- PostgreSQL（推荐使用 Supabase 托管实例）
- Drizzle ORM + Drizzle Kit
- Zod：请求、响应和共享契约
- Argon2 或安全哈希：访问密钥
- Vitest：单元与集成测试
- Testcontainers 或独立测试数据库

包管理器统一使用 pnpm。

## 3. 代码边界

后端终端负责：

```text
apps/api/**
packages/contracts/**
docs/api-contract.md
```

建议目录：

```text
apps/api/src/
├── app.ts
├── server.ts
├── config/
├── db/
│   ├── schema/
│   ├── migrations/
│   └── client.ts
├── modules/
│   ├── access/
│   ├── workspaces/
│   ├── habits/
│   ├── checkins/
│   ├── rewards/
│   ├── history/
│   └── pets/
├── plugins/
├── services/
└── test/
```

路由只处理协议转换；权限、事务和业务规则放在 service 层。

## 4. 权限模型

角色：

- `owner`
- `participant`

能力矩阵：

| 操作                   | owner | participant |
| ---------------------- | ----: | ----------: |
| 查看任务、历史和宠物   |     ✓ |           ✓ |
| 创建、编辑、归档任务   |     ✓ |           ✗ |
| 打卡和撤销当天打卡     |     ✓ |           ✓ |
| 喂食和玩耍             |     ✓ |           ✓ |
| 修改宠物名字           |     ✓ |           ✓ |
| 更新分享链接和游戏设置 |     ✓ |           ✗ |

建议统一实现：

```ts
requireSession();
requireRole('owner');
requireCapability('pet:interact');
```

不能依赖前端隐藏按钮。

## 5. 核心业务规则

- 工作空间内共享一组习惯和一只宠物。
- 同一习惯同一天只产生一次完成记录和一次奖励。
- 打卡奖励 1 份食物，数值必须配置化。
- 只能撤销工作空间当天的打卡。
- 打卡对应食物已消费后，不允许撤销。
- 喂食由服务端扣除食物并计算经验、亲密度、升级和成长阶段。
- 玩耍不消耗食物，但有服务端冷却时间。
- 习惯删除采用归档，不物理删除历史。
- 所有日期边界按工作空间时区计算，默认 `Asia/Bangkok`。
- 参与者和管理员修改宠物名字时采用最后写入生效，并保留事件记录。

## 6. 数据模型

### 6.1 工作空间和会话

`workspaces`

- `id uuid pk`
- `name text`
- `slug text unique`
- `timezone text`
- `created_at timestamptz`
- `updated_at timestamptz`

`workspace_access_keys`

- `id uuid pk`
- `workspace_id uuid fk`
- `role owner | participant`
- `key_hash text`
- `expires_at timestamptz nullable`
- `revoked_at timestamptz nullable`
- `created_at timestamptz`

`anonymous_sessions`

- `id uuid pk`
- `workspace_id uuid fk`
- `role owner | participant`
- `token_hash text`
- `last_seen_at timestamptz`
- `expires_at timestamptz`
- `revoked_at timestamptz nullable`
- `created_at timestamptz`

### 6.2 习惯

`habits`

- `id uuid pk`
- `workspace_id uuid fk`
- `name text`
- `icon text`
- `target_count integer`
- `target_unit text nullable`
- `frequency_type daily | weekly | monthly`
- `start_date date`
- `sort_order integer`
- `archived_at timestamptz nullable`
- `created_at timestamptz`
- `updated_at timestamptz`

`habit_schedules`

- `id uuid pk`
- `habit_id uuid fk`
- `weekday smallint nullable`
- `times_per_week smallint nullable`
- `month_day smallint nullable`

`habit_reminders`

- `id uuid pk`
- `habit_id uuid fk`
- `enabled boolean`
- `local_time time nullable`

### 6.3 打卡和奖励

`habit_checkins`

- `id uuid pk`
- `workspace_id uuid fk`
- `habit_id uuid fk`
- `checkin_date date`
- `completed_by_session_id uuid`
- `completed_at timestamptz`
- `cancelled_at timestamptz nullable`

为有效记录建立 `workspace_id + habit_id + checkin_date` 唯一约束或等效的部分唯一索引。

`reward_ledger`

- `id uuid pk`
- `workspace_id uuid fk`
- `currency_type food`
- `source_type checkin | feed | adjustment`
- `source_id uuid`
- `amount integer`
- `actor_session_id uuid`
- `created_at timestamptz`

余额由流水聚合或由受事务保护的余额快照加流水计算，不能由前端提交。

### 6.4 宠物养成

`pet_species`

- `id uuid pk`
- `code text unique`
- `name text`
- `rarity text`
- `asset_key text`

`pet_level_configs`

- `species_id uuid fk`
- `level integer`
- `required_experience integer`
- `growth_stage text`

`game_action_configs`

- `action_type feed | play`
- `food_cost integer`
- `experience_gain integer`
- `intimacy_gain integer`
- `cooldown_seconds integer`

`pets`

- `id uuid pk`
- `workspace_id uuid unique fk`
- `species_id uuid fk`
- `name text`
- `level integer`
- `experience integer`
- `intimacy integer`
- `growth_stage text`
- `last_played_at timestamptz nullable`
- `version integer`
- `created_at timestamptz`
- `updated_at timestamptz`

`pet_events`

- `id uuid pk`
- `pet_id uuid fk`
- `event_type feed | play | rename | level_up | evolve`
- `actor_session_id uuid`
- `payload jsonb`
- `created_at timestamptz`

## 7. API 契约

统一格式：

```json
{ "data": {} }
```

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数不正确",
    "details": []
  }
}
```

接口：

### 会话

```text
POST /api/v1/access/exchange
GET  /api/v1/session
POST /api/v1/session/logout
```

### 习惯

```text
GET    /api/v1/today
GET    /api/v1/habits
GET    /api/v1/habits/:id
POST   /api/v1/habits
PATCH  /api/v1/habits/:id
DELETE /api/v1/habits/:id
```

### 打卡

```text
POST   /api/v1/habits/:id/checkins
DELETE /api/v1/habits/:id/checkins/:date
```

### 历史

```text
GET /api/v1/history/month?month=YYYY-MM
GET /api/v1/history/day?date=YYYY-MM-DD
```

### 宠物

```text
GET   /api/v1/pet
PATCH /api/v1/pet/name
POST  /api/v1/pet/actions/feed
POST  /api/v1/pet/actions/play
```

完整请求和响应 Schema 必须定义在 `packages/contracts` 并输出到 `docs/api-contract.md`。

## 8. 分阶段任务

### B00：初始化 Monorepo

- 初始化 pnpm workspace。
- 创建 `apps/api`、`apps/web` 占位目录、`packages/contracts` 和 `docs`。
- 配置 TypeScript、ESLint、Prettier。
- 提供 `.env.example`。
- 不在仓库提交真实密钥。

### B01：API 基础设施

- 创建 Fastify 应用和启动入口。
- 实现环境变量校验。
- 实现结构化日志和请求 ID。
- 实现 `/health` 和数据库健康检查。
- 统一错误处理和响应格式。
- 配置 CORS 和 Cookie。

### B02：共享契约

- 创建角色、习惯、打卡、历史和宠物 Schema。
- 前后端共享请求与响应类型。
- 建立契约导出入口。
- 生成或手写 `docs/api-contract.md`。

### B03：数据库与迁移

- 配置 Drizzle。
- 建立全部第一版表和索引。
- 添加种子数据：一个工作空间、一只宠物、等级配置和动作配置。
- 提供 migrate、seed、reset-test-db 命令。

### B04：访问密钥

- 使用密码学安全随机数生成密钥。
- 数据库只保存哈希。
- 支持 owner 和 participant 两类密钥。
- 支持过期和撤销。
- 密钥比较避免明显时序泄露。

### B05：匿名会话

- 访问密钥换取匿名会话。
- Cookie 使用 HTTP-only、Secure、SameSite。
- 数据库保存 token 哈希而不是原文。
- 每次请求装载 workspace、role 和 sessionId。
- 登出或撤销后立即失效。

### B06：权限中间件

- 建立集中能力矩阵。
- owner 才能调用习惯写接口。
- participant 可调用打卡和宠物互动。
- 添加每个权限边界的集成测试。

### B07：习惯查询和重复规则

- 实现习惯列表、详情和 Today 聚合。
- 支持每天、每周指定星期、每周次数、每月日期。
- 统一按工作空间时区确定“今天”。
- 测试月末、闰年、开始日期和归档日期。

### B08：习惯创建、修改和归档

- 实现 owner-only CRUD。
- 删除为归档。
- 修改重复规则只影响未来计划。
- 保留历史可读性。
- 写操作增加审计日志或领域事件。

### B09：完成打卡事务

一个数据库事务内：

1. 锁定或检查当天习惯状态。
2. 验证今天应执行该习惯。
3. 创建唯一打卡记录。
4. 写入食物奖励流水。
5. 返回更新后的进度和余额。

并发请求只能有一个成功，不能发放两次奖励。

### B10：撤销打卡事务

- 仅允许撤销当天记录。
- 判断对应奖励是否已消费。
- 未消费时取消记录并写负向流水。
- 已消费时返回 `CHECKIN_REWARD_ALREADY_SPENT`。
- 失败时任何数据都不能部分修改。

### B11：历史统计

- 实现月份汇总。
- 实现指定日期详情。
- 归档习惯仍保留过去记录。
- 习惯改名后历史仍可解释。
- 明确快照策略并补充测试。

### B12：宠物查询

- 返回名字、物种、等级、经验、下级阈值、亲密度、成长阶段。
- 返回食物余额。
- 返回 feed/play 是否可用及不可用原因。
- 返回玩耍剩余冷却时间。

### B13：喂食事务

一个数据库事务内：

1. 锁定宠物和资源余额。
2. 检查食物充足。
3. 写负向食物流水。
4. 从服务端配置读取经验和亲密度增量。
5. 更新宠物。
6. 处理连续升级和成长阶段变化。
7. 写宠物事件。
8. 返回最新状态。

客户端不能提交经验增量。

### B14：玩耍与改名

- 服务端验证玩耍冷却。
- 亲密度增量从配置读取。
- 改名校验长度、空白和非法字符。
- 两种角色均可调用。
- 所有操作写入宠物事件。

### B15：安全加固

- CORS 仅允许配置的前端来源。
- Cookie 会话接口增加 CSRF 防护。
- 访问交换、打卡和宠物动作分别限流。
- 日志隐藏 Cookie、密钥和数据库连接信息。
- 所有输入经过 Zod。
- 数据查询始终限定 `workspace_id`。

### B16：自动化测试

必须覆盖：

- participant 不能管理习惯。
- participant 可以打卡、喂食、玩耍和改名。
- 同一任务同一天只有一个奖励。
- 两个会话并发打卡不会重复奖励。
- 食物不足不能喂食。
- 两个会话争抢最后一份食物时只有一个成功。
- 喂食失败不会只扣食物。
- 已消费的打卡奖励不能撤销。
- 升级与成长阶段计算正确。
- 时区跨日正确。
- 跨工作空间不能读取或修改数据。

## 9. 事务与并发要求

以下操作必须使用数据库事务：

- 打卡并发放奖励
- 撤销打卡并回收奖励
- 喂食并扣除食物
- 玩耍并更新冷却

使用唯一索引、行锁或原子条件更新保证一致性。不要采用“先查询、再在事务外更新”的模式。

关键写接口建议支持幂等键：

```text
Idempotency-Key: <uuid>
```

相同会话、相同接口和相同幂等键返回第一次结果，避免网络重试重复执行。

## 10. 历史快照策略

第一版可选以下一种方式，并在契约中固定：

1. 每天生成计划快照；历史准确度最高。
2. 打卡记录保存习惯名称、图标、目标和频率快照，同时补充未完成计划表。

推荐每日计划快照：

```text
daily_habit_plans
- workspace_id
- habit_id
- plan_date
- habit_name_snapshot
- icon_snapshot
- target_count_snapshot
- target_unit_snapshot
```

这样修改或归档习惯不会改变过去月份的计划总数。

## 11. 环境变量

`.env.example` 至少包含：

```text
NODE_ENV=development
PORT=3001
DATABASE_URL=
COOKIE_SECRET=
ACCESS_KEY_PEPPER=
WEB_ORIGIN=http://localhost:5173
SESSION_TTL_DAYS=30
DEFAULT_TIMEZONE=Asia/Bangkok
```

测试使用单独数据库，禁止自动清理开发或生产数据库。

## 12. 完成标准

- 所有接口有共享 Zod 契约。
- 数据库迁移可从空库完整执行。
- owner/participant 权限符合矩阵。
- 奖励和宠物结算全部由服务端完成。
- 关键写操作具备事务和并发测试。
- API 不暴露访问密钥、会话 Token 哈希或内部错误堆栈。
- lint、typecheck、test 和 build 全部通过。
- README 说明本地启动、迁移、种子和测试方法。

## 13. 后端终端首轮执行指令

```text
阅读 docs/backend-development.md。执行 B00-B06：初始化 pnpm monorepo、Fastify、
Drizzle、共享契约、数据库迁移、访问密钥、匿名 Cookie 会话和权限中间件。
先固定 packages/contracts 和 docs/api-contract.md，方便前端并行 Mock。
运行 lint、typecheck 和测试。不要实现未经文档定义的账号登录。
```

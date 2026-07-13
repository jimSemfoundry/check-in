# Soft Habit API 契约（v1）

本文档固定后端 v1 的共享边界。机器可读的唯一来源是 `packages/contracts/src`；字段调整必须同步修改 Zod Schema、本文档和契约测试。

## 通用约定

- Base path：`/api/v1`
- JSON 成功响应：`{ "data": ... }`
- JSON 错误响应：`{ "error": { "code": string, "message": string, "details"?: unknown[] } }`
- 日期：`YYYY-MM-DD`；月份：`YYYY-MM`；时间戳：ISO 8601 UTC 时间戳。
- 身份通过签名的 `soft_habit_session` Cookie 传递；Cookie 为 HttpOnly、SameSite=Lax，生产环境启用 Secure。
- 角色：`owner | participant`。
- 服务端不会在响应中返回访问密钥、Cookie Token 或它们的哈希。

稳定错误码：`VALIDATION_ERROR`、`UNAUTHORIZED`、`FORBIDDEN`、`NOT_FOUND`、`CONFLICT`、`ACCESS_KEY_INVALID`、`ACCESS_KEY_EXPIRED`、`ACCESS_KEY_REVOKED`、`SESSION_EXPIRED`、`HABIT_NOT_FOUND`、`CHECKIN_ALREADY_EXISTS`、`CHECKIN_NOT_DUE`、`CHECKIN_DATE_NOT_TODAY`、`CHECKIN_NOT_FOUND`、`CHECKIN_REWARD_ALREADY_SPENT`、`PET_NOT_FOUND`、`PET_CONFIG_MISSING`、`INSUFFICIENT_FOOD`、`PET_PLAY_COOLDOWN`、`INTERNAL_ERROR`、`NOT_IMPLEMENTED`。

## 会话

### `POST /access/exchange`

请求：`{ "accessKey": string }`（32–512 字符）。成功后设置会话 Cookie。

响应 `data`：

```json
{
  "sessionId": "uuid",
  "workspace": {
    "id": "uuid",
    "name": "Soft Habit",
    "slug": "soft-habit",
    "timezone": "Asia/Bangkok"
  },
  "role": "owner",
  "expiresAt": "2026-08-11T00:00:00.000Z"
}
```

### `GET /session`

返回与交换接口相同的会话对象。无效、过期或已撤销会话返回 `401 UNAUTHORIZED`。

### `POST /session/logout`

响应：`{ "data": { "loggedOut": true } }`，并立即撤销服务端会话。

## 习惯

`Habit`：`id`、`name`、`icon`、`targetCount`、`targetUnit|null`、`frequencyType`、`startDate`、`sortOrder`、`archivedAt|null`、`schedules[]`、`reminder|null`。

- `GET /today` → 当日日期、计划习惯及打卡、进度和宠物状态。
- `GET /habits` → `Habit[]`。
- `GET /habits/:id` → `Habit`。
- `POST /habits` → 创建 `Habit`，仅 owner。
- `PATCH /habits/:id` → 修改 `Habit`，仅 owner，至少一个字段。
- `DELETE /habits/:id` → 归档 `Habit`，仅 owner。

创建字段：

```json
{
  "name": "喝水",
  "icon": "water",
  "targetCount": 8,
  "targetUnit": "杯",
  "frequencyType": "daily",
  "startDate": "2026-07-12",
  "sortOrder": 0,
  "schedules": [],
  "reminder": { "enabled": true, "localTime": "09:00" }
}
```

`frequencyType` 为 `daily | weekly | monthly`。Schedule 可包含 `weekday`（0–6）、`timesPerWeek`（1–7）或 `monthDay`（1–31）。

重复规则固定如下：daily 不接受 Schedule；weekly 必须选择一个或多个 weekday，或者只提供一个 timesPerWeek；monthly 必须提供至少一个 monthDay。每周次数模式在本周未完成目标次数时每天显示为待完成；monthDay 超过当月天数时落在当月最后一天。

## 打卡

- `POST /habits/:id/checkins`，请求 `{ "date"?: "YYYY-MM-DD" }`，owner 和 participant 均可调用。
- `DELETE /habits/:id/checkins/:date`，owner 和 participant 均可调用。

响应 `data`：`{ "checkin": Checkin, "foodBalance": integer }`。`Checkin` 包含 `id`、`habitId`、`checkinDate`、`completedAt`、`cancelledAt|null`。

打卡和撤销仅接受工作空间时区的今天。同一习惯同一天只能存在一条有效打卡；成功打卡按 `CHECKIN_FOOD_REWARD` 发放食物。奖励已被消费时，撤销返回 `409 CHECKIN_REWARD_ALREADY_SPENT`。

## 历史

- `GET /history/month?month=YYYY-MM`
- `GET /history/day?date=YYYY-MM-DD`

每日对象包含 `date`、`plannedCount`、`completedCount` 和 `habits[]`；习惯项包含 `habitId`、`name`、`icon`、`completed`。历史采用 `daily_habit_plans` 每日计划快照策略。

月份响应始终返回该月全部自然日。历史名称和图标来自计划快照，因此后续修改或归档习惯不会改变过去记录。

## 宠物

- `GET /pet`
- `PATCH /pet/name`，请求 `{ "name": string }`，名称 1–30 字符。
- `POST /pet/actions/feed`
- `POST /pet/actions/play`

两种角色均可查询和互动。宠物响应包含 `id`、`name`、`species`、`level`、`experience`、`nextLevelExperience|null`、`intimacy`、`growthStage`、`foodBalance`，以及 feed/play 的服务端可用状态和玩耍冷却秒数。

喂食成本、经验和亲密度完全读取服务端动作配置。食物按奖励流水 FIFO 消费，扣粮、宠物更新、连续升级、成长阶段变化及事件写入在同一事务完成。食物不足返回 `409 INSUFFICIENT_FOOD`。玩耍冷却由服务端时间判断，冷却中返回 `409 PET_PLAY_COOLDOWN`。改名采用最后写入生效，并保留每次 rename 事件。

## 实现状态

会话、健康检查、统一错误、Cookie/CORS、访问密钥和权限中间件已经实现。B07–B14 的习惯、Today、打卡、撤销、历史统计、宠物查询、喂食、玩耍和改名均已实现。剩余 B15 安全加固和 B16 最终自动化测试完善。

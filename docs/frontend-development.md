# Soft Habit 前端开发文档

## 1. 文档目标

本文档供前端开发终端独立执行。前端负责移动端优先的 Web/PWA、权限对应的界面行为、API 接入和用户交互，不实现服务端权限或游戏结算。

第一版包含五个核心页面：今日打卡、历史记录、宠物中心、习惯管理、习惯编辑。

## 2. 技术栈

- React + Vite + TypeScript
- React Router
- Tailwind CSS
- TanStack Query：服务端数据请求和缓存
- Zustand：仅保存轻量客户端状态
- React Hook Form + Zod：表单和校验
- Material Symbols：保持与设计稿一致
- Vitest + React Testing Library
- Playwright：关键流程端到端测试

包管理器统一使用 pnpm。

## 3. 代码边界

前端终端只修改：

```text
apps/web/**
```

共享类型由后端维护在 `packages/contracts`。前端可以引用，不能私自修改契约。契约不满足需求时，先在联调记录中提出变更。

建议目录：

```text
apps/web/src/
├── app/                 # Router、Provider、全局布局
├── assets/              # 静态图片
├── components/          # 通用组件
├── features/
│   ├── access/
│   ├── habits/
│   ├── checkins/
│   ├── history/
│   └── pet/
├── lib/                 # API client、日期、格式化
├── pages/
├── stores/              # 仅客户端状态
├── styles/
└── test/
```

## 4. 产品与权限规则

角色：

- `owner`：管理任务，同时参与打卡和宠物互动。
- `participant`：不能创建、编辑或删除任务；可以打卡、撤销当天打卡、喂食、玩耍和修改宠物名字。

双方共享同一工作空间的任务、完成状态、食物余额和宠物。

前端必须按权限隐藏或禁用入口，但不能把前端限制当作安全措施。后端仍会验证每次写操作。

## 5. 路由

```text
/w/:slug/manage?k=:key        管理员访问链接
/w/:slug/join?k=:key          参与者访问链接
/today                        今日打卡
/history                      历史记录
/pet                          宠物中心
/habits                       习惯管理，仅 owner
/habits/new                   新建习惯，仅 owner
/habits/:id/edit              编辑习惯，仅 owner
/settings                     设置
```

访问密钥只用于换取会话。成功后必须从地址栏移除，后续身份由 HTTP-only Cookie 维持。

## 6. 设计规范

### 6.1 视觉方向

- 移动端优先，桌面端居中显示手机宽度内容。
- 主色为柔和灰粉色，辅助色为低饱和绿色。
- 页面背景、卡片、进度条和圆角应复用统一 Token。
- 使用设计稿的 Material Symbols，不混用不同风格图标。
- 支持浅色与深色模式，但先以浅色还原为验收基准。

### 6.2 基础组件

优先实现：

- `AppShell`
- `TopBar`
- `BottomNavigation`
- `PageLoading`
- `ErrorState`
- `EmptyState`
- `ConfirmDialog`
- `RoleGate`
- `ProgressRing`
- `HabitCard`
- `PetProgressBar`
- `Toast`

所有图标按钮必须有 `aria-label`，触控区域不小于约 44×44 px。

### 6.3 `/game` HUD Banner 拼接规则

`/game` 底部 HUD banner 使用 Tiny Swords 资源：

```text
Tiny Swords (Free Pack)/UI Elements/UI Banners from the store page/Banner/Banner.png
```

Banner 只能由当前编号规则内的 atlas 区域组成，不允许再用额外整块底板或规则外区域补缝。运行时代码集中在 `apps/web/src/game/hudLayout.ts`。

源图编号和裁切区域：

```text
0  x=320 y=128 w=64  h=64   第二行动态填充
1  x=4   y=0   w=60  h=64   第一行左固定
2  x=256 y=0   w=64  h=64   第一行动态填充
3  x=384 y=0   w=64  h=64   第一行右固定组合左半
4  x=640 y=0   w=44  h=64   第一行右固定组合右半
5  x=4   y=128 w=60  h=64   第二行左固定
6  x=640 y=128 w=44  h=64   第二行右固定
7  x=4   y=256 w=188 h=92   第三行左固定
8  x=256 y=256 w=64  h=64   第三行动态填充
9  x=384 y=256 w=64  h=64   第三行右固定组合左半
10 x=512 y=256 w=172 h=98   第三行右固定组合右半
```

布局规则：

- 第一行：`1` 固定，`2` 横向动态，`3+4` 固定组合。
- 第二行：`5` 固定，`0` 横向动态，`6` 固定。
- 第三行：`7` 固定，`8` 横向动态，`9+10` 固定组合。
- 左竖边为 `1/5/7`，右竖边为 `3/4/6/9/10`。
- `2/0/8` 是唯一允许拉伸的动态填充块；其它编号只能按比例缩放，不做横向拉伸。
- `8` 和 `9` 必须上边对齐；第二行和第三行之间不能留横向背景缝。
- Banner 宽度按视口自适应，最大 408px，左右总 margin 48px；底部居中锚定。

Slots 使用同目录下的资源：

```text
Tiny Swords (Free Pack)/UI Elements/UI Banners from the store page/Banner/Slots.png
```

`Slots.png` 的 9 个编号区域必须全部组合成一个 slot，不允许只复制其中一张。每个 slot 由 `1..9` 以 3×3 方式合成，整体等比缩放到当前 slot 尺寸；slot 内部的 9 张切片不单独拉伸。HUD 当前显示 5 个 slot，整体在 banner 内垂直居中，桌面端 slot 中心 x 为 `[-124, -62, 0, 62, 124]`，移动端为 `[-88, -44, 0, 44, 88]`，保证第一格与左边缘之间保留可见距离。

## 7. API 使用约定

- API 前缀：`/api/v1`
- Cookie 会话：请求必须携带 `credentials: "include"`
- 日期：`YYYY-MM-DD`
- 时间：ISO 8601
- 成功响应：`{ "data": ... }`
- 错误响应：`{ "error": { "code": "...", "message": "..." } }`

创建统一 API Client，不允许页面组件直接散写 `fetch`。

常见错误码要映射成用户可理解的中文提示：

- `UNAUTHORIZED`
- `FORBIDDEN`
- `INVALID_ACCESS_KEY`
- `HABIT_ALREADY_COMPLETED`
- `CHECKIN_REWARD_ALREADY_SPENT`
- `INSUFFICIENT_FOOD`
- `PET_ACTION_COOLDOWN`
- `VALIDATION_ERROR`

## 8. 分阶段任务

### F00：初始化应用

- 初始化 Vite React TypeScript。
- 配置 Tailwind、Router、Query Client、Zustand。
- 配置 lint、typecheck、test、build 脚本。
- 建立环境变量 `VITE_API_BASE_URL`。
- 建立全局颜色、间距、字体和圆角 Token。

验收：

```bash
pnpm --filter web lint
pnpm --filter web typecheck
pnpm --filter web test
pnpm --filter web build
```

全部通过。

### F01：应用外壳与导航

- 实现顶部栏、底部导航和路由布局。
- Today、History、Pet 三个主入口正确高亮。
- 管理页与编辑页通过 Today 页进入，不错误高亮 History。
- 实现全局加载、错误和 404 页面。

### F02：访问链接与会话

- 解析 slug、角色入口和访问密钥。
- 调用访问密钥交换接口。
- 成功后使用 `replaceState` 清除 URL 中的密钥。
- 调用 `/session` 恢复角色。
- 无效、过期、撤销的链接显示不同提示。
- 未建立会话时阻止进入业务页面。

### F03：今日页静态还原

- 标题“我的习惯”。
- 今日完成进度环和鼓励文案。
- 任务卡片、编辑入口、打卡开关。
- 食物余额提示。
- 管理员显示添加和编辑入口；参与者隐藏。
- 数据先通过 Mock 注入，不在组件中写死。

### F04：今日页 API 接入

- 使用 TanStack Query 请求 `/today`。
- 展示任务、完成状态、今日统计和食物余额。
- 实现骨架屏、空任务状态、失败重试。
- 进度完全使用 API 数据计算结果。

### F05：打卡与撤销

- 完成和撤销使用 mutation。
- 实现乐观更新，失败后回滚。
- 请求期间锁定对应任务，防止快速重复点击。
- 操作成功后同步今日数据、历史数据和宠物食物余额缓存。
- 奖励已消费无法撤销时，恢复开关并解释原因。

### F06：习惯管理页

- 仅 `owner` 可访问。
- 展示图标、名称、目标、频率和排序。
- 新增、编辑、归档入口。
- 删除操作使用确认弹窗，文案说明历史数据会保留。
- 空状态提供创建第一个习惯的入口。

### F07：习惯表单

字段：

- 名称
- 图标
- 目标数量
- 目标单位
- 重复类型：每天、每周、每月
- 每周星期或每周次数
- 每月日期
- 开始日期
- 提醒开关
- 提醒时间

要求：

- 新增和编辑复用同一个表单。
- 使用 React Hook Form + Zod。
- 根据频率动态显示字段。
- 保存期间防重复提交。
- 服务端字段错误显示在对应输入项。
- 取消或返回时，如果有未保存修改，应确认。

### F08：历史月历

- 月份前后切换。
- 展示每天计划数、完成数和完成比例。
- 标识今天和选中日期。
- 点击日期加载当天详情。
- 展示月度完成总数和计划总数。
- 切换月份时保留平滑加载体验。

### F09：宠物中心静态还原

- 宠物图片、名字、等级。
- 经验进度和亲密度。
- 食物余额。
- 喂食和玩耍按钮。
- 修改名字入口。
- 为宠物资源建立映射函数：

```ts
getPetAsset(species, growthStage, mood);
```

禁止在页面组件里直接写死最终资源地址。

### F10：宠物交互

- 喂食后刷新余额、经验、等级和成长阶段。
- 食物不足时按钮禁用并提示。
- 玩耍显示冷却状态和下次可用时间。
- 修改宠物名字时校验长度。
- 连续点击只能产生一次有效请求。
- 升级或成长阶段变化显示明确反馈。

### F11：多人数据同步

第一版采用简单策略：

- 页面重新聚焦时刷新。
- 活跃页面每 20 秒刷新一次。
- 每次 mutation 后立即刷新关联 Query。
- 不在第一版引入 WebSocket。

### F12：PWA 与离线行为

- 添加 Manifest 和应用图标。
- 缓存静态资源。
- 离线时允许查看最近一次数据。
- 离线时禁止打卡、喂食和玩耍等关键写操作。
- 显示清晰的离线状态。

第一版不离线排队游戏结算，避免恢复网络后重复奖励。

### F13：前端测试

组件测试至少覆盖：

- owner 与 participant 的按钮差异。
- 今日进度展示。
- 打卡成功和失败回滚。
- 习惯表单频率字段切换。
- 食物不足状态。
- 玩耍冷却状态。

Playwright 流程至少覆盖：

1. 管理员进入应用并创建习惯。
2. 参与者进入应用并完成打卡。
3. 参与者不能进入习惯编辑页面。
4. 参与者喂食并修改宠物名字。
5. 历史页显示完成记录。

## 9. Mock 与联调策略

后端未完成时，前端使用 MSW 或集中 Mock Adapter。Mock 返回值必须符合 `packages/contracts`，不能建立第二套临时字段。

联调顺序：

1. 会话与权限。
2. 今日任务查询。
3. 习惯 CRUD。
4. 打卡和撤销。
5. 宠物查询与互动。
6. 历史记录。

## 10. 状态管理原则

TanStack Query 管理：

- 会话
- 习惯
- 今日任务
- 历史记录
- 宠物数据
- 食物余额

Zustand 只管理：

- 当前打开的弹窗
- 临时 UI 偏好
- 未提交的局部交互状态

不要把服务端数据复制到 Zustand，避免两份状态不同步。

## 11. 完成标准

- 五个设计页面完成并适配移动端。
- 两种角色界面权限正确。
- 所有写操作都通过后端 API。
- 打卡、食物和宠物数据保持一致。
- 刷新页面后会话和数据正常恢复。
- 无 TypeScript、lint 和构建错误。
- 关键组件测试和端到端流程通过。
- 不在前端保存或打印访问密钥。
- 不在前端计算权威奖励与宠物经验。

## 12. 前端终端首轮执行指令

```text
阅读 docs/frontend-development.md、docs/backend-development.md 和
packages/contracts。仅修改 apps/web。先执行 F00-F04，使用与共享契约一致的
Mock 数据完成应用外壳、访问流程和 Today 页面。运行 lint、typecheck、test、
build，并记录尚未就绪的后端接口，不要自行修改 API 字段。
```

# 共享功能设计文档（只读阶段）

**日期：** 2026-04-09  
**范围：** 月经记录模块的只读共享，邀请通路打通，权限管理基础结构  
**流程图资产：** `docs/design-drafts/sharing-invite-flow.html`

---

## 背景与目标

月经记录模块已完成单人使用闭环。本阶段目标是打通最小共享通路：创建人通过微信小程序卡片邀请一个参与人，参与人以**只读**方式访问同一份数据。

只读模式作为共同编辑模式的基座先行实现，验证数据同步通路后再叠加编辑权限。

---

## 角色定义

| 角色 | AccessRole 枚举值 | 能力 |
|------|-----------------|------|
| 创建人 | `OWNER` | 全部查看 + 全部编辑 + 发起/撤销共享 |
| 参与人（只读）| `VIEWER` | 仅查看，所有编辑入口隐藏 |
| 参与人（共同编辑）| `PARTNER` | 全部查看 + 全部编辑（**本阶段不实现**）|

权限标注原则：当前实现了什么权限就明确展示出来，不开放动态切换。

---

## 约束

- 参与人数量上限：约 3 人（当前无硬性限制，依靠产品设计自然约束）
- 邀请链接：一次性，用完即失效，有效期 24 小时
- 邀请机制：`wx.shareAppMessage` 转发小程序卡片，path 携带 token
- 数据模型：参与人访问的是同一个 `ModuleInstance`，不复制数据

---

## 数据模型变更

### 新增表：`InviteToken`

```prisma
model InviteToken {
  id               String    @id @default(cuid())
  token            String    @unique
  moduleInstanceId String    @map("module_instance_id")
  createdByUserId  String    @map("created_by_user_id")
  expiresAt        DateTime  @map("expires_at")    // 创建时 +24h
  usedAt           DateTime? @map("used_at")        // null = 未使用
  usedByUserId     String?   @map("used_by_user_id")

  moduleInstance ModuleInstance @relation(fields: [moduleInstanceId], references: [id], onDelete: Cascade)

  @@index([moduleInstanceId])
  @@map("invite_tokens")
}
```

### 修改枚举：`AccessRole`

```prisma
// 变更前
enum AccessRole { OWNER  PARTNER }

// 变更后
enum AccessRole { OWNER  VIEWER  PARTNER }
```

- `VIEWER`：只读参与人，本阶段实现
- `PARTNER`：共同编辑，后续阶段实现，当前值保留但不分配

`ModuleAccess` 表其他字段（`AccessStatus`、`revokedAt`）复用已有逻辑，无需改动。

---

## 后端接口

### 新增接口

#### `POST /commands/createInviteToken`

**调用方：** 创建人  
**鉴权：** 需要登录，且 userId 必须是该 moduleInstance 的 OWNER

**请求体：**
```json
{ "moduleInstanceId": "string" }
```

**逻辑：**
1. 校验调用方是 OWNER
2. 检查是否已存在未使用且未过期的 token，若有则直接返回（幂等）
3. 否则生成新 token（crypto 随机，32 字节 hex），写入 `InviteToken`，`expiresAt = now + 24h`

**响应：**
```json
{ "ok": true, "data": { "token": "string", "expiresAt": "ISO8601" }, "error": null }
```

---

#### `GET /queries/validateInviteToken`

**调用方：** 参与人（落地页加载时）  
**鉴权：** 需要登录（确认参与人有 openid）

**查询参数：** `?token=xxx`

**逻辑：**
1. 查找 token 记录
2. 若不存在 → `INVALID_TOKEN`
3. 若 `usedAt` 不为 null → `TOKEN_ALREADY_USED`
4. 若 `expiresAt < now` → `TOKEN_EXPIRED`
5. 若调用方已是该模块的 ACTIVE 成员 → `ALREADY_MEMBER`
6. 若调用方是该模块的 OWNER → `IS_OWNER`
7. 通过 → 返回模块名称和权限说明

**响应（有效）：**
```json
{
  "ok": true,
  "data": {
    "moduleInstanceId": "string",
    "moduleType": "menstrual",
    "accessRole": "VIEWER",
    "expiresAt": "ISO8601"
  },
  "error": null
}
```

**响应（无效）：**
```json
{ "ok": false, "data": null, "error": { "code": "TOKEN_EXPIRED", "message": "..." } }
```

错误码：`INVALID_TOKEN` / `TOKEN_ALREADY_USED` / `TOKEN_EXPIRED` / `ALREADY_MEMBER` / `IS_OWNER`

---

#### `POST /commands/acceptInvite`

**调用方：** 参与人（点击「加入」后）  
**鉴权：** 需要登录

**请求体：**
```json
{ "token": "string" }
```

**逻辑（事务内执行）：**
1. 重新校验 token（防止并发/重放），校验失败则返回对应错误码
2. 写入 `ModuleAccess`：`role: VIEWER, accessStatus: ACTIVE`
3. 标记 token：`usedAt = now(), usedByUserId = userId`
4. 更新 `ModuleInstance.sharingStatus = SHARED`

**响应：**
```json
{
  "ok": true,
  "data": { "moduleInstanceId": "string", "accessRole": "VIEWER" },
  "error": null
}
```

---

#### `POST /commands/leaveModule`

**调用方：** 参与人（主动退出）  
**鉴权：** 需要登录，且调用方必须是 VIEWER（不能是 OWNER）

**请求体：**
```json
{ "moduleInstanceId": "string" }
```

**逻辑：**
1. 找到调用方在该模块的 `ModuleAccess`，role 必须不是 OWNER
2. 将 `accessStatus = REVOKED, revokedAt = now()`
3. 若模块内不再有任何 ACTIVE 的非 OWNER 成员，将 `ModuleInstance.sharingStatus = PRIVATE`

**响应：**
```json
{ "ok": true, "data": { "moduleInstanceId": "string" }, "error": null }
```

---

#### `GET /queries/getModuleMembers`

**调用方：** 创建人或参与人（模块管理页加载时）  
**鉴权：** 需要登录，且调用方必须是该模块的 ACTIVE 成员

**查询参数：** `?moduleInstanceId=xxx`

**响应：**
```json
{
  "ok": true,
  "data": {
    "members": [
      { "userId": "string", "role": "OWNER", "accessStatus": "ACTIVE", "grantedAt": "ISO8601" },
      { "userId": "string", "role": "VIEWER", "accessStatus": "ACTIVE", "grantedAt": "ISO8601" }
    ]
  },
  "error": null
}
```

注：头像/昵称由前端通过 `wx.getUserInfo` 或本地缓存补全，后端只返回 userId 和角色信息。

---

### 已有接口（复用，需确认支持 VIEWER 鉴权）

- `POST /commands/revokeModuleAccess`：创建人移除参与人，逻辑不变，确认 `requireOwner` 校验正常
- `GET /queries/*`（日历、预测等）：已有 `requireAccess` 校验，VIEWER 应能正常通过

---

## 前端变更

### 新增页面：`pages/join/index`

在 `pages.json` 中注册（不在 tabBar 中）。

**进入时序：**
1. `onLoad(options)` 取 `options.token`，token 缺失则直接展示"链接无效"
2. 调用 `validateInviteToken`，根据响应展示对应状态

**三种展示状态：**

| 状态 | 内容 |
|------|------|
| 加载中 | loading |
| token 有效 | 模块名 + "你将以只读方式加入" + 「加入」按钮 |
| token 无效/过期/已用/已是成员 | 对应说明文字 + 「回到首页」按钮 |

点击「加入」→ 调 `acceptInvite` → 成功后跳转到该模块主页（只读）。

---

### 现有页面改动：模块管理页

**创建人视角新增：**
- 「分享」按钮：调 `createInviteToken`，拿到 token 后直接触发 `wx.shareAppMessage`
- 参与人列表：成功共享后显示参与人头像/昵称 + 权限标注（「只读」）+ 「移除」操作

**参与人视角（同页面，按 role 渲染不同内容）：**
- 不展示「分享」按钮
- 显示自己的权限标注（「只读」）
- 显示「退出共享」按钮 → 调 `leaveModule`

---

### 只读状态的 UI 处理

在月经记录主页面内按 role 控制，不另建页面：

- `role === 'VIEWER'` 时，所有写操作入口（记录按钮、范围选择、详情编辑等）**隐藏**（不是置灰，避免误导）
- 页面 header 或 tab bar 区域显示「只读」角标，明确告知权限状态

---

## 错误与边界情况

| 场景 | 处理方式 |
|------|---------|
| 参与人已是该模块成员，再次点击同一链接 | `ALREADY_MEMBER` 错误，提示"你已经加入了" |
| 创建人自己打开自己发出的链接 | `IS_OWNER` 错误，提示"这是你自己的模块" |
| token 24h 内未被使用 | `expiresAt` 到期后，`validateInviteToken` 返回 `TOKEN_EXPIRED` |
| 参与人被移除后再次访问模块页 | 鉴权失败，跳转回首页并提示"共享已结束" |
| 创建人移除参与人时，模块内无其他参与人 | `sharingStatus` 自动回到 `PRIVATE` |

---

## 实现顺序建议

1. **数据库迁移**：新增 `InviteToken` 表，`AccessRole` 枚举加入 `VIEWER`
2. **后端接口**：按顺序实现 `createInviteToken` → `validateInviteToken` → `acceptInvite` → `leaveModule`
3. **前端落地页**：`pages/join/index`，先跑通 token 校验和加入流程
4. **前端只读控制**：在月经记录页按 role 隐藏编辑入口
5. **前端模块管理页**：加入分享按钮、参与人列表、退出/移除操作

---

## 本阶段不做

- 权限动态切换（只读 ↔ 共同编辑）
- 参与人管理专属页面（当前在模块管理页内嵌入即可）
- 小程序码（QR code）生成
- 邀请通知/提醒
- 共同编辑模式（`PARTNER` 角色逻辑）

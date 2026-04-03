# Plan A：选择性刷新架构（消除 0.5s 体感延迟）

## 目标

将现有「每次 mutation 后全量 resync」改为「按 mutation 类型选择性刷新」，消除简单操作（切换属性、编辑笔记）后不必要的网络等待。

## 背景

当前瓶颈：`runOptimisticMutation` 和 `runCommand` 成功后都会调用 `refreshHomeSnapshot()`，
该方法无差别地触发多个请求（getModuleHomeView + getCalendarWindow + getDayRecordDetail + getSingleDayPeriodAction）。

即使只改了一个痛感等级，也会重新拉取整个日历窗口。

## 方案：后端返回 affectedScopes，前端选择性刷新

### 核心约定

后端每个 command 接口在响应中增加 `affectedScopes` 字段：

```ts
type Scope = 'dayDetail' | 'calendar' | 'prediction' | 'moduleOverview'

// 现有响应格式
{ ok: true, data: result }

// 新响应格式（向后兼容，无 scopes 时前端降级为全量刷新）
{ ok: true, data: result, affectedScopes: Scope[] }
```

各 scope 含义：

| Scope | 对应前端请求 | 何时触发 |
|---|---|---|
| `dayDetail` | `getDayRecordDetail` + `getSingleDayPeriodAction` | 任何修改当日数据的操作 |
| `calendar` | `getCalendarWindow` | 修改了 isPeriod 字段（影响日历格子显示）|
| `prediction` | `getModuleHomeView` 中的预测部分 | 经期数据变更后 recompute() 重算了预测 |
| `moduleOverview` | `getModuleHomeView` | 模块设置变更（经期时长、预测周期） |

### 安全刷新路由规则（重要）

分析各 command 的 scope 组合，实际上只有两种模式：

- `['dayDetail']` — 属性切换、笔记编辑（不涉及经期数据）
- `['calendar', 'dayDetail', 'prediction']` 或 `['moduleOverview', 'prediction']` — 包含 `prediction`

这意味着前端的刷新逻辑可以简单路由：

```
含 prediction / moduleOverview → refreshHomeSnapshot()（全量，覆盖 calendar + dayDetail + homeView）
仅含 dayDetail               → refreshSelectedDayDetail()（跳过 calendar 和 homeView）
仅含 calendar                → refreshCalendarWindow()（备用，当前无此组合）
空 scopes                    → 不刷新（如 prompt-only 操作）
```

**不使用 Promise.all 并行刷新**：`refreshHomeSnapshot` 做全量替换（`this.rawContracts = result.raw`），而 `refreshCalendarWindow` / `refreshSelectedDayDetail` 做部分合并，并发执行会产生 last-writer-wins 竞态，导致 UI 呈现来自不同时间点的混合状态。

---

## 改动清单

### 契约 / OpenAPI 改动

#### 1. backend/docs/openapi.json — 补充 affectedScopes 字段

所有 command 接口的 response schema 中增加 `affectedScopes` 字段（可选，保持向后兼容）：

```json
"affectedScopes": {
  "type": "array",
  "items": {
    "type": "string",
    "enum": ["dayDetail", "calendar", "prediction", "moduleOverview"]
  },
  "description": "Scopes affected by this command. Frontend uses this to decide which data to refresh."
}
```

> 此字段不加入 `required`，旧客户端忽略即可，前端无 scopes 时降级为全量刷新。

---

### 后端改动

#### 2. 新增 scope 常量定义
**文件：** `backend/src/types/scopes.ts`（新建）

```ts
export type AffectedScope = 'dayDetail' | 'calendar' | 'prediction' | 'moduleOverview'

export function scopeResponse<T>(data: T, scopes: AffectedScope[]) {
  return { ok: true as const, data, affectedScopes: scopes }
}
```

#### 3. phase5.controller.ts — 纯 dayDetail 操作

**`recordDayDetailsHandler`**（当前第 36-43 行）：
- 返回改为 `scopeResponse(result, ['dayDetail'])`
- 原因：改痛感/流量/颜色不影响 isPeriod，日历无需刷新

**`recordDayNoteHandler`**（当前第 45-52 行）：
- 返回改为 `scopeResponse(result, ['dayDetail'])`
- 原因：笔记改动不影响任何日历显示

**`recordDayDetailsBatchHandler`**（当前第 108-122 行）：
- 返回改为 `scopeResponse(result, ['dayDetail'])`

#### 4. dayRecord.controller.ts — 影响 calendar + prediction 的操作

**`recordPeriodDayHandler`**（当前第 30-42 行）：
- 返回改为 `scopeResponse(result, ['calendar', 'dayDetail', 'prediction'])`

**`clearPeriodDayHandler`**（当前第 44-56 行）：
- 返回改为 `scopeResponse(result, ['calendar', 'dayDetail', 'prediction'])`

**`recordPeriodRangeHandler`**（当前第 58-71 行）：
- 返回改为 `scopeResponse(result, ['calendar', 'dayDetail', 'prediction'])`

**`clearPeriodRangeHandler`**（当前第 73-86 行）：
- 返回改为 `scopeResponse(result, ['calendar', 'dayDetail', 'prediction'])`

**`applySingleDayPeriodActionHandler`**（当前第 88-102 行）：
- 如果返回了 prompt（未执行实际操作）：`scopeResponse(result, [])`
- 如果执行了操作：`scopeResponse(result, ['calendar', 'dayDetail', 'prediction'])`
- 具体判断：检查 service 返回中是否有 `segmentChanged === true`，仅此时才包含 `'calendar'` 和 `'prediction'`

#### 5. module-shell controllers — moduleOverview

**`updateDefaultPeriodDurationHandler`**：
- 返回改为 `scopeResponse(result, ['moduleOverview', 'prediction'])`

**`updateDefaultPredictionTermHandler`**：
- 返回改为 `scopeResponse(result, ['moduleOverview', 'prediction'])`

---

### 前端改动

#### 6. home-command-service.js — 修改 commandEnvelope，透传 affectedScopes

**关键问题：** 当前 `commandEnvelope`（第 17 行）只返回 `response.data.data`（内层 payload），
`affectedScopes` 挂在 envelope 顶层（`response.data.affectedScopes`），会被直接丢弃。

**当前代码（第 3-18 行）：**
```js
async function commandEnvelope({ apiBaseUrl, openid, path, data }) {
  const response = await cloudRequest({...})
  if (response.statusCode !== 200 || !response.data?.ok) {
    throw new Error(response.data?.error?.message || `Command failed: ${path}`)
  }
  return response.data.data  // ← affectedScopes 在这里丢失
}
```

**改为：**
```js
async function commandEnvelope({ apiBaseUrl, openid, path, data }) {
  const response = await cloudRequest({...})
  if (response.statusCode !== 200 || !response.data?.ok) {
    throw new Error(response.data?.error?.message || `Command failed: ${path}`)
  }
  return {
    data: response.data.data,
    affectedScopes: response.data.affectedScopes ?? null
  }
}
```

各 command service 函数（`persistSelectedDateDetails` 等）直接 `return commandEnvelope(...)` 即可，
返回结构变为 `{ data: T, affectedScopes: Scope[] | null }`。

**特殊处理：`applySingleDayPeriodAction`**

该函数的返回值（action prompt 信息）在 `handleTogglePeriod` 中被读取，
改动后返回值的 payload 在 `.data` 字段中，调用方需更新解构：

```js
// home.vue handleTogglePeriod 中（示意，需找到实际位置）
// 改前：
const actionResult = await applySingleDayPeriodAction({...})
// 改后：
const { data: actionResult } = await applySingleDayPeriodAction({...})
```

`runCommand` / `runOptimisticMutation` 从返回值中取 `affectedScopes`，
`handleTogglePeriod` 本身不需要感知 scopes，由 `runCommand` 内部处理。

#### 7. home.vue — 新增选择性刷新方法

在当前 `refreshHomeSnapshot()`（第 272-293 行）之后，新增：

```js
// 按 scopes 路由刷新。含 prediction/moduleOverview 时走全量，仅 dayDetail 时走局部。
// 不并行：refreshHomeSnapshot 做全量替换，与部分刷新并发会产生竞态。
async refreshByScopes(scopes) {
  if (!scopes || scopes.length === 0) return

  const needsFullSnapshot =
    scopes.includes('prediction') || scopes.includes('moduleOverview')

  if (needsFullSnapshot) {
    await this.refreshHomeSnapshot(this.activeDate, {
      focusDate: this.focusDate,
      viewMode: this.viewMode
    })
  } else if (scopes.includes('dayDetail')) {
    await this.refreshSelectedDayDetail({
      selectedDate: this.activeDate,
      focusDate: this.focusDate,
      viewMode: this.viewMode
    })
  } else if (scopes.includes('calendar')) {
    await this.refreshCalendarWindow()
  }
},
```

#### 8. home.vue — 修改 runOptimisticMutation

当前代码（第 477-504 行）已正确分离命令失败和刷新失败（命令失败回滚，刷新失败保留乐观值）。
只需将刷新调用从固定的 `refreshHomeSnapshot` 改为 `refreshByScopes`：

```js
async runOptimisticMutation(nextPage, command) {
  if (this.isMutating) return
  const previousPage = this.page
  this.page = nextPage
  this.loadError = ''
  this.isMutating = true

  try {
    const { affectedScopes } = await command()  // ← 解构 affectedScopes
  } catch (error) {
    this.page = previousPage
    this.loadError = error instanceof Error ? error.message : 'Command failed'
    this.isMutating = false
    return
  }

  try {
    if (affectedScopes) {
      await this.refreshByScopes(affectedScopes)     // ← 选择性刷新
    } else {
      await this.refreshHomeSnapshot(this.activeDate, {  // ← 降级兜底
        focusDate: this.focusDate,
        viewMode: this.viewMode
      })
    }
  } catch (error) {
    this.page = nextPage  // 刷新失败保留乐观值，不回滚
    this.loadError = error instanceof Error
      ? `写入成功，但刷新失败：${error.message}`
      : '写入成功，但刷新失败'
  } finally {
    this.isMutating = false
  }
},
```

#### 9. home.vue — 修改 runCommand

当前 `runCommand`（第 505-521 行）命令失败和刷新失败在同一 try 块，且无法区分错误来源。
修改为分两段 try/catch，同时支持 affectedScopes：

```js
async runCommand(command) {
  if (this.isMutating) return
  this.loadError = ''
  this.isMutating = true

  let affectedScopes = null
  try {
    const result = await command()  // ← 命令失败在这里 catch
    affectedScopes = result?.affectedScopes ?? null
  } catch (error) {
    this.loadError = error instanceof Error ? error.message : 'Command failed'
    this.isMutating = false
    return
  }

  try {
    if (affectedScopes) {
      await this.refreshByScopes(affectedScopes)
    } else {
      await this.refreshHomeSnapshot(this.activeDate, {
        focusDate: this.focusDate,
        viewMode: this.viewMode
      })
    }
  } catch (error) {
    // 命令已成功，刷新失败不影响写入结果
    this.loadError = error instanceof Error
      ? `写入成功，但刷新失败：${error.message}`
      : '写入成功，但刷新失败'
  } finally {
    this.isMutating = false
  }
},
```

---

### 前端改动（module shell / index.vue）

#### 10. index.vue — settings 操作加乐观更新

当前 `handleSettingsOptionSelect`（第 267-280 行）：
```js
async handleSettingsOptionSelect(days) {
  await persistModuleSettings({...})
  await this.retryInitialLoad()  // 全页 reload
}
```

改为（命令失败和 reload 失败分离，各自处理）：
```js
async handleSettingsOptionSelect(days) {
  const nextPage = applySettingsOptionToPageModel(this.page, days)
  const prevPage = this.page
  this.page = nextPage  // 乐观更新

  // 只在命令本身失败时回滚 UI
  try {
    await persistModuleSettings({...})
  } catch (e) {
    this.page = prevPage
    this.loadError = e instanceof Error ? e.message : 'Command failed'
    return
  }

  // reload 失败不回滚（服务器已提交，保持乐观值，提示用户）
  try {
    await this.retryInitialLoad()
  } catch (e) {
    this.loadError = `写入成功，但刷新失败：${e instanceof Error ? e.message : ''}`
  }
}
```

> 注：`applySettingsOptionToPageModel` 是新增的纯函数，在现有 module-shell view model 文件中添加。

---

## 预期效果

| 操作 | 改前 | 改后 | 节省 |
|---|---|---|---|
| 切换痛感/流量/颜色 | refreshHomeSnapshot（全量）| refreshSelectedDayDetail（仅当日）| 减少约 2 个请求 |
| 编辑笔记 | refreshHomeSnapshot（全量）| refreshSelectedDayDetail（仅当日）| 减少约 2 个请求 |
| 标记/取消经期 | refreshHomeSnapshot | refreshHomeSnapshot（via scopes）| 不变 |
| 经期智能操作 | refreshHomeSnapshot | refreshHomeSnapshot（via scopes）| 不变 |
| 修改模块设置 | 全页 reload | 乐观更新 + refreshHomeSnapshot | 消除全页闪烁 |

---

## 实施顺序建议

1. 契约：更新 `backend/docs/openapi.json`（先定义接口契约）
2. 后端：新增 `backend/src/types/scopes.ts`
3. 后端：`phase5.controller.ts` 添加 scopes（最简单，无逻辑变化）
4. 前端：`home-command-service.js` 修改 `commandEnvelope` 返回结构
5. 前端：`home.vue` 新增 `refreshByScopes`，修改 `runOptimisticMutation` 和 `runCommand`
6. 验证：切换属性只触发 `refreshSelectedDayDetail`（网络面板确认）
7. 后端：`dayRecord.controller.ts` 添加 scopes
8. 前端：修复 `handleTogglePeriod` 中对 `applySingleDayPeriodAction` 返回值的解构
9. 验证：经期操作仍走全量刷新
10. 后端：module shell controllers 添加 scopes
11. 前端：`index.vue` settings 加乐观更新

## 测试要点

- [ ] 切换属性后，`refreshHomeSnapshot` 不被调用（网络面板验证）
- [ ] 切换属性后，日历格子状态不变（不该变）
- [ ] 切换属性后，当日详情面板正确更新
- [ ] 标记经期后，全量刷新仍然执行（日历格子变色、预测更新）
- [ ] applySingleDayPeriodAction 仅返回 prompt 时，不触发任何刷新
- [ ] applySingleDayPeriodAction 的 prompt 逻辑不受影响（handleTogglePeriod 解构正确）
- [ ] 乐观更新命令失败时，UI 正确回滚
- [ ] 命令成功但刷新失败时，UI 保持乐观值，显示「写入成功，但刷新失败」
- [ ] settings 写入成功但 reload 失败时，UI 保持新值（不回滚）
- [ ] settings 写入失败时，UI 回滚到旧值
- [ ] 老版本后端（无 affectedScopes）能降级到全量刷新

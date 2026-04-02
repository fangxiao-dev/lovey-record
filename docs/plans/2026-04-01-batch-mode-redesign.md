# Batch Mode Redesign + Today Date Fix

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 接入真实今天日期；重设计 batch selection 使 SelectedDatePanel 在批量模式下可见，保存行为解耦为"月经状态"和"记录详情"两个独立操作。

**Architecture:** 分两条主线：(1) 极小修改——DEFAULT context 改用 `new Date()` 替换硬编码日期；(2) 后端新增 `recordDayDetailsBatch` 接口，前端 batch mode 保留 SelectedDatePanel、通过 `batchDraft` 状态驱动批量写入，panel 显示隐藏通过新 `showNote` prop 控制。batch 的月经写入复用现有 range 接口；详情写入走新批量接口（仅当任意 level 非 null 时调用）。

**Tech Stack:** Node.js/Express/Prisma (backend), uni-app Vue 2 SFC (frontend), Jest (backend tests)

---

## Task 1: 修复硬编码 today 日期

**Files:**
- Modify: `frontend/services/menstrual/module-shell-service.js`
- Modify: `frontend/services/menstrual/home-contract-service.js`

**Step 1: 修改 module-shell-service.js**

找到：
```javascript
export const DEFAULT_MODULE_SHELL_CONTEXT = Object.freeze({
	apiBaseUrl: API_BASE_URL,
	openid: 'seed-home-openid',
	moduleInstanceId: 'seed-home-module',
	profileId: 'seed-home-profile',
	partnerUserId: 'seed-shared-partner',
	today: '2026-03-29'
});
```

改为（仅改 today 这一行）：
```javascript
export const DEFAULT_MODULE_SHELL_CONTEXT = Object.freeze({
	apiBaseUrl: API_BASE_URL,
	openid: 'seed-home-openid',
	moduleInstanceId: 'seed-home-module',
	profileId: 'seed-home-profile',
	partnerUserId: 'seed-shared-partner',
	today: new Date().toISOString().slice(0, 10)
});
```

**Step 2: 修改 home-contract-service.js**

找到：
```javascript
export const DEFAULT_MENSTRUAL_HOME_CONTEXT = Object.freeze({
	apiBaseUrl: API_BASE_URL,
	openid: 'seed-home-openid',
	moduleInstanceId: 'seed-home-module',
	profileId: 'seed-home-profile',
	today: '2026-03-29'
});
```

改为：
```javascript
export const DEFAULT_MENSTRUAL_HOME_CONTEXT = Object.freeze({
	apiBaseUrl: API_BASE_URL,
	openid: 'seed-home-openid',
	moduleInstanceId: 'seed-home-module',
	profileId: 'seed-home-profile',
	today: new Date().toISOString().slice(0, 10)
});
```

**Step 3: 手动验证**

重新编译，进入日历页，确认三周视图中间那行包含今天（2026-04-01）。

**Step 4: Commit**

```bash
git add frontend/services/menstrual/module-shell-service.js frontend/services/menstrual/home-contract-service.js
git commit -m "frontend: resolve today date dynamically via new Date()"
```

---

## Task 2: 后端 service — `recordDayDetailsBatch`

**Files:**
- Modify: `backend/src/services/phase5.service.ts`（在文件末尾追加）
- Test: `backend/tests/services/phase5.service.test.ts`（在现有 describe 块内追加）

### Step 1: 写失败测试

在 `backend/tests/services/phase5.service.test.ts` 的 `describe('phase5.service', ...)` 块末尾追加：

```typescript
  it('batch-updates details on multiple existing day records', async () => {
    (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({
      id: 'module-1', profileId: 'profile-1', ownerUserId: 'user-1',
    });
    (prisma.dayRecord.upsert as jest.Mock).mockResolvedValue({ id: 'day-x' });

    const result = await recordDayDetailsBatch({
      moduleInstanceId: 'module-1',
      userId: 'user-1',
      dates: ['2026-04-01', '2026-04-02'],
      flowLevel: 2,
      painLevel: null,
      colorLevel: null,
    });

    expect(result.updatedCount).toBe(2);
    expect(prisma.dayRecord.upsert).toHaveBeenCalledTimes(2);
    // update object must NOT include painLevel or colorLevel (null fields excluded)
    const updateArg = (prisma.dayRecord.upsert as jest.Mock).mock.calls[0][0].update;
    expect(updateArg).toEqual({ flowLevel: 2 });
    expect(updateArg).not.toHaveProperty('painLevel');
  });

  it('returns updatedCount 0 when dates array is empty', async () => {
    (prisma.moduleInstance.findFirst as jest.Mock).mockResolvedValue({
      id: 'module-1', profileId: 'profile-1', ownerUserId: 'user-1',
    });

    const result = await recordDayDetailsBatch({
      moduleInstanceId: 'module-1',
      userId: 'user-1',
      dates: [],
      flowLevel: 3,
      painLevel: 2,
      colorLevel: null,
    });

    expect(result.updatedCount).toBe(0);
    expect(prisma.dayRecord.upsert).not.toHaveBeenCalled();
  });
```

也要在文件顶部的 import 里加入 `recordDayDetailsBatch`：
```typescript
import {
  recordDayDetails,
  recordDayNote,
  recordDayDetailsBatch,   // ← 新增
  shareModuleInstance,
  revokeModuleAccess,
  getCalendarWindow,
  getPredictionSummary,
} from '../../src/services/phase5.service';
```

### Step 2: 跑测试，确认失败

```bash
cd backend && npx jest tests/services/phase5.service.test.ts --no-coverage
```

Expected: `recordDayDetailsBatch is not a function` 或类似导出缺失的错误。

### Step 3: 实现 `recordDayDetailsBatch`

在 `backend/src/services/phase5.service.ts` 末尾追加（`recordDayNote` 之后）：

```typescript
export async function recordDayDetailsBatch(input: {
  moduleInstanceId: string;
  userId: string;
  dates: string[];
  painLevel: number | null;
  flowLevel: number | null;
  colorLevel: number | null;
}) {
  if (!input.dates.length) {
    return { updatedCount: 0 };
  }

  const moduleInstance = await requireMaintenance(input.moduleInstanceId, input.userId);
  const profileId = moduleInstance.profileId;

  // Only update the non-null levels; null means "leave existing value unchanged"
  const detailUpdate: Record<string, number> = {};
  if (input.flowLevel !== null) detailUpdate.flowLevel = input.flowLevel;
  if (input.painLevel !== null) detailUpdate.painLevel = input.painLevel;
  if (input.colorLevel !== null) detailUpdate.colorLevel = input.colorLevel;

  let updatedCount = 0;
  for (const isoDate of input.dates) {
    const date = toDateOnly(isoDate);
    await prisma.dayRecord.upsert({
      where: {
        moduleInstanceId_profileId_date: {
          moduleInstanceId: input.moduleInstanceId,
          profileId,
          date,
        },
      },
      create: {
        moduleInstanceId: input.moduleInstanceId,
        profileId,
        date,
        isPeriod: false,
        painLevel: input.painLevel,
        flowLevel: input.flowLevel,
        colorLevel: input.colorLevel,
        note: null,
        source: 'MANUAL',
      },
      update: detailUpdate,
    });
    updatedCount += 1;
  }

  return { updatedCount };
}
```

### Step 4: 跑测试，确认通过

```bash
cd backend && npx jest tests/services/phase5.service.test.ts --no-coverage
```

Expected: 所有用例 PASS。

### Step 5: Commit

```bash
git add backend/src/services/phase5.service.ts backend/tests/services/phase5.service.test.ts
git commit -m "backend: add recordDayDetailsBatch service — batch-write detail levels to multiple dates"
```

---

## Task 3: 后端 controller + route + integration test

**Files:**
- Modify: `backend/src/controllers/phase5.controller.ts`（追加 handler）
- Modify: `backend/src/routes/commands.ts`（追加路由）
- Test: `backend/tests/integration/commands.integration.test.ts`（追加用例）

### Step 1: 写失败集成测试

在 `backend/tests/integration/commands.integration.test.ts` 文件顶部的 import 中加入：
```typescript
import { recordDayDetails, recordDayNote, recordDayDetailsBatch } from '../../src/services/phase5.service';
```

在 `jest.mock('../../src/services/phase5.service')` 那行已经会 mock 所有导出，不需要改。

在 describe 块末尾追加：
```typescript
  it('batch-records day details through the command endpoint', async () => {
    (findOrCreateUser as jest.Mock).mockResolvedValue({ id: 'user-1', openid: 'openid-1' });
    (recordDayDetailsBatch as jest.Mock).mockResolvedValue({ updatedCount: 3 });

    const response = await request(app)
      .post('/api/commands/recordDayDetailsBatch')
      .set('x-wx-openid', 'openid-1')
      .send({
        moduleInstanceId: 'module-1',
        dates: ['2026-04-01', '2026-04-02', '2026-04-03'],
        flowLevel: 2,
        painLevel: null,
        colorLevel: null,
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      data: { updatedCount: 3 },
      error: null,
    });
    expect(recordDayDetailsBatch).toHaveBeenCalledWith({
      moduleInstanceId: 'module-1',
      userId: 'user-1',
      dates: ['2026-04-01', '2026-04-02', '2026-04-03'],
      flowLevel: 2,
      painLevel: null,
      colorLevel: null,
    });
  });
```

### Step 2: 跑测试，确认失败

```bash
cd backend && npx jest tests/integration/commands.integration.test.ts --no-coverage
```

Expected: 404 或 `recordDayDetailsBatch is not a function`。

### Step 3: 添加 controller handler

在 `backend/src/controllers/phase5.controller.ts` 的 import 中加入 `recordDayDetailsBatch`：
```typescript
import {
  getCalendarWindow,
  getPredictionSummary,
  recordDayDetails,
  recordDayDetailsBatch,   // ← 新增
  recordDayNote,
  revokeModuleAccess,
  shareModuleInstance,
} from '../services/phase5.service';
```

在文件末尾追加 handler：
```typescript
export async function recordDayDetailsBatchHandler(req: Request, res: Response) {
  try {
    const result = await recordDayDetailsBatch({
      moduleInstanceId: req.body.moduleInstanceId,
      userId: req.user.id,
      dates: req.body.dates,
      flowLevel: req.body.flowLevel ?? null,
      painLevel: req.body.painLevel ?? null,
      colorLevel: req.body.colorLevel ?? null,
    });
    res.json({ ok: true, data: result, error: null });
  } catch (error) {
    handleError(res, error);
  }
}
```

### Step 4: 注册路由

在 `backend/src/routes/commands.ts` 中：

import 行加入：
```typescript
import {
  recordDayDetailsHandler,
  recordDayDetailsBatchHandler,   // ← 新增
  recordDayNoteHandler,
  revokeModuleAccessHandler,
  shareModuleInstanceHandler,
  updateDefaultPeriodDurationHandler,
} from '../controllers/phase5.controller';
```

在 `router.post('/recordDayDetails', ...)` 下方追加：
```typescript
router.post('/recordDayDetailsBatch', recordDayDetailsBatchHandler);
```

### Step 5: 跑测试，确认通过

```bash
cd backend && npx jest tests/integration/commands.integration.test.ts --no-coverage
```

Expected: 所有用例 PASS。

### Step 6: 跑全套后端测试

```bash
cd backend && npx jest --no-coverage
```

Expected: 全部 PASS，无回归。

### Step 7: Commit

```bash
git add backend/src/controllers/phase5.controller.ts backend/src/routes/commands.ts backend/tests/integration/commands.integration.test.ts
git commit -m "backend: expose recordDayDetailsBatch as POST /api/commands/recordDayDetailsBatch"
```

---

## Task 4: 导出 `createOptionRows` / `createSummaryItems`

**Files:**
- Modify: `frontend/components/menstrual/home-contract-adapter.js`

### Step 1: 加 export

找到 `function createOptionRows(dayRecord) {`，在前面加 `export`：
```javascript
export function createOptionRows(dayRecord) {
```

找到 `function createSummaryItems(dayRecord) {`，同样加 `export`：
```javascript
export function createSummaryItems(dayRecord) {
```

这两个函数接受带 `{ flowLevel, painLevel, colorLevel }` 字段的对象，与 `batchDraft` 结构完全一致。

### Step 2: Commit

```bash
git add frontend/components/menstrual/home-contract-adapter.js
git commit -m "frontend: export createOptionRows and createSummaryItems from home-contract-adapter"
```

---

## Task 5: SelectedDatePanel — 新增 `showNote` prop

**Files:**
- Modify: `frontend/components/menstrual/SelectedDatePanel.vue`

### Step 1: 添加 prop

在 `props` 对象末尾加入：
```javascript
showNote: {
  type: Boolean,
  default: true
}
```

### Step 2: 用 `v-if` 包裹 note block

找到：
```html
<view class="selected-date-panel__note-block">
```

改为：
```html
<view v-if="showNote" class="selected-date-panel__note-block">
```

### Step 3: 手动验证（H5 预览）

在 H5 dev server 里打开 SelectedDatePanel showcase，确认备注栏仍然正常显示（`showNote` 默认 true，不影响现有行为）。

### Step 4: Commit

```bash
git add frontend/components/menstrual/SelectedDatePanel.vue
git commit -m "frontend: add showNote prop to SelectedDatePanel to hide note textarea in batch mode"
```

---

## Task 6: home-command-service — 新增 `persistBatchDateDetails`

**Files:**
- Modify: `frontend/services/menstrual/home-command-service.js`

### Step 1: 追加函数

在 `persistBatchPeriodRange` 之后追加：

```javascript
export async function persistBatchDateDetails({ context, dates, flowLevel, painLevel, colorLevel }) {
	return commandEnvelope({
		apiBaseUrl: context.apiBaseUrl,
		openid: context.openid,
		path: '/api/commands/recordDayDetailsBatch',
		data: {
			moduleInstanceId: context.moduleInstanceId,
			dates,
			flowLevel: flowLevel ?? null,
			painLevel: painLevel ?? null,
			colorLevel: colorLevel ?? null,
		}
	});
}
```

### Step 2: Commit

```bash
git add frontend/services/menstrual/home-command-service.js
git commit -m "frontend: add persistBatchDateDetails to home-command-service"
```

---

## Task 7: home.vue — Batch mode 面板重设计（主体工作）

**Files:**
- Modify: `frontend/pages/menstrual/home.vue`

这是变更最多的一步，拆成若干 sub-step。

### Step 7a: 更新 imports

在 `<script>` import 区域，加入两个新引用：

```javascript
import {
  // ... 现有 imports ...
  applyToggleAttributeOptionToPageModel,    // 已有
  // ...
} from '../../components/menstrual/home-contract-adapter.js';
```

新增：
```javascript
import {
  createOptionRows,
  createSummaryItems
} from '../../components/menstrual/home-contract-adapter.js';
```

以及：
```javascript
import {
  persistBatchPeriodRange,
  persistBatchDateDetails,   // ← 新增
  // ... 其他已有 imports
} from '../../services/menstrual/home-command-service.js';
```

### Step 7b: 添加 `batchDraft` 到 data()

在 `data()` 返回对象中，`batchStartKey: null` 之后加入：

```javascript
batchDraft: {
  isPeriod: true,
  flowLevel: null,
  painLevel: null,
  colorLevel: null
},
```

### Step 7c: 添加 computed 属性

在 `computed` 对象中，`selectedBatchKeys()` 之后追加：

```javascript
batchPanelTitle() {
  const cells = this.allCalendarCells.filter(c => this.selectedBatchKeys.includes(c.key) && c.isoDate);
  if (!cells.length) return '批量记录';
  const fmt = d => d.slice(5).replace('-', '/');
  const first = cells[0].isoDate;
  const last = cells[cells.length - 1].isoDate;
  return first === last
    ? `批量记录 ${fmt(first)}`
    : `批量记录 ${fmt(first)}-${fmt(last)}`;
},
batchPanelAttributeRows() {
  return createOptionRows(this.batchDraft);
},
batchPanelSummaryItems() {
  return createSummaryItems(this.batchDraft);
},
```

### Step 7d: 更新 template 中的 SelectedDatePanel

找到现有 SelectedDatePanel：
```html
<SelectedDatePanel
  v-if="panelMode !== 'batch'"
  :title="page.selectedDatePanel.title"
  :badge="page.selectedDatePanel.badge"
  :summary-items="page.selectedDatePanel.summaryItems"
  :attribute-rows="page.selectedDatePanel.attributeRows"
  :note="page.selectedDatePanel.note"
  :initial-period-marked="page.selectedDatePanel.initialPeriodMarked"
  :initial-editor-open="page.selectedDatePanel.initialEditorOpen"
  @toggle-attribute-option="handleToggleAttributeOption"
  @clear-attributes="handleClearAttributes"
  @toggle-period="handleTogglePeriod"
  @note-change="handleNoteChange"
/>
```

替换为：
```html
<SelectedDatePanel
  v-if="page"
  :title="panelMode === 'batch' ? batchPanelTitle : page.selectedDatePanel.title"
  :badge="panelMode === 'batch' ? '' : page.selectedDatePanel.badge"
  :summary-items="panelMode === 'batch' ? batchPanelSummaryItems : page.selectedDatePanel.summaryItems"
  :attribute-rows="panelMode === 'batch' ? batchPanelAttributeRows : page.selectedDatePanel.attributeRows"
  :note="panelMode === 'batch' ? '' : page.selectedDatePanel.note"
  :initial-period-marked="panelMode === 'batch' ? batchDraft.isPeriod : page.selectedDatePanel.initialPeriodMarked"
  :initial-editor-open="panelMode === 'batch' ? false : page.selectedDatePanel.initialEditorOpen"
  :show-note="panelMode !== 'batch'"
  @toggle-attribute-option="handleToggleAttributeOption"
  @clear-attributes="handleClearAttributes"
  @toggle-period="handleTogglePeriod"
  @note-change="handleNoteChange"
/>
```

### Step 7e: 修改事件 handlers，增加 batch 分支

**`handleTogglePeriod`**（现有方法整体替换）：
```javascript
handleTogglePeriod(isPeriodMarked) {
  if (this.panelMode === 'batch') {
    this.batchDraft = { ...this.batchDraft, isPeriod: isPeriodMarked };
    return;
  }
  const nextPage = applyTogglePeriodToPageModel(this.page, isPeriodMarked);
  return this.runOptimisticMutation(nextPage, () => persistSelectedDatePeriodState({
    context: this.contractContext,
    activeDate: this.activeDate,
    pageModel: nextPage,
    isPeriodMarked
  }));
},
```

**`handleToggleAttributeOption`**（现有方法整体替换）：
```javascript
handleToggleAttributeOption(payload) {
  if (this.panelMode === 'batch') {
    const row = this.batchPanelAttributeRows.find(r => r.key === payload.rowKey);
    if (!row) return;
    const optionIndex = row.options.findIndex(o => o.key === payload.optionKey);
    if (optionIndex === -1) return;
    const level = optionIndex + 1;
    const levelKey = `${payload.rowKey}Level`;
    const currentLevel = this.batchDraft[levelKey];
    this.batchDraft = {
      ...this.batchDraft,
      [levelKey]: currentLevel === level ? null : level
    };
    return;
  }
  const nextPage = applyToggleAttributeOptionToPageModel(this.page, payload);
  return this.runOptimisticMutation(nextPage, () => persistSelectedDateDetails({
    context: this.contractContext,
    activeDate: this.activeDate,
    pageModel: nextPage
  }));
},
```

**`handleClearAttributes`**（现有方法整体替换）：
```javascript
handleClearAttributes() {
  if (this.panelMode === 'batch') {
    this.batchDraft = { ...this.batchDraft, flowLevel: null, painLevel: null, colorLevel: null };
    return;
  }
  const nextPage = applyClearAttributesToPageModel(this.page);
  return this.runOptimisticMutation(nextPage, () => persistSelectedDateDetails({
    context: this.contractContext,
    activeDate: this.activeDate,
    pageModel: nextPage
  }));
},
```

### Step 7f: 修改 `handleBatchStart`，进入时重置 batchDraft

在 `handleBatchStart(cell)` 方法的 `panelMode = 'batch'` 赋值之后，立即加一行：
```javascript
this.batchDraft = { isPeriod: true, flowLevel: null, painLevel: null, colorLevel: null };
```

### Step 7g: 更新 `applyBatchAction`，整体替换

```javascript
applyBatchAction() {
  if (!this.selectedBatchKeys.length) return;
  const ranges = this.buildBatchRanges(this.selectedBatchKeys);

  return this.runCommand(async () => {
    // 1. Period: apply to each contiguous range
    for (const range of ranges) {
      await persistBatchPeriodRange({
        context: this.contractContext,
        action: this.batchDraft.isPeriod ? 'set-period' : 'clear-record',
        startDate: range.startDate,
        endDate: range.endDate
      });
    }

    // 2. Details: only if user set at least one level
    const { flowLevel, painLevel, colorLevel } = this.batchDraft;
    if (flowLevel !== null || painLevel !== null || colorLevel !== null) {
      const dates = this.allCalendarCells
        .filter(c => this.selectedBatchKeys.includes(c.key) && c.isoDate)
        .map(c => c.isoDate);
      await persistBatchDateDetails({
        context: this.contractContext,
        dates,
        flowLevel,
        painLevel,
        colorLevel
      });
    }

    this.cancelBatchMode();
  });
},
```

### Step 7h: 手动测试 checklist

在微信开发者工具模拟器里按以下顺序验证：

1. **进入 batch mode**：长按日历格子进入批量选择，确认 SelectedDatePanel 仍然显示，title 为 "批量记录 04/01"（或实际日期），经期 chip 高亮（已选）
2. **划选多格**：选中 3-4 天，title 变为 "批量记录 04/01-04/04"
3. **默认保存为月经**：不做其他操作，点保存，确认选中日期变为月经状态
4. **取消月经保存**：重新进入 batch，取消经期 chip，保存，确认月经态被清除
5. **展开详情批量保存**：进入 batch，展开 +记录详情，选择流量=少，保存，确认所有选中日期有流量记录
6. **月经+详情同时**：进入 batch，经期保持选中，同时选流量+痛感，保存，确认两者同时写入
7. **备注区域**：确认 batch mode 下备注 textarea 不显示
8. **单日模式不受影响**：退出 batch，点击单日，面板恢复正常，期数/详情/备注均可操作

### Step 7i: Commit

```bash
git add frontend/pages/menstrual/home.vue
git commit -m "frontend: redesign batch mode — panel stays visible, period and details are independent"
```

---

## Task 8: 推送并验证体验版

### Step 1: 推送后端

```bash
git push origin master
```

等待 CI/CD 完成部署（约 2-3 分钟）。

### Step 2: 上传前端体验版

1. HBuilderX → 发行 → 微信小程序（重新编译）
2. 微信开发者工具 → 上传 → 填写版本号
3. 微信公众平台 → 版本管理 → 设为体验版

### Step 3: 真机验证

用体验版验证 Task 7h 的 checklist，确认云托管接口正常响应。

---

## 完成标准

- [ ] 日历进入时自动对齐到真实今天所在行居中
- [ ] batch mode 下 SelectedDatePanel 可见
- [ ] batch mode title 显示 "批量记录 MM/DD-MM/DD"
- [ ] 经期和详情独立写入，互不影响
- [ ] 备注区域在 batch mode 下隐藏
- [ ] 单日模式操作完全不受影响
- [ ] 后端全套测试通过

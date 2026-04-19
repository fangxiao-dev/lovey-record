# 聚焦视图导航 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为 menstrual home 的 `3 周` 聚焦视图实现“前一次 / 后一次”经期导航、条件式首行优先窗口落位，以及 `下次预测` 末端的 inline 边界反馈。

**Architecture:** 本次改动分为三层：先在 `home-contract-adapter` / 页面状态层补齐“聚焦节点”和导航目标的纯数据规则，再在 `HeaderNav` 与 `home.vue` 上实现文案、invalid 状态与 inline 提示，最后补上窗口落位策略与手动回归验证。`月览` 的 browse-only 语义保持不变，不复用或修改现有 `月览可编辑` plan。

**Tech Stack:** Vue 3 Options API, uni-app, SCSS, Node built-in `node:test`

---

## 背景约束

- 正式交互合同以 `docs/design/menstrual/function-calendar.md` 为准。
- UI 呈现合同以 `docs/design/menstrual/frontend-calendar.md` 为准。
- 首页级语义以 `docs/design/menstrual/function-home.md` 为准。
- 本 plan 只覆盖 `3 周` 聚焦视图，不改变 `月览` 的 browse-only 定位。

---

### Task 1: 纯数据层补齐聚焦节点与前后导航目标

**Files:**
- Modify: `frontend/components/menstrual/home-contract-adapter.js`
- Test: `frontend/components/menstrual/__tests__/home-contract-adapter.test.mjs`

**Step 1: 写失败测试，覆盖聚焦节点序列**

在测试文件中新增聚焦视图场景：

- focus 位于真实经期开始日时，能得到 `previousPeriodStart` / `nextPeriodStart`
- focus 位于最近一次真实经期时，`nextPeriodStart` 可以落到 `prediction_start`
- focus 位于 `prediction_start` 时，前一个目标回到最近一次真实经期，后一个目标为 `null`

测试命名建议：

```js
test('createMenstrualHomePageModel exposes focused navigation targets for real periods', () => {})
test('createMenstrualHomePageModel exposes prediction node as terminal next target', () => {})
test('createMenstrualHomePageModel marks prediction node as forward-invalid', () => {})
```

**Step 2: 运行测试，确认新增用例失败**

Run:

```bash
node --test frontend/components/menstrual/__tests__/home-contract-adapter.test.mjs
```

Expected:

- 新增用例 FAIL
- 失败原因应指向缺少 `headerNav` / page model 导航字段或目标值不对

**Step 3: 在 adapter 中补齐聚焦导航字段**

在 `home-contract-adapter.js` 中增加纯函数，基于现有：

- `currentStatusSummary.previousSegment`
- 最新真实 segment
- `predictionSummary.predictedStartDate`
- 当前 `focusDate`

推导以下字段，挂到 `headerNav` 或页面等价浏览状态上：

```js
{
  previousPeriodStart: 'YYYY-MM-DD' | null,
  nextPeriodStart: 'YYYY-MM-DD' | null,
  focusedNodeType: 'real-period' | 'prediction',
  isForwardBoundary: boolean
}
```

规则：

- `previousPeriodStart` / `nextPeriodStart` 的单位是“经期开始日”
- `prediction_start` 只作为序列末端节点出现，不再继续向后扩展
- 当 focus 命中 `prediction_start` 时：
  - `focusedNodeType = 'prediction'`
  - `isForwardBoundary = true`
  - `nextPeriodStart = null`

**Step 4: 运行测试，确认通过**

Run:

```bash
node --test frontend/components/menstrual/__tests__/home-contract-adapter.test.mjs
```

Expected:

- 新增聚焦导航测试 PASS
- 既有 adapter 测试继续 PASS

**Step 5: Commit**

```bash
git add frontend/components/menstrual/home-contract-adapter.js frontend/components/menstrual/__tests__/home-contract-adapter.test.mjs
git commit -m "feat(menstrual): expose focused-view navigation targets"
```

---

### Task 2: 页面状态层接入聚焦视图前后导航

**Files:**
- Modify: `frontend/pages/menstrual/home.vue`

**Step 1: 梳理现有 header 导航入口**

定位并记录：

- `handleHeaderPrev`
- `handleHeaderNext`
- 当前 `applyLocalBrowseState`
- 当前 `refreshCalendarWindow`

确认哪些逻辑仍按自然日期平移，哪些逻辑已经接受任意 `focusDate`。

**Step 2: 重写 header 导航目标来源**

将 `handleHeaderPrev` / `handleHeaderNext` 调整为优先使用页面模型中的：

```js
page.headerNav.previousPeriodStart
page.headerNav.nextPeriodStart
page.headerNav.isForwardBoundary
```

行为要求：

- `handleHeaderPrev` 跳到 `previousPeriodStart`
- `handleHeaderNext` 跳到 `nextPeriodStart`
- 如果目标为 `null`，不做默认日期平移兜底

**Step 3: 在 forward invalid 时保留点击但不导航**

为 `handleHeaderNext` 增加边界分支：

- 若 `page.headerNav.isForwardBoundary === true`
- 不触发新浏览请求
- 改为触发一个本地 inline feedback 状态

新增页面状态字段建议：

```js
headerInlineMessage: '',
headerInlineMessageTimer: null
```

**Step 4: 实现 inline feedback 的显示/清理机制**

规则：

- 文案固定为 `暂无更后的月经记录`
- 只在点击 invalid `后一次>>` 时出现
- 不弹 modal，不 toast 到全局
- 再次点击可刷新显示时长
- 在成功导航、切换视图、离开页面时清空

**Step 5: 手动自测**

- 从真实经期节点点 `后一次>>`，确认跳到下一次真实经期或 `下次预测`
- 到 `下次预测` 后再点 `后一次>>`，确认只出现 inline 提示
- 在 `下次预测` 点 `<<前一次`，确认回到最近一次真实经期

**Step 6: Commit**

```bash
git add frontend/pages/menstrual/home.vue
git commit -m "feat(menstrual): wire focused-view header navigation"
```

---

### Task 3: HeaderNav 组件改为聚焦视图文案与 invalid 呈现

**Files:**
- Modify: `frontend/components/menstrual/HeaderNav.vue`
- Modify: `frontend/pages/menstrual/home.vue`

**Step 1: 为 HeaderNav 补齐显式文案 props / state**

如果组件当前仍是箭头按钮，增加可表达聚焦视图语义的 props：

```js
prevLabel: { type: String, default: '<<前一次' },
nextLabel: { type: String, default: '后一次>>' },
nextInvalid: { type: Boolean, default: false },
inlineMessage: { type: String, default: '' }
```

**Step 2: 更新模板**

要求：

- 左右按钮显示文案而不是只有箭头
- 月份标题仍保持视觉中心
- invalid 的 `后一次>>` 不隐藏
- inline message 在 HeaderNav 内或紧邻 HeaderNav 的动作区域展示

**Step 3: 更新样式**

视觉要求：

- 按钮保留轻量级文本导航感，不做高占比主按钮
- invalid 态使用 muted treatment
- inline message 要像原位反馈，不像 toast 或弹窗

**Step 4: 从 home.vue 传值**

将页面状态中的：

- `page.headerNav.isForwardBoundary`
- `headerInlineMessage`

传入 `HeaderNav`

**Step 5: 手动自测**

- 默认状态下，HeaderNav 文案为 `<<前一次` / `后一次>>`
- 到序列末端时，右侧文案保留但变 muted
- 点击 invalid 按钮时，inline feedback 出现在动作区域附近

**Step 6: Commit**

```bash
git add frontend/components/menstrual/HeaderNav.vue frontend/pages/menstrual/home.vue
git commit -m "feat(menstrual): present focused-view header nav states"
```

---

### Task 4: 实现条件式首行优先窗口落位

**Files:**
- Modify: `frontend/components/menstrual/home-contract-adapter.js`
- Test: `frontend/components/menstrual/__tests__/home-contract-adapter.test.mjs`

**Step 1: 写失败测试，覆盖窗口落位规则**

新增场景：

- 默认窗口已足够好时，继续沿用现有窗口起点
- 当默认窗口会让本次经期主体明显压到第 3 行时，窗口起点前移或后移，使经期首日落到第 1 行
- 当收益不明显时，不启用首行优先

测试命名建议：

```js
test('three-week focused view keeps default window placement when first-row gain is weak', () => {})
test('three-week focused view prefers first-row placement when it clearly improves period readability', () => {})
```

**Step 2: 运行测试，确认失败**

Run:

```bash
node --test frontend/components/menstrual/__tests__/home-contract-adapter.test.mjs
```

Expected:

- 新增窗口落位测试 FAIL

**Step 3: 在 adapter 中提取窗口起点决策函数**

将当前 3 周窗口计算提取为独立函数，例如：

```js
function resolveThreeWeekWindowStart({
  focusDate,
  focusedNodeType,
  visiblePeriodRange,
  preferFirstRowWhenHelpful
}) {}
```

规则：

- 默认返回当前窗口起点逻辑
- 仅在 `focusedNodeType === 'real-period'` 或需要展示预测周期主体时评估首行优先
- 只有当首行优先能明显改善当前周期主体的连续阅读时才启用
- 返回值仍必须对应固定 `21` 天窗口的起点

**Step 4: 运行测试，确认通过**

Run:

```bash
node --test frontend/components/menstrual/__tests__/home-contract-adapter.test.mjs
```

Expected:

- 新增窗口落位测试 PASS
- 既有 month label / prediction / home model 测试继续 PASS

**Step 5: Commit**

```bash
git add frontend/components/menstrual/home-contract-adapter.js frontend/components/menstrual/__tests__/home-contract-adapter.test.mjs
git commit -m "feat(menstrual): add focused-view window placement rule"
```

---

### Task 5: 文档与运行验证收口

**Files:**
- Verify: `docs/design/menstrual/function-calendar.md`
- Verify: `docs/design/menstrual/frontend-calendar.md`
- Verify: `docs/design/menstrual/function-home.md`
- Verify: `frontend/components/menstrual/HeaderNav.vue`
- Verify: `frontend/pages/menstrual/home.vue`
- Verify: `frontend/components/menstrual/home-contract-adapter.js`

**Step 1: 核对实现与设计合同一致**

逐项核对：

- `3 周` 为聚焦视图
- HeaderNav 文案是 `<<前一次` / `后一次>>`
- forward boundary 文案是 `暂无更后的月经记录`
- `月览` 未被改成 editor

**Step 2: 运行自动化测试**

Run:

```bash
node --test frontend/components/menstrual/__tests__/home-contract-adapter.test.mjs
```

Expected:

- 全部 PASS

**Step 3: 进行手动运行验证**

按以下最小回归清单验证：

1. 进入 `3 周` 视图，确认 HeaderNav 为聚焦导航文案
2. 连续点击 `<<前一次` / `后一次>>`，确认按经期序列跳转，而不是按日期平移
3. 进入 `下次预测`，确认右侧按钮 invalid 且点击后出现 `暂无更后的月经记录`
4. 从 `下次预测` 回退一格，确认回到最近一次真实经期
5. 找一组“默认窗口会把经期主体压到第三行”的样本，确认首行优先仅在明显改善时触发
6. 切换到 `月览`，确认 browse-only 语义未被破坏

**Step 4: 记录未验证项**

若本轮未完成真机 / 小程序验证，必须明确记录：

- H5 已验证
- 微信开发者工具或真机尚未验证的部分

**Step 5: Commit**

```bash
git add docs/design/menstrual/function-calendar.md docs/design/menstrual/frontend-calendar.md docs/design/menstrual/function-home.md frontend/components/menstrual/HeaderNav.vue frontend/pages/menstrual/home.vue frontend/components/menstrual/home-contract-adapter.js frontend/components/menstrual/__tests__/home-contract-adapter.test.mjs
git commit -m "feat(menstrual): finalize focused-view navigation behavior"
```

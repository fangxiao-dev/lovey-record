# Dynamic Quick Options Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 设置条的 3 个快捷 chip 根据当前选中值动态居中，自定义选择后窗口跟随重建。

**Architecture:** 新建一个纯函数 `buildCenteredQuickOptions` 封装窗口计算逻辑；在 `ModuleManagementPage` 中用 `quickWindowAnchors` map 追踪每个设置项的窗口锚点，仅在自定义选择**成功后**更新锚点（快捷 chip 点击不触发重建，保存失败自动回滚）；`retryInitialLoad` 每次完成后重置锚点，确保页面重载后窗口与后端值对齐；`buildSettingRow` 用锚点动态计算快捷选项。服务层无需改动。

**Tech Stack:** Vue 2 (uni-app), Node.js test runner (node:test)

---

### Task 1: 新建工具函数 `buildCenteredQuickOptions`

**Files:**
- Create: `frontend/utils/picker-quick-options.js`
- Create: `frontend/__tests__/picker-quick-options.test.mjs`

**Step 1: 写失败测试**

新建 `frontend/__tests__/picker-quick-options.test.mjs`：

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCenteredQuickOptions } from '../utils/picker-quick-options.js';

const ALL_DURATION = Array.from({ length: 15 }, (_, i) => ({ value: i + 1, label: `${i + 1}` }));  // 1–15
const ALL_CYCLE   = Array.from({ length: 26 }, (_, i) => ({ value: i + 20, label: `${i + 20}` })); // 20–45

test('中间值正常居中', () => {
  const result = buildCenteredQuickOptions(6, 6, ALL_DURATION);
  assert.deepStrictEqual(result.map(o => o.value), [5, 6, 7]);
  assert.deepStrictEqual(result.map(o => o.selected), [false, true, false]);
});

test('选中值与锚点不同时，仅 selected 标记差异', () => {
  // anchor=6 但当前 selected=5（快捷 chip 点了 5，anchor 未变）
  const result = buildCenteredQuickOptions(6, 5, ALL_DURATION);
  assert.deepStrictEqual(result.map(o => o.value), [5, 6, 7]);
  assert.deepStrictEqual(result.map(o => o.selected), [true, false, false]);
});

test('锚点在下边界时 clamp 到 [min, min+1, min+2]', () => {
  const result = buildCenteredQuickOptions(1, 1, ALL_DURATION);
  assert.deepStrictEqual(result.map(o => o.value), [1, 2, 3]);
  assert.ok(result[0].selected);
});

test('锚点在上边界时 clamp 到 [max-2, max-1, max]', () => {
  const result = buildCenteredQuickOptions(15, 15, ALL_DURATION);
  assert.deepStrictEqual(result.map(o => o.value), [13, 14, 15]);
  assert.ok(result[2].selected);
});

test('自定义值 10 居中为 [9, 10, 11]', () => {
  const result = buildCenteredQuickOptions(10, 10, ALL_DURATION);
  assert.deepStrictEqual(result.map(o => o.value), [9, 10, 11]);
  assert.ok(result[1].selected);
});

test('周期范围正常工作（anchor=28）', () => {
  const result = buildCenteredQuickOptions(28, 28, ALL_CYCLE);
  assert.deepStrictEqual(result.map(o => o.value), [27, 28, 29]);
  assert.ok(result[1].selected);
});

test('allOptions 为空时返回空数组', () => {
  const result = buildCenteredQuickOptions(5, 5, []);
  assert.deepStrictEqual(result, []);
});
```

**Step 2: 运行测试确认失败**

```bash
cd frontend && node --test __tests__/picker-quick-options.test.mjs
```

期望：`ERR_MODULE_NOT_FOUND` 或所有测试失败。

**Step 3: 实现工具函数**

新建 `frontend/utils/picker-quick-options.js`：

```js
/**
 * 根据锚点值和当前选中值，从 allOptions 中取出 3 个居中的快捷选项。
 *
 * @param {number} anchor       - 窗口中心锚点（自定义选中后更新，快捷 chip 点击不更新）
 * @param {number} selectedValue - 当前实际选中值（决定 selected 标记）
 * @param {Array<{value: number, label: string}>} allOptions - 完整选项数组（已升序排列）
 * @returns {Array<{value: number, label: string, selected: boolean}>}
 */
export function buildCenteredQuickOptions(anchor, selectedValue, allOptions) {
  if (!allOptions.length) return [];

  const min = allOptions[0].value;
  const max = allOptions[allOptions.length - 1].value;

  if (max - min < 2) {
    // 范围过小，直接返回全部（最多 3 个）
    return allOptions.slice(0, 3).map(o => ({
      ...o,
      selected: o.value === selectedValue
    }));
  }

  // 将锚点 clamp 到 [min+1, max-1]，确保左右都有邻居
  const center = Math.max(min + 1, Math.min(max - 1, anchor));

  return [center - 1, center, center + 1].map(v => ({
    value: v,
    label: `${v}`,
    selected: v === selectedValue
  }));
}
```

**Step 4: 运行测试确认通过**

```bash
cd frontend && node --test __tests__/picker-quick-options.test.mjs
```

期望：7 个测试全部 PASS。

**Step 5: Commit**

```bash
git add frontend/utils/picker-quick-options.js frontend/__tests__/picker-quick-options.test.mjs
git commit -m "feat(utils): add buildCenteredQuickOptions for dynamic picker window"
```

---

### Task 2: 在 `ModuleManagementPage` 中使用动态选项

**Files:**
- Modify: `frontend/components/management/ModuleManagementPage.vue`

**Step 1: 写失败测试（契约测试更新）**

在 `frontend/__tests__/module-management-layout-contract.test.mjs` 的第一个 test block 末尾（第 80 行之后）新增两条断言：

```js
assert.match(pageSource, /quickWindowAnchors/);
assert.match(pageSource, /buildCenteredQuickOptions/);
```

运行确认新断言失败：

```bash
cd frontend && node --test __tests__/module-management-layout-contract.test.mjs
```

期望：新增的两条 `match` 断言 FAIL，其余通过。

**Step 2: 添加 import 与 `quickWindowAnchors` 状态**

在 `ModuleManagementPage.vue` 顶部 import 区添加：

```js
import { buildCenteredQuickOptions } from '../../utils/picker-quick-options.js';
```

在 `data()` 的 return 对象中添加：

```js
quickWindowAnchors: {},   // key ('duration'|'prediction') → anchor value
```

**Step 3: 修改 `buildSettingRow` 使用动态选项**

将当前：
```js
buildSettingRow(key, control) {
  const customPickerOptions = control?.customPickerOptions || [];
  const selectedValue = control?.value;
  const customPickerValueIndex = customPickerOptions.findIndex((option) => option.value === selectedValue);

  return {
    key,
    label: control?.label || '',
    options: control?.options || [],
    ...
  };
}
```

改为：
```js
buildSettingRow(key, control) {
  const customPickerOptions = control?.customPickerOptions || [];
  const selectedValue = control?.value;
  const customPickerValueIndex = customPickerOptions.findIndex((option) => option.value === selectedValue);

  // 锚点优先使用自定义选择后记录的值，首次加载时回退到当前 value
  const anchor = this.quickWindowAnchors[key] ?? selectedValue ?? 0;
  const options = buildCenteredQuickOptions(anchor, selectedValue, customPickerOptions);

  return {
    key,
    label: control?.label || '',
    options,
    customLabel: control?.customLabel || '自定义',
    customPickerVisible: this.activeCustomPickerKey === key,
    customPickerOptions,
    customPickerValueIndex: customPickerValueIndex >= 0 ? customPickerValueIndex : 0,
    pickerAlign: key === 'prediction' ? 'end' : 'start'
  };
},
```

**Step 4: 修改 `handleCustomPickerChange` — 成功后更新锚点，失败时回滚**

锚点在 **持久化成功且 reload 完成后** 才写入；demo 模式无网络调用，直接更新；生产模式失败时恢复旧锚点。

```js
async handleCustomPickerChange(key, payload) {
  const control = this.getSettingControlByKey(key);
  const nextValue = payload?.value;

  if (this.isMutating || !control || !nextValue || nextValue === control.value) return;

  // Demo 模式：无网络，直接更新锚点（不会失败）
  if (this.isDemoMode) {
    this.quickWindowAnchors = { ...this.quickWindowAnchors, [key]: nextValue };
    this.applyDemoSettingUpdate(key, nextValue);
    return;
  }

  // 生产模式：先保留旧锚点，成功后再提交新锚点
  const previousAnchor = this.quickWindowAnchors[key];
  this.isMutating = true;
  this.loadError = '';
  try {
    await this.persistSettingByKey(key, nextValue);
    await this.retryInitialLoad();
    // 持久化+重载均成功，提交新锚点
    this.quickWindowAnchors = { ...this.quickWindowAnchors, [key]: nextValue };
  } catch (error) {
    // 失败：恢复旧锚点（retryInitialLoad 已在 catch 内将 page 置 null 并设 loadError）
    this.quickWindowAnchors = { ...this.quickWindowAnchors, [key]: previousAnchor };
    this.loadError = error instanceof Error ? error.message : '模块设置更新失败';
  } finally {
    this.isMutating = false;
  }
},
```

**Step 5: 修改 `retryInitialLoad` — 重载后重置锚点**

每次 reload 成功后，将 `quickWindowAnchors` 清空，使窗口重新以后端返回值为基准（下次 `buildSettingRow` 用 `selectedValue` 作为锚点）：

```js
async retryInitialLoad() {
  this.loadError = '';
  try {
    const result = await loadMenstrualModuleShellPageModel(this.context);
    this.page = result.page;
    this.activeCustomPickerKey = '';
    this.selectedModuleId = result.page?.moduleBoard?.modules?.find((module) => module.selected)?.id
      || result.page?.moduleBoard?.modules?.[0]?.id
      || '';
    // 重置锚点：新模型加载后，窗口以后端值为准
    // （handleCustomPickerChange 在 reload 完成后再写入新锚点，不冲突）
    this.quickWindowAnchors = {};
  } catch (error) {
    this.page = null;
    this.loadError = error instanceof Error ? error.message : '联调环境请求失败';
  }
},
```

> ⚠️ **顺序约定**：`handleCustomPickerChange` 先调 `retryInitialLoad`（其中清空锚点），再写入新锚点，因此不会产生竞争。

**Step 6: 添加失败路径回归测试（契约层）**

在 `frontend/__tests__/module-management-layout-contract.test.mjs` 的第一个 test block 末尾（第 80 行之后）新增断言：

```js
assert.match(pageSource, /quickWindowAnchors/);
assert.match(pageSource, /buildCenteredQuickOptions/);
// 验证锚点在成功路径（try 块）后写入，而非在方法入口
assert.match(pageSource, /previousAnchor/);
```

运行：

```bash
cd frontend && node --test __tests__/module-management-layout-contract.test.mjs
```

期望：3 条新断言 FAIL，其余通过。

**Step 7: 运行契约测试确认全部通过**

```bash
cd frontend && node --test __tests__/module-management-layout-contract.test.mjs
```

期望：全部 PASS。

**Step 8: Commit**

```bash
git add frontend/components/management/ModuleManagementPage.vue \
        frontend/__tests__/module-management-layout-contract.test.mjs
git commit -m "feat(management): dynamic quick options window centered on selected value"
```

---

## 验证完整行为

手动在开发者工具中确认：

1. **首次加载（value=6 时长 / value=28 周期）**
   - 时长快捷项显示 5, 6, 7 → 6 高亮
   - 周期快捷项显示 27, 28, 29 → 28 高亮

2. **点击快捷 chip（不重建窗口）**
   - 当前 5,6,7 选中 6 → 点 5 → 仍显示 5,6,7，5 高亮（窗口不动）

3. **通过自定义轮盘选 10**
   - 快捷项变为 9, 10, 11 → 10 高亮

4. **选自定义边界值（1 或 15）**
   - 选 1 → 快捷项 1, 2, 3；选 15 → 快捷项 13, 14, 15

5. **Demo 模式下同样生效**（开发者工具 Demo 开关打开后重复以上步骤）

6. **保存失败时不漂移**（断网或后端报错）
   - 自定义选 10 → 模拟请求失败 → 快捷项恢复原来的窗口，不停留在 9,10,11

# 用原生 picker-view 替换自制静态滑轮

**Date:** 2026-04-19  
**Status:** Ready for implementation

## Context

当前 `ModuleSettingStrip.vue` 中的"自定义选择滑轮"是用普通 `view` + `v-for` 模拟出来的静态列表，只能点击、无法滑动，体验与设计稿不符。

微信小程序（uni-app）原生内置 `picker-view` + `picker-view-column`，效果与 iOS 时钟滚轮完全一致，支持惯性滑动，无需额外依赖。

## 文件清单

| 文件 | 操作 |
|------|------|
| `frontend/components/management/ModuleSettingStrip.vue` | 主要修改 |
| `frontend/__tests__/module-management-layout-contract.test.mjs` | 同步更新契约测试 |

---

## Step 1 — 替换模板（ModuleSettingStrip.vue）

将 `picker-card` 内的 `.wheel-shell` 块（lines 52–72）替换为：

```vue
<view class="module-setting-strip__wheel-shell">
  <picker-view
    class="module-setting-strip__picker-view"
    :value="[resolvedPickerIndex]"
    indicator-style="height: 44rpx; border-radius: 22rpx; background: rgba(255,255,255,0.96);"
    mask-style="background: linear-gradient(180deg, rgba(246,243,238,0.92) 0%, rgba(246,243,238,0.18) 100%); pointer-events: none; position: fixed; top: 0; height: 28rpx;"
    @change="handlePickerChange"
  >
    <picker-view-column>
      <view
        v-for="option in customPickerOptions"
        :key="option.value"
        class="module-setting-strip__picker-item"
      >
        <text class="module-setting-strip__picker-text">{{ option.label }}</text>
      </view>
    </picker-view-column>
  </picker-view>
</view>
```

说明：
- `.wheel-shell` div 保留，继续承担背景、圆角、border、overflow hidden 等样式
- `picker-view` 填满 `.wheel-shell`（100% × 100%）
- `indicator-style` 只使用可靠属性：`height`、`border-radius`、`background`。**不使用 `box-shadow`**——微信小程序 indicator 元素对 box-shadow 的支持不稳定，各基础库版本行为不一致。
- `indicator-style` 的 `height: 44rpx` 与 `.picker-item { height: 44rpx }` **保持一致**。picker-view 的实际行高由 indicator 高度决定，子元素 CSS 仅作视觉辅助，两者必须对齐。
- **渐变遮罩改用 `mask-style` prop**（picker-view 官方支持）而非 `::before`/`::after`，避免伪元素叠层的兼容性问题。

## Step 2 — 修改 Script（ModuleSettingStrip.vue）

**删除** `visibleWheelOptions()` 计算属性（整个 computed 块，lines 126–143）

**删除** `handleWheelOptionSelect(option)` 方法（lines 146–153）

**新增** `handlePickerChange` 方法：
```js
handlePickerChange(e) {
  const index = e.detail.value[0];
  const option = this.customPickerOptions[index];
  if (!option) return;
  this.$emit('custom-change', { value: option.value, index });
}
```

`resolvedPickerIndex`、`resolvedPickerAlign`、所有 props、emits 定义 **保持不变**。

## Step 3 — 修改 CSS（ModuleSettingStrip.vue）

**删除**以下四个 CSS 规则块：
- `.module-setting-strip__wheel-indicator { ... }`（lines 285–297）— 视觉效果改由 `indicator-style` prop 提供
- `.module-setting-strip__wheel-track { ... }`（lines 299–309）— 元素已从模板移除
- `.module-setting-strip__wheel-shell::before` 和 `::after`（lines 264–283）— 渐变遮罩改用 `mask-style` prop（官方支持）
- `.module-setting-strip__picker-text--selected { ... }`（lines 326–330）— 模板中不再绑定，属于死代码

**修改** `.wheel-shell` 的高度并移除渐变伪元素：
```scss
// 原来：
// height: 212rpx;
// border-radius: 24rpx;
// background: #f6f3ee;
// border: 2rpx solid $text-muted;
// 有 ::before 和 ::after 渐变遮罩

// 修改为：
.module-setting-strip__wheel-shell {
  width: 100%;
  height: 220rpx;  // = 5 行 × 44rpx，确保显示完整 5 行
  border-radius: 24rpx;
  background: #f6f3ee;
  border: 2rpx solid $text-muted;
  box-sizing: border-box;
  overflow: hidden;
  // 删除 ::before 和 ::after 伪元素，改用 picker-view 的 mask-style prop
}
```

**新增** 一条规则（确保 picker-view 充满容器）：
```scss
.module-setting-strip__picker-view {
  width: 100%;
  height: 100%;
  background: transparent;
}
```

其余 CSS 规则（`.picker-item`、`.picker-text`、`.picker-card` 等）**全部保留**。

## Step 4 — 更新契约测试

文件：`frontend/__tests__/module-management-layout-contract.test.mjs`

**源代码契约更新**（检查代码结构）：

| 行 | 当前代码 | 操作 |
|----|----------|------|
| 56 | `assert.doesNotMatch(settingStripSource, /picker-view/)` | **改为** `assert.match(settingStripSource, /picker-view/)` |
| 60 | `assert.match(settingStripSource, /visibleWheelOptions\(\)/)` | **删除** |
| 64 | `assert.match(settingStripSource, /module-setting-strip__wheel-indicator/)` | **删除** |
| 65 | `assert.match(settingStripSource, /module-setting-strip__wheel-track/)` | **删除** |
| 67 | `assert.match(settingStripSource, /@tap="handleWheelOptionSelect\(option\)"/)` | **删除** |
| 71 | `assert.match(settingStripSource, /height:\s*212rpx;/)` | **改为** `assert.match(settingStripSource, /height:\s*220rpx;/)` |
| 77 | `assert.match(settingStripSource, /module-setting-strip__picker-text--selected/)` | **删除**（对应 CSS 已删，非死代码契约） |

在 line 66（`@tap="$emit('custom')"` 断言）之后 **新增**：
```js
assert.match(settingStripSource, /handlePickerChange/);
assert.match(settingStripSource, /picker-view-column/);
assert.match(settingStripSource, /mask-style=/);  // 验证官方渐变遮罩方案
```

其余所有断言（lines 57–59、61–63、66、68–70、72–76、78–80）**保持不变**。

---

## Step 5 — 新增运行时行为测试

文件：`frontend/__tests__/module-setting-strip.test.mjs`（新建）

添加单元测试验证 picker 交互的完整链路：

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { shallowMount } from '@vue/test-utils';
import ModuleSettingStrip from '../components/management/ModuleSettingStrip.vue';

test('ModuleSettingStrip picker-view emits custom-change with selected value and index', async (t) => {
  const options = [
    { value: 5, label: '5 天' },
    { value: 6, label: '6 天' },
    { value: 7, label: '7 天' },
  ];

  const wrapper = shallowMount(ModuleSettingStrip, {
    props: {
      label: '经期时长',
      options: [],
      customPickerVisible: true,
      customPickerOptions: options,
      customPickerValueIndex: 1,
    },
  });

  // 模拟 picker-view @change 事件：用户从 index 1 滚到 index 2
  await wrapper.vm.handlePickerChange({
    detail: { value: [2] },
  });

  // 验证 custom-change 事件的 payload
  assert.strictEqual(wrapper.emitted('custom-change').length, 1);
  const [payload] = wrapper.emitted('custom-change')[0];
  assert.deepStrictEqual(payload, { value: 7, index: 2 });
});
```

此测试验证：
1. `handlePickerChange` 正确解析 picker 的 change 事件
2. 发出的 `custom-change` 包含正确的 `value` 和 `index`
3. 选中值与实际 options 数组对齐

---

## 验证

```bash
# 运行合约测试（源代码结构）
cd frontend && node --test __tests__/module-management-layout-contract.test.mjs

# 运行行为测试（实际交互）
cd frontend && node --test __tests__/module-setting-strip.test.mjs
```

所有测试应通过。在开发者工具中手动确认：
1. 点击"自定义" → 滑轮可流畅上下滑动（惯性效果）
2. 滑轮显示 **5 行**（当前选中居中）
3. 上下边缘渐变遮罩可见（mask-style 渲染）
4. indicator 白色高亮卡片可见（圆角 + 白色背景）
5. 滑动滑轮 → 选中值改变并保存

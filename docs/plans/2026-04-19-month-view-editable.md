# 月览可编辑 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 让月览视图与 3 周视图一样支持点击编辑、长按批选，并新增横滑翻页（含方向感知过渡动画）。

**Architecture:** 月览与 3 周视图共用同一个 `CalendarGrid` 组件，差异仅在于 `interactive` prop 被关闭。本次改动分五个独立任务：开启交互 → 焦点格子高亮 → 横滑手势检测 → 过渡动画 → 批选范围限制在当前页。

**Tech Stack:** Vue 3 Options API, uni-app, SCSS, rpx 单位

---

### 约定

- 所有 CSS 尺寸使用 `rpx`，过渡时长用 `ms`
- 涉及 `px` 的 JS 手势阈值保持 `px`（uni-app touch 事件坐标是逻辑像素）
- 每个 Task 独立提交，互不依赖

---

### Task 1: 开启月览交互

**Files:**
- Modify: `frontend/pages/menstrual/home.vue:182`

**Step 1: 修改 `interactive` prop**

```diff
- :interactive="page.viewModeControl.value === 'three-week'"
+ :interactive="true"
```

**Step 2: 手动测试**

切换到月览，点击一个历史日期，确认 SelectedDatePanel 弹出并可编辑。
切换到 3 周视图，确认行为不变。

**Step 3: Commit**

```bash
git add frontend/pages/menstrual/home.vue
git commit -m "feat(menstrual): enable interactive mode for month view"
```

---

### Task 2: 月览焦点格子高亮边框

> 月览不像 3 周视图会把焦点格子滚到屏幕中央，需要视觉锚点让用户知道编辑的是哪天。

**Files:**
- Modify: `frontend/components/menstrual/CalendarGrid.vue`

**Step 1: 新增 prop `focusedDate`**

在 `props` 中增加（找到现有 props 对象，例如 `interactive`、`busy` 同处）：

```js
focusedDate: {
  type: String,  // ISO date string, e.g. '2026-04-19'
  default: null
},
```

**Step 2: 在 cell 上绑定高亮 class**

找到 `:class` 绑定（约第 45-49 行），新增一项：

```diff
 :class="[
   { 'calendar-grid__cell--tappable': interactive && cell.selectable !== false && !busy },
   { 'calendar-grid__cell--boundary-right': ... },
-  { 'calendar-grid__cell--boundary-left': ... }
+  { 'calendar-grid__cell--boundary-left': ... },
+  { 'calendar-grid__cell--focused': focusedDate && cell.isoDate === focusedDate }
 ]"
```

**Step 3: 新增 SCSS**

在 `<style>` 末尾（现有 `.calendar-grid__cell--boundary-left` 之后）添加：

```scss
.calendar-grid__cell--focused > .date-cell {
  outline: 2rpx solid currentColor;
  outline-offset: 2rpx;
  border-radius: 50%;
  opacity: 0.8;
}
```

**Step 4: 在 home.vue 传入 `focusedDate`**

找到 `<CalendarGrid>` 绑定（home.vue 约第 180-195 行），新增一行：

```diff
 <CalendarGrid
   ref="calendarGrid"
   :weeks="page.calendarCard.weeks"
   :weekday-labels="page.calendarCard.weekdayLabels"
   :interactive="true"
+  :focused-date="viewMode === 'month' ? activeDate : null"
   :selected-keys="selectedBatchKeys"
   ...
 />
```

> `activeDate` 是当前选中日期（home.vue data 中已有），`viewMode` 同理。

**Step 5: 手动测试**

月览下点击一个格子，确认被选格子有轻微高亮环。切换到 3 周视图，确认无高亮环（因为传入 `null`）。

**Step 6: Commit**

```bash
git add frontend/components/menstrual/CalendarGrid.vue frontend/pages/menstrual/home.vue
git commit -m "feat(menstrual): highlight focused cell in month view"
```

---

### Task 3: CalendarGrid 横滑手势检测

> 在现有 touchstart / touchmove / touchend 逻辑上新增横滑识别，向 home.vue 抛出 `swipe-left` / `swipe-right` 事件。
> 不影响现有长按批选逻辑。

**Files:**
- Modify: `frontend/components/menstrual/CalendarGrid.vue`

**Step 1: 新增常量**

在现有常量区（约第 124-125 行 `LONG_PRESS_DELAY` / `MOVE_CANCEL_THRESHOLD` 旁边）添加：

```js
const SWIPE_THRESHOLD = 48;   // px — 横向位移超过此值才算翻页
const SWIPE_AXIS_RATIO = 1.5; // dx 必须是 dy 的 1.5 倍以上才算横滑
```

**Step 2: 新增 data 字段追踪当前触点位置**

在 `data()` 的 return 对象中新增（与现有 `touchStartX`、`touchStartY` 相邻）：

```js
touchCurrentX: 0,
touchCurrentY: 0,
swipeCancelled: false,  // 长按定时器因移动被取消时置 true
```

**Step 3: 在 `handlePointerMove` 中更新当前位置 & 标记 swipe 候选**

找到 `handlePointerMove`（约第 436 行），在方法开头（现有逻辑之前）插入：

```js
this.touchCurrentX = clientX;
this.touchCurrentY = clientY;
```

在取消长按定时器的 `if` 块内（约第 440-443 行），将 `swipeCancelled` 置为 true：

```diff
 if (Math.abs(dx) > MOVE_CANCEL_THRESHOLD || Math.abs(dy) > MOVE_CANCEL_THRESHOLD) {
   clearTimeout(this.longPressTimer);
   this.longPressTimer = null;
+  this.swipeCancelled = true;
 }
```

**Step 4: 在 `beginLongPress` 中重置 swipeCancelled**

找到 `beginLongPress`（约第 423 行），在方法开头插入：

```js
this.swipeCancelled = false;
```

**Step 5: 在 `finishLongPress` 中判断横滑并 emit**

找到 `finishLongPress`（约第 462 行）。在方法**末尾**（现有逻辑之后，`this.longPressStartedAt = 0;` 之前）添加：

```js
if (this.swipeCancelled && !this.batchMode) {
  const dx = this.touchCurrentX - this.touchStartX;
  const dy = this.touchCurrentY - this.touchStartY;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  if (absDx >= SWIPE_THRESHOLD && absDx >= absDy * SWIPE_AXIS_RATIO) {
    // dx < 0: 手指向左 → 翻到下一页；dx > 0: 向右 → 翻到上一页
    this.$emit(dx < 0 ? 'swipe-left' : 'swipe-right');
  }
}
this.swipeCancelled = false;
```

**Step 6: 在 `onTouchCancel` 中也重置 swipeCancelled**

```diff
 onTouchCancel() {
   if (this.busy) return;
+  this.swipeCancelled = false;
   this.finishLongPress();
 },
```

**Step 7: 在 home.vue 中监听事件并调用现有导航方法**

找到 `<CalendarGrid>` 绑定（home.vue 约第 180-195 行），新增：

```diff
 @batch-end="handleBatchEnd"
+@swipe-left="handleCalendarSwipeLeft"
+@swipe-right="handleCalendarSwipeRight"
```

在 home.vue methods 中新增（紧跟 `handleHeaderPrev` / `handleHeaderNext` 之后）：

```js
handleCalendarSwipeLeft() {
  if (this.isBrowseBusy || this.panelMode === 'batch') return;
  this.handleHeaderNext();
},
handleCalendarSwipeRight() {
  if (this.isBrowseBusy || this.panelMode === 'batch') return;
  this.handleHeaderPrev();
},
```

**Step 8: 手动测试**

月览和 3 周视图均测试：向左滑翻到下一页，向右滑翻到上一页。
确认长按批选不被误触发为翻页。

**Step 9: Commit**

```bash
git add frontend/components/menstrual/CalendarGrid.vue frontend/pages/menstrual/home.vue
git commit -m "feat(menstrual): add horizontal swipe to navigate calendar pages"
```

---

### Task 4: 翻页方向感知过渡动画

> 翻页时日历格子向翻页方向滑入滑出，给用户明确的方向感知。不用真实动画，仅用 CSS transition。

**Files:**
- Modify: `frontend/pages/menstrual/home.vue`

**Step 1: 新增 data 字段**

在 home.vue `data()` return 中新增：

```js
navTransitionName: '',   // '' | 'slide-left' | 'slide-right'
calendarNavKey: 0,       // 每次翻页时 +1，触发 <transition> 的 key 变化
```

**Step 2: 封装翻页执行逻辑**

将 `handleHeaderPrev` / `handleHeaderNext` 中重复的 `applyLocalBrowseState` + `refreshCalendarWindow` 逻辑提取为一个内部方法，并在执行前设置过渡方向：

找到 `handleHeaderPrev`（约第 958 行）和 `handleHeaderNext`（约第 970 行），在各自方法开头分别插入：

```js
// handleHeaderPrev 开头：
this.navTransitionName = 'slide-right';
this.calendarNavKey += 1;

// handleHeaderNext 开头：
this.navTransitionName = 'slide-left';
this.calendarNavKey += 1;
```

> `navTransitionName` 会在动画完成后自动被 Vue transition 清理（leave 完成 = 旧 key 销毁），无需手动重置。

**Step 3: 用 `<transition>` 包裹 CalendarGrid**

找到 `<CalendarGrid>` 绑定，外层添加：

```diff
+<transition :name="navTransitionName">
   <CalendarGrid
     ref="calendarGrid"
+    :key="calendarNavKey"
     :weeks="page.calendarCard.weeks"
     ...
   />
+</transition>
```

同时用一个容器 view 防止过渡期间布局抖动：

```html
<view class="calendar-slide-wrap">
  <transition :name="navTransitionName">
    <CalendarGrid :key="calendarNavKey" ... />
  </transition>
</view>
```

**Step 4: 添加 SCSS**

在 home.vue 的 `<style lang="scss">` 末尾添加：

```scss
.calendar-slide-wrap {
  overflow: hidden;
  position: relative;
}

.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 200ms ease-out, opacity 200ms ease-out;
  position: absolute;
  width: 100%;
}

.slide-left-enter-from {
  transform: translateX(100%);
  opacity: 0;
}
.slide-left-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-right-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}
.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
```

> 注意：过渡期间两个实例同时存在，`position: absolute` 会脱离流，容器需要有明确高度。若容器高度塌陷，在 `.calendar-slide-wrap` 上设置 `min-height` 或通过 computed 传入当前行数对应的高度。

**Step 5: 手动测试**

点击 `<<` / `>>` 按钮和横滑，确认日历内容以正确方向滑入滑出（左翻页向左滑出，右翻页向右滑出）。
切换视图模式（3 周 ↔ 月览），确认无意外动画。
确认 SelectedDatePanel 弹出不受影响。

**Step 6: Commit**

```bash
git add frontend/pages/menstrual/home.vue
git commit -m "feat(menstrual): add directional slide transition on calendar page navigation"
```

---

### Task 5: 批选范围限制在当前页

> 月览中，批选不可跨页（即不可选到上个月/下个月溢出的格子）。

**Files:**
- Modify: `frontend/pages/menstrual/home.vue:1300`

**Step 1: 在 `syncBatchSelectionRange` 中增加月份过滤**

找到 `syncBatchSelectionRange`（约第 1300 行），在现有 `.filter((cell) => cell.selectable !== false)` 一行中追加月份限制：

```diff
 this.batchSelectedKeysState = this.allCalendarCells
   .slice(rangeStart, rangeEnd + 1)
-  .filter((cell) => cell.selectable !== false)
+  .filter((cell) => {
+    if (cell.selectable === false) return false;
+    if (this.viewMode === 'month' && cell.isoDate) {
+      // 只保留属于当前焦点月份的日期，排除溢出格子
+      const focusMonth = this.focusDate.slice(0, 7); // 'YYYY-MM'
+      return cell.isoDate.startsWith(focusMonth);
+    }
+    return true;
+  })
   .map((cell) => cell.key);
```

**Step 2: 手动测试**

月览中，长按跨越行尾/行首的日期进行批选，确认选区不会包含上个月或下个月的溢出格子。
3 周视图中批选跨周，确认行为不变。

**Step 3: Commit**

```bash
git add frontend/pages/menstrual/home.vue
git commit -m "feat(menstrual): clamp batch selection to current calendar page in month view"
```

---

## 实现顺序建议

1 → 2 → 3 → 5 → 4（过渡动画放最后，因为它依赖 Task 3 的 swipe 功能且视觉调参耗时较多）

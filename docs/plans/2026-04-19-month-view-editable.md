# 月览可编辑 Implementation Plan

**Goal:** 让月览视图补齐和 3 周视图同等级别的核心编辑能力，包括点击编辑、长按批选、横滑翻页；翻页视觉效果优先复用现有日历切换机制，不单独重构一套新动画方案。

**Architecture:** 月览与 3 周视图继续共用同一个 `CalendarGrid` 组件。当前主差异是月览交互被关闭，且缺少月览焦点锚点与 swipe 翻页入口。本次改动以最小闭环补齐功能语义，现有 header 翻页、browse preload、transition/animation 机制应尽量复用。

**Tech Stack:** Vue 3 Options API, uni-app, SCSS, rpx 单位

---

## 本轮语义边界

### 必须实现的功能

1. 月览点击日期可进入单日编辑
2. 月览长按可进入批量选择
3. 月览支持左右滑动翻页
4. 月览中当前编辑日期有明确视觉锚点
5. 月览批选不会把上个月/下个月溢出格子纳入最终选区

### 明确不作为本轮主目标的事项

- 不为了对齐文档而重写现有 browse/transition 结构
- 不单独设计一套新的翻页动画容器
- 不把动画实现形式是否和文档示例完全一致当作验收条件

### 复用原则

- `CalendarGrid` 负责识别 swipe 手势并向外抛出翻页意图
- `home.vue` 负责把 swipe 事件接到现有翻页入口
- 现有 `handleHeaderPrev` / `handleHeaderNext`、buffered browse、preload、directional transition 都优先复用

---

## 约定

- 所有 CSS 尺寸使用 `rpx`，过渡时长用 `ms`
- 涉及 `px` 的 JS 手势阈值保持 `px`，因为 uni-app touch 事件坐标是逻辑像素
- 对齐重点是功能语义和交互结果，不要求逐字照搬文档中的内部代码写法
- 若当前代码已有可复用能力，优先接入而非替换

---

## Task 1: 开启月览交互

**目标:** 月览不再只是浏览，点击日期后要进入现有单日编辑流。

**Files:**
- Modify: `frontend/pages/menstrual/home.vue`

**Implementation intent:**

- 将 `CalendarGrid` 的 `interactive` 从“仅 3 周视图开启”改为月览也可交互
- 确保点击月览中的可选日期后，仍走当前 `handleCellTap -> SelectedDatePanel` 这条既有单日编辑链路
- 不改动 3 周视图现有行为

**Acceptance:**

- 切换到月览，点击历史日期，`SelectedDatePanel` 弹出并进入可编辑状态
- 切换回 3 周视图，现有单日编辑行为不变

---

## Task 2: 月览焦点格子高亮

**目标:** 给月览补一个“当前正在编辑哪一天”的视觉锚点。

> 月览不会像 3 周视图那样天然把焦点格子放在强视觉位置，因此需要额外高亮，但这不是新的选中体系，只是焦点提示。

**Files:**
- Modify: `frontend/components/menstrual/CalendarGrid.vue`
- Modify: `frontend/pages/menstrual/home.vue`

**Implementation intent:**

- 在 `CalendarGrid` 中新增 `focusedDate` 输入
- 仅当 `cell.isoDate === focusedDate` 时，为该格子增加轻量 ring/outline 高亮
- 在 `home.vue` 中仅在月览模式下传入 `activeDate`，3 周视图传 `null`

**Acceptance:**

- 月览下点击一个格子，当前编辑日期出现轻量高亮环
- 3 周视图无额外高亮环，不和现有视觉状态冲突

---

## Task 3: CalendarGrid 横滑翻页

**目标:** 月览和 3 周视图都支持左右滑动翻页，且不破坏现有长按批选。

**Files:**
- Modify: `frontend/components/menstrual/CalendarGrid.vue`
- Modify: `frontend/pages/menstrual/home.vue`

**Implementation intent:**

- 在现有 `touchstart / touchmove / touchend` 与桌面 long-press 兼容逻辑上，新增横滑识别
- `CalendarGrid` 只负责 emit `swipe-left` / `swipe-right`
- `home.vue` 接收到 swipe 后，分别调用现有 `handleHeaderNext` / `handleHeaderPrev`
- 横滑判定必须和长按批选逻辑隔离，避免把批选拖动误判成翻页

**Recommended event mapping:**

- `swipe-left` -> 下一页
- `swipe-right` -> 上一页

**Acceptance:**

- 月览下左滑进入下一页，右滑进入上一页
- 3 周视图下左滑/右滑也沿用同一翻页语义
- 长按进入批选后拖动扩选时，不会误触发翻页

---

## Task 4: 翻页效果复用现有过渡机制

**目标:** swipe 翻页接入现有过渡链路，而不是为本轮功能单独重写一套动画系统。

**Files:**
- Modify only if needed: `frontend/pages/menstrual/home.vue`

**Implementation intent:**

- 优先复用当前已有的 header prev/next 浏览切换机制
- 如果现有 browse preload、pending/current layer、direction-aware animation 已能承接 swipe 翻页，则不需要改成新的 `<transition>` 包裹写法
- 只有在 swipe 接入现有机制时暴露真实缺口，才做最小范围补丁

**Explicit non-goal:**

- 不要求把当前 `home.vue` 的日历切换实现重构成文档示例中的新 transition 容器

**Acceptance:**

- 点击 header 翻页和横滑翻页都走同一条翻页执行语义
- 页面已有方向感知动画继续生效，或至少不退化为无反馈切换
- 不因接入 swipe 而破坏当前 browse preload / buffered browse 机制

---

## Task 5: 月览批选范围限制在当前月份

**目标:** 月览批选时，最终有效选区只能包含当前焦点月份的日期。

> 这里的“限制在当前页”语义，实际指向月览当前焦点月份，而不是仅仅指 6x7 网格内所有格子。上个月和下个月的溢出格子即使可见，也不能进入最终 selection。

**Files:**
- Modify: `frontend/pages/menstrual/home.vue`

**Implementation intent:**

- 在 `syncBatchSelectionRange` 的连续范围筛选中，保留现有 `selectable !== false` 过滤
- 当 `viewMode === 'month'` 时，进一步按 `focusDate.slice(0, 7)` 过滤 `cell.isoDate`
- 3 周视图不受该限制，继续维持当前连续范围语义

**Acceptance:**

- 月览中长按跨越行尾/行首拖选时，最终选区不会包含上个月或下个月的溢出格子
- 3 周视图中的批选跨周行为保持不变

---

## 推荐实现顺序

1. Task 1: 开启月览交互
2. Task 2: 月览焦点格子高亮
3. Task 3: 横滑翻页
4. Task 5: 月览批选范围限制
5. Task 4: 仅在需要时补齐 swipe 接入现有过渡机制的缺口

---

## 验收清单

- 月览点击日期可进入单日编辑
- 月览当前编辑日期有可见焦点锚点
- 月览长按可进入批选
- 月览批选不会跨入非当前月份的溢出格子
- 月览和 3 周视图都支持左右滑动翻页
- swipe 翻页复用现有翻页与过渡机制，不引入额外的动画链路重构

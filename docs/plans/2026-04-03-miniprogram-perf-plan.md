# Plan B：小程序本身性能优化

## 目标

优化微信小程序渲染层面的性能，主要解决两个问题：
1. 日历中 40+ 个 `<image>` 标签的渲染开销
2. 批量选择时 DOM rect 查询的时序问题

---

## 优化 1：DateCell marker 从 `<image>` 改为内联 SVG

### 问题分析

**文件：** `frontend/components/menstrual/DateCell.vue`（第 6 行）

```html
<image class="date-cell__marker-image" :src="markerSrc" mode="aspectFit" />
```

日历最多渲染 42 个单元格，每个有 marker 的格子都会有一个 `<image>` 节点。
微信小程序的 `<image>` 是原生组件，每个都有独立的渲染上下文，加载时有网络/磁盘 IO。

当前只有 2 个 SVG 资源（`view-period.svg` 和 `view-contrast.svg`），内容极简：

**view-period.svg（填充色 #C9786A）：**
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path fill="#C9786A" d="M12 5C6.7 5 2.58 8.07 1 12c1.58 3.93 5.7 7 11 7s9.42-3.07 11-7c-1.58-3.93-5.7-7-11-7Zm0 11.5A4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 0 1 0 9Z"/>
  <circle cx="12" cy="12" r="2.1" fill="#C9786A"/>
</svg>
```

**view-contrast.svg（填充色 #FFFFFF）：**
- 结构完全一样，只是 fill 颜色不同

这两个图标**形状相同，只有颜色差异**，完全可以用 CSS 控制颜色。

### 方案：用 CSS mask 替代 image

用一个 `<view>` 通过 `mask-image` + `background-color` 模拟 SVG 图标，0 DOM 开销、0 网络请求、颜色由 CSS 控制。

#### 步骤 1：修改 DateCell.vue 模板

**当前（第 4-9 行）：**
```html
<view class="date-cell__marker-slot" v-if="markerToken">
  <image class="date-cell__marker-image" :src="markerSrc" mode="aspectFit" />
</view>
```

**改为：**
```html
<view
  class="date-cell__marker-slot"
  v-if="markerToken"
  :class="markerToken ? `date-cell__marker--${markerToken.replace('.', '-')}` : ''"
>
  <view class="date-cell__marker-icon" />
</view>
```

> `markerToken` 的值为 `'accent.period'` 或 `'accent.period.contrast'`，
> 替换点号后的 class 为 `date-cell__marker--accent-period` 或 `date-cell__marker--accent-period-contrast`

#### 步骤 2：修改 DateCell.vue script

删除或保留 `markerSrc` computed 属性（可以删除，不再使用）：

```js
// 删除这个 computed（或保留供其他地方使用）
markerSrc() {
  return this.cell?.markerSrc ?? null
}
```

`markerToken` computed（如果不存在则新增）：
```js
markerToken() {
  return this.cell?.markerToken ?? null
}
```

> 检查 `date-cell-view-model.js`，确认 `markerToken` 字段是否已在 view model 中输出。
> 查看第 47-52 行，`markerToken` 已有。

#### 步骤 3：修改 DateCell.vue SCSS

**删除旧的 image 样式（第 104-129 行附近）：**
```scss
// 删除：
.date-cell__marker-image {
  width: 100%;
  height: 100%;
}
```

**新增：**
```scss
// SVG path 数据（与 view-period.svg 内容一致）
$marker-svg-path: "M12 5C6.7 5 2.58 8.07 1 12c1.58 3.93 5.7 7 11 7s9.42-3.07 11-7c-1.58-3.93-5.7-7-11-7Zm0 11.5A4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 0 1 0 9Z";

.date-cell__marker-icon {
  width: 100%;
  height: 100%;
  // 使用 mask-image 模拟 SVG，颜色由 background-color 控制
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 5C6.7 5 2.58 8.07 1 12c1.58 3.93 5.7 7 11 7s9.42-3.07 11-7c-1.58-3.93-5.7-7-11-7Zm0 11.5A4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 0 1 0 9Z'/%3E%3Ccircle cx='12' cy='12' r='2.1'/%3E%3C/svg%3E");
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-size: contain;
  -webkit-mask-position: center;
  mask-image: url("data:image/svg+xml,...");  // 同上
  mask-repeat: no-repeat;
  mask-size: contain;
  mask-position: center;
  background-color: $accent-period;  // 默认颜色
}

// contrast 变体（白色，用于深色背景）
.date-cell__marker--accent-period-contrast .date-cell__marker-icon {
  background-color: $accent-period-contrast;
}
```

> `$accent-period` 和 `$accent-period-contrast` 已在 `styles/tokens/semantic.scss` 中定义。

#### 微信小程序兼容性说明

- `mask-image` 在微信小程序（基础库 2.x+）中支持带 `-webkit-` 前缀的写法
- 需要同时写 `-webkit-mask-*` 和 `mask-*` 两套
- 内联 base64 SVG 的特殊字符需 URL encode（`#` → `%23`，`'` → `%27`，空格 → `%20`）

#### 备选方案：uni-app 自定义组件（如果 mask-image 不兼容）

如果 mask-image 方案在真机上有问题，备选用 SCSS 变量直接写死两个 icon 的样式：

```scss
.date-cell__marker--accent-period .date-cell__marker-icon {
  background-image: url('/static/menstrual/view-period.svg');
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  width: 100%;
  height: 100%;
}
```

这样虽然还是引用 SVG 文件，但将 `<image>` 原生组件改为了普通 CSS 背景，
渲染开销更小（不创建原生组件实例）。

---

## 优化 2：CalendarGrid 批量选择 DOM rect 预缓存

### 问题分析

**文件：** `frontend/components/menstrual/CalendarGrid.vue`

当前批量选择的 rect 获取时机（第 368-400 行 `startBatchMode()`）：

```js
async startBatchMode(initialKey) {
  // 先尝试用已有缓存
  if (!this.cellRects) {
    // 没有缓存时，异步查询 DOM
    uni.createSelectorQuery()
      .selectAll('.calendar-grid__cell')
      .boundingClientRect((rects) => {
        this.cellRects = rects.map(...)
        // 然后才能开始 hitTest
      })
      .exec()
  }
  // ...
}
```

**问题：** 用户长按触发 `startBatchMode` 时，如果 `cellRects` 还没缓存，
需要等 `uni.createSelectorQuery` 异步回调，这段时间内拖动无响应。

### 方案：长按时捕获 + 布局变化时失效缓存

> **设计约束**：`boundingClientRect` 返回视口相对坐标。如果在 mounted 时预缓存，
> 后续任何滚动、软键盘弹出、banner 展开等布局变化都会导致缓存坐标过期，
> 拖选时命中错误的日期——这是数据完整性风险，不可接受。
>
> 因此**不在 mounted 时预缓存**，继续保留「长按时捕获」的核心逻辑，
> 仅做两项改进：① 抽取方法减少重复代码 ② 引入缓存失效机制以便
> 同一次手势内复用（避免重复查询），但布局一旦变化立即作废。

#### 步骤 1：抽取 captureCellRects 方法

将当前散落在 `startBatchMode` 里的查询逻辑，抽成独立方法：

```js
captureCellRects() {
  // 优先用同步 DOM 方法（H5/开发工具环境）
  const syncRects = this.captureCellRectsFromDom()
  if (syncRects && syncRects.length > 0) {
    this.cellRects = syncRects
    return
  }

  // 真机小程序环境用异步 SelectorQuery
  uni.createSelectorQuery()
    .in(this)
    .selectAll('.calendar-grid__cell')
    .boundingClientRect((rects) => {
      if (rects && rects.length > 0) {
        this.cellRects = rects.map(r => ({
          left: r.left,
          right: r.right,
          top: r.top,
          bottom: r.bottom
        }))
      }
    })
    .exec()
},
```

> 注意：`uni.createSelectorQuery().in(this)` 中加 `.in(this)` 是关键，
> 在组件内使用时必须传入组件实例，否则在真机上无法找到元素。

#### 步骤 2：布局变化时失效缓存

当 weeks 变化（月份/周切换导致 DOM 重建）或页面滚动/resize 时，
清除缓存，下次长按会重新计算：

```js
watch: {
  weeks: {
    handler() {
      // 日历数据变化后 DOM 重建，旧 rects 作废
      this.cellRects = null
    }
  }
},
mounted() {
  this.bindDesktopLongPressEvents()
  // 监听页面滚动和 resize，清除 rect 缓存
  // （小程序中通过 onPageScroll 传递，H5 中直接监听）
  this._invalidateRects = () => { this.cellRects = null }
  // #ifdef H5
  window.addEventListener('scroll', this._invalidateRects, { passive: true })
  window.addEventListener('resize', this._invalidateRects, { passive: true })
  // #endif
},
beforeDestroy() {
  // #ifdef H5
  window.removeEventListener('scroll', this._invalidateRects)
  window.removeEventListener('resize', this._invalidateRects)
  // #endif
},
```

> 小程序端：在父页面的 `onPageScroll` 中调用 `this.$refs.calendarGrid.cellRects = null`，
> 或通过 `uni.$on('pageScroll', ...)` 事件总线传递。

#### 步骤 3：startBatchMode 保持「长按时捕获」

`startBatchMode` 仍在长按时重新计算 rects（如果缓存已失效）：

```js
startBatchMode(initialKey) {
  // 每次长按开始时，如果缓存已被失效，重新捕获当前视口坐标
  if (!this.cellRects) {
    this.captureCellRects()
  }
  // 后续逻辑不变
  // ...
}
```

> **关键不变量**：hit-testing 永远使用手势开始时（或之后）捕获的、
> 与当前视口坐标一致的 rects，而不是挂载时的历史快照。

---

## 优化 3（可选）：日期切换请求防抖

### 问题

快速切换日期时，`handleDateCellTap` 会连续触发多次 `loadDayDetail`，
产生并发请求和竞态条件。当前有 requestId 机制，但不能减少请求数量。

### 方案（轻量）

在 `home.vue` 的日期切换处加 debounce：

```js
// 在 methods 中
handleDateCellTap: debounce(function(key) {
  this.focusDate = key
  this.loadDayDetail()
}, 100),
```

或者更简单：检查 `focusDate` 是否真的发生了变化：

```js
handleDateCellTap(key) {
  if (this.focusDate === key) return  // 同一天，跳过
  this.focusDate = key
  this.loadDayDetail()
}
```

> 这个改动极小，顺手做即可。

---

## 实施顺序建议

1. **优化 2（DOM 缓存）**：改动集中在 CalendarGrid.vue，风险低，收益明显
   - 新增 `captureCellRects()` 方法
   - mounted 和 weeks watch 中调用
   - 简化 startBatchMode

2. **优化 3（日期切换防抖）**：一行改动，顺手做

3. **优化 1（image → CSS）**：需要验证 mask-image 小程序兼容性
   - 建议先在开发工具验证，再真机测试
   - 如 mask-image 不可用，改用 CSS background-image 方案

---

## 测试要点

- [ ] 日历所有状态的 marker 图标正常显示（期间、对比色）
- [ ] 长按立即进入批量选择模式（无异步等待卡顿）
- [ ] 切换月份/周后，批量选择 hit-test 位置正确
- [ ] 真机测试：mask-image 图标颜色正确
- [ ] 真机测试：快速切换日期不出现错误的详情数据

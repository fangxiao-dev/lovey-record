# Figma + uni-app Migration Inventory

**日期：** 2026-03-22

## 用途

这份文档把“截图、旧原生代码、现有页面文件”转成三个可执行清单：

1. 页面清单
2. 组件清单
3. 旧代码可迁移逻辑清单

它是后续 Figma 结构稿和 uni-app 实现计划的直接输入。

## 一、页面清单

| 页面 / 状态 | 当前来源 | 迁移处理 | 说明 |
| --- | --- | --- | --- |
| 进入页 / 导航页 | `assets/1st_navigator.jpg`, `pages/index/index` | 保留，重做 | 作为产品入口页，职责是把用户分流到“我的模块”或“共享空间” |
| 我的模块页 | `assets/2nd-private-space.jpg`, `pages/modules/index` | 保留，重做 | 负责 owner 视角下的模块列表与共享状态展示 |
| 共享空间入口页 | `pages/shared-space/index` | 保留，重做 | 仍作为同一实例的共享入口，第一版可保留占位邀请信息 |
| 月经模块首页 | `assets/period-record-status-and-calendar.jpg`, `pages/module-home/index` | 保留，重做 | 仍是主工作台，承载状态卡、周期窗/月视图、图例和内联编辑 |
| 单日详情面板 | `assets/period-record-detail-panel.jpg` | 合并进首页状态 | 不再是独立页面，作为首页中的内联编辑面板存在 |
| 批量编辑态 | `assets/period-record-batch-select-view.jpg` | 合并进首页状态 | 作为首页的一种交互状态，而不是新页面 |
| 特殊标记展示态 | `assets/period-record-two-special-marks.jpg` | 合并进首页状态 | 用于校验单日 `special` 标记与面板切换逻辑 |
| 历史记录页 | `pages/history/index` | 候选保留 | 当前仍有价值，但应在主工作台结构稳定后再决定是否保留为独立页 |
| 周期详情页 | `pages/cycle-detail/index` | 候选合并 | 如果首页和历史页已能完成主要查看/编辑，可考虑削弱或移除独立详情页 |
| 记录编辑页 | `pages/record-editor/index`, `pages/record-exception/index` | 优先合并 / 降级 | 新主线倾向把编辑统一收敛到首页面板；独立编辑页不是优先保留项 |
| 提醒 / 设置页 | `pages/reminders/index` | 候选保留 | 可合并到设置页或保留为轻量占位页，取决于 Figma 后续结构 |

### 页面迁移判断

- 必做页面：
  - 进入页
  - 我的模块页
  - 共享空间入口页
  - 月经模块首页
- 必做状态：
  - 默认状态
  - 已记录状态
  - 单日编辑状态
  - 批量编辑状态
  - 特殊标记状态
  - 未来日期不可编辑状态
- 候选延后页面：
  - 历史记录页
  - 周期详情页
  - 提醒 / 设置页

## 二、组件清单

| 组件名 | 所属页面 | 作用 | 备注 |
| --- | --- | --- | --- |
| `AppTopBar` | 全局 | 顶部标题、返回、上下文入口 | 统一导航样式 |
| `EntryActionCard` | 进入页 | 展示产品简介和主入口按钮 | 可拆成标题区 + 按钮组 |
| `PrimaryActionButton` | 多页 | 主按钮 | Figma 里应固化主按钮 token |
| `SecondaryActionButton` | 多页 | 次按钮 | 进入页、批量编辑面板都会用到 |
| `ModuleCard` | 我的模块页 / 共享空间页 | 展示模块名、共享状态、入口动作 | 同一组件可做私有和共享变体 |
| `SharedStateBadge` | 多页 | 展示“私有 / 已共享”等状态 | 独立成 badge，避免散落文本样式 |
| `StatusHeroCard` | 模块首页 | 展示模块名、状态、预测窗口、共享标签 | 首页第一视觉块 |
| `CalendarModeSegment` | 模块首页 | 切换周期窗 / 月视图 | 应作为通用 segmented control 设计 |
| `CalendarHeaderNav` | 模块首页 | 切换日期区间、显示年月或范围标题 | 需要支持周期窗和月视图 |
| `CalendarJumpTabs` | 模块首页 | Today / Last cycle / Next prediction | 结构上是一组快捷跳转芯片 |
| `CalendarGrid` | 模块首页 | 承载周结构和日期格 | 包含网格布局和周头 |
| `DateCell` | 模块首页 | 单日格子，显示经期、预测、今日、特殊等状态 | 是重构的核心基础组件 |
| `CalendarLegend` | 模块首页 | 解释颜色和标记语义 | 应和日期状态命名一致 |
| `SelectedDatePanel` | 模块首页 | 展示选中日期状态与说明 | 单日编辑入口容器 |
| `DayStateChipGroup` | 模块首页 | 切换 `period / special / clear` | 状态切换组件 |
| `NormalRecordButton` | 模块首页 | 一键“月经正常”动作 | 业务上仍走同一个 day-record helper |
| `AttributeFieldCard` | 模块首页 | 流量 / 疼痛 / 颜色字段卡 | 可统一成同一字段组件不同配置 |
| `NotesField` | 模块首页 | 备注输入 | 需要支持失焦保存或显式保存 |
| `BatchEditPanel` | 模块首页 | 展示拖选说明、触达天数、保存 / 取消动作 | 批量编辑的状态容器 |
| `EmptyStateBlock` | 多页 | 空状态占位 | 我的模块、共享空间、历史页都可能需要 |

### 组件拆分原则

- 先按结构和职责拆，不先按视觉微差拆
- `DateCell`、`StatusHeroCard`、`SelectedDatePanel`、`BatchEditPanel` 是 Figma 和 uni-app 两边都必须优先稳定的核心组件
- 首页的大部分交互应该通过组合组件表达，而不是继续依赖整页脚本堆逻辑

## 三、旧代码可迁移逻辑清单

| 来源文件 | 迁移价值 | 建议迁移目标 | 迁移方式 |
| --- | --- | --- | --- |
| `models/day-record.js` | 高 | `models/` 或 `services/domain/` | 尽量直接移植纯函数与数据规则 |
| `services/cycle-record-service.js` | 高 | `services/records/` + `composables/useDayRecord` | 拆成纯服务和页面调用接口，去掉页面耦合 |
| `services/module-instance-service.js` | 高 | `services/modules/` | 保留模块实例、共享空间、最后编辑人等查询逻辑 |
| `utils/date.js` | 高 | `utils/date.ts/js` | 直接迁移纯日期能力，并补足 uni-app 使用场景 |
| `mock/seed-data.js` | 中 | `mock/seed-data.js` | 保留作为假数据和状态验证输入 |
| `services/module-home-service.js` | 中 | `composables/useCalendarViewModel` + `services/calendar/` | 拆出可复用的视图模型算法，避免整块照搬 |
| `pages/module-home/index.js` | 中低 | 交互流程参考 | 只保留点击、长按、拖选、保存等行为参考，不直接复用代码 |
| `pages/modules/index.js` | 低 | 信息架构参考 | 看页面目的和字段，不复用页面实现 |
| `pages/shared-space/index.js` | 低 | 信息架构参考 | 看共享入口和占位信息，不复用页面实现 |
| `pages/history/index.js` / `pages/cycle-detail/index.js` | 低 | 候选流程参考 | 先判断是否仍保留独立页，再决定迁移 |
| `app.json` | 中 | 路由清单参考 | 仅作为旧页面地图参考，最终以 uni-app `pages.json` 为准 |

### 明确不直接复用的内容

- WXML 结构
- WXSS 视觉样式
- 原生 `Page({})` 生命周期组织
- 分散在页面中的 `wx.navigateTo`、`wx.showToast`、`wx.getStorageSync` 等调用

### 建议的新落点

- 业务规则进入 `services/` 和 `composables/`
- 纯函数进入 `utils/`
- UI 状态和组件 props 由 Figma 命名反向驱动
- 平台能力统一包成 `platform/` 或 `services/platform/` 适配层

## 结论

本次迁移最重要的不是“把原生代码搬到 uni-app”，而是：

1. 用截图和当前实现还原结构
2. 用 Figma 固化页面与组件系统
3. 把高价值业务逻辑迁移到新的运行时分层

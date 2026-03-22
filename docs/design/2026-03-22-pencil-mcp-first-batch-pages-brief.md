# Pencil MCP 首批页面设计 Brief

**日期：** 2026-03-22

## 目标

这份 brief 面向 Pencil MCP，用于冻结新 uni-app 主线首批页面的结构化设计输入。

本 brief 的目标不是实现页面，也不是延续 legacy UI，而是给 Pencil MCP 一套足够明确的设计合同，使其可以直接产出：

- 页面结构
- 组件树
- 状态页
- 视觉方向
- 页面间的统一设计语言

首批设计范围固定为 4 个页面：

- 进入页
- 我的模块页
- 共享空间入口页
- 月经模块首页

## 设计边界与禁止项

### legacy 参考边界

legacy 仓库路径统一为：

`D:\CodeSpace\love-recorder`

legacy 只保留以下参考价值：

- 业务规则
- 交互契约
- 状态范围
- 信息架构
- 数据模型

legacy 不再保留以下参考价值：

- 旧页面视觉样式
- 旧布局表现
- 旧组件外观
- WXML / WXSS 页面组织方式
- 原型阶段为了快速验证而生成的 UI 细节

### 设计阶段禁止项

- 不要把 legacy UI 当作视觉 baseline
- 不要把页面做成传统经期 App 的重分析、重月历看板
- 不要改动既定产品交互模型
- 不要把共享关系表达成复制数据
- 不要提前决定 uni-app 的页面实现细节
- 不要输出 React + Tailwind 风格的实现导向稿

## 首批页面清单与页面职责

### 1. 进入页

目标：

- 作为产品入口页，向用户说明这是一个关系记录空间中的月经模块 MVP
- 将用户明确分流到“我的模块”或“共享空间”

页面职责：

- 承载产品简介
- 承载主次入口动作
- 建立轻量、克制、可信赖的第一页印象

必须保留的交互模型：

- 明确的双入口分流
- 主入口和次入口层级清晰

必须覆盖的状态：

- 默认状态
- 无共享前提下的默认分流状态

禁止偏移：

- 不要把它做成营销落地页
- 不要加入复杂 onboarding 流程

### 2. 我的模块页

目标：

- 展示 owner 视角下可进入的模块列表
- 让用户理解模块当前是私有还是已共享

页面职责：

- 承载模块卡片列表
- 承载共享状态表达
- 提供进入模块首页的主要入口

必须保留的交互模型：

- 模块以卡片或列表形式进入
- 私有 / 已共享状态必须一眼可见
- 进入模块首页时，仍是同一个 module instance

必须覆盖的状态：

- 默认列表状态
- 空状态
- 已共享模块状态

禁止偏移：

- 不要把它做成复杂工作台
- 不要在这里引入新的编辑流程

### 3. 共享空间入口页

目标：

- 作为共享入口，表达“共享访问同一模块实例”
- 承载共享中的模块入口与轻量邀请占位信息

页面职责：

- 承载共享模块卡片
- 承载共享语义说明
- 为后续真实邀请流程留占位

必须保留的交互模型：

- 从共享入口进入时，仍进入同一模块首页
- 页面要表达这是“同实例不同入口”，而不是另一份数据

必须覆盖的状态：

- 默认共享入口状态
- 空状态
- 占位邀请状态
- 已有共享模块状态

禁止偏移：

- 不要设计成聊天或协作工具首页
- 不要暗示共享后会复制出第二份记录

### 4. 月经模块首页

目标：

- 成为月经记录 MVP 的主工作台
- 先回答“当前状态”，再支持查看、记录和补录

页面职责：

- 展示状态卡
- 展示周期窗 / 月视图日历
- 展示图例
- 承载原地编辑面板
- 承载批量补录模式

必须保留的交互模型：

- 首页结构仍为“状态卡 + 周期日历 + 原地编辑面板”
- 单日点击后在首页内联编辑，不跳独立详情页
- 长按进入批量补录模式
- Month View 只用于浏览和定位，不形成第二套编辑器
- shared/private 入口都指向同一 module instance

必须覆盖的状态：

- 默认状态
- 空状态
- 已记录状态
- 单日编辑状态
- 批量编辑状态
- 特殊标记状态
- 未来日期不可编辑状态

禁止偏移：

- 不要改成自然月主导的健康分析页
- 不要弱化首页原地编辑
- 不要把批量补录藏成低优先级二级流程

## 跨页面组件系统

Pencil MCP 至少需要围绕以下组件语义组织页面：

- `AppTopBar`
- `EntryActionCard`
- `PrimaryActionButton`
- `SecondaryActionButton`
- `ModuleCard`
- `SharedStateBadge`
- `StatusHeroCard`
- `CalendarModeSegment`
- `CalendarHeaderNav`
- `CalendarJumpTabs`
- `CalendarGrid`
- `DateCell`
- `CalendarLegend`
- `SelectedDatePanel`
- `DayStateChipGroup`
- `AttributeFieldCard`
- `BatchEditPanel`
- `EmptyStateBlock`

组件组织原则：

- 先按职责拆组件，不按视觉微差拆组件
- 首页优先稳定 `StatusHeroCard`、`DateCell`、`SelectedDatePanel`、`BatchEditPanel`
- 跨页面组件应共享同一设计语言，避免每页单独长一套 UI

## 首页核心交互契约

这些交互契约对 Pencil MCP 是冻结的，不允许重写：

- 首页优先表达当前状态，不回退成传统经期 App 信息结构
- 单日编辑发生在首页下方原地面板
- 批量补录通过长按进入，并在首页内完成保存 / 取消
- Month View 存在，但它是浏览视图，不是批量编辑器
- `period / prediction / today / special` 必须可区分，但视觉层级应克制
- 共享语义始终是同一模块实例被共同访问

## 状态页覆盖清单

Pencil MCP 至少应补全以下状态页或状态 frame：

### 全局必备

- 默认态
- 空态
- 异常或受限态

### 进入页

- 默认入口态

### 我的模块页

- 默认列表态
- 空态
- 已共享卡片态

### 共享空间入口页

- 默认共享态
- 空态
- 邀请占位态
- 已有共享模块态

### 月经模块首页

- 默认态
- 已记录态
- 单日编辑态
- 批量编辑态
- 特殊标记态
- 未来日期不可编辑态

## 业务约束来源

以下业务规则必须在设计中被尊重，即使设计稿不直接展示实现细节：

- `day_record` 是唯一持久化真相
- consecutive `period` days 派生 cycle
- missing date 视为 implicit `none`
- future date 不允许记录
- `special` 是附加事件层，不应视觉升级为最强主状态

这些约束来自：

- `D:\CodeSpace\love-recorder\models\day-record.js`
- `D:\CodeSpace\love-recorder\services\cycle-record-service.js`
- `D:\CodeSpace\love-recorder\services\module-instance-service.js`
- `D:\CodeSpace\love-recorder\utils\date.js`
- `D:\CodeSpace\love-recorder\pages\module-home\index.js`

说明：

- 前四个文件主要提供业务规则和数据模型理解
- `pages/module-home/index.js` 只用于交互流程参考，不作为设计或实现模板

## 视觉系统方向

整体视觉方向应满足以下要求：

- 页面基底使用暖白、浅暖色、灰棕系
- 卡片系统轻量、柔和、留白充足
- 用较弱阴影、轻边框、统一圆角建立系统感
- 避免厚描边、重阴影、强 H5 感和情绪化粉色模板
- 更接近克制、温和、微信原生感较强的工具产品

状态表达要求：

- `period` 是最强主状态
- `prediction` 低于 `period`
- `today` 用轻提示表达
- `special` 是附加层，不抢主层级

## 对 Pencil MCP 的直接输出要求

请基于本 brief 直接产出适合继续深化的结构化设计结果，至少包括：

1. 4 个首批页面的页面结构方案
2. 跨页面组件树
3. 每个页面的关键状态 frame
4. 月经模块首页的状态卡、日历、图例、编辑面板、批量面板关系
5. 统一的视觉方向与 token 建议
6. 需要补充的 node、frame 或说明项

输出时优先保证：

- 结构清晰
- 组件边界稳定
- 状态覆盖完整
- 不回退到 legacy UI
- 不回退到传统经期 App 模板

## 可选辅助材料

以下材料可以在需要时辅助核对，但不是默认必读输入：

- `docs/plans/2026-03-22-legacy-design-asset-index.md`
- legacy 截图资产

这些材料只用于：

- 核对页面目的
- 核对状态种类
- 核对信息架构

这些材料不用于：

- 视觉复刻
- 沿着旧 UI 修皮
- 反向约束新的设计表达

## 与现有文档的关系

这份 brief 是当前给 Pencil MCP 的主入口文档。

上游约束仍来自以下文档：

- [project-context.md](/D:/CodeSpace/hbuilder-projects/lovey-record/project-context.md)
- [tech-stack-investigate.md](/D:/CodeSpace/hbuilder-projects/lovey-record/tech-stack-investigate.md)
- [2026-03-22-new-uniapp-repo-handoff.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/plans/2026-03-22-new-uniapp-repo-handoff.md)
- [2026-03-22-figma-uniapp-replatform-design.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/plans/2026-03-22-figma-uniapp-replatform-design.md)
- [2026-03-22-figma-uniapp-migration-inventory.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/plans/2026-03-22-figma-uniapp-migration-inventory.md)

`docs/module-home-figma-design-task.md` 可以继续作为“模块首页专项任务说明”存在，但不再是首批页面整套设计的主入口。

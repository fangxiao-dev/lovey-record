# New uni-app Repo Handoff

**日期：** 2026-03-22

## 当前用途

这份 handoff 只保留当前设计阶段仍然需要的结论，供新 uni-app 主线继续推进 UI 与前端模块设计。

新主线工程：

`D:\CodeSpace\hbuilder-projects\lovey-record`

legacy 参考工程：

`D:\CodeSpace\love-recorder`

## 当前主线结论

- uni-app 是唯一实现主线
- Pencil / Figma 负责页面结构、组件层级、状态页和视觉语言
- legacy 只作为业务规则、交互契约、信息架构参考
- 不直接迁移旧页面代码，不复用 WXML / WXSS / `Page({})`

## 当前阶段真正需要的资料

设计与前端模块阶段，优先使用这几份文档：

- `project-context.md`
- `tech-stack-investigate.md`
- `docs/design/2026-03-22-pencil-mcp-first-batch-pages-brief.md`
- `docs/figma-miniprogram-design-reference.md`
- `docs/plans/2026-03-22-figma-uniapp-migration-inventory.md`

如需核对截图状态，再补：

- `docs/plans/2026-03-22-legacy-design-asset-index.md`

## legacy 使用边界

优先参考这些文件：

- `D:\CodeSpace\love-recorder\models\day-record.js`
- `D:\CodeSpace\love-recorder\services\cycle-record-service.js`
- `D:\CodeSpace\love-recorder\services\module-instance-service.js`
- `D:\CodeSpace\love-recorder\utils\date.js`
- `D:\CodeSpace\love-recorder\pages\module-home\index.js`

说明：

- 前四项主要用于业务规则和数据模型理解
- `pages/module-home/index.js` 只用于交互流程参考，不是设计或实现模板

## legacy UI 结论

legacy UI 不再是视觉 baseline。

只保留这些价值：

- 业务规则
- 交互契约
- 状态范围
- 信息架构

不保留这些价值：

- 旧页面视觉样式
- 旧布局表现
- 旧组件外观
- 页面级 glue code

## 当前交接重点

当前任务重点不是迁移代码，而是冻结：

- 首批页面职责
- 页面间组件系统
- 首页核心交互契约
- 状态页覆盖范围
- 业务规则与前端模块的边界

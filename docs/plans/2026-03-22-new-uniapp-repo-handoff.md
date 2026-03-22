# New uni-app Repo Handoff

**日期：** 2026-03-22

## 当前用途

这份 handoff 保留当前主线实现仍然需要的结论，用来帮助本仓库继续推进 uni-app 页面、组件和前端模块设计。

当前主线工程：

`D:\CodeSpace\hbuilder-projects\lovey-record`

legacy 参考工程：

`D:\CodeSpace\love-recorder`

已废弃且不再作为依据的工程：

`D:\CodeSpace\love-record`

## 当前主线结论

- `D:\CodeSpace\hbuilder-projects\lovey-record` 是唯一实现主线
- uni-app 是唯一前端实现主线
- Pencil / Figma 负责页面结构、组件层级、状态页和视觉语言
- `love-recorder` 只作为业务规则、交互契约、信息架构参考
- 不直接迁移旧页面代码，不复用 WXML / WXSS / `Page({})`

## 当前阶段真正需要的资料

主线开发阶段，优先使用这些文档：

- `project-context.md`
- `tech-stack-investigate.md`
- `docs/plans/2026-03-22-figma-uniapp-replatform-design.md`
- `docs/plans/2026-03-22-figma-uniapp-replatform-implementation-plan.md`
- `docs/design/2026-03-22-pencil-mcp-first-batch-pages-brief.md`
- `docs/figma-miniprogram-design-reference.md`

如需核对 legacy 业务规则与状态范围，再补：

- `docs/plans/2026-03-22-figma-uniapp-migration-inventory.md`
- `docs/plans/2026-03-22-legacy-design-asset-index.md`

## legacy 使用边界

优先参考这些类型的资料：

- `D:\CodeSpace\love-recorder\models\*.js`
- `D:\CodeSpace\love-recorder\services\*.js`
- `D:\CodeSpace\love-recorder\utils\*.js`
- `D:\CodeSpace\love-recorder\docs\plans\*.md`
- 已同步到当前仓 `docs/` 内的设计与迁移说明

说明：

- 模型、服务、工具层主要用于业务规则和数据模型理解
- 设计与计划文档主要用于状态范围、交互契约和信息架构理解
- legacy 页面代码只可用于交互流程参考，不是设计或实现模板

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

当前任务重点不是迁移旧代码，而是持续强化当前主线：

- 首批页面职责
- 页面间组件系统
- 首页核心交互契约
- 状态页覆盖范围
- 业务规则与前端模块的边界
- token 与基础样式层的稳定性

# 首页双 Tab 设计文档

**日期：** 2026-04-09  
**范围：** 将小程序首页扩充为两个 Tab：工作台首页（消息面板）+ 模块管理  
**设计稿参考：** `docs/design-drafts/2026-03-22-module-space-and-period-home.pen`（节点 2tLiV, E5cmm, 9OJJD），`docs/design-drafts/工作台首页 ! 共享变体.png`

---

## 背景与目标

当前首页（`pages/index/index.vue`）承担模块管理职责，没有底部导航，是单页结构。

目标：引入原生 tabBar，把首页拆成两个 Tab：

1. **Tab 1（首页）**：工作台首页 —— 轻量的"续接"入口，让用户快速看到当前状态并进入模块
2. **Tab 2（模块管理）**：保留现有管理页面，不改动功能逻辑

---

## 导航结构

采用 uni-app 原生 `tabBar`，配置两个 tab：

| Tab | 文字 | 页面路径 |
|-----|------|---------|
| 1（默认） | 首页 | `pages/dashboard/index` |
| 2 | 模块管理 | `pages/index/index` |

- Tab 1 是应用启动默认落点
- Tab 1 导航栏右上角放"管理 ›"文字按钮，调用 `uni.switchTab` 跳到 Tab 2
- Tab 2 无变化，路径、功能、样式保持原样

---

## Tab 1：工作台首页（新建）

### 页面职责

帮助用户快速续接：看到模块的当前状态，直接进入模块，或跳到管理页。

### 模块卡片结构

每个模块（私有 + 共享）渲染一张卡片，包含：

| 字段 | 来源 |
|------|------|
| 模块图标 + 名称 | `module.moduleName`，图标用现有 "经" 字占位 |
| 状态 badge（经期中 / 还有 N 天 / 正常 等） | `module.badgeText` |
| 最后同步时间 | `module.durationText`（复用现有字段） |
| 参与者头像 | 有 `partnerUserId` 则渲染字母头像；无则不显示 |
| 点击入口 | `module.entryUrl`，使用 `<navigator>` 跳转 |

卡片按私有区 → 共享区顺序排列，区间无需额外分组标题（和管理页不同，首页保持扁平）。

### 加载 / 空状态

- 数据通过现有 `loadMenstrualModuleShellPageModel` + `resolveModuleContext` 获取，与管理页共享同一服务
- 加载中：显示 loading 占位卡片（骨架感，无实际骨架屏组件）
- 加载失败：显示错误提示 + 重试按钮，与管理页保持一致
- 模块为空：显示"暂无模块，前往管理页添加"

### 近期事件 feed

**本期简化**：不做 activity log。仅在每张卡片下方显示 `durationText`（如"2小时前"），作为"最后同步时间"展示。后续可扩展为真正的 feed。

---

## Tab 2：模块管理（现有，不改动）

`pages/index/index.vue` 保持完全不变，包括：

- Hero 卡
- 私有区 / 共享区模块列表
- 月经设置面板（经期天数、预测期配置）
- 共享状态控制（分享 / 取消分享）
- 开发工具栏（仅 dev 模式）

唯一隐性变化：该页面成为 tabBar 页面，`pages.json` 中需移至 tabBar list 内。

---

## 文件变更范围

| 文件 | 操作 |
|------|------|
| `frontend/pages.json` | 添加 `tabBar` 配置；新增 `pages/dashboard/index` 路由 |
| `frontend/pages/dashboard/index.vue` | **新建**：工作台首页页面 |
| `frontend/pages/index/index.vue` | 无代码修改（路径不变，成为 tabBar 页面） |

无需新建服务、无需后端改动。

---

## 约束

- 不改动模块管理页的任何逻辑或样式
- 不新增后端接口
- 首页卡片样式遵循现有 token（`$accent-period`、`$bg-subtle` 等）
- tabBar 本期不配置 `iconPath`，仅使用文字标签（uni-app 允许纯文字 tabBar）；后期按需补充图标文件


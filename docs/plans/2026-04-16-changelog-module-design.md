# Changelog 模块设计文档

**日期**：2026-04-16  
**状态**：草稿，待审阅

---

## 1. 功能定位

低打扰的产品演进感知层。不是通知系统，不是数据分析。

目标：让用户在不被打断的情况下感知到"产品在进化"。

---

## 2. 入口设计（frontend-changelog-entry）

### 位置

模块管理页（首页）底部，`模块管理` 卡片之后，带页面级水平 padding（`space.page = 16px`），距底部留足安全间距（≥ 24px）。

未来若增加 tab bar，入口置于 tab bar 之上。

### 视觉结构

```
┌─────────────────────────────────────┐
│  更新记录  ●(红点/无)               │
│  最近：新增周期阶段提示         ›   │
└─────────────────────────────────────┘
```

**尺寸与间距**
- 宽：`fill_container`，无背景卡片，与页面融合
- 上下 padding：`space.tight = 8px`（轻量，非独立卡片）
- 与上方内容间距：`space.section = 20px`

**左侧（vertical layout，gap: 3px）**
- 行 1：`更新记录`（`font.size.body = 14px`，`font.weight: 500`，`color.text.primary`）+ 未读红点（`7px` 圆，`color.accent.period = #C9786A`，有新版本时显示）
- 行 2：`最近：{最新 tag 的第一条摘要}`（`font.size.caption = 12px`，`color.text.muted`）

**右侧**
- chevron-right icon（`16px`，`color.text.muted`）

### 状态变体

| 状态 | 红点 | 摘要文字 |
|------|------|----------|
| 有未读新版本 | 显示（`#C9786A`） | 最新 tag 的第一条 change |
| 已读 / 无新版本 | 隐藏 | 同上 |
| 无任何 changelog 数据 | 隐藏 | 隐藏整个入口 |

---

## 3. Bottom Sheet 设计（frontend-changelog-sheet）

### 触发 / 关闭

- **打开**：点击入口行
- **关闭（三种方式）**：
  1. 点击上方背景遮罩（主路径）
  2. 下滑手势（gesture）
  3. 可选：sheet 内关闭按钮

### 遮罩

- 背景 dim：`rgba(0, 0, 0, 0.18)`（轻遮罩，维持轻量感但明确模态边界）

### Sheet 规格

```
┌──────────────────────────────┐  ← 遮罩（点击关闭）
│                              │
│  ────────  (drag indicator)  │  4px × 32px，radius: pill，color.border.subtle
│                              │
│  更新记录                    │  font.size.title (18px)，fontWeight 600
│                              │
│  最近更新                    │  font.size.caption，color.text.muted，uppercase / 小节标题
│  · 新增周期阶段提示          │
│  · 优化首页信息密度          │
│                              │
│  ────────────────────────── │  1px divider，color.border.subtle
│                              │
│  历史版本                    │  小节标题
│                              │
│  v1.1.0                  ›  │  accordion item，默认折叠
│  v1.0.0                  ›  │
│                              │
└──────────────────────────────┘
```

**高度**：屏幕的 70%（`70vh`），不随内容撑高，内部可滚动  
**圆角**：顶部 `radius.panel = 14px`，底部无圆角（贴底）  
**背景**：`color.bg.card = #FFFFFF`  
**内部 padding**：`20px` 水平，`24px` 顶部（drag indicator 之后）

### Sheet 内容结构

```
drag indicator（居中）
├── 标题：更新记录
├── 分区：最近更新
│   └── change list（bullet，`font.size.body`）
├── 分隔线
└── 分区：历史版本
    └── accordion list
        ├── v1.1.0 周期阶段提示（点击展开）
        └── v1.0.0 初始化
```

### Accordion 展开态

```
v1.1.0 周期阶段提示             ˅
  · 新增：月经记录模块
  · 优化：UI 布局
```

---

## 4. 功能行为（function-changelog）

### 4.1 自动弹出逻辑

```
App 启动
  → 读取本地存储 lastViewedVersion
  → 对比 changelog 数据中的 latestVersion
  → 若 latestVersion > lastViewedVersion
      → 自动打开 Bottom Sheet
      → 写入 lastViewedVersion = latestVersion（关闭时）
  → 否则：不弹出
```

**已读判定**：用户关闭 sheet（任意方式）即视为已读，写入 `lastViewedVersion`。不要求用户滚动到底部。

### 4.2 红点逻辑

```
hasUnread = (changelog[0].version !== lastViewedVersion)
```

取数组第一项（最新版本）的 `version` 与 `lastViewedVersion` 做字符串相等比较即可。数组已按版本从新到旧排列，无需版本号大小运算。

启动时计算，写入已读后实时更新。红点消失即为已读的唯一视觉反馈，无需其他状态提示。

### 4.3 "无数据"兜底

若 changelog 数据为空数组，**隐藏整个入口行**，不渲染任何占位。

---

## 5. 数据结构

### Phase 1：静态文件（bundled）

维护路径：`frontend/static/changelog.json`

放在 `static/` 根层而非 `management/` 或 `menstrual/` 子目录下，表明它是产品级全局文件，不属于任何单一功能模块。小程序打包要求静态资源在 `frontend/` 内，故不放项目根目录。

```json
[
  {
    "version": "v1.2.0",
    "title": "周期阶段提示",
    "date": "2026-04-16",
    "changes": [
      "新增周期阶段提示",
      "优化首页信息密度"
    ]
  },
  {
    "version": "v1.1.0",
    "title": "月经记录模块",
    "date": "2026-03-22",
    "changes": [
      "新增月经记录模块",
      "优化 UI 布局"
    ]
  },
  {
    "version": "v0.0.0",
    "title": "初始化",
    "date": "2026-01-01",
    "changes": [
      "项目初始化"
    ]
  }
]
```

**字段说明**
- `version`：版本号字符串（格式 `v主.次.补`），数组按版本从新到旧排列，`[0]` 即为最新版本
- `title`：版本简短标题，用于入口行预览（`最近：{title}`）和 accordion 标头（`{version} {title}`）
- `changes`：sheet 内展示的 change list

**维护方式（Phase 1）**：
- 发布新版时，在 GitHub 上打 tag，release notes 即为 changelog 内容
- 手动将同样内容写入 `static/changelog.json` 并随代码发布
- 两步操作，都在开发者手中，无外部依赖

### Phase 2（后续）

考虑 CI 脚本从 GitHub Releases API 自动同步生成 `changelog.json`，消除双维护。

---

## 6. 本地状态管理

| 字段 | 存储位置 | 类型 | 说明 |
|------|----------|------|------|
| `lastViewedVersion` | `wx.setStorageSync` | `string` | 用户已查看的最新版本号，缺省值 `"0.0.0"` |

不需要后端状态。纯客户端本地存储。

---

## 7. 动效规格

| 事件 | 动效 |
|------|------|
| Sheet 展开 | 从底部 slide-up，`ease-out`，`280ms` |
| Sheet 收起 | Slide-down，`ease-in`，`220ms` |
| 遮罩出现 | fade-in，与 sheet 同步 |
| 遮罩消失 | fade-out，与 sheet 同步 |

---

## 8. 范围边界

**本期（MVP）包含**
- 入口行（含红点）
- Bottom Sheet（最近更新 + 历史版本折叠）
- 自动弹出逻辑（首次打开新版本）
- 静态 JSON 数据文件

**本期不包含**
- 推送通知
- 更新分类标签（feature / fix）
- 多端同步阅读状态
- 个性化更新

---

*(无待确认项)*

# Pencil Board 约定

## 目标

这份文档定义当前 `.pen` 文件里常见 board / section 的职责，避免同一块区域在不同轮次里被当成不同用途。

## 总原则

board 有展示职责，但展示不能漂移语义。

也就是说：

- 允许 compact
- 允许重新排版
- 不允许为了“更好看”而改变 token 或状态的真实含义

## 关键板块职责

### Token Foundations

职责：

- 汇总当前 light 系统的 token 展示
- 定义颜色、文本、表面、spacing、radius、基础状态表达

要求：

- 这是 foundations 展示板，不是自由 moodboard
- 结构可以压缩，但不能牺牲 token 语义
- 这里的主背景层级必须清楚体现 `bg.base / bg.subtle / bg.card`

### Palette Series

职责：

- 展示当前主色及其系列化色带
- 帮助判断 anchor、浅档、中档、深档是否都可读

要求：

- 每个系列只承担“系列展示”职责，不替代正式 semantic token
- ramp 的 `500` 必须是当前工作锚点，而不是机械中位数
- 浅色块文字必须单独校正可读性

### Marker States

职责：

- 展示单个 marker 语义，而不是整个月历布局

要求：

- `special` 与 `period` 可以同色，但必须靠 icon/form 区分
- `today` 不能误做成和强状态一样的填充块
- `prediction` 若是同语义弱态，应通过浅色或弱表达呈现

### Date States

职责：

- 展示单个日期单元在不同状态下的最终表达

要求：

- 普通日期不做多余强调
- pale fill 上的数字不可默认白字
- date state 必须和 marker 语义保持一致，不能一个板块一套说法

## 命名与维护规则

- board 名称要能说明职责，不要用临时试验命名
- 同一类板块的职责不能跨轮次漂移
- 若某板块已经变成长期设计合同，应把约定同步写进 repo 文档，而不是只留在设计稿里

## 当前仓库的文件映射

- [../../design-drafts/2026-03-22-design-tokene.pen](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design-drafts/2026-03-22-design-tokene.pen)
  - `Token Foundations`
  - `Palette Series`
  - `Marker States`
  - `Date States`
- [../../design-drafts/2026-03-22-module-space-and-period-home.pen](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design-drafts/2026-03-22-module-space-and-period-home.pen)
  - 页面组合与业务层表达

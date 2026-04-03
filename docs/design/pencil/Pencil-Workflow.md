# Pencil 工作流

## 目标

这份文档定义当前 repo 中基于 Pencil 的标准工作流，避免 agent 或开发者在 `.pen` 文件里跳过 token 层、直接在页面层发明样式，或者在 live 编辑异常时继续扩大破坏面。

## 核心原则

Pencil 设计协作遵守单向供应链：

`design token -> component library -> business page`

不能反过来走，也不能先在业务页里做 page-local 方案再回填。

## 文件分工

### 1. token / foundations

这类内容只在：

- [../../design-drafts/2026-03-22-design-tokene.pen](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design-drafts/2026-03-22-design-tokene.pen)

适用内容：

- `Token Foundations`
- `Palette Series`
- 颜色、字体、间距、圆角、基础表面层级
- semantic token 的命名与展示

### 2. component library / date states / business draft

这类内容只在：

- [../../design-drafts/2026-03-22-module-space-and-period-home.pen](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design-drafts/2026-03-22-module-space-and-period-home.pen)

适用内容：

- component library
- date states
- 页面布局
- 模块空间与业务组合
- 页面如何消费已有 token 与组件

## 标准执行步骤

1. 先读 repo 契约与视觉规则。
2. 判断本次改动属于哪一层：
   - token
   - component library
   - page composition
3. 只打开对应源文件，不跨文件混改。
4. 每轮只处理一个局部意图：
   - 调语义
   - 调层级
   - 调展示
   - 调状态表达
5. 每轮改动后，必须同时做两种检查：
   - 用 `batch_get` 检查关键节点是否真的改到了目标属性
   - 用 `get_screenshot` 检查视觉上是否真的成立
6. 若 foundations 仍不稳定，不得同步业务页使用方式。
7. 只有 token 层稳定后，才允许把同一语义传播到 component 或 page。

## 局部改动优先级

Pencil 中的操作优先级固定如下：

1. 定点更新
2. 小范围验证
3. 再做批量整理

不允许：

- 先全局替换
- 再靠肉眼救火

## 何时必须先改 token 文件

只要变更涉及以下任意一项，就必须先改 `2026-03-22-design-tokene.pen`：

- 新颜色语义
- 新 spacing / radius / type 层级
- 新 marker 资源或颜色语义
- 新 surface / type / spacing / radius 层级

## 何时必须先改业务文件中的 component library

只要变更涉及以下任意一项，就必须先改 `2026-03-22-module-space-and-period-home.pen` 中的 component-library 区：

- 新可复用组件或组件变体
- date state 的正式表达
- page 中出现了明显可复用的重复结构

## 何时允许只改业务页

只有当变更明确属于页面组合，而不产生新的视觉标准时，才允许只改 `2026-03-22-module-space-and-period-home.pen`，例如：

- 现有组件的排布调整
- 已有状态组合方式的排列变化
- 页面信息架构顺序微调

## 当前仓库的额外约束

- business-page 文件中的 component-library 区是当前 reusable visual source of truth
- display board 可以 compact，但不能改变 token 含义
- foundations 稳定之前，不要把局部试验当成可传播标准


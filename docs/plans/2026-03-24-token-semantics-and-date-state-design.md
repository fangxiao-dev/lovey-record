# Token Semantics And Date State Design

**日期：** 2026-03-24

## 背景

- 目标文件：`docs/design-drafts/2026-03-22-design-tokene.pen`
- 本轮聚焦节点：`TokFd01`、`TokA012`、`rAtbZ`、`gmmIk`、`t33PT`、`CmpLib1`、`CmpCal1`
- 当前问题：accent 与 support 语义混杂、`prediction` 与 `period.soft` 映射不一致、文案与色值对不上、组件层存在语义色硬编码

## 设计结论

- `prediction` 不再作为独立颜色 token；并入 `period.soft` 的颜色资源。
- `prediction` 保留为业务状态语义，由状态映射消费 `color.accent.period.soft`。
- 绿色与蓝色收敛为扩展支持色（support family），仅用于信息、标签等扩展场景，不作为当前经期核心状态主色。
- 日期 5 态以 `t33PT` 为规范顺序：`special` / `prediction` / `normal` / `period` / `selected(today)`。

## 语义命名重排

### Accent Family（经期核心状态资源）

- `color.accent.period`
- `color.accent.period.soft`
- `color.accent.today`
- `color.accent.special`

说明：`prediction` 业务态映射到 `color.accent.period.soft`，不再新增或保留独立 `color.accent.prediction` 资源名。

### Support Family（扩展信息资源）

- `color.support.calm`（绿色）
- `color.support.info`（蓝色）

说明：support family 在 token 层保留，但不与经期核心状态资源混排。

### Alias 与共享值约定

- 允许不同语义共享同值，例如 `selected` 与 `today` 的描边色。
- 共享同值时保持语义名分离，避免“颜色同值 = 语义相同”的误读。

## 板块改造要求

### Token Foundations（`TokFd01`）

- 清理 `TokA012` 的重复 `special` 项，移除 blue special 误导项。
- 统一 `rAtbZ` 展示文案，修复 `accent.prediction` 卡片文案误写为 `period.soft` 的问题。
- `text.support`（`gmmIk`）必须保持 name / hex / swatch 三项一致。
- `Accent Controls` 与 `Color Tokens` 两处展示采用同一套语义映射。

### Date States（`t33PT`）

- 固化为可复用日期状态示例，作为高一层 token 能力。
- 保持 5 态顺序与表达一致：
  - `special`：描边 + eye marker
  - `prediction`：弱态浅填充（映射 `period.soft`）
  - `normal`：无强调
  - `period`：主强调填充
  - `selected(today)`：描边强调

### Component Library（`CmpLib1` / `CmpCal1`）

- Calendar 相关示例优先复用 Date State 规范表达，不再局部定义新状态视觉。
- `Primitive/CalendarLegend` 与 `Composite/CalendarGrid` 的状态色来源必须与 token 映射一致。

## 硬编码治理规则

- 允许硬编码：Palette ramp 展示区（纯展示用途）。
- 禁止硬编码：组件语义层（fill/text/stroke 的业务态表达）。
- 审核对象：`TokFd01` 与 `CmpLib1` 全量语义节点，重点检查日期格、legend、tag、chip、状态卡片。
- 处理原则：将语义色替换为 `$color.*` 变量引用，并在展示文案中同步正确 hex 与语义名。

## 实施顺序（token-first）

1. 先改 Token Foundations 命名与映射。
2. 再稳定 Date States 5 态示例并抽象为可复用表达。
3. 再替换 Component Library 中与状态相关的硬编码。
4. 最后做全板块一致性校验与截图验收。

## 验收标准

- `TokA012` 不再出现重复 `special`，且不再把 support 色伪装成 special。
- `prediction` 在颜色资源层只走 `period.soft` 映射。
- `gmmIk` 中 `text.support` 的标题、hex、视觉色一致。
- `t33PT` 与 `CmpCal1` 的 5 态表达一致且顺序一致。
- 组件语义层不存在新增状态色硬编码，核心表达统一走变量。

## 风险与备注

- `color.accent.prediction` 删除或替换可能影响历史节点引用；迁移时需先查引用再移除。
- 同值别名策略需要在文档中持续维护，避免后续被错误去重。
- 本文档为设计决策与执行约束，不直接替代实现计划。

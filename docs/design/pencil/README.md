# Pencil 设计协作目录

## 作用

`docs/design/pencil/` 用来沉淀当前仓库在 Pencil 协作中的长期规范。

这里不记录某一次改稿计划，而是记录跨多轮设计仍然成立的工作规则，例如：

- `.pen` 文件分工
- token / component / page 的协作顺序
- board 命名与职责
- 常见故障与恢复顺序

如果一条知识是“后续任何 agent 再改 `.pen` 都应该先知道”，它就应该落在这里，而不是只写进某个 plan。

## 阅读顺序

1. [../2026-03-22-tokenize-collaboration-rule.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design/2026-03-22-tokenize-collaboration-rule.md)
2. [../2026-03-23-ui-visual-language-guide.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design/2026-03-23-ui-visual-language-guide.md)
3. [Pencil-Workflow.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design/pencil/Pencil-Workflow.md)
4. [Pencil-Board-Conventions.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design/pencil/Pencil-Board-Conventions.md)
5. [Pencil-Pitfalls-And-Recovery.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design/pencil/Pencil-Pitfalls-And-Recovery.md)

## 与全局 Skill 的关系

这个目录是 repo 内的中文契约。

与之配套的全局 skill 在：

- `C:\Users\Xiao\.agents\skills\pencil-token-first-design\SKILL.md`
- `C:\Users\Xiao\.agents\skills\pencil-live-edit-recovery\SKILL.md`

推荐分工：

- 全局 skill 负责触发、提醒、约束 agent 行为
- 本目录负责当前仓库的具体文件、板块、命名、恢复细节

## 当前适用范围

当前优先服务 `design token` 场景，尤其是这两个 `.pen` 文件：

- [../../design-drafts/2026-03-22-design-tokene.pen](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design-drafts/2026-03-22-design-tokene.pen)
- [../../design-drafts/2026-03-22-module-space-and-period-home.pen](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design-drafts/2026-03-22-module-space-and-period-home.pen)

后续若扩展到更多 Pencil 文件，也应沿用这里的协作方式。

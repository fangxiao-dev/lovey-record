# Pencil 设计协作目录

## 作用

`docs/design/pencil/` 用来沉淀当前仓库在 Pencil 协作中的长期规范。

这里不记录某一次改稿计划，而是记录跨多轮设计仍然成立的工作规则，例如：

- `.pen` 文件分工
- token / component / page 的协作顺序
- board 命名与职责
- 常见故障与恢复顺序

如果一条知识是“后续任何 agent 再改 `.pen` 都应该先知道”，它就应该落在这里，而不是只写进某个 plan。

## 什么时候读

- 只要你要改 `.pen` 文件，就先读这里。
- 如果任务涉及 token、视觉语言或 Pencil 恢复规则，再读对应的上游设计文档。
- 如果任务只是看图、改稿或收尾，不要把整个 Pencil 目录当成必读清单。

## 目录里有什么

- `Pencil-Workflow.md` - `.pen` 协作顺序和常规工作方式。
- `Pencil-Board-Conventions.md` - board 命名、职责和放置习惯。
- `Pencil-Pitfalls-And-Recovery.md` - 常见故障与恢复顺序。

## 与全局 Skill 的关系

这个目录是 repo 内的中文契约。

与之配套的全局 skill 在：

- `C:\Users\Xiao\.agents\skills\pencil-token-first-design\SKILL.md`
- `C:\Users\Xiao\.agents\skills\pencil-live-edit-recovery\SKILL.md`

推荐分工：

- 全局 skill 负责触发、提醒、约束 agent 行为
- 本目录负责当前仓库的具体文件、板块、命名、恢复细节


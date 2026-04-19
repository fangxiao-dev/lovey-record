# Changelog Function

## Purpose

The changelog is a low-interruption product evolution layer. Its job is to let users notice that the product has changed, without disrupting their primary flow of logging or reviewing cycle data.

It is not a notification system. It is not a data dashboard. It is not a marketing surface.

For the UI presentation contract, read the paired frontend doc:

- [frontend-changelog.md](./frontend-changelog.md)

---

## Data Source

Changelog content is maintained as a bundled JS module at:

`frontend/utils/changelog-data.js`

The module exports a default array. It is bundled with the app at build time and is not fetched from a remote server.

The array is ordered from newest to oldest. Index `0` is always the most recent entry.

Each entry has the following shape:

- `version` — version string in `vMAJOR.MINOR.PATCH` format (e.g. `v1.2.0`)
- `title` — short human-readable title for this release (e.g. `周期阶段提示`)
- `date` — release date in `YYYY-MM-DD` format
- `changes` — array of user-facing change description strings, ordered by importance

### Review Draft Policy

The long-lived rule still applies: production entries should only be added when a GitHub release tag is created for that version.

For this review pass, the current `master` history is condensed into a smaller set of user-visible release entries below. Treat them as the draft changelog content used to keep the runtime data module aligned with actual user-facing changes.

The historical tags in this repository were not maintained as a clean user-facing release line, so this draft re-establishes the visible changelog sequence from `v0.0.1` and applies semver from there.

### Authoring Rule

A new changelog entry should only be added when a GitHub release tag is created for that version. If code is deployed without a tag, no changelog entry is added. This ensures the changelog reflects intentional product communications, not every deployment.

When a new tag is created, the `frontend/utils/changelog-data.js` module must be updated manually in the same release commit.

---

## Entry Row Behavior

The entry row is a passive discovery surface. It is always present at the bottom of the module management page as long as changelog data exists.

Rules:

- the entry row renders only when `frontend/utils/changelog-data.js` contains at least one entry
- the entry row does not navigate away from the page
- tapping the entry row opens the bottom sheet
- the entry row does not trigger any data mutation on tap

The preview text in the entry row always reflects the `title` of `changelog[0]`, regardless of read state.

---

## Read State

Read state is tracked locally using `uni.setStorageSync`.

The stored key is `lastViewedVersion`. Its value is the `version` string of the most recently viewed entry. The default value when no record exists is `"v0.0.0"`.

### Unread Condition

```
hasUnread = (changelog[0].version !== lastViewedVersion)
```

This comparison is a simple string equality check. The array is already sorted newest-first, so no version parsing or ordering logic is needed.

### Writing Read State

When the user closes the bottom sheet by any method (overlay tap, swipe, or close button), `lastViewedVersion` is set to `changelog[0].version`.

Read state is written on close, not on open. This is intentional: if a user opens and immediately dismisses the sheet, they are still considered to have acknowledged the update.

Read state is not synced to the server. It is device-local.

---

## Auto-Show Logic

The bottom sheet is shown automatically at app startup under one condition: the current changelog has an entry the user has not yet seen.

The startup sequence is:

1. Read `lastViewedVersion` from local storage
2. Load `frontend/utils/changelog-data.js`
3. If `changelog[0].version !== lastViewedVersion`, open the bottom sheet automatically
4. When the sheet closes, write `lastViewedVersion = changelog[0].version`

After the user closes the sheet, it must not auto-show again for the same version. This check is performed once per app session at startup.

The auto-show must not trigger if:

- the changelog data array is empty
- `lastViewedVersion` already matches the latest entry

---

## Bottom Sheet Behavior

### Content

The sheet shows two sections:

**最近更新** — the latest entry shows its `version` and `title` first, then the `changes` array as a compact flat list.

**历史版本** — all entries at index 1 and beyond, presented as a collapsed accordion list. Each item shows its `version` and `title` as the header and its `changes` array when expanded.

### Accordion Behavior

Accordion items are collapsed by default.

Only one item can be expanded at a time. Expanding an item collapses any previously expanded item.

Collapsing is triggered by tapping the same item again.

### Sheet Dismissal

All three dismissal paths produce the same outcome: the sheet closes and `lastViewedVersion` is written.

There is no distinction between "user read everything" and "user dismissed quickly". Both are treated as acknowledged.

---

## Must Preserve

- the entry row must remain passive — it must never push itself to the user's attention beyond the unread dot
- auto-show must happen at most once per version per device
- read state must be written on close, not on open
- the latest entry's `title` must always be visible in the entry row preview, regardless of whether it has been read
- the sheet must not navigate the user away from the module management page
- changelog content must be editorially curated — only entries tied to GitHub release tags should appear

## Must Avoid

- showing a changelog entry for every code deployment
- syncing read state to the server in the MVP phase
- adding version comparison logic (semver parsing, ordering) — the array order is the source of truth
- making the entry row feel like a notification or badge that demands immediate action
- auto-showing the sheet more than once for the same version
- keeping the sheet open across app sessions (it should close on app exit and only re-trigger on the next startup if the version check fails)

---

## 9. 当前 master 历史提炼的 8 个用户向版本（review draft）

> 下面这版按当前 `master` 的提交轨迹压缩而成，顺序从新到旧。只保留用户能够直接感知的功能或体验变化，不保留纯内部工程里程碑。

### v0.5.0 - 新增周期阶段提示

- 日期：2026-04-16
- 覆盖：周期阶段 hero、提示文案、注意提示 icon
- 重点：
  - 首页会直接显示当前周期阶段：卵泡期、排卵期、黄体期、经期
  - 需要注意时会补充“月经可能临近”的提示
  - 普通提示只显示文案，不强制加 icon
  - H5 页面和设计稿保持一致

### v0.4.0 - 新增月经报告页

- 日期：2026-04-10 - 2026-04-11
- 覆盖：月经报告页、趋势图、首页入口
- 重点：
  - 可以从首页进入月经报告页查看周期概览
  - 报告页补上了趋势图和摘要信息

### v0.3.0 - 支持模块共享

- 日期：2026-04-09 - 2026-04-13
- 覆盖：共享弹窗、邀请链接、只读模式
- 重点：
  - 分享时可以选择让对方只读或一起编辑
  - 加入了更清晰的共享确认流程
  - 补齐邀请加入页面

### v0.2.1 - 提升反馈速度

- 日期：2026-04-03 - 2026-04-04
- 覆盖：乐观写入、预测展示、跳转
- 重点：
  - 记录经期后页面反馈更快
  - 预测区间展示更稳定
  - 跳转到预测区更顺手

### v0.2.0 - 支持单日编辑

- 日期：2026-04-02
- 覆盖：单日经期编辑、批量选择、H5 入口
- 重点：
  - 可以直接修改某一天的经期记录
  - 补记和调整会更顺手
  - 补齐 H5 入口

### v0.1.1 - 提升页面稳定性

- 日期：2026-03-31 - 2026-04-01
- 覆盖：页面打开、加载稳定性
- 重点：
  - 页面打开和加载更稳定

### v0.1.0 - 优化日历与日期状态

- 日期：2026-03-27 - 2026-03-28
- 覆盖：日历栅格、图例、日期状态
- 重点：
  - 日历里的日期状态和颜色更统一
  - 预测期、经期和普通日期更容易区分
  - 完成主页展示骨架

### v0.0.1 - 新建月经记录首页

- 日期：2026-03-22
- 覆盖：uni-app scaffold、token、模块壳
- 重点：
  - 完成了第一版月经记录首页和基础交互

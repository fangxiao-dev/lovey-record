# Design: Share Confirmation Modal + Native WeChat Forward

**Date:** 2026-04-13  
**Status:** Approved

## Problem

The current "共享" button in `ModuleManagementPage` creates an invite token and copies a join URL to the clipboard. This is not a usable sharing mechanism — users expect to forward a mini-program card directly to a WeChat contact, not paste a raw URL somewhere.

## Goal

Replace the clipboard copy flow with:
1. A confirmation modal (owner sees module name + permission summary before sharing)
2. A native WeChat forward triggered by `open-type="share"` inside the modal
3. Recipient receives a mini-program card → taps → lands on `pages/join/index` (already built)

## Constraints

- `onShareAppMessage` is a page lifecycle hook and must live on the page component (`pages/management/index.vue`), not inside a child component.
- `<button open-type="share">` anywhere in the component tree triggers the current page's `onShareAppMessage`.
- H5 does not support `open-type="share"`. The button is a no-op in H5 (local debug only, acceptable).

## Architecture

### Data flow

```
Owner taps "共享"
  → ModuleManagementPage: showShareModal = true
  → Modal renders (module name, read-only permission summary, "发送邀请" button)
  → Owner taps "发送邀请" (open-type="share")
  → pages/management/index.vue onShareAppMessage fires
      → reads this.$refs.managementPage.context
      → calls createInviteToken({ apiBaseUrl, openid, moduleInstanceId })
      → returns { title: '邀请你查看月经记录', path: 'pages/join/index?token=xxx&apiBaseUrl=xxx' }
  → WeChat native forward picker opens
  → Owner selects friend → recipient receives mini-program card
  → Recipient taps card → pages/join/index (existing) → taps "加入" → home
```

### Files changed

| File | Change |
|------|--------|
| `frontend/components/management/ModuleManagementPage.vue` | Add `showShareModal` state; change `handleShareAction` to open modal; add modal UI |
| `frontend/pages/management/index.vue` | Add `onShareAppMessage` that reads context via `$refs.managementPage.context` and creates invite token |
| `frontend/components/management/ModuleActionRow.vue` | No change |
| `frontend/pages/join/index.vue` | No change |

## Modal Content

- Module name ("月经记录")
- Read-only permission badge (mirrors what recipient sees in join page)
- Permission rows: can view / cannot edit
- "发送邀请" button (`open-type="share"`)
- "取消" button to dismiss modal

## Error Handling

If `createInviteToken` fails inside `onShareAppMessage`, return `{ title: '月经记录' }` with no path. WeChat falls back to the current page path. Consistent with `home.vue` pattern.

## Out of Scope

- Permission selector (read-only vs. editable) — slot reserved in modal, not implemented
- Post-share success state / receipt confirmation
- H5 share fallback (copy link) — H5 is dev-only, no action needed

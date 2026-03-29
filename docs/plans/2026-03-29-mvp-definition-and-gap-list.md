# MVP Definition And Gap List

**Date:** 2026-03-29

## Purpose

This document defines what "first MVP complete" means for the current repo and lists the remaining gaps in one place.

It is intended to stop progress discussions from drifting into single-task status updates.
From this point on, completion should be judged against this document rather than against individual fixes.

## MVP Definition

The first MVP is complete only when all of the following are true:

1. A user can enter the app, identify the menstrual module, and enter the menstrual home from the product shell.
2. The menstrual home supports a stable, end-to-end status-first record loop in live mode:
   - status summary
   - 3-week calendar
   - month browse mode
   - single-day period/detail/note recording
   - batch period marking
   - refresh consistency after writes
3. The same module instance can move between private and shared access without duplicating data.
4. Module settings that affect the menstrual loop are visible and editable from the product flow.
5. The mainline runtime has a repeatable verification baseline:
   - contract-level confidence
   - page-level live regression
   - explicit release checklist

If any one of these is still missing, the repo is not yet at "first MVP complete".

## Current Baseline

### What is already materially complete

- The backend command/query surface for the menstrual module is largely present:
  - `recordPeriodDay`
  - `clearPeriodDay`
  - `recordPeriodRange`
  - `clearPeriodRange`
  - `recordDayDetails`
  - `recordDayNote`
  - `updateDefaultPeriodDuration`
  - `shareModuleInstance`
  - `revokeModuleAccess`
  - `getModuleHomeView`
  - `getDayRecordDetail`
  - `getCalendarWindow`
  - `getPredictionSummary`
  - `getModuleAccessState`
  - `getModuleSettings`
- The formal menstrual home page exists and is already the active mainline work surface.
- The live read/write loop for single-day period/detail/note and batch period marking is now working on the formal home page.
- The batch selection model has already moved beyond static demo state and has page-level live regression coverage.
- The home page now defaults to live-first loading instead of silently falling back to seeded data.

### What is only partially complete

- The menstrual home interaction model is close to complete, but still in interaction-hardening mode rather than release-ready stability.
- The module-space shell exists, but is still a static shell instead of a real module-management flow.
- Sharing and settings exist at the backend contract/runtime layer, but are not yet closed through the real frontend flow.
- Page-level live regression now exists, but coverage is still focused on the menstrual home rather than the full MVP path.

## Gap List

## 1. Home Mainline

### Done

- Status-first hero card
- 3-week editing surface
- month browse mode
- single-day inline editing
- period toggle
- detail recording
- note recording
- batch selection with jump-row save/cancel
- live-only loading and explicit refresh errors
- initial page-level live regression for key batch interactions

### Still missing before MVP-complete

- Finish the remaining batch corner cases:
  - cross-week drag continuity
  - future-boundary interaction
  - cancel recovery and panel restoration
  - repeated path toggling under fast pointer motion
- Freeze the last ambiguous product semantics that still affect acceptance wording.
- Expand the live-only acceptance list into a stable regression suite rather than a small set of targeted checks.
- Confirm WeChat Mini Program behavior for the same interaction model, especially long-press and drag semantics.

### Assessment

This area is in the final hardening phase, not in the feature-discovery phase.

## 2. Module Shell And Entry Flow

### Current state

- The shell page exists at `frontend/pages/index/index.vue`.
- It is still explicitly a static shell:
  - static private/shared zone copy
  - static module info panel
  - direct showcase-style navigation into menstrual home

### MVP gap

The MVP is not complete until the module shell supports a real closed entry loop:

- real module instance presence
- real entry affordance
- real shared/private presentation
- no placeholder-only information panel

### Required completion bar

- The user can understand where the menstrual module lives.
- The user can enter the module through the intended product path, not only through a showcase shortcut.
- The shell does not present placeholder interaction as if it were product-complete.

## 3. Sharing

### Current state

- Backend sharing commands and access-state queries exist.
- Product direction is already explicit: private/shared must point to the same module instance.
- The current frontend shell still does not provide a real share/revoke flow.

### MVP gap

The MVP is not complete until the owner can:

- share the existing module instance
- see shared state reflected in the shell
- revoke partner access
- verify that data continuity is preserved

### Required completion bar

- One real owner-to-partner share path
- One real revoke path
- One verified same-instance read/write result after sharing

## 4. Settings

### Current state

- Backend support for `updateDefaultPeriodDuration` and `getModuleSettings` exists.
- The formal menstrual home does not yet expose a user-facing settings flow for this module-level behavior.

### MVP gap

The MVP is not complete until the default period duration is accessible and understandable through the actual frontend flow.

### Required completion bar

- A user-facing settings entry exists.
- The current default period duration is visible.
- The user can update it.
- The next first-day period record reflects the changed setting.

## 5. Regression And Acceptance

### Current state

- Contract-level and service-level backend tests exist.
- Frontend unit tests exist around home services and batch interaction logic.
- A root-level Playwright entry now exists for menstrual-home live regression.

### MVP gap

The MVP is not complete until the regression baseline covers the actual release path, not only the current hotspot.

### Required completion bar

- Stable page-level live regression for:
  - single-day write loop
  - batch loop
  - refresh consistency
  - at least one shell-to-home entry path
- Explicit manual checklist for remaining platform-specific checks
- A small release gate that can be rerun before accepting a new mainline milestone

## 6. Release-Blocking Must-Haves

These are the must-pass items before the first MVP can be called complete:

- The formal menstrual home loop is stable in live mode.
- The module shell is no longer only a static placeholder.
- Sharing is closed through at least one real frontend flow.
- Settings for default period duration are closed through the frontend.
- Page-level live regression can be executed locally from the repo.
- The release checklist is explicit and repeatable.

## Non-Blocking For First MVP

These should not block calling the first MVP complete unless product scope changes:

- multi-module expansion beyond the menstrual module
- advanced analytics or charts
- real-time shared editing
- production-grade auth hardening
- AI or interpretation layers
- highly polished dashboard-style module management beyond the minimum usable shell

## Suggested Completion Order

1. Finish menstrual home interaction hardening and acceptance.
2. Replace the static module-space shell with a real entry flow.
3. Close one real sharing path end-to-end.
4. Close one real settings path end-to-end.
5. Expand the regression and release gate from "home only" to "MVP path".

## Decision Summary

If we use this document as the bar, the repo is not waiting on broad new feature discovery.
It is waiting on:

- home hardening
- shell closure
- share/settings closure
- release-grade verification

That is the remaining surface between "strong menstrual-home prototype" and "first MVP complete".

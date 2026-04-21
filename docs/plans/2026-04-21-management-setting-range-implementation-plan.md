# Management Setting Range Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** expand the management-page setting ranges so duration supports `1..20` days and prediction supports `15..50` days without changing quick-window behavior.

**Architecture:** keep the existing management quick-chip and custom-picker interaction model intact. Only widen the numeric option source in the module-shell page model and adjust tests so the current selection still drives the three-chip window.

**Tech Stack:** uni-app Vue 3, JavaScript page/component modules, Node built-in `node:test`

---

### Scope Lock

- Modify only the numeric ranges that feed management setting controls.
- Do not change quick-window generation logic.
- Do not change optimistic update behavior.
- Do not change report-page alignment logic.

### Acceptance Criteria

- Duration custom picker supports `1..20`.
- Prediction custom picker supports `15..50`.
- Existing quick-chip behavior remains unchanged except that it now reflects the wider ranges.
- Existing management regression tests pass after updating range expectations.

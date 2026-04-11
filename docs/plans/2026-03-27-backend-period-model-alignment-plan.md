# Backend Period Model Alignment Plan

> **Status:** COMPLETED

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Keep the backend documentation surface aligned to the new period model and remove legacy menstrual terminology from active docs.

**Architecture:** Treat `docs/contracts/` as the long-lived source of truth, use `docs/plans/` only for current implementation or alignment notes, and keep the root context docs synchronized with the same period-model vocabulary.

**Tech Stack:** Markdown, repository docs, repo-wide search

---

## Scope

- Update active contract docs to describe `isPeriod`, `source`, anchored period segments, `ModuleSettings`, and `isDetailRecorded`.
- Update root docs so the repo context and doc index point at the backend repo and the current contract surface.
- Keep frontend/UI documentation unchanged in this pass.
- Do not touch backend runtime code in this pass.

## Files To Keep Aligned

- `docs/contracts/domain-models/menstrual-domain-model.md`
- `docs/contracts/application-contracts/menstrual-application-contract.md`
- `docs/contracts/use-cases/menstrual-core-use-cases.md`
- `docs/contracts/README.md`
- `project-context.md`
- `docs/README.md`
- `docs/plans/2026-03-27-backend-implementation-plan.md`

## Verification

- Search those docs for legacy command and state names before and after edits.
- Confirm the active docs only use the new period vocabulary.
- Confirm links resolve to `lovey-record-backend`, not the older repo path.

## Notes

- This plan is intentionally doc-only.
- Historical migration notes should not be preserved in active docs.
- If additional backend runtime work is needed later, create a separate plan after the documentation surface is clean.

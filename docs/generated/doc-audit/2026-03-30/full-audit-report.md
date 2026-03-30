# Document Defect Report
**Date:** 2026-03-30
**Commit:** 9928df0

---

## Summary
| Layer | Category | Count |
|-------|----------|-------|
| Structure | orphan | 41 |
| Structure | misplaced | 0 |
| Structure | stale-link | 1 |
| Content | doc-vs-code | 2 |
| Content | doc-vs-ui | 0 |
| Content | doc-vs-design | 0 |
| Content | plan-status | 0 |
| **Total** | | **44** |

---

## Layer 1 — Structure Defects

> Documents that cannot be reached through progressive disclosure from entrypoints,
> or are in the wrong location.

### Orphan Documents

- `docs/checklists/day-state-rules.md`
- `docs/checklists/module-home-manual-qa.md`
- `docs/checklists/module-space-sharing-manual-qa.md`
- `docs/checklists/mvp-acceptance.md`
- `docs/contracts/application-contracts/2026-03-23-menstrual-application-contract-draft.md`
- `docs/contracts/domain-models/2026-03-23-menstrual-domain-model.md`
- `docs/contracts/use-cases/2026-03-23-menstrual-core-use-cases.md`
- `docs/design/management/Design-Overview.md`
- `docs/design/management/function-module-management-page.md`
- `docs/design/management/function-sharing-expression.md`
- `docs/design/menstrual/date-state-spec.md`
- `docs/design/menstrual/Design-Overview.md`
- `docs/design/menstrual/function-calendar.md`
- `docs/design/menstrual/function-day-recording.md`
- `docs/design/menstrual/function-home.md`
- `docs/design/menstrual/function-recording-model.md`
- `docs/design/menstrual/token-component-mapping.md`
- `docs/design/navigation/Design-Overview.md`
- `docs/design/navigation/function-dashboard-home.md`
- `docs/design/navigation/function-tab-structure.md`
- `docs/design/pencil/Pencil-Board-Conventions.md`
- `docs/design/pencil/Pencil-Pitfalls-And-Recovery.md`
- `docs/design/pencil/Pencil-Workflow.md`
- `docs/generated/doc-audit/2026-03-30/full-audit-report.md`
- `docs/generated/doc-audit/2026-03-30/latest-report.md`
- `docs/pencil-miniprogram-design-reference.md`
- `docs/period_model.md`
- `docs/plans/2026-03-27-backend-implementation-plan.md`
- `docs/plans/2026-03-27-backend-period-model-alignment-plan.md`
- `docs/plans/2026-03-27-pencil-ui-source-restructure-plan.md`
- `docs/plans/2026-03-28-calendar-grid-legend-next-plan.md`
- `docs/plans/2026-03-28-pencil-to-uniapp-implementation-plan.md`
- `docs/plans/2026-03-28-three-week-home-demo-implementation-plan.md`
- `docs/plans/2026-03-28-token-component-alignment-plan.md`
- `docs/plans/2026-03-29-document-audit-ci-design.md`
- `docs/plans/2026-03-29-document-audit-ci-implementation-plan.md`
- `docs/plans/2026-03-29-mvp-definition-and-gap-list.md`
- `docs/plans/2026-03-29-selected-date-panel-pencil-update-plan.md`
- `docs/plans/2026-03-30-batch-interaction-hardening-status.md`
- `docs/references/tech-stack-investigate.md`
- `docs/terminology.md`

### Misplaced Documents

- None

### Stale References

- `docs/governance/release-gate.md` - release-gate unit test command failed; the audit output shows the frontend menstrual unit test run exited with `# fail 5` and `# pass 0`.

---

## Layer 2 — Content Defects

> Reachable documents whose content no longer matches current reality.
>
> **Note:** Claims that cannot be verified with available tools are noted with `[unverifiable]` and deprioritized.

### [C1] Home view response shape still uses the old cycle wording
- **Document:** `docs/contracts/application-contracts/2026-03-23-menstrual-application-contract-draft.md` line 573
- **Claim:** `"currentStatusSummary": { ... "currentSegment": { ... } }` and `"visibleWindow": { "kind": "segment_window", ... }`
- **Verified via:** code
- **Reality:** `backend/src/services/query.service.ts` still returns `currentStatusSummary.currentCycle` and `visibleWindow.kind = 'cycle_window'` at lines 157-200.
- **Defect:** The draft contract describes the newer segment-oriented shape, but the live backend query still exposes the older cycle-oriented field names and window kind.
- **Suggestion:** Update the draft to reflect the runtime shape, or explicitly mark the segment wording as the intended next contract revision if the backend is expected to change.
- **Decision:** Should the contract be aligned to the current runtime shape, or should this document become the change request that intentionally freezes the new segment wording?

### [C2] Home view anchor date is documented as a segment anchor, but runtime uses today
- **Document:** `docs/contracts/application-contracts/2026-03-23-menstrual-application-contract-draft.md` line 573
- **Claim:** `"currentStatusSummary": { "anchorDate": "2026-03-23", ... }`
- **Verified via:** code
- **Reality:** `backend/src/services/query.service.ts` sets `anchorDate: todayStr` at line 161, not the cycle anchor/start date. The current runtime response therefore reports today as `anchorDate`.
- **Defect:** The contract example implies `anchorDate` tracks the period segment anchor, but the implementation currently uses the current date instead.
- **Suggestion:** Either rename the field semantics in the contract to match the runtime meaning, or change the backend to return the actual segment anchor if that is the intended product meaning.
- **Decision:** Is `anchorDate` supposed to mean the current day snapshot or the first day of the active period segment?

---

## Improvement Suggestions (Priority Order)
| # | Action | Category | Effort | File |
|---|--------|----------|--------|------|
| 1 | Align the home-view contract examples with the runtime `currentCycle` / `cycle_window` shape or update the backend to the new segment wording | content | medium | `docs/contracts/application-contracts/2026-03-23-menstrual-application-contract-draft.md` |
| 2 | Resolve the `anchorDate` semantic mismatch in the home-view contract and backend response | content | medium | `docs/contracts/application-contracts/2026-03-23-menstrual-application-contract-draft.md` |
| 3 | Fix the failing frontend menstrual unit-test command or update the release gate command set | structure | low | `docs/governance/release-gate.md` |

---

## Notes
- Layer 1 data source: `docs/generated/doc-audit/2026-03-30/latest-report.md`
- Content findings are capped at 10 per run; prioritized by impact and verifiability
- Claims marked `[unverifiable]` are included with lower priority for human context

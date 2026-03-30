# Documentation Index

## Purpose

This `docs/` directory holds the design, planning, checklist, and copied reference material that supports the active uni-app mainline in this repository.

Current mainline repo:

`D:\CodeSpace\hbuilder-projects\lovey-record-backend`

Legacy reference repo (only reference when it comes to frontend code, not for UI design):

`D:\CodeSpace\love-recorder`

## Read First

1. [../project-context.md](D:/CodeSpace/hbuilder-projects/lovey-record-backend/project-context.md) - repo purpose, scope, current milestone, and hard boundaries.
2. [../tech-stack-investigate.md](D:/CodeSpace/hbuilder-projects/lovey-record-backend/tech-stack-investigate.md) - only when you need stack, runtime, or styling assumptions that are not already in the active contracts.
3. [contracts/README.md](D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/contracts/README.md) - read when a task affects product rules, domain meaning, or frontend-backend alignment.
4. [design/README.md](D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/design/README.md) - read when a task affects visual language, module design, or design-asset structure.
5. [design/pencil/README.md](D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/design/pencil/README.md) - read when editing `.pen` files or working on Pencil workflow and recovery.
6. [plans/](D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/plans) - open only the latest relevant plan when sequencing or migration detail is actually needed.

## Useful Reference

- `docs/design/` - open the relevant module or cross-module design doc only when the design contract itself matters.
- `docs/design-drafts/` - open when you need to inspect current Pencil drafts or exported design artifacts.
- `docs/plans/` - use for active sequencing, migration, or handoff context; do not scan it exhaustively.

## Automated Audits

Two automated systems help keep documentation correct:

1. **Document Audit** — Structural health (orphaned docs, missing files, stale commands)
   - Report: `generated/doc-audit/latest-report.md`
   - Run locally: `python scripts/run_doc_audit.py --mode daily`

2. **Content Correctness Audit** — Semantic health (plan status, rule completeness, terminology consistency)
   - Report: `generated/content-audit/latest-recommendations.md`
   - Runs daily at 09:15 AM via Codex agent (Windows Task Scheduler)
   - Policy: `governance/content-audit-policy.md`
   - Data collection: `python scripts/content_audit/data_collector.py --repo-root .`

## What Is Here

- `checklists/`: rule and QA references for current MVP work
- `design/`: active design contracts, cross-module rules, and module-level design docs
- `design/pencil/`: long-lived Pencil collaboration rules, SOPs, and recovery references
- `contracts/`: long-lived product and engineering contracts such as use cases, domain models, and application contracts
- `plans/`: approved design and implementation docs, handoff notes, and migration inventories
- `design-drafts/`: preserved visual draft artifacts that still inform the current mainline
- `governance/`: durable rules for documentation health and release readiness — see [`governance/doc-audit-policy.md`](D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/governance/doc-audit-policy.md), [`governance/release-gate.md`](D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/governance/release-gate.md), and [`governance/content-audit-policy.md`](D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/governance/content-audit-policy.md)
- `generated/doc-audit/`: machine-generated structural audit reports and suggested patches; do not edit by hand
- `generated/content-audit/`: machine-generated content correctness recommendations (plan status, rule completeness, terminology consistency); do not edit by hand
- top-level markdown files: product, design, and model notes that continue to shape implementation decisions

## Important Rule

These docs may point back to specific files in `D:\CodeSpace\love-recorder` for business-rule or interaction reference. Use those paths to understand behavior and state coverage, but do not copy legacy page code into the uni-app implementation blindly.

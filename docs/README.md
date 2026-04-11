# Documentation Index

## Purpose

This `docs/` directory holds the design, planning, checklist, and copied reference material that supports the active uni-app mainline in this repository.

Directory rule:

- `docs/contracts/` and `docs/design/` hold durable, maintained single sources of truth
- `docs/checklists/` holds durable verification procedures and release-support checklists
- `docs/plans/` holds temporary execution plans, rollout notes, and implementation sequencing only

If a document is not meant to remain maintained as a durable reference, it should not live under `design/`, `contracts/`, or `checklists/`.

Current mainline repo:

`D:\CodeSpace\hbuilder-projects\lovey-record`

Legacy reference repo (only reference when it comes to frontend code, not for UI design):

`D:\CodeSpace\love-recorder`

## Read First

1. [../project-context.md](D:/CodeSpace/hbuilder-projects/lovey-record/project-context.md) - repo purpose, scope, current milestone, and hard boundaries.
2. [references/tech-stack-investigate.md](D:/CodeSpace/hbuilder-projects/lovey-record/docs/references/tech-stack-investigate.md) - only when you need stack, runtime, or styling assumptions that are not already in the active contracts.
3. [contracts/README.md](D:/CodeSpace/hbuilder-projects/lovey-record/docs/contracts/README.md) - read when a task affects product rules, domain meaning, or frontend-backend alignment.
4. [design/README.md](D:/CodeSpace/hbuilder-projects/lovey-record/docs/design/README.md) - read when a task affects visual language, module design, or design-asset structure.
5. [design/pencil/README.md](D:/CodeSpace/hbuilder-projects/lovey-record/docs/design/pencil/README.md) - read when editing `.pen` files or working on Pencil workflow and recovery.
6. [plans/](D:/CodeSpace/hbuilder-projects/lovey-record/docs/plans) - open only the latest relevant plan when sequencing or migration detail is actually needed.

## Useful Reference

- `docs/design/` - open the relevant module or cross-module design doc only when the design contract itself matters.
- `docs/design/frontend-design-spec.md` - open when you need a short, maintained entry point for the repo's current frontend design baseline.
- `docs/design/frontend-prototype-harness.md` - open when the team has already chosen direct structure-sketch-to-prototype work and the agent needs a stable way to reuse existing design resources.
- `docs/checklists/` - open when you need maintained QA or release-verification procedures, not product semantics.
- `docs/design-drafts/` - open when you need to inspect current Pencil drafts or exported design artifacts.
- `docs/plans/` - use for active sequencing, migration, or handoff context; do not scan it exhaustively.
- `docs/governance/test-strategy-matrix.md` - use when you need the current test classification and trigger policy.
- `docs/checklists/frontend-h5-live-regression.md` - use when you need the fixed H5 Playwright regression entry, local ports, or one-click startup flow.
- `docs/checklists/playwright-mcp-browser-scenarios.md` - use when you need the AI-run browser scenario supplement for local H5 checks.

## Document Health

Check for orphaned or missing documents by running:

```bash
bash docs/scripts/scan-orphans.sh
```

This scans the docs/ directory for files not reachable from any entrypoint (AGENTS.md, README.md, docs/README.md, etc).

## What Is Here

- `checklists/`: durable QA and release-verification procedures
- `design/`: active design contracts, cross-module rules, and module-level design docs
- `design/pencil/`: long-lived Pencil collaboration rules, SOPs, and recovery references
- `contracts/`: long-lived product and engineering contracts such as use cases, domain models, and application contracts
- `plans/`: temporary execution plans, implementation sequencing, and handoff notes
- `design-drafts/`: preserved visual draft artifacts that still inform the current mainline
- `governance/`: durable rules for documentation health and release readiness — see [`governance/release-gate.md`](D:/CodeSpace/hbuilder-projects/lovey-record/docs/governance/release-gate.md)
- top-level markdown files: product, design, and model notes that continue to shape implementation decisions

## Important Rule

These docs may point back to specific files in `D:\CodeSpace\love-recorder` for business-rule or interaction reference. Use those paths to understand behavior and state coverage, but do not copy legacy page code into the uni-app implementation blindly.

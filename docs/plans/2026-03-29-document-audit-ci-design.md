# 2026-03-29 Document Audit CI Design

## Summary

This design defines a documentation-audit CI system for the active mainline repository.

Target outcome:

- AI agents use repo documentation through a clearer routing structure instead of scanning markdown blindly
- the repository gets an initial documentation inventory pass to expose stale, orphaned, misplaced, and debt-bearing documents
- a scheduled CI job runs once per day and produces a single audit report plus a single suggested patch
- the system prefers higher-authority facts and can proactively verify uncertain claims with lightweight tools before classifying issues
- the first phase remains human-reviewed and does not auto-merge, auto-delete, or auto-archive files

This design does not include automatic document restructuring, automatic file deletion, or automatic patch application.

## Problem Statement

The repository already has useful documentation layers, but the system is still fragile for AI-assisted development:

- high-level markdown files route into lower-level documents through progressive disclosure, but that routing is not yet formalized as a scan boundary
- plans, contracts, design docs, AGENTS guidance, and root-level markdown files do not yet participate in one explicit documentation-governance loop
- some repository facts can drift faster than the documentation that describes them
- some problems are real but should not be rewritten as "current truth" yet because the repo is still in prototype stage or the next decision is still pending

The CI system must therefore do more than lint files. It must behave as a documentation-audit agent that can inspect the current repository state, compare it to the routed documentation graph, and emit actionable, reviewable output.

## Design Direction

Adopt a conservative documentation-governance model:

- keep the current semantic cores:
  - `docs/contracts/`
  - `docs/design/`
  - `docs/plans/`
- add stronger entrypoint, lifecycle, and governance layers around those cores
- treat documentation scanning as entrypoint-driven reachable-graph analysis rather than full-repo markdown scraping
- treat lightweight verification results as higher-authority facts than unverified inference
- keep the first phase review-first:
  - one report
  - one patch
  - human decides what to merge

## Proposed Documentation Structure

The design does not require an immediate large rename, but it does define the target structure that the initial audit should recommend toward.

Repository root remains:

- `AGENTS.md`
- `README.md`
- `project-context.md`

`docs/` evolves toward:

- `docs/README.md`
- `docs/indexes/`
- `docs/contracts/`
- `docs/design/`
- `docs/plans/active/`
- `docs/plans/completed/`
- `docs/references/`
- `docs/generated/`
- `docs/archive/`
- `docs/governance/`

Intent by directory:

- `docs/indexes/`
  - high-level routing documents for people and agents
  - stable doc-map entrypoints
- `docs/contracts/`
  - durable product, domain, and frontend-backend alignment
- `docs/design/`
  - UX, interaction, visual, and Pencil workflow contracts
- `docs/plans/active/`
  - current execution plans and active rollout documents
- `docs/plans/completed/`
  - historical plans that remain useful as records but are no longer current routing targets
- `docs/references/`
  - low-authority references, copied notes, historical references, and supporting material
- `docs/generated/`
  - generated reports, suggested patches, inventories, and machine-produced doc outputs
- `docs/archive/`
  - documents intentionally removed from the active routing graph
- `docs/governance/`
  - classification rules, scan scope rules, lifecycle rules, and reporting conventions

## Classification Model

The audit system uses only four public classification types.

### `stale`

A document statement is `stale` when:

- it conflicts with a higher-authority fact source
- the conflict is already confirmed
- a unique corrected replacement can be written now

Interpretation:

- this is not just suspicious
- this is wrong enough to patch safely

### `orphan`

A document is `orphan` when:

- it is inside the scan scope
- it is not reachable from the defined entrypoint set

Interpretation:

- the document may still contain useful content
- but it is not part of the current routed documentation system

### `misplaced`

A document is `misplaced` when:

- its content is still broadly valid
- but its location or lifecycle tier is no longer appropriate

Interpretation:

- content does not necessarily need rewriting
- the document likely needs relocation, downgrading to reference material, or archiving

### `debt`

A finding is `debt` when a real issue exists, but it should not be rewritten as settled current truth yet.

`debt` includes two explicit sub-kinds:

- `future-risk`
  - acceptable in the current prototype stage
  - likely to become a problem in production or at larger scale
- `non-blocking`
  - imperfect or incomplete now
  - but not blocking current mainline implementation

Additional `debt` triggers:

- a problem is visible, but there is no unique safe correction yet
- the correction depends on a pending design or product decision
- rewriting the document now would create false certainty

## Classification Decision Rules

The audit agent should use the following decision order:

1. Determine whether a higher-authority fact source exists.
2. Determine whether the document actually conflicts with that source.
3. If the conflict is unclear, attempt lightweight verification if it can materially improve certainty.
4. If the conflict is confirmed and a unique replacement is available, classify as `stale`.
5. If the problem is real but the replacement is still not responsibly decidable, classify as `debt`.
6. If the content is mostly valid but the file belongs in another lifecycle or routing tier, classify as `misplaced`.
7. If the file is outside the reachable graph but still inside the scan scope, classify as `orphan`.

Short version:

- confirmed wrong and safely fixable -> `stale`
- confirmed problematic but not responsibly fixable yet -> `debt`
- mostly correct but in the wrong place -> `misplaced`
- not routed -> `orphan`

## Authority And Evidence Model

The audit system must not treat all evidence equally.

### Fact sources

The agent uses two major fact classes:

- `observed`
  - static repository facts
  - code, paths, directory layout, config, markdown links, checked-in plans, checked-in contracts
- `verified`
  - facts established by lightweight tool-based validation
  - command output, successful build/test/check execution, confirmed route existence, confirmed file/path/link validity

`verified` facts outrank unverified inference because they reduce ambiguity.

### Authority priority

When multiple sources disagree, use this priority order:

1. verified current runtime facts
2. observed current repository facts
3. active `AGENTS.md` constraints
4. durable contracts under `docs/contracts/`
5. current effective plans under `docs/plans/`
6. design and collaboration rules under `docs/design/`
7. reference and legacy markdown material

Low-authority docs must not override high-authority evidence.

## Verification Escalation Rule

The audit agent is allowed and expected to validate uncertain findings before classifying them.

Verification should be attempted when:

- the claim is important enough to affect routing or patch generation
- one lightweight check can materially improve certainty
- the check is reproducible and low-cost

Typical allowed validation actions:

- verify whether linked paths or files actually exist
- verify whether documented commands still run
- verify whether a documented build or test command passes
- verify whether a documented route, script, or config path is still valid
- verify whether an AGENTS or plan reference resolves correctly

Verification should be skipped when:

- the cost is too high for daily CI
- the result would still not decide the wording uniquely
- the question is fundamentally a product or design decision
- the check depends on unstable external systems or heavy end-to-end setup

Verification outcome rules:

- if verification resolves uncertainty and yields one safe correction, classify as `stale`
- if verification still leaves decision ambiguity, classify as `debt`
- every finding must record whether its evidence is `observed` or `verified`

## Scan Scope

The initial scan and the daily scan both work inside the same scope model.

Phase-one scan scope:

- root-level key markdown files
- all markdown files under `docs/`
- scoped AGENTS files under `backend/` and `frontend/`

The phase-one system does not scan:

- images
- binary design files
- generated output outside the declared report directory
- external URLs as authoritative content

## Entrypoint Definition

Phase-one entrypoints are fixed and explicit:

- `AGENTS.md`
- `README.md`
- `project-context.md`
- `docs/README.md`
- `docs/contracts/README.md`
- `backend/AGENTS.md`
- `frontend/AGENTS.md`

This keeps the first rollout deterministic.

Future refinement may move entrypoint management into a dedicated governance document such as:

- `docs/governance/scan-entrypoints.md`

but that is not required for the first phase.

## Reachability Rules

Reachability is computed from the entrypoint set.

The scanner should:

- parse markdown links in each reachable markdown file
- follow repository-local links to markdown documents
- continue recursively until no new markdown files are discovered

The scanner should follow:

- relative markdown links
- repository-local absolute path links
- explicit links that resolve to `.md` files

The scanner should ignore:

- external URLs
- image links
- binary assets
- non-markdown files unless a later implementation explicitly decides to model them as evidence targets

Resulting sets:

- `reachable`
  - documents reachable from the entrypoint graph
- `in-scope but unreachable`
  - markdown files in scan scope but outside the reachable graph
  - these are `orphan` candidates

## Initial Inventory Pass

Before the daily audit becomes routine, the system must run an initialization pass.

The initialization pass exists to create the documentation baseline, not to restructure the repository automatically.

Initialization objectives:

- map the current reachable documentation graph
- identify the first batch of `orphan` files
- identify the first batch of `misplaced` files
- identify the first batch of `stale` claims
- identify the first batch of `debt` items
- recommend the target migration direction toward the proposed documentation structure

The initialization pass still produces the same two outputs as daily CI:

- one report
- one suggested patch

The difference is emphasis:

- the first pass includes broader structure observations and migration recommendations
- daily passes focus on drift detection and small safe corrections

## Daily Audit Workflow

The daily CI job should run once per day and perform the following sequence:

1. collect entrypoint files
2. resolve the reachable markdown graph
3. enumerate in-scope markdown files
4. classify unreachable files as `orphan` candidates
5. compare routed documents against higher-authority fact sources
6. run lightweight verification for uncertain but high-value findings
7. classify findings into `stale`, `misplaced`, `orphan`, or `debt`
8. generate one report markdown file
9. generate one suggested patch file containing only safe stale fixes
10. publish artifacts for human review

The daily job does not:

- auto-apply patches
- auto-archive files
- auto-delete files
- auto-move files
- auto-merge pull requests

## Output Contract

Phase one produces exactly two user-facing outputs:

- `docs/generated/doc-audit/latest-report.md`
- `docs/generated/doc-audit/latest.patch`

The report is the durable review artifact.

The patch is the safe-edit suggestion artifact.

### Report structure

`latest-report.md` should use a stable structure such as:

```md
# Document Audit Report
- Date:
- Commit:
- Scan Scope:
- Entry Points:

## Summary
- reachable docs:
- orphan findings:
- stale findings:
- misplaced findings:
- debt findings:

## Findings
### Stale
- id:
- file:
- evidence_kind:
- evidence:
- proposed update:

### Orphan
- id:
- file:
- rationale:

### Misplaced
- id:
- file:
- recommended target:
- rationale:

### Debt
- id:
- file:
- debt_kind:
- evidence_kind:
- rationale:
- suggested follow-up:
```

### Patch scope

`latest.patch` should include only `stale` fixes that are safe to express as direct textual updates.

The patch should not include:

- file deletions
- file moves
- archive operations
- debt-only observations

## Reporting Semantics

The report is intentionally single-file and disposable on a daily basis.

Design rules:

- do not split daily output into multiple markdown inventories
- keep the report readable by both humans and future audit agents
- prefer stable section names so the report itself can be inspected by later automation
- keep the patch separate so human reviewers can reason about scope quickly

## Lifecycle Recommendations

The design recommends, but does not require in phase one:

- splitting `docs/plans/` into `active/` and `completed/`
- introducing `docs/governance/`
- introducing `docs/generated/`
- introducing `docs/indexes/`
- gradually relocating low-authority top-level markdown into `docs/references/` or `docs/archive/`

The initialization audit should explicitly call out candidate files for these moves.

## Non-Goals

This phase does not attempt to:

- fully rewrite the repository documentation structure in one pass
- replace product or architecture decisions with CI heuristics
- promote every known issue into an immediate doc patch
- infer high-confidence truth from low-confidence signals
- solve all prototype-to-production gaps immediately

## Open Implementation Questions

- whether the daily report should be committed on a branch, published as a workflow artifact, or both
- which lightweight verification commands are acceptable in CI for this repository's runtime cost budget
- whether entrypoints should remain hard-coded in phase one or move quickly into a governance document
- how aggressively the initialization pass should recommend moves for root-level markdown files

## Acceptance Criteria

This design is considered satisfied when:

- the repository has a documented, entrypoint-driven documentation audit model
- the classification model is explicit and stable enough for CI implementation
- the authority model and verification escalation rule are defined
- the initialization scan and daily scan share one output contract
- the first phase remains review-first and non-destructive

## Recommended Next Step

Write an implementation plan that turns this design into:

- a scan script or audit command
- a governance baseline under `docs/governance/`
- a generated-output directory under `docs/generated/`
- a first initialization pass against the current repository

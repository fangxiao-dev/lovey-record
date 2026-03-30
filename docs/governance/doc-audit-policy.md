# Document Audit Policy

## Entrypoints

The scan graph is seeded from these files:

- `AGENTS.md`
- `README.md`
- `project-context.md`
- `docs/README.md`
- `docs/contracts/README.md`
- `backend/AGENTS.md`
- `frontend/AGENTS.md`

## Governance Documents

Documents in `docs/governance/` are durable rules and are part of the scan scope:

- `docs/governance/doc-audit-policy.md` — this file; defines audit rules
- `docs/governance/release-gate.md` — MVP release gate rules and test command inventory

## Public Finding Types

- `stale` — conflicts with a higher-authority fact; safe replacement is available
- `orphan` — inside scan scope but not reachable from any entrypoint
- `misplaced` — content valid but location or lifecycle tier is wrong
- `debt` — real problem but not safely fixable yet

## Debt Kinds

- `future-risk` — acceptable now; likely problem at production scale
- `non-blocking` — imperfect now; not blocking current mainline

## Evidence Kinds

- `observed` — static repo facts (paths, links, content)
- `verified` — confirmed by lightweight tool execution (path checks, command runs)

## Verification Scope

The following checks are approved for daily CI use (cheap, no external dependency):

- `verify_path_exists` — confirm that files referenced in governance or plan docs still exist
- `verify_command_runs` — run backend unit tests and frontend unit tests (no dev server required)

The following checks are explicitly out of scope for daily CI:

- live Playwright regression (requires dev server)
- WeChat Mini Program manual checks (M1–M9 in `release-gate.md`)

## Directory Content Rules

Each directory has an expected content type. A file is **misplaced by content** when its actual nature does not match the directory definition — even if its path is otherwise valid.

| Directory | Expected content type | NOT allowed here |
|---|---|---|
| `docs/plans/` | Execution plans — step-by-step tasks with explicit done criteria, written to be executed by an agent or human | Design specs, status snapshots, product definitions, reference material |
| `docs/design/` | Design specs — UX, interaction, visual contracts, architecture decisions | Execution plans, status reports |
| `docs/governance/` | Durable rules — policies, gates, product scope definitions, classification rules that remain valid across many sessions | Dated execution plans, status snapshots |
| `docs/contracts/` | Product/domain/API contracts — stable agreements between layers | Plans, design explorations |
| `docs/references/` | Low-authority reference material — status snapshots, historical records, investigation notes, implementation summaries | Durable rules, active contracts |
| `docs/generated/` | Machine-produced outputs only — audit reports, patches, metadata | Any human-authored document |

This rule is enforced by Layer 2 content audit (Codex agent), not by the Python structure scanner.

## Scan Scope

Phase-one scan scope:

- root-level key markdown files
- all markdown files under `docs/`
- scoped AGENTS files under `backend/` and `frontend/`

Not scanned in phase one: images, binary design files, `.pen` files, generated output outside `docs/generated/`.

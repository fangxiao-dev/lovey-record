# Harness Engineering Gap Analysis

**Date:** 2026-03-30
**Reference:** [Harness engineering: leveraging Codex in an agent-first world](https://openai.com/index/harness-engineering/)

---

## Core Model Comparison

**Harness Engineering model:**
```
Documentation → Mechanical enforcement (linter/CI) → Agent behavior
Documents are a constraint system, not a reference library
Violations are caught at the moment they occur
```

**Current model:**
```
Documentation → Periodic scan (audit) → Human decision → Fix
Documents are a knowledge base, audit is a quality check
Violations are discovered up to 24 hours after they occur
```

This is not a naming problem. The fundamental difference is **intervention timing**. Their constraints fire when a violation happens. Ours are discovered the next day.

---

## Gap Checklist

### G1 — No verification status field on documents

| Field | Value |
|-------|-------|
| **Gap** | Design and contract docs have no machine-readable freshness signal. An agent reading `docs/design/menstrual/function-home.md` cannot know whether that document is verified or potentially stale. |
| **Their approach** | Every `design-docs/` entry has an explicit `verification_status` field. Agents know at read time whether to trust a document. |
| **Functional impact** | Agent uses stale design docs to generate code → generates wrong code → audit finds the problem 24h later. The constraint system fails to prevent the error. |
| **Difficulty** | Low — add a YAML frontmatter block or a standard header field to each document |
| **Priority** | P1 |
| **Status** | ☐ Not started |

---

### G2 — Plans have no status dimension, only a date dimension

| Field | Value |
|-------|-------|
| **Gap** | All plans sit in one flat directory sorted by date. `2026-03-27-backend-implementation-plan.md` — is it complete? The agent must read the full content to know. Structure gives no signal. |
| **Their approach** | `exec-plans/` is split into `active/`, `completed/`, and `tech-debt/` subdirectories. Status is inferred from location. |
| **Functional impact** | Agent scans `docs/plans/` and may act on a completed plan because nothing in the structure indicates it is done. |
| **Difficulty** | Low — create `docs/plans/active/` and `docs/plans/completed/`, move files, update doc-audit-policy entrypoint rules |
| **Priority** | P1 |
| **Status** | ☐ Not started |

---

### G3 — No quality score document (QUALITY_SCORE.md)

| Field | Value |
|-------|-------|
| **Gap** | No persistent domain-level quality signal. Each audit run generates a report, but an agent starting a new session has no fast summary of "which areas are trustworthy right now." |
| **Their approach** | `QUALITY_SCORE.md` tracks quality grades by domain, auto-maintained by background agents. Agents read it at session start. |
| **Functional impact** | Agent treats all documentation areas as equally reliable. Cannot prioritize verification effort. Cannot flag "this domain has known staleness." |
| **Difficulty** | Medium — needs an auto-maintenance mechanism (Codex content audit updates it after each run) |
| **Priority** | P2 |
| **Status** | ☐ Not started |

---

### G4 — No top-level architecture navigation document

| Field | Value |
|-------|-------|
| **Gap** | Technical context is split across `backend/AGENTS.md` and `frontend/AGENTS.md` with no unified architecture map. Agent must read two files and synthesize the full system picture. |
| **Their approach** | `ARCHITECTURE.md` at repo root defines the full domain map and dependency layering (Types → Config → Repo → Service → Runtime → UI). It is the first thing agents read for code structure. |
| **Functional impact** | Agent may make cross-layer decisions (e.g., importing a service into a type module) without realizing the layering constraint. No single file enforces the architecture model. |
| **Difficulty** | Low — write once, maintained on architectural changes |
| **Priority** | P2 |
| **Status** | ☐ Not started |

---

### G5 — Enforcement is periodic, not event-driven

| Field | Value |
|-------|-------|
| **Gap** | `doc_audit` runs at 09:15 AM daily (Windows Task Scheduler). A misplaced file, a broken reference, or a wrong directory placement can survive 24 hours before detection. There are no pre-commit hooks for documentation rules. |
| **Their approach** | Custom linters fire at commit time. Error messages embed remediation instructions as agent context. Violation → immediate correction signal in the same session. |
| **Functional impact** | Documentation violations accumulate between audit runs. More importantly, agents in sessions between runs have no mechanism to know that a violation has occurred. |
| **Difficulty** | High — requires pre-commit hooks (e.g., husky or native git hooks) and lightweight Python checks that run on every commit |
| **Priority** | P3 — after P1/P2 gaps are addressed |
| **Status** | ☐ Not started |

---

### G6 — checklists/ directory is an orphan island

| Field | Value |
|-------|-------|
| **Gap** | `docs/checklists/` contains executable acceptance criteria and manual QA scripts. It is not reachable from any entrypoint — the doc-audit consistently flags all 4 files as orphans. These docs are effectively invisible to agents following progressive disclosure. |
| **Their approach** | Product specs and acceptance conditions are part of the routed documentation graph, linked from AGENTS.md or the main docs index. |
| **Functional impact** | Agent running an acceptance check cannot find `docs/checklists/mvp-acceptance.md` through the entrypoint graph. It either skips the check or does a broad search instead of following the defined route. |
| **Difficulty** | Low — either link from `docs/README.md` + `docs/governance/release-gate.md`, or merge into `docs/governance/` |
| **Priority** | P1 |
| **Status** | ☐ Not started |

---

### G7 — Documents are passive knowledge, not active constraints

| Field | Value |
|-------|-------|
| **Gap** | The deepest structural gap. Our documents record project knowledge. Their documents constrain agent behavior. The distinction: when an agent violates a rule in our system, nothing happens until the next audit. In their system, a linter fires immediately, and the error message is itself agent context that directs correction. |
| **Their approach** | "When an agent struggles, that is a diagnostic signal — identify what is missing (tools, guardrails, documentation) and feed it back into the repository. Agent failure = documentation gap, not model failure." |
| **Functional impact** | Our system is reactive. Errors occur, audits find them, humans decide. Their system is preventive. Rules are enforced the moment the agent acts. |
| **Difficulty** | High — full realization requires custom linters, pre-commit hooks, and wiring error messages as agent context. Partial improvement is possible by improving AGENTS.md routing to constraint docs. |
| **Priority** | P3 — foundational shift, addressed after structural gaps are closed |
| **Status** | ☐ Not started |

---

## Priority Summary

| # | Gap | Functional Impact | Difficulty | Priority | Status |
|---|-----|-------------------|------------|----------|--------|
| G1 | No verification status on docs | Agent trusts stale content | Low | **P1** | ☐ |
| G2 | Plans flat — no active/completed split | Agent acts on finished plans | Low | **P1** | ☐ |
| G6 | checklists/ is orphan island | Agent can't find acceptance criteria | Low | **P1** | ☐ |
| G3 | No QUALITY_SCORE.md | No domain-level trust signal at session start | Medium | **P2** | ☐ |
| G4 | No ARCHITECTURE.md | Agent must synthesize architecture from multiple files | Low | **P2** | ☐ |
| G5 | Enforcement is periodic not event-driven | Violations survive 24h | High | **P3** | ☐ |
| G7 | Docs are passive knowledge not active constraints | System is reactive not preventive | High | **P3** | ☐ |

---

## Execution Order

**Phase 1 — Low-effort, high-impact structural fixes (P1)**
1. G6: Link `docs/checklists/` into the entrypoint graph via `docs/README.md` and `release-gate.md`
2. G2: Create `docs/plans/active/` and `docs/plans/completed/`, migrate existing plans
3. G1: Add `verification_status` frontmatter to all design and contract docs

**Phase 2 — Navigation and trust signals (P2)**
4. G4: Write `ARCHITECTURE.md` at repo root
5. G3: Define `QUALITY_SCORE.md` format and wire Codex content audit to update it

**Phase 3 — Enforcement layer (P3)**
6. G5: Add pre-commit hooks for doc structure rules (misplaced files, broken entrypoint links)
7. G7: Identify top 3 high-value constraints, convert to linter rules with embedded remediation hints

---

## Notes

- This analysis was produced by comparing the OpenAI Harness Engineering article (2026) against this repository's actual docs/ structure
- The goal is not to replicate their stack — it is to close the functional gaps that affect agent reliability in this repo
- G5 and G7 require the most design work; they should not be attempted before G1/G2/G6 are stable
- Status column uses ☐ (not started) / ◐ (in progress) / ☑ (complete)

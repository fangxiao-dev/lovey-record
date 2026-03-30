# Content Correctness Audit Policy

**Date:** 2026-03-30
**Purpose:** Define the scope, rules, and execution model for the Content Correctness Audit system.

---

## Overview

The Content Correctness Audit is an AI-driven review system that analyzes repository documentation for:
1. **Rules & Design Class** — Are rules/policies/designs correct, complete, and consistent?
2. **Execution Status Class** — What is the actual completion status of long-term and short-term plans?

This is a **review-first system** that generates recommendations for human approval before any changes are made.

---

## Scope

### In Scope
- `docs/plans/` — All long-term and short-term planning documents
- `docs/governance/` — Durable rules, release gates, policies
- `docs/design/` — Design decisions, interaction patterns
- `docs/contracts/` — Domain and interface contracts

### Out of Scope (Phase 1)
- Source code content analysis (deferred to future phases)
- Automated documentation generation
- Live regression testing (Document Audit handles verification)
- Full natural language understanding of complex semantics

---

## Finding Types

### Rules & Design Class

**Incomplete Rule**
- A rule or policy references conditions but lacks corresponding actions
- A rule mentions a requirement without clear enforcement mechanism
- **Indicator:** "If [condition], then..." without "then" clause
- **Action:** Flag for clarification or expansion

**Inconsistent Terminology**
- Same concept referred to by different names across documents
- **Scope:** Within `docs/governance/`, `docs/contracts/`, `docs/design/`
- **Action:** Standardize on one term or create glossary entry

**Contradictory Rules**
- Rule A says "must do X", Rule B says "optional to do X" for the same thing
- **Action:** Urgent clarification needed (escalate)

**Missing Prerequisite Rule**
- A rule exists but its supporting rules don't (e.g., release gate but no error handling docs)
- **Action:** Recommend creating missing prerequisite documentation

**Outdated Design**
- Design doc references deprecated library, pattern, or approach
- **Indicator:** Referenced component no longer exists (via Document Audit)
- **Action:** Mark as stale (Document Audit may already flag this)

### Plan Status Class

**Complete**
- Plan document has checkmarks (✓) for all items
- Status date is recent AND no "Remaining" or "Gap" section exists
- **Action:** Archive to docs/plans/completed/

**In Progress**
- Plan has "Remaining items" section with items listed
- Gaps have been closed since last status update
- **Action:** Suggest refresh date (2 weeks out)

**Blocked**
- Document explicitly states "blocked waiting for X"
- Unstarted for >3 months without explanation
- **Action:** Escalate for decision

**Stale**
- Document date is >2 months old AND significant code changes since that date
- Status claims "complete" but code has changed since date
- **Action:** Flag for human review and refresh

---

## Classification Rules

### Rules & Design Findings

| Category | Confidence | Action Priority |
|----------|------------|-----------------|
| Incomplete Rule | High | MUST fix or document intentionally |
| Contradictory Rules | High | MUST clarify immediately |
| Inconsistent Terminology | Medium | SHOULD standardize |
| Missing Prerequisite | Medium | SHOULD add documentation |
| Outdated Design | High | MUST update or archive |

### Plan Status Findings

| Status | Confidence | Action Priority |
|--------|------------|-----------------|
| Complete | High | SHOULD archive |
| In Progress | High | SHOULD refresh on schedule |
| Blocked | Medium | MUST escalate |
| Stale | Medium | SHOULD refresh |

---

## Verification Strategy

The Content Audit relies on these data sources:

1. **Document Audit Report** (`docs/generated/doc-audit/latest-report.md`)
   - Which files are orphaned, misplaced, stale (with verified fixes)
   - Which commands/paths have been verified to exist

2. **Document Metadata**
   - Extracted by `scripts/content_audit/data_collector.py`
   - Status markers (✓, DONE, In Progress, etc.)
   - Section structure (has "Remaining", "Current state", etc.)
   - Referenced files and commands

3. **Git History**
   - Document modification dates vs. code changes
   - Detect staleness

4. **AI Analysis** (Codex Agent)
   - Semantic analysis of rule completeness
   - Consistency checking across documents
   - Plan status inference from document content

---

## Execution

### Scheduled Run
- **When:** Daily at 09:15 AM
- **Orchestrator:** Windows Task Scheduler
- **Entry Point:** `codex content-correctness-auditor` (Codex agent)
- **Notification:** Windows Toast `"Codex任务完成"`

### Internal Steps
1. Run Document Audit: `python scripts/run_doc_audit.py --mode daily`
2. Collect metadata: `python scripts/content_audit/data_collector.py`
3. Analyze with Codex agent (AI-driven)
4. Generate report: `docs/generated/content-audit/latest-recommendations.md`
5. Notify completion

### Output
**File:** `docs/generated/content-audit/latest-recommendations.md`

Contains:
- Summary of findings by class (Rules/Design, Plan Status)
- Detailed findings with evidence, impact, and recommended actions
- Prioritized action list for human review

---

## Human Review & Approval Flow

1. **Review:** Human opens the recommendations report
2. **Assess:** Evaluate each finding for accuracy and priority
3. **Approve:** Identify which recommendations to implement
4. **Execute:** Manual action (edit docs, update status, apply patches)
5. **Record:** (Optional) Track which recommendations were implemented vs. deferred

---

## Authority Hierarchy

When resolving conflicts, use this priority order:

1. Verified facts from Document Audit (highest)
2. Code structure and test results (verified)
3. Explicit governance rules (durable)
4. Active plans and contracts
5. Design decisions
6. Reference materials (lowest)

---

## Non-Goals (Phase 1)

This phase does NOT:
- Auto-apply recommendations without human review
- Rewrite document content automatically
- Delete, move, or archive files
- Execute code or run tests (Document Audit does this)
- Parse/understand design diagrams or visual content
- Validate against external APIs or systems

---

## Future Phases

**Phase 2 (Planned):**
- Extend content analysis to source code documentation
- Add LLM-based semantic validation
- Implement automated patch application for pre-approved finding types

**Phase 3 (Planned):**
- Integration with issue tracking for blocked plans
- Automatic escalation workflows
- Historical trend analysis (staleness over time)

---

## Feedback & Iteration

If the audit system generates:
- **Too many false positives:** Adjust heuristics in `data_collector.py` or agent instructions
- **Missed findings:** Add new detection patterns or expand agent scope
- **Unclear recommendations:** Refine the output report format

Document issues and refinements in `docs/governance/` for visibility.

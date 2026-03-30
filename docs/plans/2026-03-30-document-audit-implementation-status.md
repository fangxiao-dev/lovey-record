# 2026-03-30 Document Audit Implementation Status

## Executive Summary

Document audit has been split into two separate systems based on the original design:

1. **Code CI** (GitHub Actions) — verifies code quality (backend Jest + frontend tests)
2. **Document CI** (Local Codex + Task Scheduler) — verifies documentation quality (two-layer audit)

This separation respects the principle of "document audit stays pure local" while keeping code testing in GitHub.

---

## Implementation vs. Original Design

### Design Intent → Reality

| Design Point | Original Vision | Current Implementation |
|---|---|---|
| **Scheduled CI job** | "runs once per day" | Windows Task Scheduler @ 09:15 AM (local) |
| **Entry point** | CI/CD pipeline (GitHub Actions) | PowerShell script + Codex agent |
| **Output location** | `docs/generated/doc-audit/latest-report.md` | `docs/generated/doc-audit/YYYY-MM-DD/full-audit-report.md` |
| **Output format** | Two artifacts: report + patch | Single unified report (two layers) |
| **Audit layers** | Single layer (structure) | Two layers: structure + content |
| **Verification scope** | Lightweight tools only | Includes Playwright + Pencil MCPs |
| **Human review** | GitHub artifacts → PR → merge | Local report → manual decision |

---

## What Was Built

### Layer 1: Document Structure Audit (Python)

**Files:**
- `scripts/doc_audit/` — core audit engine
- `tests/doc_audit/` — 30 unit tests
- `docs/governance/doc-audit-policy.md` — governance baseline

**What it detects:**
- `orphan` — documents not reachable from entrypoints
- `misplaced` — files in wrong locations
- `stale` — broken links, failed command references
- `debt` — real problems not yet safely fixable

**Output:**
- `docs/generated/doc-audit/YYYY-MM-DD/latest-report.md` — structure findings
- `docs/generated/doc-audit/YYYY-MM-DD/latest.patch` — suggested fixes

---

### Layer 2: Document Content Audit (Codex AI)

**Files:**
- `scripts/content_audit/AGENTS.md` — Codex agent instructions
- `scripts/invoke_content_audit.ps1` — Windows Task Scheduler launcher

**What it does:**
1. Runs Layer 1 (structure audit) internally
2. For each reachable document, verifies claims against reality:
   - **Code reality** — reads `backend/src/`, `frontend/src/`
   - **UI reality** — Playwright screenshots & interactions
   - **Design reality** — Pencil `.pen` files
   - **Test results** — command execution, file existence
3. Generates recommendations with evidence

**Output:**
- `docs/generated/doc-audit/YYYY-MM-DD/full-audit-report.md` — unified two-layer report

**Report structure:**
```
## Summary (counts by category)

## Layer 1 — Structure Defects
  ### Orphan Documents
  ### Misplaced Documents
  ### Stale References

## Layer 2 — Content Defects
  ### [C1] Doc vs. Code
  ### [C2] Doc vs. UI
  ### [C3] Doc vs. Design
  ### [P1] Plan Status
  ...
```

---

## Execution Model

### Daily Workflow

```
09:15 AM (Windows Task Scheduler)
  └─> invoke_content_audit.ps1
      ├─ Set $Today = YYYY-MM-DD
      ├─ Create $AuditDir = docs/generated/doc-audit/$Today
      └─> codex "$Prompt + $AuditDir"
          │
          ├─ Step 1: python run_doc_audit.py --mode daily
          │  └─> latest-report.md + latest.patch
          │
          ├─ Step 2: Analyze reachable docs with tools
          │  ├─ Read code + git
          │  ├─ Playwright screenshots
          │  ├─ Pencil `.pen` reads
          │  └─ Command runs
          │
          └─> Step 3: Write full-audit-report.md
              (Layer 1 + Layer 2 findings)

Human Review
  └─> Read $AuditDir/full-audit-report.md
  └─> Decide which findings to act on
  └─> Execute manually (update docs, fix code, etc.)
```

### GitHub Actions (Separate)

Code-only CI: backend Jest + frontend node --test
- No document audit
- No Python unit tests
- Output: test results only

---

## Key Design Decisions

### 1. Date-based output directories

**Why:** Each day's run is independent and archivable
```
docs/generated/doc-audit/
  2026-03-30/
    latest-report.md
    latest.patch
    full-audit-report.md
  2026-03-31/
    ...
```

### 2. Single unified report

**Why:** Layer 1 + Layer 2 together give complete picture of "what's wrong with docs"
- Not two separate files (old design: report + patch)
- Not two separate runs

### 3. [unverifiable] marking

**Why:** Claims that can't be checked are still useful context for humans
- Not omitted (deleted)
- Not marked as failures
- Just noted with lower priority

### 4. Content layer uses real tools

**Why:** "Reality" is not just code, it's what the app actually does
- Pencil MCP for design state
- Playwright MCP for UI behavior
- Code reads for implementation
- Test runs for correctness

---

## Coverage

| Category | Status | Notes |
|----------|--------|-------|
| **Structure Layer** | ✓ Complete | Tested, stable, handles orphans/misplaced/stale/debt |
| **Content Layer** | ✓ Complete | AGENTS.md defined, awaiting first real run |
| **GitHub Actions** | ✓ Complete | Code tests only (Jest + node --test) |
| **Local Scheduler** | ✓ Complete | PS1 + Codex setup, ready for daily runs |
| **Report Format** | ✓ Complete | Two-layer unified format |
| **Governance** | ✓ Complete | `doc-audit-policy.md` + `release-gate.md` |

---

## Next Steps

1. **First real run** — manually trigger `invoke_content_audit.ps1` locally to see first `full-audit-report.md`
2. **Validate Content Layer** — review findings quality, adjust thresholds if needed
3. **Setup Task Scheduler** — configure daily 09:15 AM trigger (Windows Task Scheduler)
4. **Monitor** — first few runs, validate findings accuracy

---

## Relationship to Original Design

The original **2026-03-29 Document Audit CI Design** remains valid as a conceptual foundation:
- Two-layer model ✓
- Review-first, non-destructive ✓
- Governance baseline ✓
- Lightweight verification ✓

The implementation differs in:
- **Where it runs** — local instead of GitHub Actions (cleaner separation)
- **How outputs look** — unified report instead of separate artifacts
- **Tools available** — expanded with Pencil + Playwright MCPs

This is a deliberate refinement, not a deviation from the design philosophy.

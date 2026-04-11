# Document Audit CI Implementation Plan

> **Status:** COMPLETED

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a review-first document-audit CI that can map the routed markdown graph, classify findings, run lightweight verification for uncertain claims, and emit one report plus one suggested patch.

**Architecture:** Implement the audit system as a small Python standard-library tool under `scripts/doc_audit/` so it can run both locally and in GitHub Actions without adding heavy dependencies. Keep governance rules in markdown under `docs/governance/`, generate outputs under `docs/generated/doc-audit/`, and separate the initial inventory mode from the daily mode behind one command entrypoint.

**Tech Stack:** Python 3 standard library, `unittest`, GitHub Actions, markdown governance docs, repository-local file and process inspection

---

### Task 1: Add governance baseline and output directories

**Files:**
- Create: `docs/governance/doc-audit-policy.md`
- Create: `docs/generated/doc-audit/.gitkeep`
- Modify: `docs/README.md`
- Modify: `docs/plans/2026-03-29-document-audit-ci-design.md`

**Step 1: Write the governance policy draft**

Create `docs/governance/doc-audit-policy.md` with these sections:

```md
# Document Audit Policy

## Entrypoints
- `AGENTS.md`
- `README.md`
- `project-context.md`
- `docs/README.md`
- `docs/contracts/README.md`
- `backend/AGENTS.md`
- `frontend/AGENTS.md`

## Public Finding Types
- `stale`
- `orphan`
- `misplaced`
- `debt`

## Debt Kinds
- `future-risk`
- `non-blocking`

## Evidence Kinds
- `observed`
- `verified`
```

**Step 2: Add the generated output directory placeholder**

Create `docs/generated/doc-audit/.gitkeep`.

**Step 3: Route the docs index to the new governance layer**

Update `docs/README.md` so it mentions:

- `docs/governance/` as the audit-policy source
- `docs/generated/` as the machine-generated output area

**Step 4: Cross-link the design document to the governance policy**

Update `docs/plans/2026-03-29-document-audit-ci-design.md` so the recommended next step references `docs/governance/doc-audit-policy.md`.

**Step 5: Verify the files and links**

Run: `python -c "from pathlib import Path; paths=[Path('docs/governance/doc-audit-policy.md'), Path('docs/generated/doc-audit/.gitkeep')]; print(all(p.exists() for p in paths))"`

Expected: `True`

**Step 6: Commit**

```bash
git add docs/governance/doc-audit-policy.md docs/generated/doc-audit/.gitkeep docs/README.md docs/plans/2026-03-29-document-audit-ci-design.md
git commit -m "docs: add document audit governance baseline"
```

### Task 2: Build entrypoint loading and markdown graph resolution

**Files:**
- Create: `scripts/doc_audit/__init__.py`
- Create: `scripts/doc_audit/models.py`
- Create: `scripts/doc_audit/entrypoints.py`
- Create: `scripts/doc_audit/graph.py`
- Create: `tests/doc_audit/test_entrypoints.py`
- Create: `tests/doc_audit/test_graph.py`

**Step 1: Write the failing entrypoint test**

Create `tests/doc_audit/test_entrypoints.py`:

```python
import unittest
from pathlib import Path

from scripts.doc_audit.entrypoints import get_phase_one_entrypoints


class EntrypointTests(unittest.TestCase):
    def test_phase_one_entrypoints_are_repo_relative_paths(self) -> None:
        repo_root = Path.cwd()
        entrypoints = get_phase_one_entrypoints(repo_root)

        self.assertIn(repo_root / "AGENTS.md", entrypoints)
        self.assertIn(repo_root / "docs" / "README.md", entrypoints)
        self.assertIn(repo_root / "backend" / "AGENTS.md", entrypoints)
```

**Step 2: Run the test to confirm it fails**

Run: `python -m unittest tests.doc_audit.test_entrypoints -v`

Expected: FAIL with `ModuleNotFoundError` or missing function error

**Step 3: Write the minimal entrypoint loader**

Create `scripts/doc_audit/entrypoints.py`:

```python
from pathlib import Path


PHASE_ONE_ENTRYPOINTS = (
    "AGENTS.md",
    "README.md",
    "project-context.md",
    "docs/README.md",
    "docs/contracts/README.md",
    "backend/AGENTS.md",
    "frontend/AGENTS.md",
)


def get_phase_one_entrypoints(repo_root: Path) -> list[Path]:
    return [repo_root / rel_path for rel_path in PHASE_ONE_ENTRYPOINTS]
```

**Step 4: Write the failing graph traversal test**

Create `tests/doc_audit/test_graph.py`:

```python
import tempfile
import unittest
from pathlib import Path

from scripts.doc_audit.graph import resolve_reachable_markdown


class GraphTests(unittest.TestCase):
    def test_resolve_reachable_markdown_follows_local_markdown_links(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "README.md").write_text("[Docs](docs/README.md)\n", encoding="utf-8")
            (root / "docs").mkdir()
            (root / "docs" / "README.md").write_text("[Plan](../plans/next.md)\n", encoding="utf-8")
            (root / "plans").mkdir()
            (root / "plans" / "next.md").write_text("# next\n", encoding="utf-8")

            reachable = resolve_reachable_markdown(root, [root / "README.md"])

            self.assertIn(root / "README.md", reachable)
            self.assertIn(root / "docs" / "README.md", reachable)
            self.assertIn(root / "plans" / "next.md", reachable)
```

**Step 5: Run the graph test to confirm it fails**

Run: `python -m unittest tests.doc_audit.test_graph -v`

Expected: FAIL with `ModuleNotFoundError` or missing function error

**Step 6: Write the minimal graph resolver**

Create `scripts/doc_audit/graph.py` that:

- extracts markdown links with a simple regex
- resolves relative markdown paths
- ignores external URLs and image links
- performs breadth-first traversal from entrypoints

Skeleton:

```python
from collections import deque
from pathlib import Path
import re

LINK_RE = re.compile(r"\[[^\]]+\]\(([^)]+)\)")


def resolve_reachable_markdown(repo_root: Path, entrypoints: list[Path]) -> set[Path]:
    queue = deque(path.resolve() for path in entrypoints if path.exists())
    seen: set[Path] = set()
    ...
```

**Step 7: Run both tests**

Run: `python -m unittest tests.doc_audit.test_entrypoints tests.doc_audit.test_graph -v`

Expected: PASS

**Step 8: Commit**

```bash
git add scripts/doc_audit/__init__.py scripts/doc_audit/models.py scripts/doc_audit/entrypoints.py scripts/doc_audit/graph.py tests/doc_audit/test_entrypoints.py tests/doc_audit/test_graph.py
git commit -m "feat: add document audit graph resolution"
```

### Task 3: Implement scope enumeration and classification rules

**Files:**
- Modify: `scripts/doc_audit/models.py`
- Create: `scripts/doc_audit/classifier.py`
- Create: `tests/doc_audit/test_classifier.py`

**Step 1: Write the failing classifier tests**

Create `tests/doc_audit/test_classifier.py`:

```python
import unittest
from pathlib import Path

from scripts.doc_audit.classifier import classify_findings
from scripts.doc_audit.models import AuditInput, CandidateIssue


class ClassifierTests(unittest.TestCase):
    def test_marks_unreachable_markdown_as_orphan(self) -> None:
        issue = CandidateIssue(
            file=Path("docs/old-note.md"),
            kind_hint="orphan",
            evidence_kind="observed",
            detail="not reachable from any entrypoint",
        )
        result = classify_findings(AuditInput(candidate_issues=[issue]))
        self.assertEqual(result[0].kind, "orphan")

    def test_marks_fixable_conflict_as_stale(self) -> None:
        issue = CandidateIssue(
            file=Path("docs/README.md"),
            kind_hint="stale",
            evidence_kind="verified",
            detail="documented command fails and replacement is known",
            suggested_replacement="Use `python scripts/run_doc_audit.py --mode daily`.",
        )
        result = classify_findings(AuditInput(candidate_issues=[issue]))
        self.assertEqual(result[0].kind, "stale")
```

**Step 2: Run the classifier tests to confirm they fail**

Run: `python -m unittest tests.doc_audit.test_classifier -v`

Expected: FAIL with import or missing symbol errors

**Step 3: Define shared models**

Update `scripts/doc_audit/models.py` with dataclasses such as:

```python
from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class CandidateIssue:
    file: Path
    kind_hint: str
    evidence_kind: str
    detail: str
    suggested_replacement: str | None = None
    debt_kind: str | None = None


@dataclass
class Finding:
    kind: str
    file: Path
    evidence_kind: str
    detail: str
    suggested_replacement: str | None = None
    debt_kind: str | None = None


@dataclass
class AuditInput:
    candidate_issues: list[CandidateIssue] = field(default_factory=list)
```

**Step 4: Write the minimal classifier**

Create `scripts/doc_audit/classifier.py` that:

- maps unreachable files to `orphan`
- maps fixable confirmed conflicts to `stale`
- maps unresolved-but-real issues to `debt`
- maps relocation-only findings to `misplaced`

**Step 5: Run the classifier tests**

Run: `python -m unittest tests.doc_audit.test_classifier -v`

Expected: PASS

**Step 6: Add a narrow regression for debt sub-kinds**

Add this test:

```python
    def test_keeps_future_risk_debt_kind(self) -> None:
        issue = CandidateIssue(
            file=Path("docs/legacy.md"),
            kind_hint="debt",
            evidence_kind="observed",
            detail="prototype-safe but production-risky",
            debt_kind="future-risk",
        )
        result = classify_findings(AuditInput(candidate_issues=[issue]))
        self.assertEqual(result[0].debt_kind, "future-risk")
```

**Step 7: Re-run the classifier suite**

Run: `python -m unittest tests.doc_audit.test_classifier -v`

Expected: PASS

**Step 8: Commit**

```bash
git add scripts/doc_audit/models.py scripts/doc_audit/classifier.py tests/doc_audit/test_classifier.py
git commit -m "feat: add document audit classification rules"
```

### Task 4: Add lightweight verification hooks

**Files:**
- Create: `scripts/doc_audit/verification.py`
- Modify: `scripts/doc_audit/models.py`
- Create: `tests/doc_audit/test_verification.py`

**Step 1: Write the failing verification tests**

Create `tests/doc_audit/test_verification.py`:

```python
import tempfile
import unittest
from pathlib import Path

from scripts.doc_audit.verification import verify_path_exists


class VerificationTests(unittest.TestCase):
    def test_verify_path_exists_returns_verified_when_file_exists(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            file_path = Path(tmp) / "README.md"
            file_path.write_text("# ok\n", encoding="utf-8")
            result = verify_path_exists(file_path)
            self.assertEqual(result.evidence_kind, "verified")
            self.assertTrue(result.ok)
```

**Step 2: Run the verification test to confirm it fails**

Run: `python -m unittest tests.doc_audit.test_verification -v`

Expected: FAIL with import error

**Step 3: Define the verification result model**

Update `scripts/doc_audit/models.py` with:

```python
@dataclass
class VerificationResult:
    ok: bool
    evidence_kind: str
    detail: str
```

**Step 4: Write the minimal verification module**

Create `scripts/doc_audit/verification.py`:

```python
from pathlib import Path

from scripts.doc_audit.models import VerificationResult


def verify_path_exists(path: Path) -> VerificationResult:
    exists = path.exists()
    return VerificationResult(
        ok=exists,
        evidence_kind="verified",
        detail=f"path exists: {exists}",
    )
```

**Step 5: Run the verification test**

Run: `python -m unittest tests.doc_audit.test_verification -v`

Expected: PASS

**Step 6: Extend the module with command verification placeholder**

Add a second function signature only:

```python
def verify_command_runs(command: list[str], cwd: Path) -> VerificationResult:
    ...
```

Back it with `subprocess.run(..., capture_output=True, text=True)`.

**Step 7: Add one test for a trivial command**

Add:

```python
from scripts.doc_audit.verification import verify_command_runs

    def test_verify_command_runs_marks_success_as_verified(self) -> None:
        result = verify_command_runs(["python", "-c", "print('ok')"], Path.cwd())
        self.assertEqual(result.evidence_kind, "verified")
        self.assertTrue(result.ok)
```

**Step 8: Re-run the verification suite**

Run: `python -m unittest tests.doc_audit.test_verification -v`

Expected: PASS

**Step 9: Commit**

```bash
git add scripts/doc_audit/verification.py scripts/doc_audit/models.py tests/doc_audit/test_verification.py
git commit -m "feat: add document audit verification hooks"
```

### Task 5: Generate the report and patch artifacts

**Files:**
- Create: `scripts/doc_audit/reporting.py`
- Create: `scripts/run_doc_audit.py`
- Create: `tests/doc_audit/test_reporting.py`

**Step 1: Write the failing reporting test**

Create `tests/doc_audit/test_reporting.py`:

```python
import tempfile
import unittest
from pathlib import Path

from scripts.doc_audit.models import Finding
from scripts.doc_audit.reporting import write_report


class ReportingTests(unittest.TestCase):
    def test_write_report_creates_latest_report_file(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            output_dir = Path(tmp)
            findings = [
                Finding(
                    kind="stale",
                    file=Path("docs/README.md"),
                    evidence_kind="verified",
                    detail="old command text",
                    suggested_replacement="new command text",
                )
            ]
            report_path = write_report(output_dir, findings, ["AGENTS.md"])
            self.assertTrue(report_path.exists())
            self.assertIn("Document Audit Report", report_path.read_text(encoding="utf-8"))
```

**Step 2: Run the reporting test to confirm it fails**

Run: `python -m unittest tests.doc_audit.test_reporting -v`

Expected: FAIL with import error

**Step 3: Write the minimal reporting implementation**

Create `scripts/doc_audit/reporting.py` with:

- `write_report(output_dir, findings, entrypoints)`
- `write_patch(output_dir, findings)`

Requirements:

- write `latest-report.md`
- write `latest.patch`
- include only `stale` findings in the patch

**Step 4: Add a patch-generation test**

Extend `tests/doc_audit/test_reporting.py`:

```python
from scripts.doc_audit.reporting import write_patch

    def test_write_patch_only_emits_stale_findings(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            output_dir = Path(tmp)
            findings = [
                Finding(kind="stale", file=Path("docs/README.md"), evidence_kind="verified", detail="x", suggested_replacement="y"),
                Finding(kind="debt", file=Path("docs/legacy.md"), evidence_kind="observed", detail="risk"),
            ]
            patch_path = write_patch(output_dir, findings)
            patch_text = patch_path.read_text(encoding="utf-8")
            self.assertIn("docs/README.md", patch_text)
            self.assertNotIn("docs/legacy.md", patch_text)
```

**Step 5: Run the reporting tests**

Run: `python -m unittest tests.doc_audit.test_reporting -v`

Expected: PASS

**Step 6: Create the CLI entrypoint**

Create `scripts/run_doc_audit.py` with:

- `--mode init`
- `--mode daily`
- repo root discovery from `Path(__file__).resolve().parents[1]`
- output target `docs/generated/doc-audit/`

The initial implementation may use placeholder candidate issue collection, but it must:

- load entrypoints
- resolve the graph
- call reporting functions
- exit non-zero only when the command itself fails, not when findings exist

**Step 7: Smoke-test the CLI**

Run: `python scripts/run_doc_audit.py --mode init`

Expected:

- exit code `0`
- `docs/generated/doc-audit/latest-report.md` exists
- `docs/generated/doc-audit/latest.patch` exists

**Step 8: Commit**

```bash
git add scripts/doc_audit/reporting.py scripts/run_doc_audit.py tests/doc_audit/test_reporting.py docs/generated/doc-audit/latest-report.md docs/generated/doc-audit/latest.patch
git commit -m "feat: add document audit reporting pipeline"
```

### Task 6: Add initialization inventory heuristics

**Files:**
- Modify: `scripts/doc_audit/graph.py`
- Modify: `scripts/doc_audit/classifier.py`
- Modify: `scripts/run_doc_audit.py`
- Create: `tests/doc_audit/test_init_mode.py`

**Step 1: Write the failing init-mode test**

Create `tests/doc_audit/test_init_mode.py`:

```python
import subprocess
import unittest
from pathlib import Path


class InitModeTests(unittest.TestCase):
    def test_init_mode_report_mentions_structure_recommendations(self) -> None:
        repo_root = Path.cwd()
        result = subprocess.run(
            ["python", "scripts/run_doc_audit.py", "--mode", "init"],
            cwd=repo_root,
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(result.returncode, 0)
        report_text = (repo_root / "docs" / "generated" / "doc-audit" / "latest-report.md").read_text(encoding="utf-8")
        self.assertIn("initialization", report_text.lower())
```

**Step 2: Run the init-mode test to confirm it fails**

Run: `python -m unittest tests.doc_audit.test_init_mode -v`

Expected: FAIL because the report lacks initialization-specific output

**Step 3: Add initialization-specific report content**

Update the CLI and reporting flow so `--mode init` adds:

- a note that this is the baseline inventory pass
- a section for migration recommendations
- a section for root-level markdown relocation candidates

**Step 4: Add simple misplaced heuristics**

Implement minimal heuristics only:

- root-level markdown files not in `{AGENTS.md, README.md, project-context.md}` become `misplaced` candidates
- markdown under `docs/plans/` remains valid but can be annotated for future active/completed split without moving files yet

**Step 5: Re-run the init-mode test**

Run: `python -m unittest tests.doc_audit.test_init_mode -v`

Expected: PASS

**Step 6: Commit**

```bash
git add scripts/doc_audit/graph.py scripts/doc_audit/classifier.py scripts/run_doc_audit.py tests/doc_audit/test_init_mode.py docs/generated/doc-audit/latest-report.md docs/generated/doc-audit/latest.patch
git commit -m "feat: add document audit initialization mode"
```

### Task 7: Add the daily GitHub Actions workflow

**Files:**
- Create: `.github/workflows/doc-audit.yml`
- Modify: `README.md`

**Step 1: Write the workflow file**

Create `.github/workflows/doc-audit.yml` with:

- `schedule` once per day
- `workflow_dispatch`
- `actions/checkout@v4`
- `actions/setup-python@v5`
- `python-version: '3.11'`
- test step:
  - `python -m unittest discover -s tests/doc_audit -p 'test_*.py' -v`
- audit step:
  - `python scripts/run_doc_audit.py --mode daily`
- artifact upload step for:
  - `docs/generated/doc-audit/latest-report.md`
  - `docs/generated/doc-audit/latest.patch`

**Step 2: Add local discoverability to the root README**

Update `README.md` with one short section:

```md
## Document Audit

The repository includes a review-first document audit workflow.

- Local run: `python scripts/run_doc_audit.py --mode init`
- Daily CI: `.github/workflows/doc-audit.yml`
```

**Step 3: Validate the workflow YAML parses**

Run: `python -c "import yaml, pathlib; print(bool(yaml.safe_load(pathlib.Path('.github/workflows/doc-audit.yml').read_text(encoding='utf-8'))))"`

Expected: `True`

If `PyYAML` is unavailable, replace this with a simpler structural smoke check:

Run: `python -c "from pathlib import Path; text=Path('.github/workflows/doc-audit.yml').read_text(encoding='utf-8'); print('schedule:' in text and 'workflow_dispatch:' in text and 'upload-artifact' in text)"`

Expected: `True`

**Step 4: Run the full narrow verification suite**

Run: `python -m unittest discover -s tests/doc_audit -p 'test_*.py' -v`

Expected: PASS

**Step 5: Commit**

```bash
git add .github/workflows/doc-audit.yml README.md
git commit -m "ci: add daily document audit workflow"
```

### Task 8: Execute the first baseline audit and review output

**Files:**
- Modify: `docs/generated/doc-audit/latest-report.md`
- Modify: `docs/generated/doc-audit/latest.patch`
- Review: `docs/governance/doc-audit-policy.md`
- Review: `docs/plans/2026-03-29-document-audit-ci-design.md`

**Step 1: Run the initialization audit**

Run: `python scripts/run_doc_audit.py --mode init`

Expected:

- exit code `0`
- generated report and patch refreshed

**Step 2: Inspect the report for the first baseline findings**

Review whether the report contains:

- reachable entrypoint graph summary
- orphan candidates
- misplaced root-level markdown candidates
- debt candidates with `future-risk` or `non-blocking` labels when applicable

**Step 3: Patch only the audit tool if the report format is clearly broken**

Do not start restructuring repository docs in this step. Only fix the audit tool if the output contract is wrong.

**Step 4: Re-run the narrow verification**

Run: `python -m unittest discover -s tests/doc_audit -p 'test_*.py' -v`

Expected: PASS

**Step 5: Commit**

```bash
git add docs/generated/doc-audit/latest-report.md docs/generated/doc-audit/latest.patch
git commit -m "chore: capture initial document audit baseline"
```

## Execution Notes

- Keep the implementation standard-library only in phase one.
- Do not add markdown parser dependencies unless the existing regex approach proves insufficient.
- Keep verification narrow and cheap enough for daily CI.
- Do not auto-delete or auto-move files in this plan.
- If a finding cannot be safely converted into a patch, keep it in the report as `debt` or `misplaced`.

"""
Document audit CLI.

Usage:
    python scripts/run_doc_audit.py --mode init
    python scripts/run_doc_audit.py --mode daily
"""
import argparse
import sys
from datetime import date
from pathlib import Path

# Ensure repo root is on the import path when run as a script.
_REPO_ROOT = Path(__file__).resolve().parents[1]
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from scripts.doc_audit.classifier import classify_findings
from scripts.doc_audit.entrypoints import get_phase_one_entrypoints
from scripts.doc_audit.graph import enumerate_scope_markdown, resolve_reachable_markdown
from scripts.doc_audit.models import AuditInput, CandidateIssue
from scripts.doc_audit.reporting import write_patch, write_report
from scripts.doc_audit.verification import (
    verify_release_gate_test_files,
    verify_unit_test_commands,
)

_AUDIT_BASE = _REPO_ROOT / "docs" / "generated" / "doc-audit"


def _output_dir() -> Path:
    today = date.today().isoformat()  # e.g. 2026-03-30
    d = _AUDIT_BASE / today
    d.mkdir(parents=True, exist_ok=True)
    return d


def _collect_candidate_issues(
    repo_root: Path,
    reachable: set[Path],
    scope: set[Path],
    mode: str,
) -> list[CandidateIssue]:
    issues: list[CandidateIssue] = []

    # Orphan: in scope but not reachable from any entrypoint
    for path in sorted(scope - reachable):
        issues.append(CandidateIssue(
            file=path.relative_to(repo_root),
            kind_hint="orphan",
            evidence_kind="observed",
            detail="not reachable from any entrypoint",
        ))

    # Misplaced (init mode): root-level markdown not in the expected set
    if mode == "init":
        allowed_root = {"AGENTS.md", "README.md", "project-context.md"}
        for md in sorted(repo_root.glob("*.md")):
            if md.name not in allowed_root:
                issues.append(CandidateIssue(
                    file=md.relative_to(repo_root),
                    kind_hint="misplaced",
                    evidence_kind="observed",
                    detail=(
                        f"root-level markdown '{md.name}' is not in the expected set "
                        f"{sorted(allowed_root)}; consider moving to docs/references/ or docs/archive/"
                    ),
                ))

    # Verification: release-gate test files
    for path, result in verify_release_gate_test_files(repo_root):
        if not result.ok:
            issues.append(CandidateIssue(
                file=path.relative_to(repo_root),
                kind_hint="stale",
                evidence_kind="verified",
                detail=(
                    f"release-gate.md references this test file but it no longer exists: {result.detail}"
                ),
                suggested_replacement="Remove or update the reference in docs/governance/release-gate.md.",
            ))

    # Verification: unit test commands (daily mode — skip in init to keep it fast)
    if mode == "daily":
        for label, result in verify_unit_test_commands(repo_root):
            if not result.ok:
                issues.append(CandidateIssue(
                    file=Path("docs/governance/release-gate.md"),
                    kind_hint="stale",
                    evidence_kind="verified",
                    detail=f"release-gate unit test command failed — {label}: {result.detail}",
                    suggested_replacement=(
                        "Fix the failing tests or update the command in release-gate.md."
                    ),
                ))

    return issues


def main() -> None:
    parser = argparse.ArgumentParser(description="Document audit tool")
    parser.add_argument("--mode", choices=["init", "daily"], default="daily")
    args = parser.parse_args()

    repo_root = _REPO_ROOT
    entrypoints = get_phase_one_entrypoints(repo_root)
    reachable = resolve_reachable_markdown(repo_root, entrypoints)
    scope = enumerate_scope_markdown(repo_root)

    candidate_issues = _collect_candidate_issues(repo_root, reachable, scope, args.mode)
    findings = classify_findings(AuditInput(candidate_issues=candidate_issues))

    output_dir = _output_dir()
    entrypoint_labels = [str(p.relative_to(repo_root)) for p in entrypoints]
    write_report(output_dir, findings, entrypoint_labels, mode=args.mode, reachable_count=len(reachable))
    write_patch(output_dir, findings)

    stale = sum(1 for f in findings if f.kind == "stale")
    orphan = sum(1 for f in findings if f.kind == "orphan")
    misplaced = sum(1 for f in findings if f.kind == "misplaced")
    debt = sum(1 for f in findings if f.kind == "debt")
    print(
        f"[doc-audit] mode={args.mode}  reachable={len(reachable)}  "
        f"scope={len(scope)}  stale={stale}  orphan={orphan}  "
        f"misplaced={misplaced}  debt={debt}"
    )
    print(f"[doc-audit] report → {output_dir / 'latest-report.md'}")
    print(f"[doc-audit] patch  → {output_dir / 'latest.patch'}")


if __name__ == "__main__":
    main()

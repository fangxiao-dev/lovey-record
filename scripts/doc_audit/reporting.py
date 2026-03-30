from datetime import date
from pathlib import Path

from scripts.doc_audit.models import Finding


def _section(findings: list[Finding], kind: str) -> str:
    items = [f for f in findings if f.kind == kind]
    if not items:
        return ""
    lines = [f"### {kind.capitalize()}\n"]
    for f in items:
        lines.append(f"- **file:** `{f.file.as_posix()}`")
        lines.append(f"  - evidence: `{f.evidence_kind}`")
        lines.append(f"  - detail: {f.detail}")
        if f.debt_kind:
            lines.append(f"  - debt_kind: `{f.debt_kind}`")
        if f.suggested_replacement:
            lines.append(f"  - proposed update: {f.suggested_replacement}")
    return "\n".join(lines) + "\n"


def write_report(
    output_dir: Path,
    findings: list[Finding],
    entrypoints: list[str],
    mode: str = "daily",
    reachable_count: int | None = None,
) -> Path:
    counts = {k: sum(1 for f in findings if f.kind == k)
              for k in ("stale", "orphan", "misplaced", "debt")}
    shown_reachable = reachable_count if reachable_count is not None else len(entrypoints)

    header = f"""# Document Audit Report

- Date: {date.today().isoformat()}
- Mode: {mode}
- Entry Points: {len(entrypoints)}

## Summary

- reachable docs: {shown_reachable}
- stale findings: {counts['stale']}
- orphan findings: {counts['orphan']}
- misplaced findings: {counts['misplaced']}
- debt findings: {counts['debt']}

"""
    init_section = ""
    if mode == "init":
        init_section = """## Initialization Notes

This is the baseline inventory pass. Findings below represent the initial state of the
documentation graph. Use them to guide migration toward the target structure defined in
`docs/plans/2026-03-29-document-audit-ci-design.md`.

"""

    findings_body = "## Findings\n\n"
    for kind in ("stale", "orphan", "misplaced", "debt"):
        section = _section(findings, kind)
        if section:
            findings_body += section + "\n"
    if counts["stale"] == counts["orphan"] == counts["misplaced"] == counts["debt"] == 0:
        findings_body += "_No findings._\n"

    output_dir.mkdir(parents=True, exist_ok=True)
    report_path = output_dir / "latest-report.md"
    report_path.write_text(header + init_section + findings_body, encoding="utf-8")
    return report_path


def write_patch(output_dir: Path, findings: list[Finding]) -> Path:
    patchable = [f for f in findings if f.kind == "stale" and f.suggested_replacement]
    lines = ["# Document Audit Suggested Patch\n",
             f"# Generated: {date.today().isoformat()}\n",
             f"# Patchable stale findings: {len(patchable)}\n\n"]
    for f in patchable:
        lines.append(f"## {f.file.as_posix()}\n")
        lines.append(f"**Detail:** {f.detail}\n\n")
        lines.append(f"**Suggested replacement:**\n\n{f.suggested_replacement}\n\n")
        lines.append("---\n\n")

    output_dir.mkdir(parents=True, exist_ok=True)
    patch_path = output_dir / "latest.patch"
    patch_path.write_text("".join(lines), encoding="utf-8")
    return patch_path

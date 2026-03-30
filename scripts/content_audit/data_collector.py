#!/usr/bin/env python
"""
Data Collection for Content Correctness Audit

Gathers structured document metadata from the repository without AI analysis.
This data serves as input for Codex agent to analyze document content correctness.
"""

import json
import re
import sys
from pathlib import Path
from typing import Optional

# Add repo root to path for imports
repo_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(repo_root))

from scripts.content_audit.models import (
    ContentAuditMetadata,
    DesignMetadata,
    DocumentAuditFinding,
    GovernanceMetadata,
    PlanMetadata,
)


def extract_date_from_filename(filename: str) -> Optional[str]:
    """
    Extract date from plan filename pattern: YYYY-MM-DD-description.md
    Returns: "YYYY-MM-DD" or None
    """
    match = re.match(r"(\d{4}-\d{2}-\d{2})", filename)
    return match.group(1) if match else None


def detect_plan_type(file_path: Path) -> str:
    """Determine if plan is long-term or short-term based on content/name"""
    filename = file_path.name
    content = file_path.read_text(encoding="utf-8")

    # Heuristics
    if "definition" in filename.lower() or "gap-list" in filename.lower():
        return "long_term"
    if re.search(r"(?i)long.term|strategic|vision|roadmap", content):
        return "long_term"
    if re.search(r"(?i)task|implementation|step|action", content[:500]):
        return "short_term"

    return "short_term"


def extract_status_markers(content: str) -> dict:
    """Count status indicators in document"""
    markers = {
        "checkmarks": len(re.findall(r"✓|✔", content)),
        "done_mentions": len(re.findall(r"(?i)\bdone\b|\bcomplete\b", content)),
        "in_progress_mentions": len(re.findall(r"(?i)in progress|pending", content)),
        "blocked_mentions": len(re.findall(r"(?i)blocked|waiting", content)),
    }
    return markers


def has_remaining_section(content: str) -> bool:
    """Check if document has explicit 'remaining' or 'gap' sections"""
    return bool(
        re.search(
            r"(?i)## (remaining|still missing|gap|todo|next)",
            content,
        )
    )


def extract_section_headers(content: str) -> list[str]:
    """Extract all level-2 headers as section names"""
    headers = re.findall(r"^## (.+)$", content, re.MULTILINE)
    return headers


def collect_plan_metadata(repo_root: Path) -> list[PlanMetadata]:
    """Extract metadata from all plan documents"""
    plans_dir = repo_root / "docs" / "plans"
    results = []

    if not plans_dir.exists():
        return results

    for plan_file in plans_dir.glob("*.md"):
        content = plan_file.read_text(encoding="utf-8")

        metadata = PlanMetadata(
            file=plan_file.relative_to(repo_root),
            last_modified_date=extract_date_from_filename(plan_file.name),
            status_markers=extract_status_markers(content),
            has_remaining_section=has_remaining_section(content),
            sections=extract_section_headers(content),
            plan_type=detect_plan_type(plan_file),
        )
        results.append(metadata)

    return results


def extract_referenced_paths(content: str) -> list[Path]:
    """Extract file paths from document (e.g., in links or code blocks)"""
    paths = []
    # Match patterns like [text](path/to/file.md) and `path/to/file.md`
    pattern = r"(?:\[.*?\]\(([^)]+)\)|`([^`]+)`)"
    matches = re.findall(pattern, content)

    for match in matches:
        path_str = match[0] or match[1]
        if path_str and (path_str.endswith(".md") or "/" in path_str or "\\" in path_str):
            paths.append(Path(path_str))

    return paths


def extract_commands(content: str) -> list[str]:
    """Extract command references from document"""
    commands = []
    # Match patterns like `command arg1 arg2` or ```bash\ncommand\n```
    cmd_pattern = r"(?:^|\n)(?:```(?:bash|sh|powershell)\n)?(.+?)(?:\n```|$)"
    matches = re.findall(cmd_pattern, content, re.MULTILINE)

    # Simple heuristic: if it starts with known command prefixes, it's probably a command
    for match in matches:
        if re.match(r"^(python|npm|node|pytest|cargo|go|java)", match.strip()):
            commands.append(match.strip())

    return commands


def collect_governance_metadata(repo_root: Path) -> list[GovernanceMetadata]:
    """Extract metadata from governance documents"""
    governance_dir = repo_root / "docs" / "governance"
    results = []

    if not governance_dir.exists():
        return results

    for gov_file in governance_dir.glob("*.md"):
        content = gov_file.read_text(encoding="utf-8")

        # Extract rules as sections with "rule" or "requirement" in name
        rules = []
        for header in extract_section_headers(content):
            if re.search(r"(?i)rule|requirement|guideline|policy", header):
                rules.append({"name": header})

        metadata = GovernanceMetadata(
            file=gov_file.relative_to(repo_root),
            rules=rules,
            referenced_files=extract_referenced_paths(content),
            referenced_commands=extract_commands(content),
        )
        results.append(metadata)

    return results


def collect_design_metadata(repo_root: Path) -> list[DesignMetadata]:
    """Extract metadata from design documents"""
    design_dir = repo_root / "docs" / "design"
    results = []

    if not design_dir.exists():
        return results

    for design_file in design_dir.glob("*.md"):
        content = design_file.read_text(encoding="utf-8")

        # Extract design decisions (look for "Decision" sections)
        decisions = []
        for header in extract_section_headers(content):
            if re.search(r"(?i)decision|choice|approach", header):
                decisions.append({"title": header})

        metadata = DesignMetadata(
            file=design_file.relative_to(repo_root),
            design_decisions=decisions,
            referenced_contracts=extract_referenced_paths(content),
        )
        results.append(metadata)

    return results


def parse_document_audit_report(report_path: Path) -> list[DocumentAuditFinding]:
    """Parse Document Audit report to extract findings"""
    findings = []

    if not report_path.exists():
        return findings

    content = report_path.read_text(encoding="utf-8")

    # Extract findings sections: look for headings and structured content
    # Pattern: ### [Finding Type]\n - **file:** ...\n - evidence_kind: ...\n
    finding_blocks = re.split(r"^### ", content, flags=re.MULTILINE)[1:]

    for block in finding_blocks:
        lines = block.split("\n")
        kind = lines[0].strip()

        # Parse each bullet
        for line in lines[1:]:
            if "**file:**" in line:
                match = re.search(r"\*\*file:\*\*\s*`?([^`]+)`?", line)
                if match:
                    file_path = Path(match.group(1))

                    # Simple heuristic: assume finding type from section header
                    clean_kind = kind.lower().split()[0]
                    if clean_kind not in ["stale", "orphan", "misplaced", "debt"]:
                        clean_kind = "debt"

                    finding = DocumentAuditFinding(
                        kind=clean_kind,
                        file=file_path,
                        evidence_kind="observed",
                        detail=f"From document audit: {kind}",
                    )
                    findings.append(finding)

    return findings


def get_last_commit_hash(repo_root: Path) -> Optional[str]:
    """Get the last commit hash using git"""
    import subprocess

    try:
        result = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=repo_root,
            capture_output=True,
            text=True,
            check=False,
        )
        return result.stdout.strip() if result.returncode == 0 else None
    except Exception:
        return None


def get_modified_files(repo_root: Path) -> list[Path]:
    """Get recently modified files from git"""
    import subprocess

    try:
        result = subprocess.run(
            ["git", "diff", "--name-only"],
            cwd=repo_root,
            capture_output=True,
            text=True,
            check=False,
        )
        if result.returncode == 0:
            return [Path(f) for f in result.stdout.strip().split("\n") if f]
    except Exception:
        pass

    return []


def collect_all_metadata(repo_root: Path, audit_report_path: Optional[Path] = None) -> ContentAuditMetadata:
    """
    Collect all metadata for content audit analysis

    Args:
        repo_root: Repository root directory
        audit_report_path: Path to Document Audit report (optional)

    Returns:
        ContentAuditMetadata with all collected data
    """
    # Determine audit report path if not provided
    if audit_report_path is None:
        audit_report_path = repo_root / "docs" / "generated" / "doc-audit" / "latest-report.md"

    return ContentAuditMetadata(
        plans=collect_plan_metadata(repo_root),
        governance=collect_governance_metadata(repo_root),
        design=collect_design_metadata(repo_root),
        document_audit_findings=parse_document_audit_report(audit_report_path),
        last_commit=get_last_commit_hash(repo_root),
        modified_files=get_modified_files(repo_root),
    )


def main():
    """CLI entry point"""
    import argparse
    import sys

    parser = argparse.ArgumentParser(description="Collect document metadata for content audit")
    parser.add_argument("--repo-root", type=Path, default=Path.cwd(), help="Repository root directory")
    parser.add_argument("--audit-report", type=Path, help="Path to Document Audit report")
    parser.add_argument("--output", type=Path, help="Output file path (JSON)")

    args = parser.parse_args()

    # Collect metadata
    metadata = collect_all_metadata(args.repo_root, args.audit_report)

    # Convert to JSON-serializable format
    output_data = {
        "plans": [
            {
                "file": str(p.file),
                "last_modified_date": p.last_modified_date,
                "status_markers": p.status_markers,
                "has_remaining_section": p.has_remaining_section,
                "sections": p.sections,
                "plan_type": p.plan_type,
            }
            for p in metadata.plans
        ],
        "governance": [
            {
                "file": str(g.file),
                "rules": g.rules,
                "referenced_files": [str(f) for f in g.referenced_files],
                "referenced_commands": g.referenced_commands,
                "authority_level": g.authority_level,
            }
            for g in metadata.governance
        ],
        "design": [
            {
                "file": str(d.file),
                "design_decisions": d.design_decisions,
                "referenced_contracts": [str(c) for c in d.referenced_contracts],
            }
            for d in metadata.design
        ],
        "document_audit_findings": [
            {
                "kind": f.kind,
                "file": str(f.file),
                "evidence_kind": f.evidence_kind,
                "detail": f.detail,
                "debt_kind": f.debt_kind,
            }
            for f in metadata.document_audit_findings
        ],
        "last_commit": metadata.last_commit,
        "modified_files": [str(f) for f in metadata.modified_files],
        "test_status": metadata.test_status,
    }

    # Output
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump(output_data, f, indent=2)
        print(f"Metadata written to {args.output}", file=sys.stderr)
    else:
        print(json.dumps(output_data, indent=2))


if __name__ == "__main__":
    main()

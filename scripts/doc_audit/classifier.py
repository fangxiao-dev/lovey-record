from scripts.doc_audit.models import AuditInput, CandidateIssue, Finding

_VALID_KINDS = {"stale", "orphan", "misplaced", "debt"}


def _classify_one(issue: CandidateIssue) -> Finding:
    kind = issue.kind_hint if issue.kind_hint in _VALID_KINDS else "debt"
    return Finding(
        kind=kind,
        file=issue.file,
        evidence_kind=issue.evidence_kind,
        detail=issue.detail,
        suggested_replacement=issue.suggested_replacement,
        debt_kind=issue.debt_kind,
    )


def classify_findings(audit_input: AuditInput) -> list[Finding]:
    return [_classify_one(issue) for issue in audit_input.candidate_issues]

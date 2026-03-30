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


@dataclass
class VerificationResult:
    ok: bool
    evidence_kind: str
    detail: str

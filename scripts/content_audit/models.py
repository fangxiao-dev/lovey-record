from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional


@dataclass
class PlanMetadata:
    """Metadata extracted from a plan document"""
    file: Path
    last_modified_date: Optional[str] = None  # YYYY-MM-DD from filename or document
    status_markers: dict = field(default_factory=dict)  # {"complete": 3, "in_progress": 2, "blocked": 0}
    has_remaining_section: bool = False
    sections: list[str] = field(default_factory=list)  # ["Current state", "Remaining items", etc.]
    plan_type: str = "unknown"  # "long_term" or "short_term"


@dataclass
class GovernanceMetadata:
    """Metadata extracted from a governance document"""
    file: Path
    rules: list[dict] = field(default_factory=list)  # [{"name": "rule1", "date": "2026-03-20"}, ...]
    referenced_files: list[Path] = field(default_factory=list)
    referenced_commands: list[str] = field(default_factory=list)
    authority_level: str = "high"  # high, medium, low


@dataclass
class DesignMetadata:
    """Metadata extracted from a design document"""
    file: Path
    referenced_components: list[str] = field(default_factory=list)
    design_decisions: list[dict] = field(default_factory=list)  # [{"title": "...", "date": "..."}, ...]
    referenced_contracts: list[Path] = field(default_factory=list)


@dataclass
class DocumentAuditFinding:
    """Represents a finding from Document Audit"""
    kind: str  # "stale", "orphan", "misplaced", "debt"
    file: Path
    evidence_kind: str  # "observed" or "verified"
    detail: str
    debt_kind: Optional[str] = None  # "future-risk" or "non-blocking"


@dataclass
class ContentAuditMetadata:
    """Complete metadata collection for content audit analysis"""
    plans: list[PlanMetadata] = field(default_factory=list)
    governance: list[GovernanceMetadata] = field(default_factory=list)
    design: list[DesignMetadata] = field(default_factory=list)
    document_audit_findings: list[DocumentAuditFinding] = field(default_factory=list)
    last_commit: Optional[str] = None
    modified_files: list[Path] = field(default_factory=list)
    test_status: str = "unknown"  # "passing", "failing", "unknown"

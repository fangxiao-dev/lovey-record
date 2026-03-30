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

    def test_marks_valid_content_wrong_location_as_misplaced(self) -> None:
        issue = CandidateIssue(
            file=Path("docs/plans/old-done-plan.md"),
            kind_hint="misplaced",
            evidence_kind="observed",
            detail="plan is completed but still in active plans directory",
        )
        result = classify_findings(AuditInput(candidate_issues=[issue]))
        self.assertEqual(result[0].kind, "misplaced")

    def test_marks_unresolvable_problem_as_debt(self) -> None:
        issue = CandidateIssue(
            file=Path("docs/legacy.md"),
            kind_hint="debt",
            evidence_kind="observed",
            detail="prototype-safe but production-risky",
            debt_kind="future-risk",
        )
        result = classify_findings(AuditInput(candidate_issues=[issue]))
        self.assertEqual(result[0].kind, "debt")

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

    def test_keeps_non_blocking_debt_kind(self) -> None:
        issue = CandidateIssue(
            file=Path("docs/incomplete.md"),
            kind_hint="debt",
            evidence_kind="observed",
            detail="incomplete but not blocking",
            debt_kind="non-blocking",
        )
        result = classify_findings(AuditInput(candidate_issues=[issue]))
        self.assertEqual(result[0].debt_kind, "non-blocking")

    def test_preserves_evidence_kind_on_finding(self) -> None:
        issue = CandidateIssue(
            file=Path("docs/a.md"),
            kind_hint="stale",
            evidence_kind="verified",
            detail="verified mismatch",
            suggested_replacement="fixed text",
        )
        result = classify_findings(AuditInput(candidate_issues=[issue]))
        self.assertEqual(result[0].evidence_kind, "verified")

    def test_multiple_issues_are_all_classified(self) -> None:
        issues = [
            CandidateIssue(file=Path("a.md"), kind_hint="orphan", evidence_kind="observed", detail="orphan"),
            CandidateIssue(file=Path("b.md"), kind_hint="stale", evidence_kind="verified", detail="stale",
                           suggested_replacement="fix"),
        ]
        result = classify_findings(AuditInput(candidate_issues=issues))
        self.assertEqual(len(result), 2)
        self.assertEqual({f.kind for f in result}, {"orphan", "stale"})

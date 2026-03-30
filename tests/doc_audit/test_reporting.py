import tempfile
import unittest
from pathlib import Path

from scripts.doc_audit.models import Finding
from scripts.doc_audit.reporting import write_report, write_patch


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
            report_path = write_report(output_dir, findings, ["AGENTS.md"], mode="daily")
            self.assertTrue(report_path.exists())
            text = report_path.read_text(encoding="utf-8")
            self.assertIn("Document Audit Report", text)
            self.assertIn("stale", text)
            self.assertIn("docs/README.md", text)

    def test_write_report_includes_all_finding_kinds(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            output_dir = Path(tmp)
            findings = [
                Finding(kind="stale", file=Path("a.md"), evidence_kind="verified",
                        detail="x", suggested_replacement="y"),
                Finding(kind="orphan", file=Path("b.md"), evidence_kind="observed", detail="unreachable"),
                Finding(kind="misplaced", file=Path("c.md"), evidence_kind="observed",
                        detail="wrong dir"),
                Finding(kind="debt", file=Path("d.md"), evidence_kind="observed",
                        detail="risky", debt_kind="future-risk"),
            ]
            report_path = write_report(output_dir, findings, [], mode="daily")
            text = report_path.read_text(encoding="utf-8")
            for section in ("Stale", "Orphan", "Misplaced", "Debt"):
                self.assertIn(section, text)

    def test_write_patch_only_emits_stale_findings(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            output_dir = Path(tmp)
            findings = [
                Finding(kind="stale", file=Path("docs/README.md"), evidence_kind="verified",
                        detail="x", suggested_replacement="y"),
                Finding(kind="debt", file=Path("docs/legacy.md"), evidence_kind="observed", detail="risk"),
            ]
            patch_path = write_patch(output_dir, findings)
            patch_text = patch_path.read_text(encoding="utf-8")
            self.assertIn("docs/README.md", patch_text)
            self.assertNotIn("docs/legacy.md", patch_text)

    def test_write_patch_excludes_stale_without_replacement(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            output_dir = Path(tmp)
            findings = [
                Finding(kind="stale", file=Path("docs/a.md"), evidence_kind="verified",
                        detail="x", suggested_replacement=None),
            ]
            patch_path = write_patch(output_dir, findings)
            patch_text = patch_path.read_text(encoding="utf-8")
            self.assertNotIn("docs/a.md", patch_text)

    def test_write_report_init_mode_includes_initialization_section(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            output_dir = Path(tmp)
            report_path = write_report(output_dir, [], [], mode="init")
            text = report_path.read_text(encoding="utf-8")
            self.assertIn("initialization", text.lower())

import subprocess
import unittest
from datetime import date
from pathlib import Path


class InitModeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        repo_root = Path.cwd()
        result = subprocess.run(
            ["python", "scripts/run_doc_audit.py", "--mode", "init"],
            cwd=repo_root,
            capture_output=True,
            text=True,
            check=False,
        )
        cls.returncode = result.returncode
        cls.stdout = result.stdout
        today = date.today().isoformat()
        cls.report_path = repo_root / "docs" / "generated" / "doc-audit" / today / "latest-report.md"

    def test_init_mode_exits_zero(self) -> None:
        self.assertEqual(self.returncode, 0, self.stdout)

    def test_init_mode_report_exists(self) -> None:
        self.assertTrue(self.report_path.exists())

    def test_init_mode_report_mentions_initialization(self) -> None:
        text = self.report_path.read_text(encoding="utf-8")
        self.assertIn("initialization", text.lower())

    def test_init_mode_report_has_summary_section(self) -> None:
        text = self.report_path.read_text(encoding="utf-8")
        self.assertIn("## Summary", text)

    def test_init_mode_report_has_findings_section(self) -> None:
        text = self.report_path.read_text(encoding="utf-8")
        self.assertIn("## Findings", text)

    def test_init_mode_detects_orphan_docs(self) -> None:
        # There are markdown files in docs/ not reachable from entrypoints — at least some orphans expected.
        text = self.report_path.read_text(encoding="utf-8")
        self.assertIn("orphan", text.lower())

    def test_patch_file_exists(self) -> None:
        patch_path = self.report_path.parent / "latest.patch"
        self.assertTrue(patch_path.exists())

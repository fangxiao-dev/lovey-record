import tempfile
import unittest
from pathlib import Path

from scripts.doc_audit.verification import verify_path_exists, verify_command_runs


class VerificationTests(unittest.TestCase):
    def test_verify_path_exists_returns_verified_when_file_exists(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            file_path = Path(tmp) / "README.md"
            file_path.write_text("# ok\n", encoding="utf-8")
            result = verify_path_exists(file_path)
            self.assertEqual(result.evidence_kind, "verified")
            self.assertTrue(result.ok)

    def test_verify_path_exists_returns_verified_false_when_missing(self) -> None:
        result = verify_path_exists(Path("/nonexistent/path/file.md"))
        self.assertEqual(result.evidence_kind, "verified")
        self.assertFalse(result.ok)

    def test_verify_command_runs_marks_success_as_verified(self) -> None:
        result = verify_command_runs(["python", "-c", "print('ok')"], Path.cwd())
        self.assertEqual(result.evidence_kind, "verified")
        self.assertTrue(result.ok)

    def test_verify_command_runs_marks_failure_as_verified_false(self) -> None:
        result = verify_command_runs(["python", "-c", "raise SystemExit(1)"], Path.cwd())
        self.assertEqual(result.evidence_kind, "verified")
        self.assertFalse(result.ok)

    def test_verify_release_gate_test_files_all_exist(self) -> None:
        from scripts.doc_audit.verification import verify_release_gate_test_files
        results = verify_release_gate_test_files(Path.cwd())
        self.assertTrue(len(results) > 0)
        for path, result in results:
            self.assertEqual(result.evidence_kind, "verified")
            self.assertTrue(result.ok, f"release-gate referenced file missing: {path}")

    def test_verify_unit_test_commands_pass(self) -> None:
        from scripts.doc_audit.verification import verify_unit_test_commands
        results = verify_unit_test_commands(Path.cwd())
        self.assertTrue(len(results) > 0)
        for label, result in results:
            if result.evidence_kind == "observed":
                # Runtime not available in this environment — skip is acceptable.
                continue
            self.assertEqual(result.evidence_kind, "verified")
            self.assertTrue(result.ok, f"unit test command failed: {label}\n{result.detail}")

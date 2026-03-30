import shutil
import subprocess
import sys
from pathlib import Path

from scripts.doc_audit.models import VerificationResult

# Test files referenced in docs/governance/release-gate.md automated gate.
# Update this list when the release gate commands change.
_RELEASE_GATE_TEST_FILES = (
    "backend/tests/services/phase5.service.test.ts",
    "backend/tests/services/query.service.test.ts",
    "frontend/services/menstrual/__tests__/module-shell-service.test.mjs",
    "frontend/services/menstrual/__tests__/module-shell-command-service.test.mjs",
    "frontend/services/menstrual/__tests__/home-contract-service.test.mjs",
    "frontend/components/menstrual/__tests__/batch-selection-contract.test.mjs",
    "frontend/components/menstrual/__tests__/calendar-grid-h5-long-press.test.mjs",
    "frontend/scripts/menstrual-home-batch-live-regression.spec.mjs",
)

# Unit test commands that are cheap enough for daily CI (no dev server required).
# Each entry is (label, command, cwd_relative_to_repo_root).
_UNIT_TEST_COMMANDS = (
    (
        "backend: phase5 + query service tests",
        ["npm", "test", "--", "--runInBand",
         "tests/services/phase5.service.test.ts",
         "tests/services/query.service.test.ts"],
        "backend",
    ),
    (
        "frontend: menstrual unit tests",
        ["node", "--test",
         "frontend/services/menstrual/__tests__/module-shell-service.test.mjs",
         "frontend/services/menstrual/__tests__/module-shell-command-service.test.mjs",
         "frontend/services/menstrual/__tests__/home-contract-service.test.mjs",
         "frontend/components/menstrual/__tests__/batch-selection-contract.test.mjs",
         "frontend/components/menstrual/__tests__/calendar-grid-h5-long-press.test.mjs"],
        ".",
    ),
)


def verify_path_exists(path: Path) -> VerificationResult:
    exists = path.exists()
    return VerificationResult(
        ok=exists,
        evidence_kind="verified",
        detail=f"path {'exists' if exists else 'missing'}: {path}",
    )


def _resolve_command(command: list[str]) -> list[str]:
    """On Windows, resolve bare executables (e.g. 'npm' -> 'npm.cmd') via PATH."""
    if sys.platform != "win32" or not command:
        return command
    exe = shutil.which(command[0])
    if exe:
        return [exe] + command[1:]
    return command


def verify_command_runs(command: list[str], cwd: Path) -> VerificationResult:
    try:
        result = subprocess.run(
            _resolve_command(command),
            cwd=str(cwd),
            capture_output=True,
            text=True,
            check=False,
        )
        ok = result.returncode == 0
        detail = (result.stdout + result.stderr).strip()[-400:] if not ok else "exit 0"
        return VerificationResult(ok=ok, evidence_kind="verified", detail=detail)
    except FileNotFoundError as exc:
        return VerificationResult(ok=False, evidence_kind="verified", detail=str(exc))


def verify_release_gate_test_files(
    repo_root: Path,
) -> list[tuple[Path, VerificationResult]]:
    """Check that every test file referenced in the release gate still exists."""
    results = []
    for rel in _RELEASE_GATE_TEST_FILES:
        path = repo_root / rel
        results.append((path, verify_path_exists(path)))
    return results


def verify_unit_test_commands(
    repo_root: Path,
) -> list[tuple[str, VerificationResult]]:
    """Run the cheap unit test commands from the release gate and return results.

    If the runtime (e.g. npm/node) is not available in the current environment
    the entry is skipped with evidence_kind='observed' so doc-audit CI does not
    fail just because Node dependencies are not installed.
    """
    results = []
    for label, command, cwd_rel in _UNIT_TEST_COMMANDS:
        exe = shutil.which(_resolve_command(command)[0])
        if exe is None:
            results.append((label, VerificationResult(
                ok=True,
                evidence_kind="observed",
                detail=f"skipped: '{command[0]}' not found in PATH",
            )))
            continue
        cwd = repo_root if cwd_rel == "." else repo_root / cwd_rel
        results.append((label, verify_command_runs(command, cwd)))
    return results

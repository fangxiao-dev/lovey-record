import unittest
from pathlib import Path

from scripts.doc_audit.entrypoints import get_phase_one_entrypoints


class EntrypointTests(unittest.TestCase):
    def test_phase_one_entrypoints_are_repo_relative_paths(self) -> None:
        repo_root = Path.cwd()
        entrypoints = get_phase_one_entrypoints(repo_root)

        self.assertIn(repo_root / "AGENTS.md", entrypoints)
        self.assertIn(repo_root / "docs" / "README.md", entrypoints)
        self.assertIn(repo_root / "backend" / "AGENTS.md", entrypoints)

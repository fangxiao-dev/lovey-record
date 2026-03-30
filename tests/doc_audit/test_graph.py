import tempfile
import unittest
from pathlib import Path

from scripts.doc_audit.graph import resolve_reachable_markdown


class GraphTests(unittest.TestCase):
    def test_resolve_reachable_markdown_follows_local_markdown_links(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "README.md").write_text("[Docs](docs/README.md)\n", encoding="utf-8")
            (root / "docs").mkdir()
            (root / "docs" / "README.md").write_text("[Plan](../plans/next.md)\n", encoding="utf-8")
            (root / "plans").mkdir()
            (root / "plans" / "next.md").write_text("# next\n", encoding="utf-8")

            reachable = resolve_reachable_markdown(root, [root / "README.md"])

            self.assertIn(root / "README.md", reachable)
            self.assertIn(root / "docs" / "README.md", reachable)
            self.assertIn(root / "plans" / "next.md", reachable)

    def test_resolve_reachable_markdown_ignores_external_urls(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "README.md").write_text(
                "[External](https://example.com) [Local](local.md)\n",
                encoding="utf-8",
            )
            (root / "local.md").write_text("# local\n", encoding="utf-8")

            reachable = resolve_reachable_markdown(root, [root / "README.md"])

            self.assertIn(root / "local.md", reachable)
            self.assertNotIn(root / "https:", reachable)

    def test_resolve_reachable_markdown_does_not_revisit_seen_files(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "a.md").write_text("[B](b.md)\n", encoding="utf-8")
            (root / "b.md").write_text("[A](a.md)\n", encoding="utf-8")

            reachable = resolve_reachable_markdown(root, [root / "a.md"])

            self.assertEqual(reachable, {root / "a.md", root / "b.md"})

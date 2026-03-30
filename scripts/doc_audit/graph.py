from collections import deque
from pathlib import Path
import re

# Matches Markdown links: [text](target) — captures the target
LINK_RE = re.compile(r"\[[^\]]*\]\(([^)]+)\)")


def _extract_local_markdown_links(content: str, source_file: Path) -> list[Path]:
    """Return absolute paths for all local .md links found in content."""
    links = []
    for match in LINK_RE.finditer(content):
        target = match.group(1).strip()
        # Skip external URLs
        if target.startswith(("http://", "https://", "mailto:")):
            continue
        # Strip URL fragments and query strings
        target = target.split("#")[0].split("?")[0].strip()
        if not target:
            continue
        # Only follow markdown files
        if not target.lower().endswith(".md"):
            continue
        resolved = (source_file.parent / target).resolve()
        links.append(resolved)
    return links


def resolve_reachable_markdown(repo_root: Path, entrypoints: list[Path]) -> set[Path]:
    """BFS from entrypoints; return the set of reachable markdown files."""
    queue: deque[Path] = deque()
    seen: set[Path] = set()

    for path in entrypoints:
        resolved = path.resolve()
        if resolved.exists() and resolved not in seen:
            seen.add(resolved)
            queue.append(resolved)

    while queue:
        current = queue.popleft()
        try:
            content = current.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue
        for link in _extract_local_markdown_links(content, current):
            if link not in seen and link.exists():
                seen.add(link)
                queue.append(link)

    return seen


def enumerate_scope_markdown(repo_root: Path) -> set[Path]:
    """Return all .md files within the phase-one scan scope."""
    scope: set[Path] = set()
    # Root-level key markdown files
    for md in repo_root.glob("*.md"):
        scope.add(md.resolve())
    # All markdown under docs/
    for md in (repo_root / "docs").rglob("*.md"):
        scope.add(md.resolve())
    # Scoped AGENTS files
    for subdir in ("backend", "frontend"):
        agents = repo_root / subdir / "AGENTS.md"
        if agents.exists():
            scope.add(agents.resolve())
    return scope

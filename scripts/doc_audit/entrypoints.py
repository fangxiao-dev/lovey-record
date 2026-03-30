from pathlib import Path


PHASE_ONE_ENTRYPOINTS = (
    "AGENTS.md",
    "README.md",
    "project-context.md",
    "docs/README.md",
    "docs/contracts/README.md",
    "docs/governance/doc-audit-policy.md",
    "backend/AGENTS.md",
    "frontend/AGENTS.md",
)


def get_phase_one_entrypoints(repo_root: Path) -> list[Path]:
    return [repo_root / rel_path for rel_path in PHASE_ONE_ENTRYPOINTS]

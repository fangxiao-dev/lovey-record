# AGENTS.md

## Design (General)

### Project Introduction
- This repository is the active monorepo for a relationship record product whose first MVP module is menstrual tracking.
- It contains the uni-app frontend, the backend service layer, and the shared design/product contracts used to keep both sides aligned.
- Use `project-context.md`, `docs/plans/`, and `docs/contracts/` as the project background and contract baseline.
- Legacy/reference repo: Only use `D:\CodeSpace\love-recorder` as a legacy/reference repo. Do not copy legacy implementation structure directly into this repo.
### Core Reading Order
1. Read [docs/plans](D:\CodeSpace\hbuilder-projects\lovey-record-backend\docs\plans) if you need the latest relevant plan.
2. Read the latest relevant contract under [docs/contracts](D:\CodeSpace\hbuilder-projects\lovey-record-backend\docs\contracts) when the task affects product rules, domain meaning, or frontend-backend alignment.
3. Read [docs/README.md](D:\CodeSpace\hbuilder-projects\lovey-record-backend\docs\README.md) when the task depends on design references, checklists, migration notes, or document navigation, etc.
4. Read [project-context.md](D:\CodeSpace\hbuilder-projects\lovey-record-backend\project-context.md) if you need background understanding.

### Navigation
- **Frontend work: MUST read [Frontend-Specific Guidance](#frontend-specific-guidance)**.
- **Backend work: MUST read [Backend Guidance](#backend-guidance)**.
- General Design and Pencil workflow: read [docs/design/pencil/README.md](D:\CodeSpace\hbuilder-projects\lovey-record-backend\docs\design\pencil\README.md).
- UI collaboration lessons and Pencil-to-code verification rules: read [docs/design/2026-03-28-ui-collaboration-lessons.md](D:\CodeSpace\hbuilder-projects\lovey-record-backend\docs\design\2026-03-28-ui-collaboration-lessons.md).
- Feature-level interaction contracts: read the relevant `function-*.md` under `docs/design/<module>/`. These are authoritative UX contracts that take precedence over Pencil when they disagree.

### Product And Contract Direction
- Treat the menstrual module as the first fully realized MVP module inside a broader relationship-record product.
- Keep durable product semantics in `docs/contracts/`, and treat `docs/plans/` as execution and rollout guidance.
- If you need the current backend/frontend shared model, read the latest domain model and application contract under `docs/contracts/`.

### Workflow
- Before substantial work, inspect repo state and read the relevant plan and contract docs first.
- Update `docs/contracts/` when durable product behavior, domain meaning, or frontend-backend boundaries change.
- Update `docs/plans/` when rollout, sequencing, page structure, or implementation scope changes.
- Update `docs/design/<module>/function-*.md` when a feature-level interaction contract is created or changed. These are the authoritative UX source of truth for that feature.
- Update `project-context.md` when project role, milestone, or core repo constraints change.
- Prefer making cross-layer alignment explicit in documents before implementation when the change would otherwise create ambiguity.
- For frontend/UI work that needs web-end validation, do an initial pass with Playwright MCP yourself first, then ask the user to verify only after the initial runtime check is clean.
- Once the goal is clear, continue execution without stopping after each small batch to ask for confirmation.
- The default execution loop is:
  1. investigate by reading docs/code and using tools when needed to verify facts
  2. create and maintain a temporary working plan that includes goal, detailed steps, acceptance criteria, and current step status
  3. implement code changes
  4. add tests and run verification
  5. update the temporary working plan
  6. continue to the next gap until a stop condition is reached
- Do not pause for user confirmation between these steps unless a real stop condition is hit.
- Stop and ask the user only in these cases:
  - a product semantic or tradeoff decision requires user judgment
  - an unblockable issue remains, such as environment limits, permission limits, external dependency failure, or conflicting requirements
- When finishing a task, include two short closing statements:
  - current mainline progress
  - next-step recommendation
- `Current mainline progress` must describe the higher-level mainline objective and what stage it has reached, not just the most recent subtask that was completed.
- Prefer framing `Current mainline progress` around the active product or delivery line, such as frontend-backend integration, contract alignment, runtime acceptance readiness, or rollout stage.
- Use `Next-step recommendation` for the next concrete subtask, cleanup item, semantic decision, or rollout action that should follow from the current mainline stage.
- Example:
  - `Current mainline progress: menstrual/home 的前后端联调主链已经打通，正式页所需的单日读写、note、batch edit、live-first 加载与页面级 live 验收都已进入可闭环状态。`
  - `Next-step recommendation: 收口 clear-record 的最终产品语义，并把本轮 live-only 验收沉淀成固定回归清单或脚本。`

### Development Environment & Git Worktrees

When using git worktrees for parallel development:

**Worktree Setup:**
- After creating a new worktree, run `./setup.ps1` from the worktree root to automatically copy `.env` files from the parent repository
- This ensures the worktree has required configuration without manually copying files
- The script handles both `backend/.env` and `frontend/.env*` files
- Example: 
  ```powershell
  cd .claude/worktrees/your-worktree/
  ./setup.ps1
  ```

**Local Development Workflow:**
- Develop on a feature branch in the worktree (no push to remote required)
- Commit changes locally in the worktree
- Merge the worktree branch to the local master in the parent repository: `git merge <worktree-branch>`
- Keep the remote clean - only push when ready for external sharing/review

---

## Frontend-Specific Guidance

- `frontend/` is the active uni-app Vue 3 client implementation.
- Read [frontend/AGENTS.md](D:\CodeSpace\hbuilder-projects\lovey-record-backend\frontend\AGENTS.md) before changing frontend pages, components, styles, or verification flow.
- The frontend should consume backend-aligned contracts without redefining domain semantics locally.
- Frontend-specific implementation, styling, and verification rules live in `frontend/AGENTS.md`.

---
## Backend Guidance

### Backend Scope
- `backend/` contains the backend runtime, persistence, tests, and backend-local operational documentation.
- Backend-specific implementation rules are intentionally kept out of this root file to avoid duplication and drift.

### Backend Entry Point
- Read [backend/AGENTS.md](D:\CodeSpace\hbuilder-projects\lovey-record-backend\backend\AGENTS.md) before changing backend routes, controllers, services, tests, Prisma schema, or backend-local docs.
- Use the backend file for:
  - backend reading order
  - command/query contract alignment rules
  - service/controller/route layering rules
  - Prisma and persistence guidance
  - backend verification expectations

### Backend Root-Level Constraint
- Frontend-backend alignment must be managed through `docs/contracts/application-contracts/` before backend API changes are treated as stable.

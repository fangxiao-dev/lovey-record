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

### Product And Contract Direction
- Treat the menstrual module as the first fully realized MVP module inside a broader relationship-record product.
- Keep durable product semantics in `docs/contracts/`, and treat `docs/plans/` as execution and rollout guidance.
- If you need the current backend/frontend shared model, read the latest domain model and application contract under `docs/contracts/`.

### Workflow
- Before substantial work, inspect repo state and read the relevant plan and contract docs first.
- Update `docs/contracts/` when durable product behavior, domain meaning, or frontend-backend boundaries change.
- Update `docs/plans/` when rollout, sequencing, page structure, or implementation scope changes.
- Update `project-context.md` when project role, milestone, or core repo constraints change.
- Prefer making cross-layer alignment explicit in documents before implementation when the change would otherwise create ambiguity.
- For frontend/UI work that needs web-end validation, do an initial pass with Playwright MCP yourself first, then ask the user to verify only after the initial runtime check is clean.
- When finishing a task, include two short closing statements:
  - current mainline progress
  - next-step recommendation
- Example:
  - `Current mainline progress: backend contract surface and backend docs are now aligned to the runtime baseline.`
  - `Next-step recommendation: continue with seed/mock data, starting from getModuleHomeView, getDayRecordDetail, and getModuleSettings.`

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

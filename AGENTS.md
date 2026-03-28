# AGENTS.md

## Design (General)

### Project Introduction
- This repository is the active monorepo for a relationship record product whose first MVP module is menstrual tracking.
- It contains the uni-app frontend, the backend service layer, and the shared design/product contracts used to keep both sides aligned.
- Use `project-context.md`, `docs/plans/`, and `docs/contracts/` as the project background and contract baseline.

### Core Reading Order
1. Read [docs/plans](D:\CodeSpace\hbuilder-projects\lovey-record-backend\docs\plans) if you need the latest relevant plan.
2. Read the latest relevant contract under [docs/contracts](D:\CodeSpace\hbuilder-projects\lovey-record-backend\docs\contracts) when the task affects product rules, domain meaning, or frontend-backend alignment.
3. Read [docs/README.md](D:\CodeSpace\hbuilder-projects\lovey-record-backend\docs\README.md) when the task depends on design references, checklists, migration notes, or document navigation, etc.
4. Read [project-context.md](D:\CodeSpace\hbuilder-projects\lovey-record-backend\project-context.md) if you need background understanding.

### Navigation
- Frontend work: read [frontend/AGENTS.md](D:\CodeSpace\hbuilder-projects\lovey-record-backend\frontend\AGENTS.md).
- Backend work: read [backend/AGENTS.md](D:\CodeSpace\hbuilder-projects\lovey-record-backend\backend\AGENTS.md).
- Design and Pencil workflow: read [docs/design/pencil/README.md](D:\CodeSpace\hbuilder-projects\lovey-record-backend\docs\design\pencil\README.md).

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
- When finishing a task, include two short closing statements:
  - current mainline progress
  - next-step recommendation
- Example:
  - `Current mainline progress: backend contract surface and backend docs are now aligned to the runtime baseline.`
  - `Next-step recommendation: continue with seed/mock data, starting from getModuleHomeView, getDayRecordDetail, and getModuleSettings.`

### Legacy Reference Boundary
- Only use `D:\CodeSpace\love-recorder` as the valid legacy/reference repo.
- Do not copy legacy implementation structure directly into this repo.

---

## Frontend-Specific Guidance

### Frontend Role
- `frontend/` is the active uni-app Vue 3 client implementation.
- The frontend should consume backend-aligned contracts without redefining domain semantics locally.

### Frontend Reading Order
1. Read the general section above first.
2. Read [docs/design/2026-03-23-ui-visual-language-guide.md](D:\CodeSpace\hbuilder-projects\lovey-record-backend\docs\design\2026-03-23-ui-visual-language-guide.md) before changing visual tone, color semantics, component styling, or token presentation.
3. Read [docs/design/2026-03-22-tokenize-collaboration-rule.md](D:\CodeSpace\hbuilder-projects\lovey-record-backend\docs\design\2026-03-22-tokenize-collaboration-rule.md) before changing tokens, component-library styling, or page-level visual composition.
4. Read [docs/design/pencil/README.md](D:\CodeSpace\hbuilder-projects\lovey-record-backend\docs\design\pencil\README.md) before editing `.pen` files or using Pencil MCP tools.
5. Read `tech-stack-investigate.md` only if you need technical details on the frontend stack or styling/runtime assumptions.

### Frontend Architecture And Boundaries
- Frontend is a uni-app Vue 3 app, not a standard Vue Router SPA.
- All frontend pages must be registered in `frontend/pages.json`.
- Use uni-app navigation and uni APIs where applicable.
- Avoid browser-only APIs and direct DOM access unless clearly limited to H5.
- Prefer reusable components and tokenized styling over page-local duplication.
- Keep the visual pipeline one-way: design token -> component library -> business page composition.
- Do not copy legacy page code directly into uni-app files.

### Frontend Implementation Expectations
- Prefer uni-app-compatible Vue 3 SFCs.
- Prefer semantic tokens over hard-coded values.
- Keep repeated UI blocks componentized.
- Keep presentational components as dumb as practical.
- Separate business logic and pure UI where practical.
- Prefer mobile-friendly sizing and use `rpx` where appropriate for page-level UI.
- Use conditional compilation only when necessary.

### Frontend Testing And Verification Expectations
- Verify that every new frontend page is registered in `frontend/pages.json`.
- Verify that shared frontend code does not depend on obvious browser-only APIs.
- Call out any H5 versus WeChat Mini Program caveats that remain unverified.
- Treat manual runtime verification as required for navigation, layout, and platform-specific UI behavior.
- Do not claim completion without stating what was verified and what remains unverified.

### Frontend Definition Of Done
- Code structure is consistent with uni-app Vue 3 conventions.
- No obvious browser-only logic appears in shared code.
- New frontend pages are registered in `frontend/pages.json`.
- Styling uses tokenized values where possible.
- Repeated UI patterns are componentized or intentionally prepared for extraction.
- Any remaining platform caveats or verification gaps are stated explicitly.

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

# AGENTS.md

## Project Introduction
- Project purpose: build the active mainline uni-app Vue 3 implementation of a relationship record product whose first MVP module is menstrual tracking
- Primary users: builders working on the uni-app mainline, plus future agents that need to keep product intent, sharing constraints, and design-system direction aligned
- Current milestone: extend the runnable uni-app prototype from its current module-space shell toward a clearer menstrual-module MVP flow
- Contract baseline: use `project-context.md`, `tech-stack-investigate.md`, the approved docs under `docs/plans/`, and the long-lived contracts under `docs/contracts/` as the project contract

## Reading Order
1. Read [project-context.md](D:\CodeSpace\hbuilder-projects\lovey-record\project-context.md).
2. Read the latest relevant design or implementation plan under [docs/plans](D:\CodeSpace\hbuilder-projects\lovey-record\docs\plans).
3. Read the latest relevant use case, domain model, or application contract under [docs/contracts](D:\CodeSpace\hbuilder-projects\lovey-record\docs\contracts) when the task affects product rules, domain boundaries, or frontend-backend alignment.
4. Read [docs/README.md](D:\CodeSpace\hbuilder-projects\lovey-record\docs\README.md) when the task depends on design references, checklists, or copied migration notes.
5. Read [docs/design/2026-03-23-ui-visual-language-guide.md](D:\CodeSpace\hbuilder-projects\lovey-record\docs\design\2026-03-23-ui-visual-language-guide.md) before changing visual tone, color semantics, component styling, or token presentation.
6. Read [docs/design/2026-03-22-tokenize-collaboration-rule.md](D:\CodeSpace\hbuilder-projects\lovey-record\docs\design\2026-03-22-tokenize-collaboration-rule.md) before changing token, component-library, or page-level visual design.
7. Read [docs/design/pencil/README.md](D:\CodeSpace\hbuilder-projects\lovey-record\docs\design\pencil\README.md) before editing `.pen` files or using Pencil MCP tools.
8. Inspect the legacy reference repo only after the document contract is clear.
9. Read [tech-stack-investigate.md](D:\CodeSpace\hbuilder-projects\lovey-record\tech-stack-investigate.md) only if you need details on the tech stack.
## Architecture Snapshot
- Main directories:
  - `pages/`
  - `components/` when shared UI appears
  - `styles/tokens/`
  - `styles/foundation/`
  - `utils/` for reusable pure logic and wrappers when needed
  - `docs/`
- Documentation structure:
  - `docs/plans/` stores stage-specific design docs, implementation plans, migration inventories, and handoff material
- `docs/contracts/` stores long-lived use cases, domain models, and application contracts that should outlive a single implementation phase
- `docs/design/` stores visual and interaction design contracts
- `docs/design/pencil/` stores long-lived Pencil workflow and recovery references for `.pen` collaboration
- Core runtime rules:
  - this is a uni-app Vue 3 app, not a standard Vue Router web app
  - all pages must be registered in `pages.json`
  - use uni-app navigation and uni-app APIs where applicable
  - avoid browser-only APIs and direct DOM access unless clearly limited to H5
- Styling structure:
  - `uni.scss` bridges project tokens into uni compatibility variables
  - `styles/tokens/` defines primitive and semantic tokens
  - `styles/foundation/` provides shared base, pattern, mixin, and utility layers

## Architectural Boundaries
- Treat the menstrual module as the first fully realized MVP module in this repo.
- Preserve the distinction between a user-owned module instance and a shared space.
- Model sharing as access to the same instance, never as duplicated data.
- Do not treat this repo as a legacy/reference-only repo.
- Do not treat this repo as a normal Vue Router SPA.
- Do not copy legacy page code directly into uni-app pages.
- Prefer reusable components and tokenized styling over page-local duplication.

## Workflow
- Simple tasks may execute directly once the existing contract is clear.
- Before substantial work, inspect repo state and the relevant contract docs.
- For complex tasks, page restructures, information architecture changes, or changes to the private/shared model, create or update the relevant design or implementation plan under `docs/plans/` before implementation.
- When the task changes durable product behavior, domain meaning, or frontend-backend boundaries, create or update the relevant contract under `docs/contracts/` instead of hiding those decisions only inside a plan.
- Follow the delivery order when implementing features:
  1. summarize the plan
  2. create or update tokens if needed
  3. implement shared components first
  4. implement pages
  5. update `pages.json` if new pages are added
  6. explain key assumptions
  7. list risks or platform caveats
- For visual design work, keep the flow one-way: token definitions first, then component-library changes, then page composition.
- For visual design work, treat [docs/design/2026-03-23-ui-visual-language-guide.md](D:\CodeSpace\hbuilder-projects\lovey-record\docs\design\2026-03-23-ui-visual-language-guide.md) as the aesthetic contract and [docs/design/2026-03-22-tokenize-collaboration-rule.md](D:\CodeSpace\hbuilder-projects\lovey-record\docs\design\2026-03-22-tokenize-collaboration-rule.md) as the pipeline rule.
- When project role, scope, milestone, or core constraints change, update the root context docs instead of leaving the change implicit.

## Implementation Expectations
- Prefer uni-app-compatible Vue 3 SFCs and uni APIs.
- Prefer semantic tokens over hard-coded values.
- Keep repeated UI blocks componentized.
- Keep presentational components as dumb as practical.
- Separate business logic and pure UI where practical.
- Prefer mobile-friendly sizing and use `rpx` where appropriate for page-level UI.
- Use conditional compilation only when necessary.
- Do not introduce dependencies that rely heavily on browser DOM behavior.

## Testing And Verification Expectations
- Verify that every new page is registered in `pages.json`.
- Verify that shared code does not depend on obvious browser-only APIs.
- Call out any H5 versus WeChat Mini Program caveats that remain unverified.
- Treat manual runtime verification as required for navigation, layout, and platform-specific UI behavior.
- Do not claim completion without stating what was verified and what remains unverified.

## Legacy Reference Boundary
- Only use `D:\CodeSpace\love-recorder` as the valid legacy/reference repo.
- Do not use `D:\CodeSpace\love-record`; it is deprecated and should not inform planning or implementation.
- Prefer these kinds of legacy inputs:
  - business rules and state definitions
  - day-record and cycle-record logic
  - module-instance and sharing model constraints
  - interaction contract and information architecture
  - design and migration notes already copied under `docs/`
- Do not use these as implementation templates:
  - WXML page structure
  - WXSS styling hierarchy
  - native `Page({})` lifecycle glue
  - old page-local layout code copied into uni-app files

## Update Responsibilities
- Update [project-context.md](D:\CodeSpace\hbuilder-projects\lovey-record\project-context.md) when project purpose, repo role, scope, milestone, or constraints change.
- Update [tech-stack-investigate.md](D:\CodeSpace\hbuilder-projects\lovey-record\tech-stack-investigate.md) when the technical direction, styling architecture, state strategy, or runtime assumptions change.
- Update `docs/plans/` when a complex task changes page structure, module responsibilities, product flow, or implementation sequencing.
- Update `docs/contracts/` when core use cases, domain objects, invariants, or application contracts change.
- Keep `docs/README.md` and major handoff/reference docs aligned with the root contract when repo positioning changes.

## Definition Of Done
- Code structure is consistent with uni-app Vue 3 conventions.
- No obvious browser-only logic appears in shared code.
- New pages are registered in `pages.json`.
- Styling uses tokenized values where possible.
- Repeated UI patterns are componentized or intentionally prepared for extraction.
- Any remaining platform caveats or verification gaps are stated explicitly.

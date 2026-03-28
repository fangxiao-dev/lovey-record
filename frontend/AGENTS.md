# Frontend AGENTS

## Purpose
- Scope: `frontend/` only
- Runtime: uni-app Vue 3, WeChat Mini Program first, H5 aware where practical
- Goal: build the active menstrual-module MVP frontend on top of the approved token, component, and page contracts

## Read First
1. Read [../project-context.md](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/project-context.md).
2. Read the latest relevant plan under [../docs/plans](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/plans).
3. Read the relevant long-lived contract under [../docs/contracts](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/contracts) when the task affects product rules or frontend-backend boundaries.
4. Read [../docs/design/2026-03-23-ui-visual-language-guide.md](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/design/2026-03-23-ui-visual-language-guide.md) before changing visual tone, component styling, or semantic color usage.
5. Read [../docs/design/2026-03-22-tokenize-collaboration-rule.md](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/design/2026-03-22-tokenize-collaboration-rule.md) before changing tokens, component-library visuals, or page composition.
6. Read [../docs/design/pencil/README.md](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/design/pencil/README.md) before editing `.pen` files or using Pencil MCP tools.

## Frontend Boundaries
- Treat `frontend/` as a uni-app app, not a standard Vue Router SPA.
- Use uni-app navigation, components, and APIs where applicable.
- Register every new page in [pages.json](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/frontend/pages.json).
- Avoid browser-only APIs and direct DOM access unless clearly limited to H5.
- Prefer reusable shared components over page-local duplication.
- Keep the one-way visual pipeline:
  1. token definitions
  2. shared components
  3. page composition
- Do not copy legacy WXML/WXSS/page glue directly into uni-app files.

## Styling Structure
- [uni.scss](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/frontend/uni.scss) bridges project tokens into uni compatibility variables.
- [styles/tokens/](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/frontend/styles/tokens) defines primitive and semantic tokens.
- [styles/foundation/](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/frontend/styles/foundation) defines base, mixin, pattern, and utility layers.
- Prefer semantic tokens over hard-coded values.
- Prefer `rpx` for page-level mobile UI when it fits uni-app conventions.

## Skill Guidance
- When designing or implementing frontend components, pages, or visual states, actively use the `frontend-design` skill to keep the output intentional and non-generic.
- Use `frontend-design` together with the approved design contracts; the skill should sharpen execution, not override the repo's token-first design pipeline.

## Implementation Expectations
- Prefer uni-app-compatible Vue 3 SFCs.
- Keep presentational components as dumb as practical.
- Separate business logic, mock state, and pure UI where practical.
- Component state surfaces should map through props or small pure helpers instead of page-local style forks.
- Repeated UI patterns should be extracted or intentionally prepared for extraction.

## Verification Expectations
- Verify every new frontend page is registered in [pages.json](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/frontend/pages.json).
- Verify shared frontend code does not rely on obvious browser-only APIs.
- State what was verified and what remains unverified.
- Treat manual runtime verification as required for navigation, layout, and platform-specific behavior.
- Call out H5 versus WeChat Mini Program caveats explicitly when still unverified.
- For Pencil-derived UI work, read [../docs/design/2026-03-28-ui-collaboration-lessons.md](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/design/2026-03-28-ui-collaboration-lessons.md) and use the named Pencil node as the source of truth before touching code.
- For Pencil-driven pages, verify that the current runtime page is still the correct acceptance surface before changing code. If the latest named Pencil nodes imply a different page structure or demo baseline, re-read those nodes first and treat the old runtime output as stale until revalidated.

# Backend Docs

This directory is the backend-local entry point for frontend integration notes, runtime-facing API examples, and backend operational placeholders.

## Reading Order
1. Start with the durable product/domain contracts under [docs/contracts](D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/contracts/README.md).
2. Read [backend/AGENTS.md](D:/CodeSpace/hbuilder-projects/lovey-record-backend/backend/AGENTS.md) for backend working rules.
3. Read [openapi.json](D:/CodeSpace/hbuilder-projects/lovey-record-backend/backend/docs/openapi.json) for the machine-readable API surface used by frontend integration and contract tests.
4. Read [2026-03-28-frontend-integration-api-examples.md](D:/CodeSpace/hbuilder-projects/lovey-record-backend/backend/docs/2026-03-28-frontend-integration-api-examples.md) for the current runtime-facing request/response examples the frontend can integrate against.
5. Read [2026-03-28-frontend-integration-prep.md](D:/CodeSpace/hbuilder-projects/lovey-record-backend/backend/docs/2026-03-28-frontend-integration-prep.md) for mock-data scenarios, the `npm run db:seed` baseline, test priorities, and the placeholder for future real-DB preparation.

## Scope
- Keep backend-local docs practical and runtime-facing.
- Use `docs/contracts/` for durable product semantics.
- Use this folder for integration support, operational notes, and temporary backend-facing guidance that should not replace the product contracts.

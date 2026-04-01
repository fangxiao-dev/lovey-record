# Backend AGENTS.md

## Scope And Inheritance
- This file supplements the repo-level `AGENTS.md`; it does not replace it.
- Follow the root `AGENTS.md` first for repo-wide rules, then use this file for backend-specific guidance inside `backend/`.
- Treat this file as the working agreement for backend runtime, persistence, tests, and backend-facing documentation.

## Backend Mission
- Build and maintain the backend service layer for the menstrual MVP inside the broader relationship-record product.
- Keep the backend aligned to the active period model: `isPeriod`, `source`, anchored period segments, `ModuleSettings`, and derived `isDetailRecorded`.
- Provide a stable command/query surface for the uni-app frontend without letting transport or persistence details redefine product semantics.

## Required Reading Order
1. Read [project-context.md](D:/CodeSpace/hbuilder-projects/lovey-record-backend/project-context.md).
2. Read the relevant backend plan in [docs/plans](D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/plans), especially:
   - `2026-03-27-backend-implementation-plan.md`
   - `2026-03-27-backend-period-model-alignment-plan.md`
3. Read the active backend contracts under [docs/contracts](D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/contracts):
   - `domain-models/2026-03-23-menstrual-domain-model.md`
   - `application-contracts/2026-03-23-menstrual-application-contract-draft.md`
   - `use-cases/2026-03-23-menstrual-core-use-cases.md` when behavior or flow is affected
4. Read `backend/README.md` only as a local directory overview; if it conflicts with runtime code or contracts, prefer the contracts and the implemented source.
5. Inspect `backend/src/`, `backend/prisma/`, and `backend/tests/` before changing structure or behavior.

## Backend Architecture Snapshot
- Runtime stack:
  - Node.js 20
  - Express 4
  - TypeScript 5
  - Prisma 5
  - Jest + Supertest
- Active directories:
  - `src/routes/` defines the public command/query surface
  - `src/controllers/` translates HTTP requests into service calls
  - `src/services/` holds business rules and orchestration
  - `src/db/` contains Prisma wiring and DB access helpers
  - `prisma/` owns schema and migration assets
  - `tests/` covers service and integration behavior
  - `docs/` is backend-local documentation, not the primary product contract source

## Backend Domain Boundaries
- `DayRecord` is the primary persisted truth for daily recording.
- Anchored period segments, prediction windows, home views, and `isDetailRecorded` are derived models.
- `ModuleSettings.defaultPeriodDurationDays` is part of the active model and influences future auto-fill behavior.
- Sharing always means access to the same `ModuleInstance`; do not model sharing as copied data.
- Product semantics live in `docs/contracts/`, not inside Prisma naming or ad hoc controller logic.

## Implementation Rules
- Keep the public API surface aligned with the application contract before implementation.
- Add or rename commands and queries in `docs/contracts/application-contracts/` before exposing them from `src/routes/`.
- Keep route handlers thin:
  - routes map URLs to handlers
  - controllers validate/normalize request input and shape responses
  - services own domain behavior, recomputation, and invariants
- Do not hide domain rules inside controllers, middleware, or Prisma queries.
- Prefer explicit service functions for each command/query over generic mutation helpers.
- Keep derived model recomputation deterministic and reconstructable from persisted truth plus settings.
- Avoid introducing frontend language, UI assumptions, or view-specific shortcuts into backend domain code unless the application contract explicitly requires the read model.

## Persistence And Database Rules

### Local Development Database
- **Local DB setup**: Docker MySQL 8.4 container managed via `docker-compose.yml` in the repo root
- **Connection**: `.env` contains `DATABASE_URL=mysql://root:password@localhost:3306/lovey_record`
- **Prisma workflow for local changes**:
  1. Modify `prisma/schema.prisma`
  2. Run `npx prisma migrate dev --name <description>` to generate migration files
  3. Migration SQL files are committed to `prisma/migrations/` in git
  4. Local MySQL schema updates automatically
- **Data isolation**: Local DB is for development/testing only; never shared with cloud
- **Running locally**: `docker-compose up -d` starts the MySQL container, then `PORT=3004 npm run dev`

### Cloud Deployment Database
- **Cloud DB**: Tencent WeChat CloudRun managed MySQL instance at `10.8.108.220:3306`
- **Cloud credentials**: Environment variables in cloud console (different from local)
- **Migration path**: Dockerfile includes `RUN npx prisma migrate deploy` which applies committed migration files to cloud DB
- **Never manually edit migrations**: All schema changes must go through local `prisma migrate dev` workflow first

### General Persistence Rules
- Prisma schema must reflect the domain contract, not redefine it.
- Treat schema and migrations as backend implementation assets; durable business meaning still belongs in `docs/contracts/`.
- Before introducing a real DB dependency into a feature, make sure the command/query contract and test coverage already exist.
- When changing Prisma schema:
  - update `prisma/schema.prisma`
  - run `npx prisma migrate dev --name <description>` locally
  - verify affected tests
  - commit migration files to git
  - document any contract-visible persistence impact
- Do not add persistence-only fields that leak into public responses unless the application contract is updated first.

## Testing And Verification Expectations
- For behavior changes, prefer both:
  - service-level tests for domain rules
  - integration tests for HTTP command/query behavior
- When command/query names or payload shapes change, verify runtime routes and `docs/contracts/application-contracts/` remain aligned.
- Before claiming backend work is complete, run the narrowest meaningful verification first, then broader verification when risk warrants it.
- Standard verification commands in this directory:
  - `npm test -- --runInBand`
  - `npm run build`
  - Prisma commands when schema work is involved
- If real DB behavior is still unverified, say so explicitly.

## Documentation Update Responsibilities
- Update `docs/contracts/` when:
  - command/query names change
  - payload shapes change
  - domain invariants change
  - sharing, segment, settings, or prediction semantics change
- Update `docs/plans/` when:
  - sequencing changes
  - rollout scope changes
  - a substantial backend implementation slice needs a current execution plan
- Update `backend/docs/` when backend-local operational or API notes are useful, but do not treat backend-local docs as a substitute for product contracts.
- Update `project-context.md` only when repo role, milestone, or cross-cutting constraints change.

## Legacy Reference Boundary
- Only use `D:/CodeSpace/love-recorder` as the valid legacy/reference repo.
- Use it for business-rule confirmation, not for copying implementation structure.
- Do not copy old backend, page, or mini-program glue directly into this backend.

## Definition Of Done
- Public backend behavior matches the active application contract.
- Domain rules remain implemented in services, not scattered across transport or persistence layers.
- Tests cover the changed behavior at the appropriate level.
- `npm run build` passes for backend code changes.
- Any unverified real-DB or environment-specific behavior is called out explicitly.
- When writing closing statements for backend work, follow the root `AGENTS.md` rule: `Current mainline progress` must summarize the higher-level mainline stage, while `Next-step recommendation` should name the next concrete backend or cross-layer action.

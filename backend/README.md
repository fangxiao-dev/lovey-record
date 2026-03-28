# Backend

REST API backend for Lovey Record.

## When To Read

Read this directory when you are working on backend runtime, persistence, tests, seed fixtures, or backend-local documentation.

For backend-specific working rules, start with [AGENTS.md](./AGENTS.md).

For backend-facing integration notes and API examples, start with [docs/README.md](./docs/README.md).

## What Lives Here

- `controllers/` - request handlers
- `routes/` - HTTP route definitions
- `services/` - business logic
- `models/` - data access and domain shaping
- `middleware/` - request/response middleware
- `config/` - runtime configuration
- `prisma/` - schema and seed entrypoints
- `tests/` - backend unit, integration, and contract tests

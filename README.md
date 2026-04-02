# Lovey Record

This monorepo hosts a relationship-record product whose first MVP module is menstrual tracking.

## Start Here

1. [AGENTS.md](./AGENTS.md) - repo-level working rules and navigation.
2. [project-context.md](./project-context.md) - project purpose, scope, and current milestone.
3. [docs/README.md](./docs/README.md) - documentation entry point when you need deeper context.

## Main Areas

- `frontend/` - uni-app Vue 3 client implementation.
- `backend/` - REST API backend and backend-local docs.
- `docs/` - contracts, design guidance, plans, and design drafts.

## Current Milestone

The active mainline is moving from backend/runtime alignment into frontend integration and shared seed/mock scenarios.

## Live Regression

- Fixed H5 live regression entry: `npm run test:menstrual:live`
- One-click startup + H5 live regression: `npm run test:menstrual:live:boot`

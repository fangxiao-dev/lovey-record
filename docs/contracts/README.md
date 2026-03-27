# Contracts Index

## Purpose

This directory stores long-lived product and engineering contracts that should remain stable across implementation phases.

Use `docs/contracts/` for documents that define:

- what the product must do
- which domain concepts exist
- which invariants cannot drift
- how backend and future frontend work should align before transport or storage details are finalized

Do not use this directory for:

- one-off implementation tasks
- migration inventories
- handoff notes
- page-specific execution sequencing

Those belong under `docs/plans/`.

## Structure

- `use-cases/`: stable, UI-agnostic descriptions of user goals and system responsibilities
- `domain-models/`: domain objects, relationships, states, enums, and invariants
- `application-contracts/`: command/query contracts and read models used to align backend implementation work

## Read Order

1. [use-cases/2026-03-23-menstrual-core-use-cases.md](D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/contracts/use-cases/2026-03-23-menstrual-core-use-cases.md)
2. [domain-models/2026-03-23-menstrual-domain-model.md](D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/contracts/domain-models/2026-03-23-menstrual-domain-model.md)
3. [application-contracts/2026-03-23-menstrual-application-contract-draft.md](D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/contracts/application-contracts/2026-03-23-menstrual-application-contract-draft.md)

## Working Rule

When a task changes durable product behavior, domain meaning, or backend-facing boundaries:

1. update the relevant contract here first
2. then update any affected plan under `docs/plans/`
3. only then treat implementation as aligned

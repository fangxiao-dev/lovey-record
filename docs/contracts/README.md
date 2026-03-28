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

- `use-cases/`: UI-agnostic user goals and system responsibilities
- `domain-models/`: domain objects, relationships, states, enums, and invariants
- `application-contracts/`: command/query contracts and read models

## When To Read

- Read this directory when a task changes durable product behavior, domain meaning, or frontend-backend boundaries.
- Open the relevant file inside this directory rather than scanning the whole tree.
- If the task only changes rollout or sequencing, start with `docs/plans/` instead.

## Working Rule

When a task changes durable product behavior, domain meaning, or backend-facing boundaries:

1. update the relevant contract here first
2. then update any affected plan under `docs/plans/`
3. only then treat implementation as aligned

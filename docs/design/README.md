# Design Directory Guide

## Purpose

`docs/design/` is the canonical home for active design contracts in this repo.

Use this directory to understand:

- cross-cutting visual rules
- module-level design boundaries
- key function-level interaction contracts

Do not treat `docs/plans/` as the long-term design home. `plans/` is for change plans, implementation sequencing, and handoff material. Stable design knowledge should be organized here.

## When To Read

- Read this directory when the task affects visual language, module design, or interaction rules.
- Open the relevant module directory or cross-module rule only when that design contract is actually needed.
- If you are editing `.pen` files, start with `docs/design/pencil/README.md`.

## Structure

### Root-Level Design Docs

Root-level files in `docs/design/` are only for cross-module rules, such as:

- visual language
- token/component-library collaboration rules
- Pencil collaboration conventions
- other design constraints that apply to multiple modules

Current examples:

- [2026-03-23-ui-visual-language-guide.md](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/design/2026-03-23-ui-visual-language-guide.md)
- [2026-03-22-tokenize-collaboration-rule.md](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/design/2026-03-22-tokenize-collaboration-rule.md)
- [pencil/README.md](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/design/pencil/README.md)

### Module Directories

Each major module gets its own directory:

- [navigation/](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/design/navigation)
- [management/](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/design/management)
- [menstrual/](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/design/menstrual)

There is also one cross-module process/reference directory:

- [pencil/](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/design/pencil)

Each module directory should keep its long-lived design contract in `Design-Overview.md` and add `function-*.md` files only for the specific interactions that need durable detail.

## Naming Rules

- Module overview files must be named `Design-Overview.md`.
- Function-level docs must be named `function-<topic>.md`.
- Use English file names and English slugs.
- Keep names semantic and stable; avoid date-based names inside module directories unless the date itself is the design subject.

## Reading Order

When working on design or UI implementation:

1. Read [project-context.md](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/project-context.md).
2. Read [tech-stack-investigate.md](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/tech-stack-investigate.md).
3. Read this file.
4. Read the relevant cross-module design rules in `docs/design/`.
5. If the task edits `.pen` files, read [pencil/README.md](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/design/pencil/README.md).
6. Read the target module's `Design-Overview.md` only when the module-specific contract is needed.
7. Read only the needed `function-*.md` files for that task.
8. Read implementation plans under `docs/plans/` only when sequencing or migration detail is needed.

## Writing Rules

- Put stable module design decisions into the relevant module directory.
- Put only cross-module rules at the root of `docs/design/`.
- If a change affects one module only, update that module's `Design-Overview.md` or `function-*.md`.
- If a change affects multiple modules, update the relevant root-level design doc first.
- Prefer links between docs over duplicating the same design contract in multiple places.

## Current Map

### Module Directories

- `navigation/` - navigation and dashboard design rules.
- `management/` - module management and sharing design rules.
- `menstrual/` - the first MVP module's long-lived design rules.

### Pencil Collaboration

- `pencil/` - cross-module Pencil workflow, conventions, and recovery guidance.


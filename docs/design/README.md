# Design Directory Guide

## Purpose

`docs/design/` is the canonical home for active design contracts in this repo.

Use this directory to understand:

- cross-cutting visual rules
- module-level design boundaries
- key function-level interaction contracts

Do not treat `docs/plans/` as the long-term design home. `plans/` is for change plans, implementation sequencing, and handoff material. Stable design knowledge should be organized here.

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

Each module directory should contain:

- `Design-Overview.md`
  - the module's long-lived design contract
- `function-*.md`
  - key function-level design docs for the module

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
6. Read the target module's `Design-Overview.md`.
7. Read only the needed `function-*.md` files for that task.
8. Read implementation plans under `docs/plans/` only when sequencing or migration detail is needed.

## Writing Rules

- Put stable module design decisions into the relevant module directory.
- Put only cross-module rules at the root of `docs/design/`.
- If a change affects one module only, update that module's `Design-Overview.md` or `function-*.md`.
- If a change affects multiple modules, update the relevant root-level design doc first.
- Prefer links between docs over duplicating the same design contract in multiple places.

## Current Map

### Navigation

- [Design-Overview.md](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/design/navigation/Design-Overview.md)
- [function-dashboard-home.md](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/design/navigation/function-dashboard-home.md)
- [function-tab-structure.md](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/design/navigation/function-tab-structure.md)

### Management

- [Design-Overview.md](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/design/management/Design-Overview.md)
- [function-module-management-page.md](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/design/management/function-module-management-page.md)
- [function-sharing-expression.md](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/design/management/function-sharing-expression.md)

### Menstrual

- [Design-Overview.md](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/design/menstrual/Design-Overview.md)
- [date-state-spec.md](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/design/menstrual/date-state-spec.md)
- [token-component-mapping.md](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/design/menstrual/token-component-mapping.md)
- [function-home.md](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/design/menstrual/function-home.md)
- [function-recording-model.md](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/design/menstrual/function-recording-model.md)

### Pencil Collaboration

- [README.md](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/design/pencil/README.md)
- [Pencil-Workflow.md](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/design/pencil/Pencil-Workflow.md)
- [Pencil-Pitfalls-And-Recovery.md](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/design/pencil/Pencil-Pitfalls-And-Recovery.md)
- [Pencil-Board-Conventions.md](/D:/CodeSpace/hbuilder-projects/lovey-record-backend/docs/design/pencil/Pencil-Board-Conventions.md)


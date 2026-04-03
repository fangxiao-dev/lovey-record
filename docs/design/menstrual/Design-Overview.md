# Menstrual Design Overview

## Purpose

This document defines the long-lived design contract for the menstrual module.

The menstrual module is the first fully realized MVP module in this repo.

## Current Role

The module must prove:

- status-first module entry
- low-burden day recording
- same-instance private/shared understanding
- reusable page and component structure

## Core Design Rules

- The home page answers current status first.
- The home page remains the main editing surface.
- `day_record` is the data truth; anchored period segments are derived.
- Shared access points to the same module instance.
- Month view is supportive, not the primary editor.

## Key Surfaces

- menstrual home
- calendar and state expression
- single-day inline editing
- long-press batch editing

## Related Surface Docs

- [function-home.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design/menstrual/function-home.md)
- [frontend-home.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design/menstrual/frontend-home.md)
- [function-calendar.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design/menstrual/function-calendar.md)
- [frontend-calendar.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design/menstrual/frontend-calendar.md)
- [function-day-recording.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design/menstrual/function-day-recording.md)
- [frontend-day-recording.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design/menstrual/frontend-day-recording.md)
- [date-state-spec.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design/menstrual/date-state-spec.md)
- [token-component-mapping.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design/menstrual/token-component-mapping.md)
- [function-recording-model.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design/menstrual/function-recording-model.md)

## Upstream References

- [../2026-03-23-ui-visual-language-guide.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design/2026-03-23-ui-visual-language-guide.md)
- [../2026-03-22-tokenize-collaboration-rule.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design/2026-03-22-tokenize-collaboration-rule.md)
- [../../contracts/domain-models/menstrual-domain-model.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/contracts/domain-models/menstrual-domain-model.md)


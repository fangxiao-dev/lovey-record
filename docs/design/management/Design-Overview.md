# Management Design Overview

## Purpose

This document defines the long-lived design contract for module management.

The management area is where users understand:

- what modules exist
- which modules are private or shared
- how module organization works

## Current Role

Management is the structured module surface, not the first landing page.

It should preserve:

- private/shared organization semantics
- module entry clarity
- room for future management actions

## Design Boundaries

- Keep management distinct from dashboard home.
- Preserve the difference between a private module area and a shared area.
- Do not collapse shared semantics into duplicated module cards with different data identities.
- Do not simplify the page so far that it loses ownership and shared-state meaning.

## Related Surface Docs

- [function-module-management-page.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design/management/function-module-management-page.md)
- [function-sharing-expression.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design/management/function-sharing-expression.md)
- [frontend-sharing-expression.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design/management/frontend-sharing-expression.md)



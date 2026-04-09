# Management Design Overview

## Purpose

This document defines the long-lived design contract for module management.

The management area is where users understand:

- what modules exist
- which modules are private or shared
- how a selected module can be managed directly from the same page

## Current Role

Management is the structured module surface, not the first landing page.

It should preserve:

- private/shared organization semantics
- module entry clarity
- direct single-module management without leaving the page

## Design Boundaries

- Keep management distinct from dashboard home.
- Keep the page as one default view instead of splitting it into separate management states.
- Do not collapse shared semantics into duplicated module cards with different data identities.
- Do not reintroduce private/shared split sections as the primary page structure.
- Do not move core module actions out of the selected-module management card.

## Related Surface Docs

- [function-module-management-page.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design/management/function-module-management-page.md)
- [frontend-module-management-page.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design/management/frontend-module-management-page.md)
- [function-sharing-expression.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design/management/function-sharing-expression.md)
- [frontend-sharing-expression.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design/management/frontend-sharing-expression.md)



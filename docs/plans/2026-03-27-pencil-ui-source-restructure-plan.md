# 2026-03-27 Pencil UI Source Restructure Plan

> **Status:** COMPLETED

## Summary

This plan covers only the frontend UI design source restructuring for the active Pencil workflow.

Target outcome:

- `2026-03-22-design-tokene.pen` becomes a token-and-foundations-only file
- `2026-03-22-module-space-and-period-home.pen` becomes the source of truth for component library, date states, and business pages
- the current date-state expressions are migrated into the business-page file as formal component-library patterns
- repo design docs are updated so the file responsibilities match the actual working model

This plan does not include backend changes.

## Implementation Changes

### Design contract updates

- Update the tokenize collaboration rule so the token file is no longer described as the reusable component source.
- Update Pencil workflow and board-convention docs so the current source split is:
  - token file for foundations and semantic tokens
  - business file for component library, date states, and page composition
- Record that `date states` are part of the component-library layer, not the token-foundations layer.

### `2026-03-22-design-tokene.pen`

- Rebuild the visible token board structure based on the top-level screenshot rather than the current loose internal grouping.
- Keep only token/foundations responsibilities:
  - palette ramps
  - semantic color tokens
  - type tokens
  - shape/radius/surface stack foundations
- Remove component-library content from this file.
- Remove date-state source content from this file; do not keep a temporary source-of-truth copy here.

### `2026-03-22-module-space-and-period-home.pen`

- Promote the current local dependency area into the formal component-library source for the project.
- Keep the existing business-file visual language as the baseline.
- Add the five approved date-state expressions into the component-library area as normalized reusable patterns.
- Reuse the updated date-state expressions across the menstrual pages so page examples and library patterns stay aligned.
- Allow moderate visual cleanup where token application reveals inconsistencies, but do not change information architecture or page purpose.

## Validation

- Verify the token file no longer contains formal component-library or date-state source sections.
- Verify the business file contains the formal component-library source and the migrated date-state patterns.
- Verify screenshots for:
  - token foundations board
  - component-library/date-state area
  - at least one updated menstrual page example
- Verify `period`, `prediction`, `today`, and `detail-recorded` remain visually distinguishable and still follow the approved warm restrained direction.

## Assumptions

- Frontend UI only; backend files remain untouched.
- `module-space-and-period-home.pen` is the current component-library source of truth.
- `design-tokene.pen` remains in use, but only as the token/foundations source.
- If a live Pencil read conflicts with the visible screenshot, screenshot intent wins for the token-file rebuild.

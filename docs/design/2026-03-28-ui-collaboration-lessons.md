# UI Collaboration Lessons

## Purpose

This document records the durable UI collaboration rules learned while translating Pencil designs into uni-app code in this repo.

It is intentionally short and operational. Use it as a source-of-truth checklist before changing any Pencil-derived UI.

## Source Of Truth Order

When Pencil, docs, and code disagree, use this order:

1. the explicitly named Pencil node or board
2. the matching design contract under `docs/design/`
3. the current component-library / showcase runtime
4. the code implementation

If a task names a Pencil node, that node is the canonical visual contract for the requested primitive or state family.

## Required Validation Loop

For any UI primitive or state board:

1. inspect the Pencil node screenshot first
2. identify the exact visual rules that matter
3. implement the smallest code surface that matches those rules
4. run runtime verification before handing the result back
5. compare the runtime against the Pencil node, not against memory

Do not treat a handoff, an earlier screenshot, or a previous fix as proof of current correctness.

## Date-State Rules

For menstrual date-state work, keep these rules fixed:

- `DateCell` states are contract states, not decorative variants
- `today` uses a circular outline
- `detail-recorded` uses a small eye marker
- `detail-recorded` marker color is `accent.period`
- `period` foreground contrast uses `accent.period.contrast`
- `period` is a contrast-bearing state, not a separate marker family
- `future` is calendar-relative, not a sample-grid placeholder
- `CalendarGrid` owns week structure and week dividers
- `DateCell` owns date-state appearance only

## Marker Rules

The eye marker must stay small relative to the date numeral.

The approved marker source should come from the Pencil design or a shared asset already present in the design draft. Do not hand-draw a new eye if the design file already provides one.

When a Pencil node shows a marker example, treat its size and color as the canonical check:

- keep the marker visually subordinate to the number
- use `accent.period` for the eye marker
- use `accent.period.contrast` only where the surface itself needs contrast, such as period-filled states

For DateCell internal layout:

- reuse the existing `DateState` template before attempting manual redraw
- when changing a DateCell baseline, update the named source board first and only then sync page instances
- when resizing a DateCell, scale the existing numeral-marker layout proportionally
- treat board dimensions like `45x45` as Pencil-only visual calibration, not frontend hardcoded CSS or fixed runtime sizing
- keep numerals visually top-weighted, not vertically centered
- keep markers off the frame bottom edge
- use transparent placeholder markers to preserve baseline alignment when needed

## Attribute Option Rules

For compact attribute option matrices such as `aRXKk`:

- unselected option text uses size `10`
- selected option text uses size `11`
- only selected options keep the emphasis combo of inside stroke plus drop shadow
- non-selected options should not inherit selected shadow or emphasis stroke by accident

For compact attribute summary tags such as `ESVZm`, `WeHmZ`, and `CVHF4`:

- use a `3:2` frame proportion
- keep tag text at size `11`
- use `color.text.primary` for the tag text
- keep the small accompanying icon, when present, in the attribute accent color rather than recoloring it to primary

## Collaboration Rules

When giving a UI task to Codex, include:

- the Pencil file path
- the node id
- whether the node is the canonical source or a supporting reference
- the exact state or visual property to verify

Example:

```text
Canonical source: docs/design-drafts/2026-03-22-module-space-and-period-home.pen
Node: aUI1Y
Use this node as the source of truth for marker size and marker color.
Do not infer marker styling from existing code if it conflicts with this node.
```

## Anti-Patterns

- assuming an earlier handoff is still valid
- using runtime code as the first source of truth
- turning a contract board into a convenience demo before the primitive is stable
- changing a page-local comparison board without first updating the named source-of-truth board
- widening a reusable component with board-only explanation text
- keeping eye markers or state colors as ad hoc CSS after the design has already defined them

## Recommended Use

Read this document before:

- translating a Pencil date-state board into uni-app code
- changing marker geometry or state colors
- making a new showcase page for a design primitive
- reviewing a UI change that must match Pencil exactly
